const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Comment_ = mongoose.model('Comment')
const Like = mongoose.model('Like')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath
const likeIsValid = mongoose.model('Like').likeIsValid  // function that validates a like
const imagesAreValid = mongoose.model('Photo').validateImages
let parseReqBody = multer({ dest: photoUploadsPath, limits: { fileSize: 2000000, files: 10 } /* max file size is 2MB */ }).array('addPhotoToPost')

module.exports = {
  addPost: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    parseReqBody(req, res, function (err) {
      if (!imagesAreValid(req, res, err, req.files)) {  // attached error messages to req.session.errMsg
        res.redirect(returnUrl)
        return
      }
      let albumName = 'newsfeed-photos-' + req.user._id
      let newPostInfo = req.body
      if (typeof newPostInfo.publicPost === 'undefined') {
        // Make the post public by default
        newPostInfo.publicPost = 'publicvisible'
      }
      let postIsPublic = newPostInfo.publicPost.toString() === 'publicvisible'
      let newPost = new Post({
        author: req.user._id,
        category: req.user.category,
        content: newPostInfo.content,
        public: postIsPublic
      })

      if (!newPost.content || newPost.content.length < 3) {
        req.session.errorMsg = "Your post's content is too short! It must be longer than 3 characters."
        req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
        res.redirect('/')
        return
      }

      Album.findOrCreateAlbum(albumName, req.user._id)
        .then((album) => {
          let photoIndex = 1

          // create a photo object for each uploaded photo
          let photoUploadPromises = req.files.map(function (photo) {
            return new Promise((resolve, reject) => {
              let photoUp = Object.assign(photo, {
                author: req.user._id,
                album: album._id,
                classCss: album.classCss,
                public: postIsPublic,
                description: newPostInfo[photoIndex.toString()]
              })

              photoIndex += 1

              Photo.create(photoUp).then(photo => {
                resolve(photo._id)
              })
            })
          })
          Promise.all(photoUploadPromises).then(uploadedPhotos => {
            newPost.photos = uploadedPhotos
            Post.create(newPost).then(post => {
              res.redirect('/')
            })
          })
        })
    })
  },

  addComment: (req, res) => {
    let postId = req.params.id  // the post this comment is on
    let newComment = req.body
    newComment.author = req.user._id

    if (!newComment.content || newComment.content.length < 2) {
      req.session.errorMsg = 'Your comment is too short! All comments must be longer than 2 characters.'
      res.redirect('/')
      return
    }

    Post.findById(postId).then(post => {
      if (!post) {
        req.session.errorMsg = 'No such post exists.'
        res.redirect('/')
        return
      }

      Comment_.create(newComment).then((newComment) => {
        post.addComment(newComment._id).then(() => {
          // Comment added!
          let returnUrl = res.locals.returnUrl || '/'
          res.redirect(returnUrl)
        })
      })
    })
  },

  addLike: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    // regex is: /post\/(.+)\/add(.{3,7})/
    let postId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect(returnUrl)
      return
    }
    let userId = req.user._id
    Post.findById(postId).populate('likes').then(post => {
      if (!post) {
        // ERROR - Post with ID does not exist!
        req.session.errorMsg = 'No such post exists.'
        res.redirect(returnUrl)
        return
      }
      let likeIndex = post.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex !== -1) {
        // user has already liked this post
        if (post.likes[likeIndex].type === likeType) {
          res.redirect(returnUrl)
          return
        } else {
          // User is un-liking this photo and giving it a {likeType}
          // So we simply change the name of this like
          post.likes[likeIndex].type = likeType
          post.likes[likeIndex].save().then(() => {

            res.redirect(returnUrl)
            // Success!
          })
        }
      } else {
        // User is liking this post for the first time
        Like.create({ type: likeType, author: req.user._id }).then(like => {
          post.addLike(like._id).then(() => {
            res.redirect(returnUrl)
          })
        })
      }
    })
  },

  removeLike: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    // regex is: /post\/(.+)\/remove(.{3,7})/
    let postId = req.params[0]
    let likeType = req.params[1]
    if (!likeIsValid(likeType)) {
      req.session.errorMsg = `${likeType} is not a valid type of like!`
      res.redirect(returnUrl)
      return
    }
    let userId = req.user._id

    Post.findById(postId).populate('likes').then(post => {
      if (!post) {
        req.session.errorMsg = 'No such post exists.'
        res.redirect(returnUrl)
        return
      }
      // Get the index of the user's like'
      let likeIndex = post.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex === -1) {
        // ERROR - User has not liked this at all
        res.redirect(returnUrl)
        return
      } else if (post.likes[likeIndex].type !== likeType) {
        // ERROR - example: User is trying to unPAW a post he has LOVED
        res.redirect(returnUrl)
        return
      }
      let likeId = post.likes[likeIndex]._id
      Like.findByIdAndRemove(likeId)

      post.removeLike(likeId).then(() => {
        // Like is removed!
        res.redirect(returnUrl)
        return
      })
    })
  }
}
