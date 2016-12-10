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
      req.session.errorMsg = `Category ${category} does not exist!`
      res.render('index', { categories: categories })
      return
    }

    if (req.user.category.name === category) {
      // user is the same category
      Post.find({ category: req.user.category.id }).populate('author comments likes').then(posts => {
        posts = Post.initializeForView(posts)  // sorts the posts and splits their likes
        res.render('user/newsfeed', { posts: posts, failedPost: req.session.failedPost, categories: categories })
      })
    } else {
      // user is another category
      Category.findOne({ name: category }).then(cat => {
        if (!cat) {
          req.session.errorMsg = `Category ${category} does not exist!`
          res.render('index', { categories: categories })
          return
        }
        Post.find({ public: true, category: cat.id }).populate('author comments likes').then(posts => {
          posts = Post.initializeForView(posts)  // sorts the posts and splits their likes

          res.render('user/newsfeed', { posts: posts, failedPost: req.session.failedPost, categories: categories })
        })
      })
    }
  }
}
