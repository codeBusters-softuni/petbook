const mongoose = require('mongoose')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Post = mongoose.model('Post')
const path = require('path')
const config = require('../config/config')['development']  // TODO: Set environment variable!
const multer = require('multer')

let publicDirPath = path.join(config.rootFolder, 'public')
let readFiles = multer({ dest: path.join(publicDirPath, 'uploads') }).array('uploadedPhotos')

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
        readFiles(req, res, function () {  // middleware to parse the uploaded files to req.files
          // logic for the post
          let newPostArg = req.body
          let postPublicity = newPostArg.photocheck.toString() === 'publicvisible'
          let newPost = new Post({
            author: req.user._id,
            category: req.user.category,
            content: newPostArg.descriptionPostPhotos,
            public: postPublicity
          })
          if (newPost.content.length < 1) {
            // ERROR - Content is too short!
            // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
            req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
            res.redirect('/')
            return
          }

          Post.create(newPost).then(post => {
            // Logic for the upload of photos
            // the newPostArgs hold the description for each photo, the key being their number. We start from 1 and for each photo increment
            let counter = 1

            // create a photo object for each uploaded photo
            req.files.forEach(function (photo) {
              let photoUp = new Photo({
                fieldname: photo.fieldname,
                originalname: photo.originalname,
                encoding: photo.encoding,
                mimetype: photo.mimetype,
                destination: photo.destination,
                filename: photo.filename,
                path: photo.path,
                size: photo.size,
                author: post.author,
                description: newPostArg[counter.toString()],
                album: album._id,
                post: post._id,
                classCss: album.classForCss,
                public: postPublicity
              })
              counter += 1

              Photo.create(photoUp).then(photo => {
                photo.prepareUploadSinglePhotos(photoUp.album)
                photo.prepareUploadInPost(photoUp.post)
              }
              )
            })
          })

          res.redirect('/')
        })
      })
  }
}
