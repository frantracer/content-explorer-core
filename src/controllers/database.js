var MongoClient = require('mongodb').MongoClient;

var _db;

module.exports = {
  connect: function(db_url, db_name, callback) {
    MongoClient.connect(db_url, function(error, db) {
      if (error) {
        console.log(error)
      } else {
        console.log("Connected to mongodb database")
        _db = db.db(db_name);
        callback();
      }
    });
  },

  dbc : function() {
    return _db;
  }
}
