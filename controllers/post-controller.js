const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Comment_ = mongoose.model('Comment')

module.exports = {
  addPost: (req, res) => {
    let newPost = req.body
    newPost.author = req.user._id
    newPost.category = req.user.category

    if (newPost.content.length < 3) {
      // ERROR - Content is too short!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
      res.redirect('/')
      return
    }
    // TODO: Once User can set if he wants his post to be public or not, add functionality here
    Post.create(newPost).then(() => {
      res.redirect('/')
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

  }
}
