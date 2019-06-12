const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const routes = require('./routes/')

const app = express()

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
app.listen(port, () => {
    console.log(`Server started at port: ${port}`);
});
