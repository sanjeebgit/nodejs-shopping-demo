// ------------------------------------------------------------------------------------
// @Dependencies
// ------------------------------------------------------------------------------------
const express = require('express');

const router = express.Router();

const path = require('path');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const { body } = require('express-validator/check');

// ------------------------------------------------------------------------------------
// @Paths
// ------------------------------------------------------------------------------------

// path:- /admin/add-product => get
router.get('/add-product', isAuth, adminController.getAddProduct);

// path:-  /admin/add-product => post 
router.post(
    '/add-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    // body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description')
        .trim()
        .isString()
        .isLength({ min: 5, max: 400 })
],
    isAuth,
    adminController.postAddProduct);

// path:- /admin/edit-product
router.get('/edit-product/:productId', adminController.getEditProduct);

// path:- /admin/product => get
router.get('/products', isAuth, adminController.getProducts);

// path:-  /admin/edit-product => post 
router.post('/edit-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    // body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description')
        .trim()
        .isString()
        .isLength({ min: 5, max: 400 })
        .trim()
],
    isAuth,
    adminController.postEditProduct);

// path:- /admin/delete-product/ => delete
router.delete('/product/:productId', isAuth, adminController.deleteProduct)









// @Exporting Modules
module.exports = router;

// exporting multiple dependencies
// exports.routes = router;
// exports.products = products;

