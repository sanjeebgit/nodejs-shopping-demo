const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();
const { check, body } = require('express-validator/check');

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.post(
    '/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please eneter a valid email.')
            .normalizeEmail(),
        body(
            'password',
            'Please enter a valid password.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please eneter a valid email.')
            .custom((value, { req }) => {

                return User.findOne({ email: value })
                    .then(userDoc => {
                        // If Existing user
                        if (userDoc) {
                            return Promise.reject(
                                'E-Mail exist already. Please pick a different one'
                            );
                        }
                    });
            })
            .normalizeEmail(),
        body(
            'password',
            'Please enter a password with only number and text and at least 5 character')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match!')
                }
                return true;
            })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);


module.exports = router;