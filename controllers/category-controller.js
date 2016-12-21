const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Category = mongoose.model('Category')
const categories = require('./../config/constants').categories

module.exports = {
  // This function should show all the posts for the given category
  // if the user is not of the same category, we should only show the public posts that are in that category!
  showPosts: (req, res) => {
    let page = parseInt(req.query.page || '1') - 1
    let category = req.params.category.toLowerCase().capitalize()
    if (categories.indexOf(category) === -1) {
      req.session.errorMsg = `Category ${category} does not exist!`
      res.redirect('/')
      return
    }
    new Promise((resolve, reject) => {  // load the posts the user will see
      if (req.user.category.name === category) {
        // user is the same category
        Post.find({ category: req.user.category.id }).then(posts => {
          // sort by their date descending (newest first)
          posts = Post.sortPosts(posts)
          resolve(posts)
        })
      } else {  // user is another category
        Category.findOne({ name: category }).then(cat => {
          if (!cat) {
            req.session.errorMsg = `Category ${category} does not exist!`
            res.redirect('/')
            return
          }
          // get all the public posts of the category
          Post.find({ public: true, category: cat.id }).then(posts => {
            resolve(posts)
          })
        })
      }
    }).then(posts => {
      // sort by their date descending (newest first)
      posts = Post.sortPosts(posts)
      // get the posts in the page
      let postPages = Post.getPostsInPage(page, posts)
      let postsInPage = postPages.posts
      let pages = postPages.pages  // array of possible pages [1,2,3]
      Post.populate(postsInPage, 'author comments likes photos').then((postsInPage) => {
        Post.populate(postsInPage, [{ path: 'comments.author', model: 'User' }, { path: 'author.profilePic', model: 'Photo' }]).then(() => {
          Post.populate(postsInPage, [{ path: 'comments.author.profilePic', model: 'Photo' }]).then(() => {
            // sorts the posts and splits their likes
            Post.initializeForView(postsInPage).then(postsInPage => {
              res.render('home/newsfeed', { posts: postsInPage, failedPost: res.locals.failedPost, categories: categories, pages: pages, selectedPage: page + 1 })
            })
          })
        })
      })
    })
  }
}
