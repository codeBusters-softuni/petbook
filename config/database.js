const mongoose = require('mongoose')
mongoose.Promise = global.Promise

module.exports = (config) => {
  mongoose.connect(config.connectionString)

  // require different DB models here, the order is important!
  require('./../models/Role').initialize()
  require('./../models/Category').initialize()
  require('./../models/User')
  require('./../models/Post')
  require('./../models/Photo')
  require('./../models/Comment')
  require('./../models/Tag')
  require('./../models/Like')
}

