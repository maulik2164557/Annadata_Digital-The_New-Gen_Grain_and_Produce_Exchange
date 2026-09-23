const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendSMS, sendEmail } = require('../services/notificationService');
const { createNotification } = require('./notificationController');

// ─── CREATE ORDER (Consumer) ──────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
    try {
        const { productId, quantity_quintals, shippingAddress } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.quantity_quintals < quantity_quintals) {
            return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }

        const total_price = product.price_per_quintal * quantity_quintals;

        const order = await Order.create({
            consumerId: req.user.id,
            farmerId: product.farmerId,
            productId,
            quantity_quintals,
            total_price,
            shippingAddress,
        });

        product.quantity_quintals -= quantity_quintals;
        await product.save();

        // Fetch consumer info for notification
        const consumer = await User.findById(req.user.id);

        // Notify Farmer — in-app notification + email
        const farmer = await User.findById(product.farmerId);
        if (farmer) {
            const notifMsg = `New order received! ${consumer?.name || 'A consumer'} has ordered ${quantity_quintals} quintal(s) of "${product.name}". Check your orders to confirm.`;
            await createNotification(farmer._id, notifMsg, 'order_placed', order._id);
            await sendEmail(
                farmer.email,
                'New Order Received – Annadata Digital',
                `Hello ${farmer.name},\n\nYou have a new order!\n\nProduct: ${product.name}\nQuantity: ${quantity_quintals} quintal(s)\nTotal Amount: ₹${total_price.toLocaleString('en-IN')}\n\nConsumer: ${consumer?.name || 'N/A'}\nPhone: ${consumer?.phone || 'N/A'}\nDelivery Address: ${shippingAddress}\n\nPlease log in to confirm this order.\n\n– Annadata Digital`
            );
            await sendSMS(farmer.phone, `[Annadata] New order: ${quantity_quintals} qtl of "${product.name}" from ${consumer?.name || 'consumer'}. Login to confirm.`);
        }

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// ─── GET ALL ORDERS (Farmer sees their orders, Consumer sees their orders) ────
exports.getOrders = async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role === 'Consumer') {
            query.consumerId = req.user.id;
        } else if (req.user.role === 'Farmer') {
            query.farmerId = req.user.id;
        }
        // Admin gets all

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('productId', 'name price_per_quintal category')
            .populate('farmerId', 'name phone email upiId address')
            .populate('consumerId', 'name phone email address');

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

// ─── GET SINGLE ORDER BY ID ───────────────────────────────────────────────────
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('productId', 'name price_per_quintal category description')
            .populate('farmerId', 'name phone email upiId address averageRating')
            .populate('consumerId', 'name phone email address');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only the farmer, consumer of this order, or admin can view it
        const userId = req.user.id;
        const isFarmer = order.farmerId?._id?.toString() === userId;
        const isConsumer = order.consumerId?._id?.toString() === userId;
        const isAdmin = req.user.role === 'Admin';

        if (!isFarmer && !isConsumer && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE ORDER STATUS ──────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, transporter } = req.body;

        let order = await Order.findById(req.params.id)
            .populate('consumerId', 'name phone email address')
            .populate('farmerId', 'name phone email upiId address')
            .populate('productId', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const userId = req.user.id;
        const role = req.user.role;
        const isFarmer = order.farmerId?._id?.toString() === userId;
        const isConsumer = order.consumerId?._id?.toString() === userId;
        const isAdmin = role === 'Admin';

        // ── FARMER actions: Confirmed, Dispatched ─────────────────────────────
        if (status === 'Confirmed') {
            if (!isFarmer && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Only the farmer can confirm an order' });
            }
            if (order.status !== 'Placed') {
                return res.status(400).json({ success: false, message: 'Order can only be confirmed from Placed status' });
            }

            order.status = 'Confirmed';
            await order.save();

            // Notify Consumer with UPI payment details
            const farmer = order.farmerId;
            const consumer = order.consumerId;
            const upiInfo = farmer?.upiId ? `\nFarmer UPI ID: ${farmer.upiId}\nTotal Amount to Pay: ₹${order.total_price.toLocaleString('en-IN')}` : '\n(Farmer has not set a UPI ID yet. Please contact the farmer directly.)';

            const notifMsg = `Your order of "${order.productId?.name}" has been confirmed by the farmer! Please complete the payment.${farmer?.upiId ? ` Farmer UPI: ${farmer.upiId} | Amount: ₹${order.total_price.toLocaleString('en-IN')}` : ''}`;
            await createNotification(consumer._id, notifMsg, 'order_confirmed', order._id);

            await sendEmail(
                consumer.email,
                'Order Confirmed – Complete Your Payment | Annadata Digital',
                `Hello ${consumer.name},\n\nGreat news! Your order has been confirmed by the farmer.\n\nOrder Details:\nProduct: ${order.productId?.name}\nQuantity: ${order.quantity_quintals} quintal(s)\nTotal Amount: ₹${order.total_price.toLocaleString('en-IN')}\n\nFarmer Details:\nName: ${farmer?.name}\nPhone: ${farmer?.phone}\nAddress: ${farmer?.address}${upiInfo}\n\nPlease transfer the payment directly to the farmer using the UPI ID above. Do not pay through the website.\n\n– Annadata Digital`
            );
            await sendSMS(consumer.phone, `[Annadata] Your order of "${order.productId?.name}" is confirmed! Pay ₹${order.total_price.toLocaleString('en-IN')} to farmer UPI: ${farmer?.upiId || 'N/A'}`);
        }

        // ── DISPATCHED ────────────────────────────────────────────────────────
        else if (status === 'Dispatched') {
            if (!isFarmer && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Only the farmer can mark an order as dispatched' });
            }
            if (order.status !== 'Confirmed') {
                return res.status(400).json({ success: false, message: 'Order must be confirmed before dispatching' });
            }
            if (!transporter?.name || !transporter?.phone) {
                return res.status(400).json({ success: false, message: 'Transporter name and phone number are required to dispatch' });
            }

            order.status = 'Dispatched';
            order.transporter = { name: transporter.name, phone: transporter.phone };
            await order.save();

            const consumer = order.consumerId;
            const notifMsg = `Your order of "${order.productId?.name}" has been dispatched! Transporter: ${transporter.name} | Phone: ${transporter.phone}`;
            await createNotification(consumer._id, notifMsg, 'order_dispatched', order._id);

            await sendEmail(
                consumer.email,
                'Order Dispatched – Annadata Digital',
                `Hello ${consumer.name},\n\nYour order is on its way!\n\nProduct: ${order.productId?.name}\nQuantity: ${order.quantity_quintals} quintal(s)\n\nTransporter Details:\nName: ${transporter.name}\nPhone: ${transporter.phone}\n\nYou can contact the transporter to track your delivery.\n\n– Annadata Digital`
            );
            await sendSMS(consumer.phone, `[Annadata] Order dispatched! Contact your transporter: ${transporter.name} at ${transporter.phone}`);
        }

        // ── DELIVERED (by Consumer) ───────────────────────────────────────────
        else if (status === 'Delivered') {
            if (!isConsumer && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Only the consumer can mark an order as delivered' });
            }
            if (order.status !== 'Dispatched') {
                return res.status(400).json({ success: false, message: 'Order must be dispatched before marking as delivered' });
            }

            order.status = 'Delivered';
            await order.save();

            const farmer = order.farmerId;
            const consumer = order.consumerId;
            const notifMsg = `Great news! Your order of "${order.productId?.name}" has been successfully delivered to ${consumer?.name}.`;
            await createNotification(farmer._id, notifMsg, 'order_delivered', order._id);

            await sendEmail(
                farmer.email,
                'Order Successfully Delivered – Annadata Digital',
                `Hello ${farmer.name},\n\nYour produce has been successfully delivered!\n\nProduct: ${order.productId?.name}\nQuantity: ${order.quantity_quintals} quintal(s)\nTotal Amount: ₹${order.total_price.toLocaleString('en-IN')}\n\nDelivered to: ${consumer?.name}\nPhone: ${consumer?.phone}\n\nThank you for using Annadata Digital!\n\n– Annadata Digital`
            );
            await sendSMS(farmer.phone, `[Annadata] Order delivered! ${order.quantity_quintals} qtl of "${order.productId?.name}" successfully delivered to ${consumer?.name}.`);

        } else {
            return res.status(400).json({ success: false, message: `Invalid status transition to "${status}"` });
        }

        // Re-fetch the final order with all populated fields for response
        const updatedOrder = await Order.findById(order._id)
            .populate('productId', 'name price_per_quintal category description')
            .populate('farmerId', 'name phone email upiId address averageRating')
            .populate('consumerId', 'name phone email address');

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE PAYMENT STATUS (Farmer only) ─────────────────────────────────────
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus } = req.body;

        if (!['Completed', 'Pending', 'Failed', 'Refunded'].includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        let order = await Order.findById(req.params.id)
            .populate('consumerId', 'name phone email')
            .populate('productId', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.farmerId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only the farmer can update payment status' });
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        if (paymentStatus === 'Completed') {
            const notifMsg = `Payment for your order of "${order.productId?.name}" has been marked as received by the farmer.`;
            await createNotification(order.consumerId._id, notifMsg, 'payment_update', order._id);
            await sendEmail(
                order.consumerId.email,
                'Payment Received – Annadata Digital',
                `Hello ${order.consumerId.name},\n\nThe farmer has confirmed receipt of your payment for "${order.productId?.name}".\n\nOrder Amount: ₹${order.total_price.toLocaleString('en-IN')}\n\nThank you!\n\n– Annadata Digital`
            );
        }

        const updatedOrder = await Order.findById(order._id)
            .populate('productId', 'name price_per_quintal category description')
            .populate('farmerId', 'name phone email upiId address averageRating')
            .populate('consumerId', 'name phone email address');

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        next(error);
    }
};