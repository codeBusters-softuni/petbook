// this file will hold all constant values used throughout the web app
let environment = process.env.ENVIRONMENT || 'development'
const config = require('./config')[environment]
const path = require('path')

module.exports = {
  categories: ['Dog', 'Cat', 'Parrot', 'Elephant'],
  likes: ['Paw', 'Love', 'Dislike'],
  rootPath: config.rootFolder,
  photoUploadsPath: path.join(config.rootFolder, 'public', 'uploads'),
  postsPerPage: 20,
  usersPerPage: 10,
  favIconPath: path.join(config.rootFolder, '/public/images/favicon.ico'),
  viewsDirPath: path.join(config.rootFolder, '/views'),
  publicDirPath: path.join(config.rootFolder, 'public'),
  sessionSecretKey: process.env.SESSIONSECRETKEY || 's3cr3t5tr1ng'
}
