const mongoose = require('mongoose')
const Album = mongoose.model('Album')
const Photo = mongoose.model('Photo')
const Post = mongoose.model('Post')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath
const imagesAreValid = mongoose.model('Photo').validateImages
let parseFiles = multer({
  dest: photoUploadsPath,
  limits: { fileSize: 2000000, files: 10 } /* max file size is 2MB */
}).array('uploadAlbum')

module.exports = {
  uploadAlbum: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    
    parseFiles(req, res, function (err) {
      if (!imagesAreValid(req, res, err, req.files)) {  // attaches error messages to req.session.errMsg
        res.redirect(returnUrl)
        return
      }
      let newPostInfo = req.body
      let postIsPublic = newPostInfo.photocheckAlbum.toString() === 'publicvisible'
      let cssClassName = newPostInfo.nameAlbum.replace(/\s+/g, '-').replace(/\d+/g, 'abc') + '-DbStyle'  //CSS3 doesn't support ID selectors that start with a digit

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
      if (newPost.content.length < 3) {
        req.session.erroMsg = "Your post's content must be longer than 3 characters!"
        req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
        res.redirect(returnUrl)
        return
      }
      Album.findOne({ name: newAlbum.name }).then(album => {
        if (album) {
          req.session.errorMsg = 'Album already exists!'
          res.redirect(returnUrl)
          return
        }
        Album.create(newAlbum).then(newAlbum => {
          newAlbum.addToUser()

          // the newAlbumInfo holds the description for each photo, the key being their number. We start from 1 and for each photo increment
          let photoIndex = 1

          // create a photo object for each uploaded photo
          req.files = req.files.sort((fileA, fileB) => {
            return fileA.size - fileB.size
          })

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
