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
    getSubscriptions(user)
    .then((subscriptions) => {
      Promise.all(subscriptions.map((subscription) => {
        return getFeeds(subscription, user).then((feeds) => {
          return feeds.map((feed) => {
            return { ...feed, "source": subscription}
          })
        })
      }))
      .then((feedsBySubs) => {
        var feeds = [].concat.apply([], feedsBySubs)
        feeds.sort((a, b) => { return b.date - a.date })

        contentmarks = [
          {
            id: "1",
            name: "Uncategorized",
            feeds: feeds
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
  googleAuth = oauth2(user.google_profile.access_token);

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

const getFeeds = (subscription, user) => {
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
        link: "https://www.youtube.com/embed/" + item.snippet.resourceId.videoId,
        title: item.snippet.title,
        date: new Date(item.snippet.publishedAt)
      }
    })
  })
}

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
