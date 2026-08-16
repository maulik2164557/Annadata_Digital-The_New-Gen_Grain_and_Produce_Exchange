// const Order = require('../models/Order');

// const Product = require('../models/Product');



// /\*\*

// &#x20;\* @desc    Create a new order

// &#x20;\* @route   POST /api/v1/orders

// &#x20;\* @access  Private (Consumer)

// &#x20;\*/

// exports.createOrder = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { productId, quantity\_quintals, shippingAddress } = req.body;



// &#x20;   const product = await Product.findById(productId);

// &#x20;   if (!product) {

// &#x20;     return res.status(404).json({ success: false, message: 'Product not found' });

// &#x20;   }



// &#x20;   if (product.quantity\_quintals < quantity\_quintals) {

// &#x20;     return res.status(400).json({ success: false, message: 'Insufficient stock available' });

// &#x20;   }



// &#x20;   const total\_price = product.price\_per\_quintal \* quantity\_quintals;



// &#x20;   const order = await Order.create({

// &#x20;     consumerId: req.user.id,

// &#x20;     farmerId: product.farmerId,

// &#x20;     productId,

// &#x20;     quantity\_quintals,

// &#x20;     total\_price,

// &#x20;     shippingAddress,

// &#x20;   });



// &#x20;   // Deduct quantity from stock

// &#x20;   product.quantity\_quintals -= quantity\_quintals;

// &#x20;   await product.save();



// &#x20;   res.status(201).json({ success: true, data: order });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Get user's orders (Consumer sees bought orders; Farmer sees sales)

// &#x20;\* @route   GET /api/v1/orders

// &#x20;\* @access  Private

// &#x20;\*/

// exports.getOrders = async (req, res, next) => {

// &#x20; try {

// &#x20;   let query = {};

// &#x20;   if (req.user.role === 'Consumer') {

// &#x20;     query.consumerId = req.user.id;

// &#x20;   } else if (req.user.role === 'Farmer') {

// &#x20;     query.farmerId = req.user.id;

// &#x20;   }



// &#x20;   const orders = await Order.find(query)

// &#x20;     .populate('productId', 'name price\_per\_quintal category')

// &#x20;     .populate('farmerId', 'name phone')

// &#x20;     .populate('consumerId', 'name phone address');



// &#x20;   res.status(200).json({ success: true, count: orders.length, data: orders });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Update order status

// &#x20;\* @route   PUT /api/v1/orders/:id/status

// &#x20;\* @access  Private (Farmer / Admin)

// &#x20;\*/

// exports.updateOrderStatus = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { status, paymentStatus } = req.body;

// &#x20;   let order = await Order.findById(req.params.id);



// &#x20;   if (!order) {

// &#x20;     return res.status(404).json({ success: false, message: 'Order not found' });

// &#x20;   }



// &#x20;   if (order.farmerId.toString() !== req.user.id \&\& req.user.role !== 'Admin') {

// &#x20;     return res.status(403).json({ success: false, message: 'Not authorized to update this order' });

// &#x20;   }



// &#x20;   if (status) order.status = status;

// &#x20;   if (paymentStatus) order.paymentStatus = paymentStatus;



// &#x20;   await order.save();

// &#x20;   res.status(200).json({ success: true, data: order });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };

const Order = require('../models/Order');
const Product = require('../models/Product');

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

        let order = await Order.findById(req.params.id);

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

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};