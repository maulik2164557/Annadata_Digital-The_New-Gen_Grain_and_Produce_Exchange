const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['order_placed', 'order_confirmed', 'order_dispatched', 'order_delivered', 'payment_update', 'general'],
      default: 'general',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
