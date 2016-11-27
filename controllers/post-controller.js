const mongoose = require('mongoose')
const Post = mongoose.model('Post')

module.exports = {
  addPost: (req, res) => {
    let newPost = req.body
    newPost.author = req.user._id
    newPost.category = req.user.category

    if (newPost.content.length < 3) {
      // ERROR - Email is invalid!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
      res.redirect('/')
      return
    }
    // TODO: Once User can set if he wants his post to be public or not, add functionality here
    Post.create(newPost).then(() => {
      res.redirect('/')
    })
  }
}
