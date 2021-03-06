const express = require('express')

const CustomError = require('../common/errors')

const contentmarkC = require('../controllers/contentmark')
const subscriptionC = require('../controllers/subscription')
const userC = require('../controllers/user')
const authC = require('../controllers/auth')

// ENDPOINTS DEFINITION
var router = express.Router()

router.route('/ping')
    .get(ping)

router.route('/login')
    .post(login)

router.route('/logout')
    .post(logout)

router.route('/contentmarks')
    .get(apiCall(getContentmarks))

router.route('/contentmarks')
    .post(apiCall(createContentmark))

router.route('/contentmarks/:contentmark_id')
    .delete(apiCall(deleteContentmark))

router.route('/contentmarks/:contentmark_id/subscriptions')
    .post(apiCall(addSubscription))

router.route('/contentmarks/:contentmark_id/subscriptions/:subscription_id')
    .delete(apiCall(removeSubscription))

router.route('/subscriptions')
    .get(apiCall(getSubscriptions))

module.exports = router

// COMMON FUNCTIONS

function apiCall (callback) {
    return (req, res, next) => {
        new Promise((resolve, reject) => {
            const reqSid = req.headers.sid ? req.headers.sid : req.cookies.sid

            if (reqSid) {
                userC.getUserBySid(reqSid)
                    .then(user => {
                        if (user) {
                            req.user = user
                            resolve(req)
                        } else {
                            reject(new CustomError('Credentials are invalid', 401))
                        }
                    })
            } else {
                reject(new CustomError('No credentials provided', 401))
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

function sendResponse (res, data, code) {
    res.status(code || 200)
        .send({
            data: data
        })
}

function sendError (res, error) {
    if (!(error instanceof CustomError)) {
        error = new CustomError('Internal error', 500, error)
    }
    console.error(error.message + ' : ' + error.code + ' -> ' + error.description)
    console.debug(error.stack)

    res.status(error.code).send({
        meta: {
            error: error.message
        }
    })
}

function filterUserProfile (user) {
    return {
        name: user.name,
        sid: user.sid,
        picture_url: user.picture_url
    }
}

// ROUTE FUNCTIONS

function ping (req, res) {
    sendResponse(res, { message: 'ok' })
}

function login (req, res) {
    const reqSid = req.headers.sid ? req.headers.sid : req.cookies.sid

    if (req.body.code != null) {
        return authC.validateGoogleCode(req.body.code)
            .then(user => {
                return userC.updateUserSid(user)
            })
            .then(user => {
                const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 2).toUTCString()
                const sid = user.sid
                res.set('Set-Cookie', `sid=${sid}; Expires=${expirationDate}; HttpOnly; Secure; Path=/;`)

                sendResponse(res, filterUserProfile(user))
            }).catch(error => {
                sendError(res, error)
            })
    } else if (reqSid) {
        return userC.getUserBySid(reqSid)
            .then(user => {
                if (user == null) {
                    throw new CustomError('Invalid sid')
                } else {
                    sendResponse(res, filterUserProfile(user))
                }
            }).catch(error => {
                sendError(res, error)
            })
    } else {
        sendError(res, new CustomError('No credentials provided'))
    }
}

function logout (req, res) {
    const reqSid = req.headers.sid ? req.headers.sid : req.cookies.sid

    return userC.getUserBySid(reqSid)
        .then(user => {
            return userC.updateUserSid(user)
        })
        .then(user => {
            const expirationDate = new Date(0).toUTCString()
            res.set('Set-Cookie', `sid=; Expires=${expirationDate}; HttpOnly; Secure; Path=/;`)
            sendResponse(res, {})
        }).catch(error => {
            sendError(res, error)
        })
}

function getContentmarks (req) {
    return contentmarkC.getContentmarks(req.user)
        .then(contentmarks => {
            return { items: contentmarks }
        })
}

function createContentmark (req) {
    if (!req.body.name) {
        throw new CustomError('No contentmark name provided', 400)
    }
    return contentmarkC.createContentmark(req.user, req.body)
        .then(contentmark => {
            return contentmark
        })
}

function deleteContentmark (req) {
    return contentmarkC.deleteContentmark(req.user, req.params.contentmark_id)
}

function addSubscription (req) {
    return contentmarkC.addSubscription(req.user, req.params.contentmark_id, req.body.subscription_id)
}

function removeSubscription (req) {
    return contentmarkC.removeSubscription(req.user, req.params.contentmark_id, req.params.subscription_id)
}

function getSubscriptions (req) {
    return subscriptionC.getSubscriptions(req.user)
        .then(subscriptions => {
            const subsDetails = subscriptions.map(subscription => {
                return {
                    id: subscription._id,
                    type: subscription.type,
                    name: subscription.name,
                    link: subscription.link,
                    thumbnail: subscription.thumbnail
                }
            })
            return {
                items: subsDetails
            }
        })
}
