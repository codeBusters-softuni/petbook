const mongoose = require('mongoose')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Post = mongoose.model('Post')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath

let savePhotos = multer({ dest: photoUploadsPath }).array('uploadedPhotos')

module.exports = {
  allGet: (req, res) => {
    if (!req.user) {
      let returnUrl = '/user/uploadPhotos'
      req.session.returnUrl = returnUrl

      res.redirect('/user/login')
      return
    }

    res.render('user/uploadPhotos')
  },

  // function that handles photo uploads on the newsfeed
  uploadPhotosPost: (req, res) => {
    let albumName = 'newsfeed-photos-' + req.user._id
    // Try to find the user's album to add the picture to, otherwise create a new one
    Album.findOrCreateAlbum(albumName, req.user._id)  // custom function in Album.js
      .then(album => {
        savePhotos(req, res, function () {  // middleware to parse the uploaded files to req.files and save them on the server
          // logic for the post
          let newPostInfo = req.body
          let postIsPublic = newPostInfo.photocheck.toString() === 'publicvisible'
          let newPost = new Post({
            author: req.user._id,
            category: req.user.category,
            content: newPostInfo.descriptionPostPhotos,
            public: postIsPublic
          })
          if (newPost.content.length < 1) {
            // ERROR - Content is too short!
            // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
            req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
            res.redirect('/')
            return
          }
          // the newPostInfo holds the description for each photo, the key being their number. We start from 1 and for each photo increment
          let photoIndex = 1

          // create a photo object for each uploaded photo
          let photoUploadPromises = req.files.map(function (photo) {
            return new Promise((resolve, reject) => {
              let photoUp = Object.assign(photo, {
                // merge the photo's metadata and the data tied with the server
                author: newPost.author,
                description: newPostInfo[photoIndex.toString()],
                album: album._id,
                classCss: album.classForCss,
                public: postIsPublic
              })

              photoIndex += 1

              Photo.create(photoUp).then(photo => {
                resolve(photo._id)
              })
            })
          })

          Promise.all(photoUploadPromises).then((uploadedPhotos) => {
            newPost.photos = uploadedPhotos
            Post.create(newPost).then(post => {
              res.redirect('/')
            })
          })
        })
      })
  }
}
