const User = require('../models/User');
const { sendSMS, sendEmail } = require('../services/notificationService');

exports.updateUserApprovalStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = status;
        await user.save();

        // Send account status update notification
        await sendSMS(user.phone, `Your Annadata Digital account status has been updated to: ${status}`);
        await sendEmail(user.email, 'Account Status Update - Annadata Digital', `Your account status is now ${status}.`);

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
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