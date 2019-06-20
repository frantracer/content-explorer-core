var users = {
  "key" : {
    email: "",
    name: "",
    sid: "",
    access_token: "",
    refresh_token: "",
    picture_url: ""
  }
};

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
    users[key]["sid"] = "mysid"

    callback(null, users[key])
  }

}
