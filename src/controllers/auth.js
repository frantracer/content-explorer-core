const { google } = require('googleapis')
const CustomError = require('../common/errors.js')

const userC = require('../controllers/user')

// PRIVATE FUNCTIONS

function verifyIdToken (idToken, accessToken, refreshToken) {
    return new Promise((resolve, reject) => {
    // Create client
        const client = createOauth2Client()
        client.setCredentials({ access_token: accessToken })
        const oauth2 = google.oauth2({
            auth: client,
            version: 'v2'
        })
        // Verify id token
        oauth2.tokeninfo({ id_token: idToken }, (error, response) => {
            if (error) {
                reject(new CustomError('Cannot validate ID token', 400, error))
            } else {
                if (!isTokenIdResponseValid(response)) {
                    throw new CustomError('Invalid ID token', 400)
                } else {
                    resolve({ access: accessToken, refresh: refreshToken })
                }
            }
        })
    })
}

function getUserProfile (accessToken, refreshToken) {
    // Create client
    const client = createOauth2Client()
    client.setCredentials({ access_token: accessToken })
    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2'
    })

    // Get user profile
    return new Promise((resolve, reject) => {
        oauth2.userinfo.get({ access_token: accessToken }, (error, response) => {
            if (error) {
                reject(new CustomError('Cannot obtain user info', 400, error))
            } else {
                const userProfile = {
                    name: response.data.given_name,
                    email: response.data.email,
                    picture_url: response.data.picture,
                    google_profile: {
                        access_token: accessToken,
                        refresh_token: refreshToken
                    }
                }
                resolve(userProfile)
            }
        })
    })
}

function isTokenIdResponseValid (response) {
    return response.data.issuer === 'https://accounts.google.com'
}

// PUBLIC FUNCTIONS

function createOauth2Client (accessToken) {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.WEB_ADDRESS)
    if (accessToken) {
        client.setCredentials({ access_token: accessToken })
    }
    return client
}

function validateGoogleCode (code) {
    return createOauth2Client().getToken(code)
        .then(response => {
            return {
                id: response.res.data.id_token,
                access: response.res.data.access_token,
                refresh: response.res.data.refresh_token
            }
        }).catch(error => {
            throw new CustomError('Cannot obtain access token from code', 400, error)
        }).then(token => {
            return verifyIdToken(token.id, token.access, token.refresh)
        }).then(token => {
            return getUserProfile(token.access, token.refresh)
        }).then(userProfile => {
            return userC.updateOrCreateUser(userProfile)
        })
}

module.exports = { validateGoogleCode, createOauth2Client }
