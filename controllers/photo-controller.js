const mongoose = require('mongoose')
const Photo = require('mongoose').model('Photo')
const Album = require('mongoose').model('Album')
const Post = mongoose.model('Post')
const path = require('path')
const config = require('../config/config')['development']  // TODO: Set environment variable!
const multer = require('multer')


let publicDirPath = path.join(config.rootFolder, 'public')
let uploadDirPath = multer({ dest: path.join(publicDirPath, 'uploads') }).array('uploadedPhotos')

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
    let classForCss
    let albumUp = new Album()
    let albumId = undefined
    // Try to find the user's album to add the picture to, otherwise create a new one
    Album.findOne({ name: albumName }).then(album => {
      // TODO: Add a wrapper function in Album.js which returns an album object
      if (!album) {
        albumUp.name = albumName
        albumUp.author = req.user._id
        albumUp.public = true
        albumUp.classCss = 'Your-photos-from-NewsFeed-DbStyle'

        Album.create(albumUp).then(newAlbum => {
          newAlbum.prepareUploadAlbum()
          let albumId = newAlbum._id
          classForCss = newAlbum.classCss
        })
      } else {
        let albumId = album._id
        classForCss = album.classCss
      }
    }).then(() => {
      uploadDirPath(req, res, function () {

        // logic for the post
        var newPostArg = req.body
        var newPost = new Post({
          author: req.user._id,
          category: req.user.category,
          content: newPostArg.descriptionPostPhotos
        })

        if (newPost.content.length < 1) {
          // ERROR - Content is too short!
          // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
          req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
          res.redirect('/')
          return
        }

        if (newPostArg.photocheck.toString() === 'publicvisible') {
          newPost.public = true
        }

        // TODO: Once User can set if he wants his post to be public or not, add functionality here
        var _idNewPost = newPost._id
        Post.create(newPost).then(post => {
          _idNewPost = post._id
        })


        // Logic for the upload of photos

        let photoArgs = req.body
        photoArgs.author = req.user.id
        let counter = 1

        req.files.forEach(function (item) {
          let photoUp = new Photo({
            fieldname: item.fieldname,
            originalname: item.originalname,
            encoding: item.encoding,
            mimetype: item.mimetype,
            destination: item.destination,
            filename: item.filename,
            path: item.path,
            size: item.size,
            author: photoArgs.author,
            description: photoArgs[counter.toString()],
            album: albumId,
            post: _idNewPost,
            classCss: classForCss
          })

          counter += 1
          if (photoArgs.photocheck.toString() === 'publicvisible') {
            photoUp.public = true
          } else {
            photoUp.public = false
          }

          Photo.create(photoUp).then(photo => {
            photo.prepareUploadSinglePhotos(photoUp.album)
            photo.prepareUploadInPost(photoUp.post)
          }
          )
        })
      })

      res.redirect('/')
    })
  }
}
