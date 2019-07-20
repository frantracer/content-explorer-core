const crypto = require('crypto')
const db = require("../controllers/database").dbc

// PRIVATE FUNCTIONS

function generateUniqueSid() {
  var sha = crypto.createHash('sha256');
  sha.update(Math.random().toString());
  sid = sha.digest('hex');

  return getUserBySid(sid)
  .then(user => {
    if(user === null) {
      return sid
    } else {
      return generateUniqueSid()
    }
  })
}

// PUBLIC FUNCTIONS

function getUserBySid (sid) {
  return db().collection("users").findOne({"sid": sid})
  .then(user => {
    return user
  })
}

function updateOrCreateUser (profile) {
  return db().collection("users").findOne({email: profile.email})
  .then(user => {
    if(!user) {
      profile["profile_update"] = new Date();
      profile["subs_update"] = new Date(0);
      profile["subscriptions"] = []
      
      return db().collection("users")
      .insertOne(profile).then(result => {
        return result.ops[0]
      })
    } else {
      profile["profile_update"] = new Date();

      return db().collection("users")
      .findOneAndUpdate({_id: user._id}, {"$set": profile}, {"returnOriginal": false}).then(result => {
        return result.value
      })
    }
  })
}

function updateUserSid (user) {
  return generateUniqueSid()
  .then(sid => {
    return db().collection("users").findOneAndUpdate({_id: user._id}, {"$set" : { "sid": sid } }, {"returnOriginal": false})
    .then(result => {
      return result.value
    })
  })
}

module.exports = { getUserBySid, updateOrCreateUser, updateUserSid }
