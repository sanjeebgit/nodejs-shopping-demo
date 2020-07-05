const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
    },
    password: {
        type: String,
        require: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    // reference / related to Product model
                    ref: 'Product',
                    require: true
                },
                quantity: {
                    type: Number,
                    require: true
                }
            }
        ]
    }
});

// we can add own methods in mongoose
userSchema.methods.addToCart = function (product) {

    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        });
    }

    const updatedCart = {
        items: updatedCartItems
    };

    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(items => {
        return items.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function() {
    this.cart = { items: [] };
    return this.save();
}


module.exports = mongoose.model('User', userSchema);







// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;
// const Id = mongodb.Id;



// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users')
//             .insertOne(this);
//     }

//     addToCart(product) {

//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });

//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({
//                 productId: new ObjectId(product._id),
//                 quantity: 1
//             });
//         }

//         const updatedCart = {
//             items: updatedCartItems
//         };

//         const db = getDb();
//         return db.collection('users')
//             .updateOne(
//                 { _id: new ObjectId(this._id) },
//                 { $set: { cart: updatedCart } }
//             );
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });

//         return db.collection('products')
//             .find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {
//                         ...p,
//                         quantity: this.cart.items.find(i => {
//                             return i.productId.toString() === p._id.toString();
//                         }).quantity
//                     }
//                 });
//             });
//     }

//     deleteItemFromCart(productId) {
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString();
//         });
//         const db = getDb();
//         return db
//             .collection('users')
//             .updateOne(
//                 { _id: new ObjectId(this._id) },
//                 { $set: { cart: { items: updatedCartItems } } }
//             );
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name
//                     }
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = { items: [] };
//                 return db.collection('users')
//                     .updateOne(
//                         { _id: new ObjectId(this._id) },
//                         { $set: { cart: { items: [] } } }
//                     );
//             });
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders')
//             .find({ 'user._id': new ObjectId(this._id) })
//             .toArray();
//     }


//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users')
//             .findOne({ _id: new ObjectId(userId) });
//     }
// }

// module.exports = User;

// // user  have cart
// // cart will hole Product