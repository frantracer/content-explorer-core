const {google} = require('googleapis');
const youtube = google.youtube('v3')

const ObjectId = require('mongodb').ObjectId;

const authC = require('../controllers/auth')
const db = require("../controllers/database").dbc

// PRIVATE FUNCTIONS

function getGoogleSubscriptionsPages(googleAuth, list, next) {
  var request = {
    auth: googleAuth,
    part: "snippet",
    mine: true,
    maxResults: 25
  }
  if (next) {
    request["pageToken"] = next
  }

  return youtube.subscriptions.list(request)
  .then(response => {
    if(response.data.nextPageToken) {
      return getGoogleSubscriptionsPages(googleAuth, list.concat(response.data.items), response.data.nextPageToken)
    } else {
      return list.concat(response.data.items)
    }
  })
}
  
function getGoogleChannelsInfo(googleAuth, ids, max, list) {
  if(max > 50){
    throw new CustomError("The maximum number of channels to request is 50", 500)
  }

  if(ids.length == 0) {
    return new Promise(resolve => {resolve([])})
  }

  return youtube.channels.list({
    auth: googleAuth,
    part: "contentDetails, snippet",
    id: ids.slice(0, max).join(","),
    maxResults: max
  }).then(response => {
    if(ids.length > max) {
      return getGoogleChannelsInfo(googleAuth, ids.slice(max), max, list.concat(response.data.items))
    } else {
      list = list.concat(response.data.items)
      return list
    }
  })
}

// PUBLIC FUNCTIONS

function getSubscriptions(user) {
  const UPDATE_DIFF_MILISECONDS = 60 * 60 * 1000 // 1 HOUR
  var curDate = new Date()
  var updateUserSubs = curDate - user.subs_update > UPDATE_DIFF_MILISECONDS

  return new Promise(resolve => {
    if(updateUserSubs) {
      var googleAuth = authC.createOauth2Client(user.google_profile.access_token);
      resolve(getGoogleSubscriptionsPages(googleAuth, [], null))
    } else {
      resolve([])
    }
  }).then(requestedSubs => {
    return requestedSubs.filter(sub => { return new Date(sub.snippet.publishedAt) > new Date(user.subs_update) })
  }).then(newSubs => {
    // TODO: First perform a query to check whether the channel exists in the DB
    var googleAuth = authC.createOauth2Client(user.google_profile.access_token);
    channelIds = newSubs.map(sub => {return sub.snippet.resourceId.channelId})
    return getGoogleChannelsInfo(googleAuth, channelIds, 50, [])
    .then(channels => {
      return channels.map(channelInfo => {
        return {
          type: "youtube",
          name: channelInfo.snippet.title,
          link: "https://www.youtube.com/channel/" + channelInfo.id,
          info: {
            playlist_id: channelInfo.contentDetails.relatedPlaylists.uploads,
            channel_id: channelInfo.id
          },
          feeds_update: new Date(0),
          thumbnail: channelInfo.snippet.thumbnails.medium.url
        }
      })
    })
  }).then(newChannels => {
    return Promise.all(newChannels.map(channel => {
      return db().collection("subscriptions").findOneAndUpdate(
        {"info.channel_id" : channel.info.channel_id},
        {"$setOnInsert" : channel},
        {"upsert" : true, "returnOriginal" : false}
      ).then(result => {
        return result.value
      })
    }))
  }).then(createdSubs => {
    if(updateUserSubs) {
      return db().collection("users").findOneAndUpdate(
        {"_id" : ObjectId(user._id)},
        {
          "$addToSet" : { "subscriptions" : { "$each" : createdSubs.map(sub => {return sub._id}) } },
          "$set" : { "subs_update" : new Date() }
        },
        {"returnOriginal": false}
      ).then(result => {
        return result.value
      })
    } else {
      return user
    }
  }).then(userUpdated => {
    return db().collection("subscriptions")
    .find({"_id" : { "$in" : userUpdated.subscriptions } }).toArray()
  })
}

module.exports = { getSubscriptions }
