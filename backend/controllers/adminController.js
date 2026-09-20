const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSMS, sendEmail } = require('../services/notificationService');

exports.updateUserApprovalStatus = async (req, res, next) => {
    try {
        // Fallback supports status, isApproved, or approvalStatus payload keys
        const statusValue = req.body.status || req.body.approvalStatus || (req.body.isApproved ? 'Approved' : 'Rejected');

        if (!statusValue) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid status or isApproved field in request body'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = statusValue;
        user.isApproved = statusValue === 'Approved';
        await user.save();

        // Send account status update notification
        await sendSMS(user.phone, `Your Annadata Digital account status has been updated to: ${statusValue}`);
        await sendEmail(user.email, 'Account Status Update - Annadata Digital', `Your account status is now ${statusValue}.`);

        res.status(200).json({
            success: true,
            message: `User status updated to ${statusValue}`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-passwordHash');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminOverview = async (req, res, next) => {
    try {
        const [users, products, orders] = await Promise.all([
            User.find().select('-passwordHash'),
            Product.find().populate('farmerId', 'name email phone address'),
            Order.find()
                .populate('productId', 'name category price_per_quintal')
                .populate('consumerId', 'name email phone address')
                .populate('farmerId', 'name email phone address')
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            data: { users, products, orders }
        });
    } catch (error) {
        next(error);
    }
};