const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    consumerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity_quintals: {
      type: Number,
      required: [true, 'Please specify order quantity in quintals'],
      min: [0.1, 'Minimum order quantity is 0.1 quintal'],
    },
    total_price: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: [true, 'Please provide a shipping address'],
    },
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);