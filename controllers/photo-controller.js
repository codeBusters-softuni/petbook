const mongoose = require('mongoose')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Post = mongoose.model('Post')
const Like = mongoose.model('Like')
const multer = require('multer')
const constants = require('../config/constants')
const photoUploadsPath = constants.photoUploadsPath
const likeIsValid = mongoose.model('Like').likeIsValid  // function that validates a like
const imagesAreValid = mongoose.model('Photo').validateImages
let parseReqBody = multer({ dest: photoUploadsPath, limits: { fileSize: 2000000, files: 10 } /* max file size is 2MB */ }).single('addProfilePhoto')

module.exports = {
  uploadProfilePhoto: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    let albumName = 'Profile Photos'
    // create or find said album
    Album.findOrCreateAlbum(albumName, req.user._id) // custom function in Album.js
      .then(album => {
        parseReqBody(req, res, function (err) {
          if (!imagesAreValid(req, res, err, req.file)) {  // attached error messages to req.session.errMsg
            res.redirect(returnUrl)
            return
          }

          let photo = req.file
          let profilePhoto = Object.assign(photo, {
            // merge the photo's metadata and the data tied with the server
            author: req.user._id,
            album: album._id,
            classCss: album.classCss,
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
                let profileUrl = `/user/${req.user.userId}`
                res.redirect(profileUrl)
              })
            })
          })
        })
      })
  },

  deletePhoto: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    let photoId = req.params.id

    Photo.findById(photoId).then(photo => {
      if (!photo) {
        req.session.errorMsg = 'No such photo exists.'
        res.redirect(returnUrl)
        return
      } else if (!photo.author.equals(req.user._id)) {
        req.session.errorMsg = 'You do not have permission to delete that photo!'
        res.redirect(returnUrl)
        return
      }

      photo.remove().then(() => {
        res.redirect(returnUrl)
      })
    })
  },

  addLike: (req, res) => {
    // regex is: /photo\/(.+)\/add(.{3,7})/
    let returnUrl = res.locals.returnUrl || '/'

    let photoId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect(returnUrl)
      return
    }
    let userId = req.user._id
    Photo.findById(photoId).populate('likes').then(photo => {
      if (!photo) {
        // ERROR - Photo with ID does not exist!
        req.session.errorMsg = 'No such photo exists.'
        res.redirect(returnUrl)
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
            res.redirect(returnUrl)
            // Success!
          })
        }
      } else {
        // User is liking this photo for the first time
        Like.create({ type: likeType, author: req.user._id }).then(like => {
          photo.addLike(like._id).then(() => {
            res.redirect(returnUrl)
          })
        })
      }
    })
  },

  removeLike: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    // regex is: /photo\/(.+)\/remove(.{3,7})/
    let photoId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect(returnUrl)
      return
    }
    let userId = req.user._id

    Photo.findById(photoId).populate('likes').then(photo => {
      if (!photo) {
        req.session.errorMsg = 'No such photo exists.'
        res.redirect(returnUrl)
        return
      }
      // Get the index of the user's like
      let likeIndex = photo.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex === -1) {
        // ERROR - User has not liked this at all
        res.redirect(returnUrl)
        return
      } else if (photo.likes[likeIndex].type !== likeType) {
        // ERROR - example: User is trying to unPaw a post he has LOVED
        res.redirect(returnUrl)
        return
      }

      let likeId = photo.likes[likeIndex]._id
      Like.findByIdAndRemove(likeId)

      photo.removeLike(likeId).then(() => {
        // Like is removed!

        res.redirect(returnUrl)
        return
      })
    })
  }
}
