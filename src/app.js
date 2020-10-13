require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

const router = require('./routes/')

const app = express()

const db = require('./controllers/database')

/** set up SSL */
var server
if (process.env.HTTPS) {
    const fs = require('fs')
    const https = require('https')
    const sslOptions = {
        key: fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8'),
        cert: fs.readFileSync(process.env.CERTIFICATE_PATH, 'utf8')
    }
    server = https.createServer(sslOptions, app)
} else {
    const http = require('http')
    server = http.createServer(app)
}

/** set up middlewares */
app.use(cors({ origin: process.env.WEB_ADDRESS, credentials: true }))
app.use(bodyParser.json())
app.use(helmet())
app.use(cookieParser())

/** set up routes {API Endpoints} */
app.use('/api', router)

/** connect to database */
db.connect(process.env.DB_URL, process.env.DB_NAME, () => {
    /** start server */
    const port = 3000 || process.env.PORT
    server.listen(port, () => {
        console.log(`Server started at port: ${port}`)
    })
})
