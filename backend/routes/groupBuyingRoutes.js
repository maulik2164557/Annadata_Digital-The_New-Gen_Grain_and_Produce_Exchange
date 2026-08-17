const express = require('express');
const {
  createGroupDeal,
  joinGroupDeal,
  getGroupDeals,
} = require('../controllers/groupBuyingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/')
  .get(getGroupDeals)
  .post(protect, authorize('Farmer', 'Admin'), createGroupDeal);

router.route('/:id/join')
  .put(protect, authorize('Consumer'), joinGroupDeal);

module.exports = router;