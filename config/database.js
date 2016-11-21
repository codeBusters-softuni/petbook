const mongoose = require('mongoose')
mongoose.Promise = global.Promise

module.exports = (config) => {
  mongoose.connect(config.connectionString)

  // require different modules here
  require('./../models/Role').initialize()
  require('./../models/User')
  require('./../models/Post')
  require('./../models/Photo')
  require('./../models/Category')
  require('./../models/Comment')
  require('./../models/Tag')
  require('./../models/Like')
}

