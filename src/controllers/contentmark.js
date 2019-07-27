const db = require("../controllers/database").dbc

const subscriptionC = require('../controllers/subscription')
const feedC = require('../controllers/feed')

// PRIVATE FUNCTIONS

function getContentmarkList(user) {
  return db().collection("subscriptions").find({}).project({"_id" : 1}).toArray()
  .then(sub_ids => {
    return contentmarks = [
      {
        _id: "1",
        name: "Uncategorized",
        subscriptions: sub_ids
      }
    ] 
  })
}

// PUBLIC FUNCTIONS

function getContentmarks(user) {
  return subscriptionC.getSubscriptions(user)
  .then(subscriptions => {
    return Promise.all(subscriptions.map(subscription => {
      return feedC.getFeeds(subscription, user)
    }))
  }).then(() => {
    return getContentmarkList(user)
  }).then(contentmarks => {
    return Promise.all(contentmarks.map(contentmark => {
      var subs_ids = contentmark.subscriptions.map(sub => { return sub._id })
      return db().collection("feeds").find({"subscription" : { "$in" : subs_ids } })
      // TODO: sort and limit by parameters
      .sort({"date" : -1}).limit(100).toArray()
      .then(feeds => {
        return {
          "id": contentmark._id,
          "name": contentmark.name,
          "feeds": feeds
        }
      })
    }))
  })
}

module.exports = { getContentmarks }

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
