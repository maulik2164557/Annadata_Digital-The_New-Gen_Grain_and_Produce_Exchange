// const Product = require('../models/Product');



// /\*\*

// &#x20;\* @desc    Get all produce listings (with search \& category filters)

// &#x20;\* @route   GET /api/v1/products

// &#x20;\* @access  Public

// &#x20;\*/

// exports.getProducts = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { category, search } = req.query;

// &#x20;   let query = { isApproved: true };



// &#x20;   if (category) {

// &#x20;     query.category = category;

// &#x20;   }



// &#x20;   if (search) {

// &#x20;     query.name = { $regex: search, $options: 'i' };

// &#x20;   }



// &#x20;   const products = await Product.find(query).populate('farmerId', 'name phone address averageRating');

// &#x20;   res.status(200).json({ success: true, count: products.length, data: products });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Get single product by ID

// &#x20;\* @route   GET /api/v1/products/:id

// &#x20;\* @access  Public

// &#x20;\*/

// exports.getProductById = async (req, res, next) => {

// &#x20; try {

// &#x20;   const product = await Product.findById(req.params.id).populate('farmerId', 'name phone address averageRating');

// &#x20;   if (!product) {

// &#x20;     return res.status(404).json({ success: false, message: 'Product not found' });

// &#x20;   }

// &#x20;   res.status(200).json({ success: true, data: product });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Create a new produce listing

// &#x20;\* @route   POST /api/v1/products

// &#x20;\* @access  Private (Farmer only)

// &#x20;\*/

// exports.createProduct = async (req, res, next) => {

// &#x20; try {

// &#x20;   req.body.farmerId = req.user.id;



// &#x20;   // If uploaded images exist via multer middleware

// &#x20;   if (req.files \&\& req.files.length > 0) {

// &#x20;     req.body.images = req.files.map((file) => file.path);

// &#x20;   }



// &#x20;   const product = await Product.create(req.body);

// &#x20;   res.status(201).json({ success: true, data: product });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Update a produce listing

// &#x20;\* @route   PUT /api/v1/products/:id

// &#x20;\* @access  Private (Farmer who owns the product / Admin)

// &#x20;\*/

// exports.updateProduct = async (req, res, next) => {

// &#x20; try {

// &#x20;   let product = await Product.findById(req.params.id);



// &#x20;   if (!product) {

// &#x20;     return res.status(404).json({ success: false, message: 'Product not found' });

// &#x20;   }



// &#x20;   // Verify ownership or Admin role

// &#x20;   if (product.farmerId.toString() !== req.user.id \&\& req.user.role !== 'Admin') {

// &#x20;     return res.status(403).json({ success: false, message: 'Not authorized to update this produce' });

// &#x20;   }



// &#x20;   product = await Product.findByIdAndUpdate(req.params.id, req.body, {

// &#x20;     new: true,

// &#x20;     runValidators: true,

// &#x20;   });



// &#x20;   res.status(200).json({ success: true, data: product });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Delete a produce listing

// &#x20;\* @route   DELETE /api/v1/products/:id

// &#x20;\* @access  Private (Farmer who owns the product / Admin)

// &#x20;\*/

// exports.deleteProduct = async (req, res, next) => {

// &#x20; try {

// &#x20;   const product = await Product.findById(req.params.id);



// &#x20;   if (!product) {

// &#x20;     return res.status(404).json({ success: false, message: 'Product not found' });

// &#x20;   }



// &#x20;   if (product.farmerId.toString() !== req.user.id \&\& req.user.role !== 'Admin') {

// &#x20;     return res.status(403).json({ success: false, message: 'Not authorized to delete this produce' });

// &#x20;   }



// &#x20;   await product.deleteOne();

// &#x20;   res.status(200).json({ success: true, message: 'Produce listing deleted successfully' });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };
const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        let query = { isApproved: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = {
                $regex: search,
                $options: 'i'
            };
        }

        const products = await Product
            .find(query)
            .populate(
                'farmerId',
                'name phone address averageRating'
            );

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product
            .findById(req.params.id)
            .populate(
                'farmerId',
                'name phone address averageRating'
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        req.body.farmerId = req.user.id;

        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(
                (file) => file.path
            );
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (
            product.farmerId.toString() !== req.user.id &&
            req.user.role !== 'Admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this produce'
            });
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (
            product.farmerId.toString() !== req.user.id &&
            req.user.role !== 'Admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Produce listing deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};