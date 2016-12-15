let express = require('express')
let app = express()
let environment = process.env.ENVIRONMENT || 'development'
const config = require('./config/config')[environment]

require('./config/config').initialize()
require('./config/database')(config)
require('./config/express')(app, config)
require('./config/routes')(app)
require('./config/passport')()


app.listen(1337)
// TODO: Add links to each comment and user image


