const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { validationResult } = require('express-validator/check');

const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    try {
        res.render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: message,
            oldInput: {
                email: '',
                password: '',
            },
            validationError: []
        })
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    // getting error from validator
    const error = validationResult(req);
    if (!error.isEmpty()) {
        console.log('error.array()', error.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: error.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationError: error.array()
        });
    }


    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationError: error.array()
                });
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log('err:-', err);
                            res.redirect('/');
                        });
                    }

                    // if password does n't Match
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Password should match.',
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationError: error.array()
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login')
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    try {
        res.render('auth/signup', {
            path: '/signup',
            pageTitle: 'signup',
            errorMessage: message,
            oldInput: {
                email: '',
                password: '',
                confirmPassword: ''
            },
            validationError: []
        })
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    // getting error from validator
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'signup',
            errorMessage: error.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword,
            },
            validationError: error.array()
        });
    }

    // If New user
    return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login')
            return transporter.sendMail({
                to: email,
                from: 'sanjeeb9997@gmail.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up!</h1>'
            });
        })
        .catch(err => {
            console.log('Mailer Error', err);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log('ERR:-', err);
            return res.redirect('/reset')
        }
        // It should store in user object
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('error', 'No account found in provided mail Id.');
                    return res.redirect('/reset');
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save()
                    .then(result => {
                        res.redirect('/');
                        console.log('req.body.email', req.body.email);
                        return transporter.sendMail({
                            to: req.body.email,
                            from: 'sanjeeb9997@gmail.com',
                            subject: 'Password Reset!',
                            html: `
                       <p> You requested a password reset </p>
                       <p><a href="http://localhost:3000/reset/${token}">Click this </a></p>
                       `,
                        });
                    });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;

    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    })
        .then(user => {

            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }

            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(newHashedPassword => {
            resetUser.password = newHashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined
            return resetUser.save();
        })
        .then(newUserDetails => {
            console.log('result after reset', newUserDetails);
            res.redirect('/login')
            return transporter.sendMail({
                to: newUserDetails.email,
                from: 'sanjeeb9997@gmail.com',
                subject: 'Password Reset!',
                html: `
           <p> You have successfully changed your password. Please login with new password. </p>
           <p><a href="http://localhost:3000/login">Click this to Login </a></p>
           `,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


