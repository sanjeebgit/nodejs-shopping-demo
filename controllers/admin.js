const Product = require('../models/product');
const { validationResult } = require('express-validator/check');

const mongoose = require('mongoose');

const fileHelper = require('../util/file');

// -------------------------------------------------------------------------------------------------------------------------------------
// @ Admin Routes
// -------------------------------------------------------------------------------------------------------------------------------------
exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationError: []
    });
};


exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;
    console.log('image', image);
    const errors = validationResult(req);
    console.log('Error', errors);

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                description: description,
                price: price
            },
            errorMessage: 'Attached file is not an image.',
            validationError: []
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                description: description,
                price: price
            },
            errorMessage: errors.array()[0].msg,
            validationError: errors.array()
        });
    }

    const imageUrl = image.path;
    const product = new Product({
        // _id: mongoose.Types.ObjectId('5e9d1f36d054101dfdbabcf0'),
        title: title,
        imageUrl: imageUrl,
        description: description,
        price: price,
        // mongoose will pick the id from user object 
        userId: req.user
    });

    product
        // save method from mongoose
        .save()
        .then(result => {
            console.log('CREATED product!', result);
            res.redirect('/admin/products');
        })
        .catch(err => {
            // First Option
            //  res.redirect('/500');

            // second choice
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);

            // @ One option
            // return res.status(500).render('admin/edit-product', {
            //     pageTitle: 'Add Product',
            //     path: '/admin/edit-product',
            //     editing: false,
            //     hasError: true,
            //     product: {
            //         title: title,
            //         imageUrl: imageUrl,
            //         description: description,
            //         price: price
            //     },
            //     errorMessage: 'Databse operation failed, please try again...',
            //     validationError: errors.array()
            // });
        });

};


exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    // fetching product
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationError: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};



exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;

    const errors = validationResult(req);
    console.log('errors:-', errors);

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                description: updatedDescription,
                price: updatedPrice,
                _id: prodId
            },
            errorMessage: 'Attached file is not an image.',
            validationError: errors.array()
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                description: updatedDescription,
                price: updatedPrice,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationError: errors.array()
        });
    }

    Product.findById(prodId)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.description = updatedDescription;
            product.price = updatedPrice;

            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }

            // updating product in mongoose
            return product.save()
                .then(result => {
                    console.log('UPDATED product!');
                    res.redirect('/admin/products');
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


// Get Admin Product page
exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        // id will be escalated
        //  .select('title price -_id imageUrl')
        //  .populate('userId', 'name')
        .then(products => {
            console.log('products', products);
            res.render('admin/products', {
                pageTitle: 'Admin Products',
                path: '/admin/products',
                prods: products,
                user: req.user
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};



exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
 
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('product not found.'))
            }
            fileHelper.deleteFile(product.imageUrl);
            return  Product.deleteOne({ _id: prodId, userId: req.user._id })
        })
        .then(() => {
            res.status(200).json({
                message: 'Success!'
            });
            // res.redirect('/admin/products');
        })
        .catch(err => {
            res.status(500).json({
                message: 'Deleting product failed.'
            });
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // return next(error);
        });
};