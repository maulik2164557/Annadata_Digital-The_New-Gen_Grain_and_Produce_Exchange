const express = require('express');
const { addReview , getFarmerReviews} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/farmer/:farmerId', getFarmerReviews);
router.post('/', protect, authorize('Consumer'), addReview);

module.exports = router;