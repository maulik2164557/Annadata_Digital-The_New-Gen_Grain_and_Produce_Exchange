const GroupPurchase = require('../models/GroupPurchase');

/**
 * Automatically check and close expired group purchase deals
 */
const checkExpiredGroupDeals = async () => {
  try {
    const expiredDeals = await GroupPurchase.updateMany(
      {
        status: 'Active',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'Expired' },
      }
    );

    if (expiredDeals.modifiedCount > 0) {
      console.log(`[AUTOMATION] Closed ${expiredDeals.modifiedCount} expired group deals.`);
    }
  } catch (error) {
    console.error('[AUTOMATION ERROR] Failed to update expired deals:', error);
  }
};

module.exports = {
  checkExpiredGroupDeals,
};