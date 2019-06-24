const {google} = require('googleapis');
const CustomError = require("../common/errors.js");

const userC = require('../controllers/user')

const oauth2Client = () => { 
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.WEB_ADDRESS);
}

module.exports = {

  validateGoogleCode : function (code, callback) {
    const client = oauth2Client();

    const verifyIdToken = (idToken, accessToken, refreshToken) => {
      // Create client
      client.setCredentials({access_token: accessToken});
      const oauth2 = google.oauth2({
        auth: client,
        version: 'v2'
      });

      // Verify id token
      oauth2.tokeninfo({id_token: idToken}, (error, response) => {
        if(error) {
          callback(new CustomError("Cannot validate ID token", 400, error))
        } else {
          if(isTokenIdResponseValid(response)) {
            getUserProfile(accessToken, refreshToken)
          } else {
            callback(new CustomError("Invalid ID token", 400))
          }
        }
      })
    }

    const getUserProfile = (accessToken, refreshToken) => {
      // Create client
      client.setCredentials({access_token: accessToken});
      const oauth2 = google.oauth2({
        auth: client,
        version: 'v2'
      });

      // Get user profile
      oauth2.userinfo.get({access_token: accessToken}, (error, response) => {
        if(error) {
          callback(new CustomError("Cannot obtain user info", 400, error))
        } else {
          let userProfile = {
            name: response.data.given_name,
            email: response.data.email,
            picture_url: response.data.picture,
            google_profile: {
              access_token: accessToken,
              refresh_token: refreshToken
            }
          }
          userC.updateUser(userProfile.email, userProfile, callback)
        }
      })
    }

    // Get access and id token
    return client.getToken(code)
    .then((response) => {
      verifyIdToken(response.res.data.id_token, response.res.data.access_token, response.res.data.refresh_token)
    })
    .catch((error) => {
      callback(new CustomError("Cannot obtain access token from code", 400, error))
    })
  }

}

// PRIVATE FUNCTIONS

function isTokenIdResponseValid(response) {
  if(response.data.issuer === 'https://accounts.google.com') {
    return true
  } else {
    return false
  }
}