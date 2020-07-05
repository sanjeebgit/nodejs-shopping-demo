const fs = require('fs');
const path = require('path');
const https = require('https');

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');

const errorController = require('./controllers/error');
const User = require('./models/user');
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.t8pc0.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// const MONGODB_URI = 'mongodb://localhost:27017/node_app';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});

const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');


const filestorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}


// EJS(Templating Engine)
app.set('view engine', 'ejs');
app.set('views', 'views');

// importing routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));


// parsing  incoming request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: filestorage, fileFilter: fileFilter }).single('image'));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret: 'My secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use(flash());


// it will pass to view directly
app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next()
});


app.use((req, res, next) => {
    console.log('Request URL:-', `\x1b[32m ${req.url} \x1b[0m`);

    if (!req.session.user) {
        return next();
    }

    // if session have user
    User.findById(req.session.user._id)
        .then(user => {
            // throw new Error('Dummy');
            if (!user) {
                return next();
            }
            req.user = user;
            next()
        })
        .catch(err => {
            next(new Error(err));
        })
});

// -------------------------------------------------------

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
// app.use(csrf());


app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next()
});

// ------------------------------------------------------------------------------------
// @ Other Routes
// ------------------------------------------------------------------------------------
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500)

// use error in controller in case if wrong path
app.use(errorController.get404);

app.use((error, req, res, next) => {
    // console.log('Error occured!', error);
    if (error) {
        res.status(500).render('500', {
            pageTitle: 'Page Not Found',
            path: '/500',
            error: error
        });
    }
})


// connecting db using Mongoose
mongoose.connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(result => {
        app.listen(process.env.PORT || 3000);
      
        // https.createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3000);

        console.log('\x1b[34m%s\x1b[0m', 'Node server is listening in port: 3000');
    })
    .catch(err => {
        console.log('err:-', err);
    });






