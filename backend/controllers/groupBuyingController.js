// const GroupPurchase = require('../models/GroupPurchase');

// const Product = require('../models/Product');



// /\*\*

// &#x20;\* @desc    Create a new group purchase deal

// &#x20;\* @route   POST /api/v1/group-buying

// &#x20;\* @access  Private (Farmer / Admin)

// &#x20;\*/

// exports.createGroupDeal = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { productId, target\_quantity\_quintals, discount\_percentage, expiresAt } = req.body;



// &#x20;   const product = await Product.findById(productId);

// &#x20;   if (!product) {

// &#x20;     return res.status(404).json({ success: false, message: 'Product not found' });

// &#x20;   }



// &#x20;   const groupDeal = await GroupPurchase.create({

// &#x20;     productId,

// &#x20;     farmerId: req.user.id,

// &#x20;     target\_quantity\_quintals,

// &#x20;     discount\_percentage,

// &#x20;     expiresAt,

// &#x20;   });



// &#x20;   res.status(201).json({ success: true, data: groupDeal });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Join an existing group purchase deal

// &#x20;\* @route   PUT /api/v1/group-buying/:id/join

// &#x20;\* @access  Private (Consumer)

// &#x20;\*/

// exports.joinGroupDeal = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { quantity\_quintals } = req.body;

// &#x20;   const groupDeal = await GroupPurchase.findById(req.params.id);



// &#x20;   if (!groupDeal || groupDeal.status !== 'Active') {

// &#x20;     return res.status(400).json({ success: false, message: 'Group deal is not active' });

// &#x20;   }



// &#x20;   groupDeal.participants.push({

// &#x20;     consumerId: req.user.id,

// &#x20;     quantity\_quintals,

// &#x20;   });



// &#x20;   groupDeal.current\_quantity\_quintals += quantity\_quintals;



// &#x20;   // Auto-complete deal if target is met

// &#x20;   if (groupDeal.current\_quantity\_quintals >= groupDeal.target\_quantity\_quintals) {

// &#x20;     groupDeal.status = 'Completed';

// &#x20;   }



// &#x20;   await groupDeal.save();

// &#x20;   res.status(200).json({ success: true, data: groupDeal });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Get active group deals

// &#x20;\* @route   GET /api/v1/group-buying

// &#x20;\* @access  Public

// &#x20;\*/

// exports.getGroupDeals = async (req, res, next) => {

// &#x20; try {

// &#x20;   const groupDeals = await GroupPurchase.find({ status: 'Active' }).populate('productId');

// &#x20;   res.status(200).json({ success: true, count: groupDeals.length, data: groupDeals });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };


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


