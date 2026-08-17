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