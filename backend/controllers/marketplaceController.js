// const MarketStatus = require('../models/MarketStatus');



// /\*\*

// &#x20;\* @desc    Get regional market price status and crop trends

// &#x20;\* @route   GET /api/v1/marketplace/status

// &#x20;\* @access  Public

// &#x20;\*/

// exports.getMarketStatus = async (req, res, next) => {

// &#x20; try {

// &#x20;   const statusData = await MarketStatus.find().sort({ lastUpdated: -1 });

// &#x20;   res.status(200).json({ success: true, count: statusData.length, data: statusData });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };

const MarketStatus = require('../models/MarketStatus');

exports.getMarketStatus = async (req, res, next) => {
    try {
        const statusData = await MarketStatus
            .find()
            .sort({ lastUpdated: -1 });

        res.status(200).json({
            success: true,
            count: statusData.length,
            data: statusData
        });
    } catch (error) {
        next(error);
    }
};