const db = require('../controllers/database').dbc

const ObjectId = require('mongodb').ObjectId

const CustomError = require('../common/errors')

const subscriptionC = require('../controllers/subscription')
const feedC = require('../controllers/feed')

// PRIVATE FUNCTIONS

function getContentmarkList (user) {
    return db().collection('contentmarks').find({ user_id: user._id }).toArray()
        .then(contentmarks => {
            return db().collection('users').findOne({ _id: user._id })
                .then(user => {
                    let subIds = user.subscriptions.map(subId => subId.toString())

                    const categorizedSubsIds = contentmarks
                        .map(contentmark => { return contentmark.subscriptions })
                        .reduce((list1, list2) => { return list1.concat(list2) }, [])

                    subIds = subIds.filter(subId => !categorizedSubsIds.includes(subId))

                    const uncategorized = {
                        _id: ObjectId('000000000000000000000000'),
                        name: 'Uncategorized',
                        subscriptions: subIds
                    }
                    contentmarks.push(uncategorized)
                    return contentmarks
                })
        })
}

// PUBLIC FUNCTIONS

function getContentmarks (user) {
    return subscriptionC.getSubscriptions(user)
        .then(subscriptions => {
            return Promise.all(subscriptions.map(subscription => {
                return feedC.getFeeds(subscription, user)
            }))
        }).then(() => {
            return getContentmarkList(user)
        }).then(contentmarks => {
            return Promise.all(contentmarks.map(contentmark => {
                var subsIds = contentmark.subscriptions.map(subId => { return ObjectId(subId) })
                return db().collection('feeds').find({ subscription: { $in: subsIds } })
                // TODO: sort and limit by parameters
                    .sort({ date: -1 }).limit(100).toArray()
                    .then(feeds => {
                        return {
                            id: contentmark._id,
                            name: contentmark.name,
                            subscriptions: subsIds,
                            feeds: feeds
                        }
                    })
            }))
        })
}

function createContentmark (user, contentmark) {
    return db().collection('contentmarks').insertOne({
        name: contentmark.name,
        user_id: user._id,
        subscriptions: []
    })
        .then(result => {
            return result.ops[0]
        })
}

function deleteContentmark (user, contentmarkId) {
    return db().collection('contentmarks').findOne({ _id: ObjectId(contentmarkId), user_id: user._id })
        .then(contentmark => {
            if (contentmark == null) {
                throw new CustomError('No contentmark found')
            } else {
                return db().collection('contentmarks').deleteOne({ _id: contentmark._id })
                    .then(result => {
                        return contentmark
                    })
            }
        })
}

function addSubscription (user, contentmarkId, subscriptionId) {
    return db().collection('subscriptions').findOne({ _id: ObjectId(subscriptionId) })
        .then(subscription => {
            if (subscription == null) {
                throw new CustomError('Subscription does not exist')
            }
        }).then(() => {
            return db().collection('contentmarks').findOne({ _id: ObjectId(contentmarkId) })
        }).then(contentmark => {
            console.log(contentmark)
            if (contentmark == null || String(contentmark.user_id) !== String(user._id)) {
                throw new CustomError('Contentmark not found')
            }
            return contentmark
        }).then(contentmark => {
            return db().collection('contentmarks').findOneAndUpdate(
                { _id: ObjectId(contentmark._id) },
                {
                    $addToSet: { subscriptions: subscriptionId }
                },
                { returnOriginal: false })
        }).then(result => {
            return result.value
        })
}

function removeSubscription (user, contentmarkId, subscriptionId) {
    return db().collection('subscriptions').findOne({ _id: ObjectId(subscriptionId) })
        .then(subscription => {
            if (subscription == null) {
                throw new CustomError('Subscription does not exist')
            }
        }).then(() => {
            return db().collection('contentmarks').findOne({ _id: ObjectId(contentmarkId) })
        }).then(contentmark => {
            console.log(contentmark)
            if (contentmark == null || String(contentmark.user_id) !== String(user._id)) {
                throw new CustomError('Contentmark not found')
            }
            return contentmark
        }).then(contentmark => {
            return db().collection('contentmarks').findOneAndUpdate(
                { _id: ObjectId(contentmark._id) },
                {
                    $pull: { subscriptions: subscriptionId }
                },
                { returnOriginal: false })
        }).then(result => {
            return result.value
        })
}

module.exports = { getContentmarks, createContentmark, deleteContentmark, addSubscription, removeSubscription }

// SAMPLE RESULTS

// eslint-disable-next-line no-unused-vars
const contentmarksSample = [
    {
        id: '1',
        name: 'Videogames',
        feeds: [
            {
                type: 'youtube',
                title: '¿Importa la dificultad en el videojuego? - Post Script',
                link: 'https://www.youtube.com/embed/rnglNZZGh-s',
                date: new Date('2019-04-17T00:00:00Z'),
                last_update: new Date(),
                source: {
                    name: 'DayoScript',
                    type: 'youtube',
                    link: 'https://www.youtube.com/channel/UCVBkwO6Ok1De0UfNZdo7-Ag',
                    last_update: new Date(),
                    info: {
                        playlist_id: 'UUVBkwO6Ok1De0UfNZdo7-Ag',
                        channel_id: 'UCVBkwO6Ok1De0UfNZdo7-Ag'
                    }
                }
            },
            {
                type: 'youtube',
                title: 'Cuidao Ahí... Observation',
                link: 'https://www.youtube.com/embed/qc80mRwsPc0',
                date: new Date('2019-05-16T00:00:00Z'),
                last_update: new Date(),
                source: {
                    name: 'Pazos64',
                    type: 'youtube',
                    link: 'https://www.youtube.com/channel/UCVj_RIAE1KGK_tM-iJtb_xg',
                    last_update: new Date(),
                    info: {
                        playlist_id: 'UUVj_RIAE1KGK_tM-iJtb_xg',
                        channel_id: 'UCVj_RIAE1KGK_tM-iJtb_xg'
                    }
                }
            }
        ]
    },
    {
        id: '2',
        name: 'Physics',
        feeds: [
            {
                type: 'youtube',
                title: 'La Física Cuántica de Avengers Endgame',
                link: 'https://www.youtube.com/embed/ca1_rbfQMts',
                date: new Date('2019-05-03T00:00:00Z'),
                last_update: new Date(),
                source: {
                    name: 'QuantumFracture',
                    type: 'youtube',
                    link: 'https://www.youtube.com/channel/UCbdSYaPD-lr1kW27UJuk8Pw',
                    last_update: new Date(),
                    info: {
                        playlist_id: 'UUbdSYaPD-lr1kW27UJuk8Pw',
                        channel_id: 'UCbdSYaPD-lr1kW27UJuk8Pw'
                    }
                }
            }
        ]
    },
    {
        id: '3',
        name: 'Music',
        feeds: [
            {
                type: 'youtube',
                title: 'I Don\'t Want To Miss A Thing - Aerosmith (1920s Brass Band Cover) ft. Sara Niemietz',
                link: 'https://www.youtube.com/embed/9iDncS9-2vI',
                date: new Date('2019-02-01T00:00:00Z'),
                last_update: new Date(),
                source: {
                    name: 'PostmodernJukebox',
                    type: 'youtube',
                    link: 'https://www.youtube.com/channel/UCORIeT1hk6tYBuntEXsguLg',
                    last_update: new Date(),
                    info: {
                        playlist_id: 'UUORIeT1hk6tYBuntEXsguLg',
                        channel_id: 'UCORIeT1hk6tYBuntEXsguLg'
                    }
                }
            }
        ]
    }
]
