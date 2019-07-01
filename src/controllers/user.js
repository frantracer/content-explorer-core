const crypto = require('crypto')
const db = require("../controllers/database").dbc

// Private functions

function _generateUniqueSid(callback) {
  var sha = crypto.createHash('sha256');
  sha.update(Math.random().toString());
  sid = sha.digest('hex');

  getUserBySid(sid, (error, user) => {
    if(error) {
      callback(error)
    } else if(user === null) {
      callback(null, sid)
    } else {
      _generateUniqueSid(callback)
    }
  })
}

// Public functions

function getUserBySid (sid, callback) {
  db().collection("users").findOne({"sid": sid}, (error, user) => {
    callback(error, user)
  })
}

function updateOrCreateUser (profile, callback) {
  db().collection("users").findOne({email: profile.email}, (error, user) => {
    if(error) {
      callback(error)
    } else {
      if(!user) {
        db().collection("users")
        .insertOne(profile, (error, result) => {
          user = result.ops[0]
          callback(error, user)
        })
      } else {
        db().collection("users")
        .findOneAndUpdate({_id: user._id}, {"$set": profile}, {"returnOriginal": false}, (error, result) => {
          user = result.value
          callback(error, user)
        })
      }
    }
  })
}

function updateUserSid (user, callback) {
  _generateUniqueSid((error, sid) => {
    db().collection("users")
    .findOneAndUpdate({_id: user._id}, {"$set" : { "sid": sid } }, {"returnOriginal": false}, (error, result) => {
      user = result.value
      callback(error, result.value)
    })
  })
}

module.exports = { getUserBySid, updateOrCreateUser, updateUserSid }
