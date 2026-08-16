const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a crop/produce name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a crop category'],
      enum: ['Grains', 'Pulses', 'Vegetables', 'Fruits', 'Oilseeds', 'Spices', 'Other'],
    },
    quantity_quintals: {
      type: Number,
      required: [true, 'Please enter available quantity in quintals'],
      min: [0, 'Quantity cannot be negative'],
    },
    price_per_quintal: {
      type: Number,
      required: [true, 'Please enter price per quintal (INR)'],
      min: [0, 'Price cannot be negative'],
    },
    harvest_date: {
      type: Date,
      required: [true, 'Please specify the harvest date'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: [
      {
        type: String,
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);