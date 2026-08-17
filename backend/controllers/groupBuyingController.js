const GroupPurchase = require('../models/GroupPurchase');
const Product = require('../models/Product');

exports.createGroupDeal = async (req, res, next) => {
    try {
        const {
            productId,
            target_quantity_quintals,
            discount_percentage,
            expiresAt
        } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const groupDeal = await GroupPurchase.create({
            productId,
            farmerId: req.user.id,
            target_quantity_quintals,
            discount_percentage,
            expiresAt
        });

        res.status(201).json({
            success: true,
            data: groupDeal
        });
    } catch (error) {
        next(error);
    }
};

exports.joinGroupDeal = async (req, res, next) => {
    try {
        const { quantity_quintals } = req.body;

        const groupDeal = await GroupPurchase.findById(req.params.id);

        if (!groupDeal || groupDeal.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Group deal is not active'
            });
        }

        groupDeal.participants.push({
            consumerId: req.user.id,
            quantity_quintals
        });

        groupDeal.current_quantity_quintals += quantity_quintals;

        if (
            groupDeal.current_quantity_quintals >=
            groupDeal.target_quantity_quintals
        ) {
            groupDeal.status = 'Completed';
        }

        await groupDeal.save();

        res.status(200).json({
            success: true,
            data: groupDeal
        });
    } catch (error) {
        next(error);
    }
};

exports.getGroupDeals = async (req, res, next) => {
    try {
        const groupDeals = await GroupPurchase
            .find({ status: 'Active' })
            .populate('productId');

        res.status(200).json({
            success: true,
            count: groupDeals.length,
            data: groupDeals
        });
    } catch (error) {
        next(error);
    }
};


