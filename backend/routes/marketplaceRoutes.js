const express = require('express');
const { getMarketStatus } = require('../controllers/marketplaceController');

const router = express.Router();

router.get('/status', getMarketStatus);

module.exports = router;