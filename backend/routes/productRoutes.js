const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('Farmer', 'Admin'), upload.array('images', 5), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('Farmer', 'Admin'), updateProduct)
  .delete(protect, authorize('Farmer', 'Admin'), deleteProduct);

module.exports = router;