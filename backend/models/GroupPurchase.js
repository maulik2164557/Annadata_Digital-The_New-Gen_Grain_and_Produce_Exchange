const mongoose = require('mongoose');

const GroupPurchaseSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_quantity_quintals: {
      type: Number,
      required: [true, 'Please specify target bulk quantity'],
    },
    current_quantity_quintals: {
      type: Number,
      default: 0,
    },
    discount_percentage: {
      type: Number,
      required: [true, 'Please specify bulk discount percentage'],
      min: 0,
      max: 100,
    },
    participants: [
      {
        consumerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        quantity_quintals: {
          type: Number,
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Expired', 'Cancelled'],
      default: 'Active',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupPurchase', GroupPurchaseSchema);