const mongoose = require('mongoose');

const MarketStatusSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: [true, 'Please specify the crop name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify crop category'],
      enum: ['Grains', 'Pulses', 'Vegetables', 'Fruits', 'Oilseeds', 'Spices', 'Other'],
    },
    averagePricePerQuintal: {
      type: Number,
      required: [true, 'Please provide the current average price per quintal'],
      min: [0, 'Price cannot be negative'],
    },
    minPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    demandLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Very High'],
      default: 'Moderate',
    },
    priceTrend: {
      type: String,
      enum: ['Rising', 'Falling', 'Stable'],
      default: 'Stable',
    },
    region: {
      type: String,
      default: 'National',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketStatus', MarketStatusSchema);