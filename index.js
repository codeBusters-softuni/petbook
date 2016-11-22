let express = require('express')
let app = express()
const config = require('./config/config')['development']

require('./config/database')(config)
require('./config/express')(app, config)
require('./config/routes')(app)
require('./config/passport')()

app.listen(1337)
