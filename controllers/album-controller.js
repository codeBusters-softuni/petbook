const mongoose = require('mongoose')
const Album = mongoose.model('Album')
const Photo = mongoose.model('Photo')
const Post = mongoose.model('Post')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath
let saveFiles = multer({ dest: photoUploadsPath }).array('uploadAlbum')

module.exports = {
  uploadAlbum: (req, res) => {
    saveFiles(req, res, function () {
      let newPostInfo = req.body
      let postIsPublic = newPostInfo.photocheckAlbum.toString() === 'publicvisible'
      let cssClassName = newPostInfo.nameAlbum.replace(' ', '-') + '-DbStyle'

      let newPost = new Post({
        author: req.user._id,
        category: req.user.category,
        content: newPostInfo.descriptionAlbum,
        public: postIsPublic
      })

      let newAlbum = new Album({
        name: newPostInfo.nameAlbum,
        description: newPostInfo.descriptionAlbum,
        author: req.user._id,
        classCss: cssClassName,
        public: postIsPublic
      })

      Album.findOne({ name: newAlbum.name }).then(album => {
        if (album) {
          // ERROR - Album already exists!
          res.redirect('/')
          return
        }
        Album.create(newAlbum).then(newAlbum => {
          if (newPost.content.length < 1) {
            // ERROR - Content is too short!
            // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
            req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
            res.redirect('/')
            return
          }

          // the newAlbumInfo holds the description for each photo, the key being their number. We start from 1 and for each photo increment
          let photoIndex = 1

          // hold a promise for each photo that resolves when the photo is uploaded, returns an array of their ids
          let photoUploadPromises = req.files.map(function (photo) {
            return new Promise((resolve, reject) => {
              let photoUp = Object.assign(photo, {
                // merge the photo's metadata and the data tied with the server
                author: newAlbum.author,
                description: newPostInfo[photoIndex.toString()],
                album: newAlbum._id,
                classCss: cssClassName,
                public: postIsPublic
              })

              photoIndex += 1
              Photo.create(photoUp).then(photo => {
                resolve(photo.id)
              })
            })
          })
          // once all the photos are uploaded, create the post
          Promise.all(photoUploadPromises).then((uploadedPhotos) => {
            newPost.photos = uploadedPhotos
            Post.create(newPost).then(post => {
              res.redirect('/')
            })
          })
        })
      })
    })
  }
}
