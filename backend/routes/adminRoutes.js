const express = require('express');
const { getAllUsers, updateUserApprovalStatus, getAdminOverview } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/users', getAllUsers);
router.get('/overview', getAdminOverview);
router.put('/users/:id/approval', updateUserApprovalStatus);

module.exports = router;