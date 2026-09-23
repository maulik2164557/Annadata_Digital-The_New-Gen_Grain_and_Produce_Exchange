const express = require('express');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/read-all').put(protect, markAllRead);
router.route('/:id/read').put(protect, markRead);

module.exports = router;
