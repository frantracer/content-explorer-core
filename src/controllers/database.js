var MongoClient = require('mongodb').MongoClient

var _db

module.exports = {
    connect: function (dbUrl, dbName, callback) {
        MongoClient.connect(dbUrl, function (error, db) {
            if (error) {
                console.log(error)
            } else {
                console.log('Connected to mongodb database')
                _db = db.db(dbName)
                callback()
            }
        })
    },

    dbc: function () {
        return _db
    }
}
