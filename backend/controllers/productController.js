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