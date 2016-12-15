// this file will hold all constant values used throughout the web app
let environment = process.env.ENVIRONMENT || 'development'
const config = require('./config')[environment]
const path = require('path')

module.exports = {
  categories: ['Dog', 'Cat'],
  likes: ['Paw', 'Love', 'Dislike'],
  rootPath: config.rootFolder,
  photoUploadsPath: path.join(config.rootFolder, 'public', 'uploads'),
  postsPerPage: 20
}
