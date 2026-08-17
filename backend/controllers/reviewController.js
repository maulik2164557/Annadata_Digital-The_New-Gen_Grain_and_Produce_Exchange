const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');

exports.addReview = async (req, res, next) => {
    try {
        const {
            farmerId,
            orderId,
            ratingStars,
            comment
        } = req.body;

        const order = await Order.findById(orderId);

        if (!order || order.status !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Reviews can only be submitted for delivered orders'
            });
        }

        const review = await Review.create({
            reviewerId: req.user.id,
            farmerId,
            orderId,
            ratingStars,
            comment
        });

        const reviews = await Review.find({ farmerId });

        const avgRating =
            reviews.reduce(
                (acc, item) => acc + item.ratingStars,
                0
            ) / reviews.length;

        await User.findByIdAndUpdate(farmerId, {
            averageRating: avgRating.toFixed(1),
            totalReviews: reviews.length
        });

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        next(error);
    }
};