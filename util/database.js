// -------------------------------------------------------------------------------------------------------------------------------
// @ Databse configuration for mando db
// -------------------------------------------------------------------------------------------------------------------------------

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let _db;

// mongodb+srv://sanjeeb:<password>@cluster0-yn9kj.mongodb.net/test?retryWrites=true&w=majority
// mongodb+srv://sanjeeb:Sanjeeb@99@cluster0-wnrwk.mongodb.net/shop?retryWrites=true&w=majority
const mongoConnect = (callback) => {
    MongoClient.connect('mongodb://localhost:27017/node_app',
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })
        .then(client => {
            console.log('Connected!');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err)
            throw err;
        });
};

const getDb = () => {
if(_db) {
 return _db;
}
throw 'No database found';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

