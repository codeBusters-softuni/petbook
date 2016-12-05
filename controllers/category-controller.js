const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Category = mongoose.model('Category')
const categories = require('./../config/constants').categories

module.exports = {
  // This function should show all the articles for the given category
  // if the user is not of the same category, we should only show the public posts that are in that category!
  showArticles: (req, res) => {
    let category = req.params.category.toLowerCase().capitalize()

    if (categories.indexOf(category) === -1) {
      // ERROR - Category does not exist!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('index')
      return
    }

    if (req.user.category.name === category) {
      // user is the same category
      Post.find({ category: req.user.category.id }).populate('author comments likes').then(posts => {
        posts = Post.initializeForView(posts)  // sorts the posts and splits their likes
        res.render('user/newsfeed', { posts: posts, failedPost: req.session.failedPost })
      })
    } else {
      // user is another category
      Category.findOne({ name: category }).then(cat => {
        if (!cat) {
          // ERROR - category does not exist
          // Something is wrong with the logic, as we validated that the category is in our constants categories
          res.render('index')
          return
        }
        Post.find({ public: true, category: cat.id }).populate('author comments likes').then(posts => {
          posts = Post.initializeForView(posts)  // sorts the posts and splits their likes

          res.render('user/newsfeed', { posts: posts, failedPost: req.session.failedPost })
        })
      })
    }
  }
}
