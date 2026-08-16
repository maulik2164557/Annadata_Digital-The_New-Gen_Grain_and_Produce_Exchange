// const Review = require('../models/Review');

// const User = require('../models/User');

// const Order = require('../models/Order');



// /\*\*

// &#x20;\* @desc    Add a review for a farmer after order delivery

// &#x20;\* @route   POST /api/v1/reviews

// &#x20;\* @access  Private (Consumer)

// &#x20;\*/

// exports.addReview = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { farmerId, orderId, ratingStars, comment } = req.body;



// &#x20;   const order = await Order.findById(orderId);

// &#x20;   if (!order || order.status !== 'Delivered') {

// &#x20;     return res.status(400).json({ success: false, message: 'Reviews can only be submitted for delivered orders' });

// &#x20;   }



// &#x20;   const review = await Review.create({

// &#x20;     reviewerId: req.user.id,

// &#x20;     farmerId,

// &#x20;     orderId,

// &#x20;     ratingStars,

// &#x20;     comment,

// &#x20;   });



// &#x20;   // Recalculate average rating for farmer

// &#x20;   const reviews = await Review.find({ farmerId });

// &#x20;   const avgRating = reviews.reduce((acc, item) => item.ratingStars + acc, 0) / reviews.length;



// &#x20;   await User.findByIdAndUpdate(farmerId, {

// &#x20;     averageRating: avgRating.toFixed(1),

// &#x20;     totalReviews: reviews.length,

// &#x20;   });



// &#x20;   res.status(201).json({ success: true, data: review });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };


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