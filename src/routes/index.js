const CustomError = require('../common/errors')

const contentmarkC = require('../controllers/contentmark')
const userC = require('../controllers/user')
const authC = require('../controllers/auth')

// ENDPOINTS DEFINITION

module.exports = (router) => {
  router.route('/ping')
  .get(apiCall(ping, false)),

  router.route('/login')
  .post(apiCall(login, false)),

  router.route('/contentmarks')
  .get(apiCall(getContentmarks, true)),

  router.route('/contentmarks')
  .post(apiCall(createContentmark, true)),

  router.route('/contentmarks/:contentmark_id')
  .delete(apiCall(deleteContentmark, true)),

  router.route('/contentmarks/:contentmark_id/subscriptions')
  .post(apiCall(addSubscription, true)),

  router.route('/contentmarks/:contentmark_id/subscriptions/:subscription_id')
  .delete(apiCall(removeSubscription, true))
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

function createContentmark(req) {
  if(!req.body.name) {
    throw new CustomError("No contentmark name provided", 400)
  }
  return contentmarkC.createContentmark(req.user, req.body)
  .then(contentmark => {
    return contentmark
  })
}

function deleteContentmark(req) {
  return contentmarkC.deleteContentmark(req.user, req.params.contentmark_id)
}

function addSubscription(req) {
  return contentmarkC.addSubscription(req.user, req.params.contentmark_id, req.body.subscription_id)
}

function removeSubscription(req) {
  return contentmarkC.removeSubscription(req.user, req.params.contentmark_id, req.params.subscription_id)
}