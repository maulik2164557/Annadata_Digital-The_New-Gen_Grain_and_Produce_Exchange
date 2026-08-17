const express = require('express');
const { getAllUsers, updateUserApprovalStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/approval', updateUserApprovalStatus);

module.exports = router;