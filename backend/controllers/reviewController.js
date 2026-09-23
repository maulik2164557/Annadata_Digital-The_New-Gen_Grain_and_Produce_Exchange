const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

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

exports.getFarmerReviews = async (req, res, next) => {
    try {
        const { farmerId } = req.params;

        const reviews = await Review.find({ farmerId })
            .populate('reviewerId', 'name email phone role')
            .populate({
                path: 'orderId',
                select: 'productId',
                populate: { path: 'productId', select: 'name category harvest_date' }
            })
            .sort({ createdAt: -1 });

        const products = await Product.find({ farmerId })
            .select('name category harvest_date averageRating')
            .sort({ createdAt: -1 });

        const productsWithReviews = products.map(product => ({
            ...product.toObject(),
            reviews: reviews.filter(review => review.orderId?.productId?._id?.toString() === product._id.toString())
        }));

        const avgRating = reviews.length > 0
            ? (reviews.reduce((acc, item) => acc + item.ratingStars, 0) / reviews.length).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: Number(avgRating),
            products: productsWithReviews,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};