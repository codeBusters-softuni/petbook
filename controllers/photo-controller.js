const mongoose = require('mongoose')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Post = mongoose.model('Post')
const Like = mongoose.model('Like')
const multer = require('multer')
const constants = require('../config/constants')
const photoUploadsPath = constants.photoUploadsPath
const likeIsValid = mongoose.model('Like').likeIsValid  // function that validates a like
let parseReqBody = multer({ dest: photoUploadsPath,
   limits: { fileSize: 2000000, files: 10 } /* max file size is 2MB */})
   .array('uploadedPhotos')


module.exports = {
  // function that handles photo uploads on the newsfeed
  uploadPhotosPost: (req, res) => {
    let albumName = 'newsfeed-photos-' + req.user._id

    // Try to find the user's album to add the picture to, otherwise create a new one
    Album.findOrCreateAlbum(albumName, req.user._id)  // custom function in Album.js
      .then(album => {
        parseReqBody(req, res, function (err) {  // middleware to parse the uploaded files to req.files and save them on the server
          if (err) {
            if (err.message === 'File too large') {
              req.session.errorMsg = 'An image you uploaded was too large. Maximum size for an image is 2MB!'
            } else if (err.message === 'Too many files') {
              req.session.errorMsg = 'You cannot upload more than 10 images at once!'
            } else {
              req.session.errorMsg = err.message
            }
            let returnUrl = '/'
            if (req.session.returnUrl) {
              returnUrl = req.session.returnUrl
              delete req.session.returnUrl
            }
            res.redirect(returnUrl)
            return
          }
          // logic for the post
          let newPostInfo = req.body
          let postIsPublic = newPostInfo.photocheck.toString() === 'publicvisible'
          let newPost = new Post({
            author: req.user._id,
            category: req.user.category,
            content: newPostInfo.descriptionPostPhotos,
            public: postIsPublic
          })
          if (newPost.content.length <= 2) {
            req.session.errorMsg = 'Post content must be longer than 2 characters!'
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
  },

  uploadProfilePhoto: (req, res) => {
    let parseProfilePhoto = multer({ dest: photoUploadsPath, limits: { fileSize: 2000000, files: 10 } /* max file size is 2MB */ }).single('addProfilePhoto')
    let albumName = 'profile-photos-' + req.user._id
    // create or find said album
    Album.findOrCreateAlbum(albumName, req.user._id) // custom function in Album.js
      .then(album => {
        parseProfilePhoto(req, res, function (err) {
          if (err) {
            if (err.message === 'File too large') {
              req.session.errorMsg = 'An image you uploaded was too large. Maximum size for an image is 2MB!'
            } else if (err.message === 'Too many files') {
              req.session.errorMsg = 'You cannot upload more than 10 images at once!'
            } else {
              req.session.errorMsg = err.message
            }
            let returnUrl = '/'
            if (req.session.returnUrl) {
              returnUrl = req.session.returnUrl
              delete req.session.returnUrl
            }
            res.redirect(returnUrl)
            return
          }
          if (!req.file) {
            res.redirect('/')
          }

          let photo = req.file
          let profilePhoto = Object.assign(photo, {
            // merge the photo's metadata and the data tied with the server
            author: req.user._id,
            album: album._id,
            classCss: album.classForCss,
            public: true
          })

          Photo.create(profilePhoto).then(photo => {
            req.user.updateProfilePicture(photo._id).then(() => {
              let newPost = new Post({
                author: req.user._id,
                category: req.user.category._id,
                content: 'I updated my profile picture!',
                public: true,
                photos: [photo._id]
              })
              Post.create(newPost).then(() => {
                res.redirect(`/user/${req.user.userId}`)
              })
            })
          })
        })
      })
  },

  deletePhoto: (req, res) => {
    let photoId = req.params.id

    Photo.findById(photoId).then(photo => {
      if (!photo) {
        req.session.errorMsg = 'No such photo exists.'
        res.redirect('/')
        return
      } else if (!photo.author.equals(req.user._id)) {
        req.session.errorMsg = 'You do not have permission to delete that photo!'
        res.redirect('/')
        return
      }

      photo.remove().then(() => {
        let returnUrl = '/'
        if (req.session.returnUrl) {
          returnUrl = req.session.returnUrl
          delete req.session.returnUrl
        }
        res.redirect(returnUrl)
      })
    })
  },

  addLike: (req, res) => {
    // regex is: /photo\/(.+)\/add(.{3,7})/
    let photoId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect('/')
      return
    }
    let userId = req.user._id
    Photo.findById(photoId).populate('likes').then(photo => {
      if (!photo) {
        // ERROR - Photo with ID does not exist!
        req.session.errorMsg = 'No such photo exists.'
        res.redirect('/')
        return
      }
      let likeIndex = photo.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex !== -1) {
        // user has already liked this photo
        if (photo.likes[likeIndex].type === likeType) {
          // user is editing the HTML
          res.redirect('/')
          return
        } else {
          // User is un-liking this photo and giving it a {likeType}
          // so we simply change the name of this like
          photo.likes[likeIndex].type = likeType
          photo.likes[likeIndex].save().then(() => {
            let returnUrl = '/'
            if (req.session.returnUrl) {
              returnUrl = req.session.returnUrl
              delete req.session.returnUrl
            }
            res.redirect(returnUrl)
            // Success!
          })
        }
      } else {
        // User is liking this photo for the first time
        Like.create({ type: likeType, author: req.user._id }).then(like => {
          photo.addLike(like._id).then(() => {
            let returnUrl = '/'
            if (req.session.returnUrl) {
              returnUrl = req.session.returnUrl
              delete req.session.returnUrl
            }

            res.redirect(returnUrl)
          })
        })
      }
    })
  },

  removeLike: (req, res) => {
    // regex is: /photo\/(.+)\/remove(.{3,7})/
    let photoId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect('/')
      return
    }
    let userId = req.user._id

    Photo.findById(photoId).populate('likes').then(photo => {
      if (!photo) {
        req.session.errorMsg = 'No such photo exists.'
        res.redirect('/')
        return
      }
      // Get the index of the user's like
      let likeIndex = photo.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex === -1) {
        // ERROR - User has not liked this at all
        res.redirect('/')
        return
      } else if (photo.likes[likeIndex].type !== likeType) {
        // ERROR - example: User is trying to unPaw a post he has LOVED
        res.redirect('/')
        return
      }

      let likeId = photo.likes[likeIndex]._id
      Like.findByIdAndRemove(likeId)

      photo.removeLike(likeId).then(() => {
        // Like is removed!
        let returnUrl = '/'
        if (req.session.returnUrl) {
          returnUrl = req.session.returnUrl
          delete req.session.returnUrl
        }

        res.redirect(returnUrl)
        return
      })
    })
  }
}
