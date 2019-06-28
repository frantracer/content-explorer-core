const contenmarkC = require('../controllers/contentmark')
const userC = require('../controllers/user')
const authC = require('../controllers/auth')

// ENDPOINTS DEFINITION

module.exports = (router) => {
  router.route('/ping').get(ping),

  router.route('/login').post(login),

  router.route('/contentmarks').get(getContentmarks)
}

// COMMON FUNCTIONS

function sendResponse(error, data, res) {
  if(error) {
    res.status(error.code).send(error.message)
    console.error(error.message + " : " + error.code + " -> " + error.description)
  } else {
    res.status(200).send(data)
  }
}

function filterUserProfile(user) {
  return filteredUser = {
    name: user.name,
    sid: user.sid,
    picture_url: user.picture_url
  }
}

function ping(req, res, next) {
  sendResponse(null, {message: "ok"}, res)
}

// ROUTE FUNCTIONS

function login(req, res, next) {
  if(req.body.sid) {
    userC.getUserBySid(req.headers.sid, (error, user) => {
      sendResponse(error, filterUserProfile(user), res)
    })
  } else if (req.body.code) {
    authC.validateGoogleCode(req.body.code, (error, user) => {
      sendResponse(error, filterUserProfile(user), res)
    })
  }
}

function getContentmarks(req, res, next) {
  userC.getUserBySid(req.headers.sid, (error, user) => {
    if(error) {
      sendResponse(error, null, res)
    } else if(user != null) {
      contenmarkC.getAllContentmarksByUser(user, (error, contentmarks) => {
        sendResponse(error, {items: contentmarks}, res)
      });
    } else {
      sendResponse(new CustomError("User not found"), null, res)
    }
  })
}
