const express = require('express');
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// List & Create
router.route('/')
    .post(protect, authorize('Consumer'), createOrder)
    .get(protect, getOrders);

// Single order detail
router.route('/:id')
    .get(protect, getOrderById);

// Order status update — Farmer confirms/dispatches; Consumer marks delivered
router.route('/:id/status')
    .put(protect, authorize('Farmer', 'Consumer', 'Admin'), updateOrderStatus);

// Payment status — Farmer only
router.route('/:id/payment')
    .put(protect, authorize('Farmer', 'Admin'), updatePaymentStatus);

module.exports = router;