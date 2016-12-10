const mongoose = require('mongoose')
const Album = mongoose.model('Album')
const Photo = mongoose.model('Photo')
const Post = mongoose.model('Post')
const multer = require('multer')

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
    var dest = __dirname.toString().split('\\')
    dest[dest.length - 1] = 'public'
    dest = dest.join('\\')
    let readFiles = multer({ dest: dest + '/uploads/' }).array('uploadAlbum')
    readFiles(req, res, function () {
      // logic for the post
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
        let albumArgs = req.body
        let cssClassName = albumArgs.nameAlbum.split(' ').filter(function (n) { return n !== '' })
        cssClassName = cssClassName.join('-') + '-DbStyle'

        let newAlbumUp = new Album({
          name: albumArgs.nameAlbum,
          description: albumArgs.descriptionAlbum,
          author: req.user._id,
          classCss: cssClassName,
          public: postIsPublic
        })


        Album.create(newAlbumUp).then(newAlbum => {
          newAlbum.prepareUploadAlbum()

          let counter = 1

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
              author: newAlbum.author,
              description: albumArgs[counter.toString()],
              album: newAlbum._id,
              post: post._id,
              classCss: cssClassName
            })

            counter += 1
            if (albumArgs.photocheckAlbum.toString() === 'publicvisible') {
              photoUp.public = true
            } else {
              photoUp.public = false
            }

            Photo.create(photoUp).then(photo => {
              photo.prepareUpload()
              photo.prepareUploadInAlbum(photoUp.album)
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
