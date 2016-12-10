const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Comment_ = mongoose.model('Comment')
const Like = mongoose.model('Like')
const Photo = require('mongoose').model('Photo')
const Album = require('mongoose').model('Album')
const multer = require('multer')
const photoUploadsPath = require('../config/constants').photoUploadsPath
let parseReqBody = multer({ dest: photoUploadsPath }).array('addPhotoToPost')

module.exports = {
  addPost: (req, res) => {
    parseReqBody(req, res, function () {
      let albumName = 'newsfeed-photos-' + req.user._id
      let newPostInfo = req.body
      let postIsPublic = newPostInfo.publicPost.toString() === 'publicvisible'
      let newPost = new Post({
        author: req.user._id,
        category: req.user.category,
        content: newPostInfo.content,
        public: postIsPublic
      })

      if (newPost.content.length < 3) {
        // ERROR - Content is too short!
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
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
              let photoUp = new Photo({
                fieldname: photo.fieldname,
                originalname: photo.originalname,
                encoding: photo.encoding,
                mimetype: photo.mimetype,
                destination: photo.destination,
                filename: photo.filename,
                path: photo.path,
                size: photo.size,
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
            newPostInfo.photos = uploadedPhotos
            Post.create(newPost).then(post => {
              res.redirect('/')
            })
          })
        })
    })
  },

  addComment: (req, res) => {
    let postId = req.params.id  // the post this comment is on
    console.log(postId)
    let newComment = req.body
    newComment.author = req.user._id

    if (newComment.content.length < 2) {
      // ERROR - Comment is too short!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.redirect('/')
      return
    }

    Post.findById(postId).then(post => {
      if (!post) {
        // ERROR - No such Post exists, it was either deleted or the user is using something to send POST requests to the server
        res.redirect('/')
        return
      }
      console.log(newComment)
      Comment_.create(newComment).then((newComment) => {
        post.addComment(newComment._id).then(() => {
          // Comment added!
          res.redirect('/')
        })
      })
    })
  },

  addLike: (req, res) => {
    // regex is: /post\/(.+)\/add(.{3,7})/
    let postId = req.params[0]
    let likeType = req.params[1]
    let userId = req.user._id
    Post.findById(postId).populate('likes').then(post => {
      if (!post) {
        // ERROR - Post with ID does not exist!
        res.redirect('/')
        return
      }
      let likeIndex = post.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex !== -1) {
        // user has already liked this post
        if (post.likes[likeIndex].type === likeType) {
          // User has already {likeType} this photo and is trying to again, ERROR!
          res.redirect('/')
          return
        } else {
          // User is un-liking this photo and giving it a {likeType}
          // So we simply change the name of this like
          post.likes[likeIndex].type = likeType
          post.likes[likeIndex].save().then(() => {
            res.redirect('/')
            // Success!
          })
        }
      } else {
        // User is liking this post for the first time
        Like.create({ type: likeType, author: req.user._id }).then(like => {
          post.addLike(like._id).then(() => {
            res.redirect('/')  // Success!
          })
        })
      }
    })
  },

  removeLike: (req, res) => {
    // regex is: /post\/(.+)\/remove(.{3,7})/
    let postId = req.params[0]
    let likeType = req.params[1]
    let userId = req.user._id

    Post.findById(postId).populate('likes').then(post => {
      if (!post) {
        // ERROR - Post with ID does not exist!
        res.redirect('/')
        return
      }
      // Get the index of the user's like'
      let likeIndex = post.likes.findIndex(like => {
        return like.author.equals(userId)
      })

      if (likeIndex === -1) {
        // ERROR - User has not liked this at all
        res.redirect('/')
        return
      } else {
        if (post.likes[likeIndex].type !== likeType) {
          // ERROR - example: User is trying to unPAW a post he has LOVED
          res.redirect('/')
          return
        }
        let likeId = post.likes[likeIndex]._id
        post.removeLike(likeId).then(() => {
          // Like is removed!
          res.redirect('/')
          return
        })
        Like.findByIdAndRemove(likeId)
      }
    })
  }
}
