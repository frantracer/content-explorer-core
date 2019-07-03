const CustomError = require('../common/errors')

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

function sendResponse(res, data, code) {
  res.status(code ? code : 200).send(data)
}

function sendError(res, error) {
  if(!(error instanceof CustomError)) {
    error = new CustomError("Internal error", 500, error)
  }
  res.status(error.code).send(error.message)
  console.error(error.message + " : " + error.code + " -> " + error.description)
  console.debug(error.stack)
}

function filterUserProfile(user) {
  return filteredUser = {
    name: user.name,
    sid: user.sid,
    picture_url: user.picture_url
  }
}

function ping(req, res, next) {
  sendResponse(res, {message: "ok"})
}

// ROUTE FUNCTIONS

function login(req, res, next) {
  if(req.headers.sid) {
    userC.getUserBySid(req.headers.sid).then(user => {
      sendResponse(res, filterUserProfile(user))
    }).catch(error => {
      sendError(res, error)
    })
  } else if (req.body.code) {
    authC.validateGoogleCode(req.body.code)
    .then(user => {
      return userC.updateUserSid(user)
    }).then(user => {
      sendResponse(res, filterUserProfile(user))
    }).catch(error => {
      sendError(res, error)
    })
  }
}

function getContentmarks(req, res, next) {
  userC.getUserBySid(req.headers.sid)
  .then(user => {
    if(user != null) {
      return contenmarkC.getAllContentmarksByUser(user)
    } else {
      throw new CustomError("User not found")
    }
  }).then(contentmarks => {
    sendResponse(res, {items: contentmarks})
  }).catch(error => {
    sendError(res, error)
  })
}
