const {google} = require('googleapis');

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

module.exports = {
  getAllContentmarksByUser: function (user, callback) {
    getSubscriptions(user).then((subscriptions) => {
      Promise.all(subscriptions.map((subscription) => {
        return getFeeds(subscription).then((feeds) => {
          return {
            ...subscription,
            ...{"feeds": feeds}
          }
        })
      })).then((subscriptions) => {
        contentmarks = [
          {
            id: "1",
            name: "Uncategorized",
            resources: subscriptions
          }
        ]
        callback(null, contentmarks);
      })
    }).catch((error) => {
      callback(error)
    })
  }
}

// PRIVATE FUNCTIONS

const getSubscriptions = (user) => {
  googleAuth = oauth2(user.access_token);

  return youtube.subscriptions.list({
    auth: googleAuth,
    part: "snippet",
    mine: true,
    maxResults: 10
  }).then((response) => {
    return Promise.all(
      response.data.items.map((subscription) => {
        channelId = subscription.snippet.resourceId.channelId;
        return youtube.channels.list({
          auth: googleAuth,
          part: "contentDetails, snippet",
          id: channelId
        }).then((channel) => {
          channelInfo = channel.data.items[0]
          return {
            type: "youtube",
            name: channelInfo.snippet.title,
            link: "https://www.youtube.com/channel/" + channelInfo.id,
            info: {
              playlist_id: channelInfo.contentDetails.relatedPlaylists.uploads,
              channel_id: channelInfo.id
            }
          }
        })
    })).then((subscriptions) => {
      return subscriptions
    })
  })
}

const getFeeds = (subscription) => {
  googleAuth = oauth2(user.access_token);

  return youtube.playlistItems.list({
    auth: googleAuth,
    part: "snippet",
    playlistId: subscription.info.playlist_id,
    maxResults: 5
  }).then((response) => {
    return response.data.items.map((item) => {
      return {
        type: "youtube",
        link: "https://www.youtube.com/embed/" + item.snippet.resourceId.videoId,
        title: item.snippet.title,
        date: item.snippet.publishedAt
      }
    })
  })
}

// SAMPLE RESULTS

const contentmarks_sample = [
  {
    id: "1",
    name: "Videogames",
    resources: [
      {
        name: "DayoScript",
        type: "youtube",
        link: "https://www.youtube.com/channel/UCVBkwO6Ok1De0UfNZdo7-Ag",
        info: {
          lastUpdate: ""
        },
        feeds: [
          {
            name: "¿Importa la dificultad en el videojuego? - Post Script",
            link: "https://www.youtube.com/embed/rnglNZZGh-s"
          }
        ]
      },
      {
        name: "Pazos64",
        type: "youtube",
        link: "https://www.youtube.com/channel/UCVj_RIAE1KGK_tM-iJtb_xg",
        info: {
          lastUpdate: ""
        },
        feeds: [
          {
            name: "Cuidao Ahí... Observation",
            link: "https://www.youtube.com/embed/qc80mRwsPc0"
          }
        ]
      }
    ]
  },
  {
    id: "2",
    name: "Physics",
    resources: [
      {
        name: "QuantumFracture",
        type: "youtube",
        link: "https://www.youtube.com/channel/UCbdSYaPD-lr1kW27UJuk8Pw",
        info: {
          lastUpdate: ""
        },
        feeds: [
          {
            name: "La Física Cuántica de Avengers Endgame",
            link: "https://www.youtube.com/embed/ca1_rbfQMts"
          }
        ]
      }
    ]
  },
  {
    id: "3",
    name: "Music",
    resources: [
      {
        name: "PostmodernJukebox",
        type: "youtube",
        link: "https://www.youtube.com/channel/UCORIeT1hk6tYBuntEXsguLg",
        info: {
          lastUpdate: ""
        },
        feeds: [
          {
            name: "I Don't Want To Miss A Thing - Aerosmith (1920s Brass Band Cover) ft. Sara Niemietz",
            link: "https://www.youtube.com/embed/9iDncS9-2vI"
          }
        ]
      }
    ]
  }
];
