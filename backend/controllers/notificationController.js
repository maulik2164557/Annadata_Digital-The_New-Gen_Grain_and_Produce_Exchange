const Notification = require('../models/Notification');

// Create a notification for a user
const createNotification = async (userId, message, type, orderId = null) => {
    try {
        await Notification.create({ userId, message, type, orderId });
    } catch (err) {
        console.error('[Notification] Failed to create notification:', err.message);
    }
};

// GET /api/v1/notifications — fetch notifications for current user
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter(n => !n.read).length;

        res.status(200).json({
            success: true,
            unreadCount,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/notifications/:id/read — mark a single notification as read
exports.markRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/notifications/read-all — mark all as read
exports.markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

exports.createNotification = createNotification;
