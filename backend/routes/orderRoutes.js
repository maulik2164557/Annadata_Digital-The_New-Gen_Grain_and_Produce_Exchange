const express = require('express');
const { createOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('Consumer'), createOrder)
  .get(protect, getOrders);

router.route('/:id/status')
  .put(protect, authorize('Farmer', 'Admin'), updateOrderStatus);

module.exports = router;