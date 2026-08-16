const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    ratingStars: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Prevent user from submitting multiple reviews for the same order
ReviewSchema.index({ orderId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);