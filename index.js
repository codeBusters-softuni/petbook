let express = require('express')
let app = express()
var favicon = require('serve-favicon');
let environment = process.env.ENVIRONMENT || 'development'
const config = require('./config/config')[environment]

app.use(favicon(__dirname + '/public/images/favicon.ico'));

require('./config/config').initialize()
require('./config/database')(config)
require('./config/express')(app, config)
require('./config/routes')(app)
require('./config/passport')()


app.listen(1337)
// TODO: Add links to each comment and user image
// TODO: Add pagination!


