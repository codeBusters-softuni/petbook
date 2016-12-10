const mongoose = require('mongoose')
const Album = mongoose.model('Album')
const Photo = mongoose.model('Photo')
const Post = mongoose.model('Post')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath
let saveFiles = multer({ dest: photoUploadsPath }).array('uploadAlbum')

module.exports = {
  createAlbumGet: (req, res) => {
    if (!req.user) {
      let returnUrl = '/user/uploadPhotos'
      req.session.returnUrl = returnUrl
      res.redirect('/user/login')
      return
    }

    res.render('user/uploadPhotos')
  },

  uploadAlbum: (req, res) => {
    saveFiles(req, res, function () {
      let newPostArg = req.body
      let postIsPublic = newPostArg.photocheckAlbum.toString() === 'publicvisible'

      let newPost = new Post({
        author: req.user._id,
        category: req.user.category,
        content: newPostArg.descriptionAlbum,
        public: postIsPublic
      })

      if (newPost.content.length < 1) {
        // ERROR - Content is too short!
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
        res.redirect('/')
        return
      }


      Post.create(newPost).then(post => {
        let newAlbumInfo = req.body
        let cssClassName = newAlbumInfo.nameAlbum.replace(' ', '-') + '-DbStyle'

        let newAlbumUp = new Album({
          name: newAlbumInfo.nameAlbum,
          description: newAlbumInfo.descriptionAlbum,
          author: req.user._id,
          classCss: cssClassName,
          public: postIsPublic
        })


        Album.create(newAlbumUp).then(newAlbum => {
          newAlbum.prepareUploadAlbum()
          // the newAlbumInfo holds the description for each photo, the key being their number. We start from 1 and for each photo increment
          let photoIndex = 1

          req.files.forEach(function (photo) {
            let photoUp = Object.assign(photo, {
              // merge the photo's metadata and the data tied with the server
              author: newAlbum.author,
              description: newAlbumInfo[photoIndex.toString()],
              album: newAlbum._id,
              post: post._id,
              classCss: cssClassName,
              public: postIsPublic
            })

            photoIndex += 1

            Photo.create(photoUp).then(photo => {
              photo.prepareUpload()
              photo.prepareUploadInAlbum(photoUp.album)
              photo.prepareUploadInPost(photoUp.post)
            })
          })
        })
        res.redirect('/')
      })
    })
  }
}
