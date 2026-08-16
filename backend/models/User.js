const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Exclude password hash from standard queries
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    role: {
      type: String,
      enum: ['Farmer', 'Consumer', 'Admin'],
      required: [true, 'Please specify a user role'],
    },
    status: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Blocked', 'Deactivated'],
      default: 'Pending Approval',
    },
    // Farmer-specific attributes
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);