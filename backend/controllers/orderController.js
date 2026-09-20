const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendSMS, sendEmail } = require('../services/notificationService');

exports.createOrder = async (req, res, next) => {
    try {
        const {
            productId,
            quantity_quintals,
            shippingAddress
        } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.quantity_quintals < quantity_quintals) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available'
            });
        }

        const total_price =
            product.price_per_quintal * quantity_quintals;

        const order = await Order.create({
            consumerId: req.user.id,
            farmerId: product.farmerId,
            productId,
            quantity_quintals,
            total_price,
            shippingAddress
        });

        product.quantity_quintals -= quantity_quintals;
        await product.save();

        // Notify Farmer about new order
        const farmer = await User.findById(product.farmerId);
        if (farmer) {
            await sendSMS(farmer.phone, `New Order Received! ${quantity_quintals} quintals of ${product.name}. Please check your dashboard for details.`);
            await sendEmail(farmer.email, 'New Order Received - Annadata Digital', `You have received a new order of ${quantity_quintals} quintals of ${product.name}. Please check your dashboard for details.`);
        }

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        let query = {};

        if (req.user.role === 'Consumer') {
            query.consumerId = req.user.id;
        } else if (req.user.role === 'Farmer') {
            query.farmerId = req.user.id;
        }

        const orders = await Order.find(query)
            .populate(
                'productId',
                'name price_per_quintal category'
            )
            .populate(
                'farmerId',
                'name phone'
            )
            .populate(
                'consumerId',
                'name phone address'
            );

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, paymentStatus } = req.body;

        let order = await Order.findById(req.params.id)
            .populate('consumerId', 'name phone email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (
            order.farmerId.toString() !== req.user.id &&
            req.user.role !== 'Admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        if (status) {
            order.status = status;
        }

        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }

        if (status === 'Confirmed') {
            order.paymentStatus = 'Completed';
        }

        await order.save();

        if (order.consumerId) {
            await sendSMS(order.consumerId.phone, `Order #${order._id} status updated to: ${order.status}`);
            await sendEmail(order.consumerId.email, 'Order Status Update', `Your order #${order._id} is now ${order.status}.`);

            if (status === 'Confirmed') {
                await sendSMS(order.consumerId.phone, `Payment confirmed for order #${order._id}. Payment to the farmer is marked completed.`);
                await sendEmail(order.consumerId.email, 'Payment Confirmation - Annadata Digital', `Payment for order #${order._id} has been completed and sent to the farmer.`);
            }
        }

        res.status(200).json({
            success: true,
            data: order
        });

        if (status === 'Confirmed') {
            setTimeout(() => updateOrderStatusAutomatically(order._id), 5000);
        }
    } catch (error) {
        next(error);
    }
};

async function updateOrderStatusAutomatically(orderId) {
    const order = await Order.findById(orderId).populate('consumerId', 'phone email');
    if (!order || order.status !== 'Confirmed') return;
    order.status = 'Dispatched';
    await order.save();
    await sendSMS(order.consumerId.phone, `Order #${order._id} has been dispatched.`);
    await sendEmail(order.consumerId.email, 'Order Dispatched - Annadata Digital', `Your order #${order._id} has been dispatched.`);
    setTimeout(async () => {
        const delivered = await Order.findById(orderId).populate('consumerId', 'phone email');
        if (!delivered || delivered.status !== 'Dispatched') return;
        delivered.status = 'Delivered';
        await delivered.save();
        await sendSMS(delivered.consumerId.phone, `Order #${delivered._id} has been delivered.`);
        await sendEmail(delivered.consumerId.email, 'Order Delivered - Annadata Digital', `Your order #${delivered._id} has been delivered.`);
    }, 5000);
}