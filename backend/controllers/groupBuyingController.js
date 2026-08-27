const GroupPurchase = require('../models/GroupPurchase');
const Product = require('../models/Product');

exports.createGroupDeal = async (req, res, next) => {
    try {
        const {
            productId,
            target_quantity_quintals,
            bulkDiscountPercentage,
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
            // Fallback supports both payload formats
            bulkDiscountPercentage: bulkDiscountPercentage || discount_percentage,
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
    const { quantity_quintals, shippingAddress } = req.body;

    // 1. Validate quantity input
    const quantity = Number(quantity_quintals);
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity_quintals number"
      });
    }

    // Fixed: changed GroupBuying to GroupPurchase
    const groupDeal = await GroupPurchase.findById(req.params.id);
    if (!groupDeal) {
      return res.status(404).json({ success: false, message: "Group deal not found" });
    }

    // 2. Safely add quantity
    groupDeal.current_quantity_quintals = (groupDeal.current_quantity_quintals || 0) + quantity;
    
    groupDeal.participants.push({
      consumerId: req.user.id,
      quantity_quintals: quantity,
      shippingAddress
    });

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