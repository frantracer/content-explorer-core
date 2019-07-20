const {google} = require('googleapis');
const CustomError = require('../common/errors')

const db = require("../controllers/database").dbc
const ObjectId = require('mongodb').ObjectId;

const oauth2 = (accessToken) => { 
  client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.WEB_ADDRESS);
  if(accessToken){
    client.setCredentials({access_token: accessToken});
  }
  return client;
}

const youtube = google.youtube('v3')

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
      return list.concat(response.data.items)
    }
  })
}

function getSubscriptions(user) {
  const UPDATE_DIFF_MILISECONDS = 60 * 60 * 1000 // 1 HOUR
  var curDate = new Date()
  var updateUserSubs = curDate - user.subs_update > UPDATE_DIFF_MILISECONDS

  return new Promise(resolve => {
    if(updateUserSubs) {
      var googleAuth = oauth2(user.google_profile.access_token);
      resolve(getGoogleSubscriptionsPages(googleAuth, [], null))
    } else {
      resolve([])
    }
  }).then(requestedSubs => {
    return requestedSubs.filter(sub => { return new Date(sub.snippet.publishedAt) > new Date(user.subs_update) })
  }).then(newSubs => {
    // TODO: First perform a query to check whether the channel exists in the DB
    var googleAuth = oauth2(user.google_profile.access_token);
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
    .find({"_id" : { "$in" : userUpdated.subscriptions } })
    .toArray().then(sub => {
      return sub
    })
  })
}

function getFeeds(subscription, user) {
  googleAuth = oauth2(user.google_profile.access_token);

  return youtube.playlistItems.list({
    auth: googleAuth,
    part: "snippet",
    playlistId: subscription.info.playlist_id,
    maxResults: 5
  }).then((response) => {
    return response.data.items.map((item) => {
      return {
        type: "youtube",
        thumbnail: item.snippet.thumbnails.medium.url,
        link: "https://www.youtube.com/embed/" + item.snippet.resourceId.videoId,
        title: item.snippet.title,
        date: new Date(item.snippet.publishedAt)
      }
    })
  })
}

// PUBLIC FUNCTIONS

function getAllContentmarksByUser(user) {
  return getSubscriptions(user)
  .then(subscriptions => {
    return Promise.all(subscriptions.map(subscription => {
      return getFeeds(subscription, user).then(feeds => {
        return feeds.map(feed => {
          return { ...feed, "source": subscription }
        })
      })
    }))
  }).then(feedsBySubs => {
    var feeds = [].concat.apply([], feedsBySubs)
    feeds.sort((a, b) => { return b.date - a.date })

    return contentmarks = [
      {
        id: "1",
        name: "Uncategorized",
        feeds: feeds
      }
    ]
  })
}

module.exports = { getAllContentmarksByUser }

// SAMPLE RESULTS

const contentmarks_sample = [
  {
    id: "1",
    name: "Videogames",
    feeds: [
      {
        type: "youtube",
        title: "¿Importa la dificultad en el videojuego? - Post Script",
        link: "https://www.youtube.com/embed/rnglNZZGh-s",
        date: new Date("2019-04-17T00:00:00Z"),
        last_update: new Date(),
        source: {
          name: "DayoScript",
          type: "youtube",
          link: "https://www.youtube.com/channel/UCVBkwO6Ok1De0UfNZdo7-Ag",
          last_update: new Date(),
          info: {
            playlist_id: "UUVBkwO6Ok1De0UfNZdo7-Ag",
            channel_id: "UCVBkwO6Ok1De0UfNZdo7-Ag"
          }
        }
      },
      {
        type: "youtube",
        title: "Cuidao Ahí... Observation",
        link: "https://www.youtube.com/embed/qc80mRwsPc0",
        date: new Date("2019-05-16T00:00:00Z"),
        last_update: new Date(),
        source: {
          name: "Pazos64",
          type: "youtube",
          link: "https://www.youtube.com/channel/UCVj_RIAE1KGK_tM-iJtb_xg",
          last_update: new Date(),
          info: {
            playlist_id: "UUVj_RIAE1KGK_tM-iJtb_xg",
            channel_id: "UCVj_RIAE1KGK_tM-iJtb_xg"
          }
        }
      }
    ],
  },
  {
    id: "2",
    name: "Physics",
    feeds: [
      {
        type: "youtube",
        title: "La Física Cuántica de Avengers Endgame",
        link: "https://www.youtube.com/embed/ca1_rbfQMts",
        date: new Date("2019-05-03T00:00:00Z"),
        last_update: new Date(),
        source: {
          name: "QuantumFracture",
          type: "youtube",
          link: "https://www.youtube.com/channel/UCbdSYaPD-lr1kW27UJuk8Pw",
          last_update: new Date(),
          info: {
            playlist_id: "UUbdSYaPD-lr1kW27UJuk8Pw",
            channel_id: "UCbdSYaPD-lr1kW27UJuk8Pw"
          }
        }
      },
    ],
  },
  {
    id: "3",
    name: "Music",
    feeds: [
      {
        type: "youtube",
        title: "I Don't Want To Miss A Thing - Aerosmith (1920s Brass Band Cover) ft. Sara Niemietz",
        link: "https://www.youtube.com/embed/9iDncS9-2vI",
        date: new Date("2019-02-01T00:00:00Z"),
        last_update: new Date(),
        source: {
          name: "PostmodernJukebox",
          type: "youtube",
          link: "https://www.youtube.com/channel/UCORIeT1hk6tYBuntEXsguLg",
          last_update: new Date(),
          info: {
            playlist_id: "UUORIeT1hk6tYBuntEXsguLg",
            channel_id: "UCORIeT1hk6tYBuntEXsguLg"
          }
        }
      }
    ]
  }
];
