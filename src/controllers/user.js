const crypto = require('crypto')

var users = {};

module.exports = {

  getUserBySid: function (sid, callback) {
    user = null
    for(var key of Object.keys(users)) {
      if(users[key]["sid"] === sid) {
        user = users[key]
      }
    }
    callback(null, user)
  },

  updateUser: function (key, profile, callback) {
    if(users[key] === undefined) {
      users[key] = {}
    }

    Object.keys(profile).forEach(field => {
      users[key][field] = profile[field]
    });

    generateUniqueSid((error, sid) => {
      users[key]["sid"] = sid
      callback(error, users[key])
    })
  }

}

// Private functions

function generateUniqueSid(callback) {
  var sha = crypto.createHash('sha256');
  sha.update(Math.random().toString());
  sid = sha.digest('hex');

  module.exports.getUserBySid(sid, (error, user) => {
    if(error) {
      callback(error)
    } else if(user === null) {
      callback(null, sid)
    } else {
      generateUniqueSid(callback)
    }
  })
}