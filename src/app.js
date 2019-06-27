require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const routes = require('./routes/')

const app = express()

/** set up SSL */
var server
if(process.env.HTTPS) {
    var fs = require('fs');
    var https = require('https');
    var sslOptions = {
        key:  fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8'),
        cert: fs.readFileSync(process.env.CERTIFICATE_PATH, 'utf8')
    };
    server = https.createServer(sslOptions, app);
} else {
    var http = require('http');
    server = http.createServer(app);
}

/** set up middlewares */
app.use(cors())
app.use(bodyParser.json())
app.use(helmet())

/** set up routes {API Endpoints} */
const router = express.Router()
routes(router)
app.use('/api', router)

/** start server */
let port = 3000 || process.env.PORT;
server.listen(port, () => {
    console.log(`Server started at port: ${port}`);
});
