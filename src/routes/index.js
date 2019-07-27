const CustomError = require('../common/errors')

const contentmarkC = require('../controllers/contentmark')
const userC = require('../controllers/user')
const authC = require('../controllers/auth')

// ENDPOINTS DEFINITION

module.exports = (router) => {
  router.route('/ping').get(apiCall(ping, false)),

  router.route('/login').post(apiCall(login, false)),

  router.route('/contentmarks').get(apiCall(getContentmarks, true))
}

// COMMON FUNCTIONS

function apiCall(callback, sidRequired) {
  return (req, res, next) => {
    new Promise((resolve, reject) => {
      if(sidRequired) {
        if(req.headers.sid) {
          userC.getUserBySid(req.headers.sid)
          .then(user => {
            if(user) {
              req.user = user
              resolve(req)
            } else {
              reject(new CustomError("Credentials are invalid", 401))
            }
          })
        } else {
          reject(new CustomError("No credentials provided", 401))
        }
      } else {
        resolve(req)
      }
    }).then(request => {
      return callback(request)
    }).then(data => {
      sendResponse(res, data, 200)
    }).catch(error => {
      sendError(res, error)
    })
  }
}

function sendResponse(res, data, code) {
  res.status(code ? code : 200)
  .send({
    "data": data
  })
}

function sendError(res, error) {
  if(!(error instanceof CustomError)) {
    error = new CustomError("Internal error", 500, error)
  }
  console.error(error.message + " : " + error.code + " -> " + error.description)
  console.debug(error.stack)

  res.status(error.code).send({
    "meta": {
      "error": error.message
    }
  })
}

function filterUserProfile(user) {
  return filteredUser = {
    name: user.name,
    sid: user.sid,
    picture_url: user.picture_url
  }
}

// ROUTE FUNCTIONS

function ping(req) {
  return new Promise((resolve, reject) => { resolve({message: "ok"}) })
}

function login(req) {
  if(req.headers.sid) {
    return userC.getUserBySid(req.headers.sid)
    .then(user => {
      return filterUserProfile(user)
    })
  } else if (req.body.code) {
    return authC.validateGoogleCode(req.body.code)
    .then(user => {
      return userC.updateUserSid(user)
    })
    .then(user => {
      return filterUserProfile(user)
    })
  }
}

function getContentmarks(req) {
  return contentmarkC.getContentmarks(req.user)
  .then(contentmarks => {
    return {items: contentmarks}
  })
}
