const { google } = require('googleapis')
const youtube = google.youtube('v3')

const authC = require('../controllers/auth')
const db = require('../controllers/database').dbc

// PRIVATE FUNCTIONS

function getVideosInPlaylist (googleAuth, playlistId, fromDate, maxResults, list, next) {
    const request = {
        auth: googleAuth,
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50
    }

    if (next) {
        request.pageToken = next
    }

    return youtube.playlistItems.list(request)
        .then(response => {
            const unfilteredItems = response.data.items
            const filteredItems = unfilteredItems.filter(item => { return new Date(item.snippet.publishedAt) > fromDate })

            let newList = list.concat(filteredItems)

            if (response.data.nextPageToken && unfilteredItems.length === filteredItems.length && newList.length < maxResults) {
                return getVideosInPlaylist(googleAuth, playlistId, fromDate, maxResults, newList, response.data.nextPageToken)
            } else {
                newList = newList.slice(0, maxResults)
                return newList
            }
        })
}

// PUBLIC FUNCTIONS

function getFeeds (subscription, user) {
    const MAX_FEEDS_PER_SUB = 500
    const UPDATE_DIFF_MILISECONDS = 60 * 60 * 1000 // 1 HOUR
    const currentDate = new Date()
    const updateFeeds = currentDate - subscription.feeds_update > UPDATE_DIFF_MILISECONDS

    return new Promise(resolve => {
        if (updateFeeds) {
            const googleAuth = authC.createOauth2Client(user.google_profile.access_token)
            resolve(getVideosInPlaylist(googleAuth, subscription.info.playlist_id, subscription.feeds_update, MAX_FEEDS_PER_SUB, [], null))
        } else {
            resolve([])
        }
    }).then(videos => {
        return videos.map(video => {
            return {
                type: 'youtube',
                thumbnail: video.snippet.thumbnails.medium.url,
                link: 'https://www.youtube.com/embed/' + video.snippet.resourceId.videoId,
                info: {
                    video_id: video.snippet.resourceId.videoId
                },
                title: video.snippet.title,
                date: new Date(video.snippet.publishedAt),
                subscription: subscription._id,
                last_update: new Date()
            }
        })
    }).then(feeds => {
        return feeds.map(feed => {
            return db().collection('feeds').findOneAndUpdate(
                { 'info.video_id': feed.info.video_id },
                { $setOnInsert: feed },
                { upsert: true, returnOriginal: false }
            ).then(result => {
                return result.value
            })
        })
    }).then(() => {
        return db().collection('subscriptions').findOneAndUpdate(
            { _id: subscription._id },
            { $set: { feeds_update: currentDate } },
            { returnOriginal: false }
        ).then(result => {
            subscription = result.value
            return subscription
        })
    }).then(() => {
        return db().collection('feeds').find({
            subscription: subscription._id
        })
            .toArray()
    })
}

module.exports = { getFeeds }
