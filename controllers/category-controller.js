const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Category = mongoose.model('Category')
const categories = require('./../config/constants').categories

module.exports = {
  // This function should show all the articles for the given category
  // if the user is not of the same category, we should only show the public posts that are in that category!
  showArticles: (req, res) => {
    let page = parseInt(req.query.page || '1') - 1
    let category = req.params.category.toLowerCase().capitalize()
    if (categories.indexOf(category) === -1) {
      req.session.errorMsg = `Category ${category} does not exist!`
      res.redirect('/')
      return
    }

    if (req.user.category.name === category) {
      // user is the same category
      Post.find({ category: req.user.category.id }).populate('author comments likes photos').then(posts => {
        // sort by their date descending (newest first)
        posts = Post.sortPosts(posts)
        // get the posts in the page
        let postPages = Post.getPostsInPage(page, posts)
        let postsInPage = postPages.posts
        let pages = postPages.pages  // array of possible pages [1,2,3]
        Post.populate(postsInPage, [{ path: 'comments.author', model: 'User' }, { path: 'author.profilePic', model: 'Photo' }]).then(() => {
          Post.populate(postsInPage, [{ path: 'comments.author.profilePic', model: 'Photo' }]).then(() => {
            Post.initializeForView(postsInPage).then(postsInPage => {
              // sorts the posts and splits their likes
              res.render('user/newsfeed', { posts: postsInPage, failedPost: res.locals.failedPost, categories: categories, pages: pages })
            })
          })
        })
      })
    } else {
      // user is another category

      // load all the articles from the user's friends
      req.user.getPostsByFriends().then(friendPosts => {
        Category.findOne({ name: category }).then(cat => {
          if (!cat) {
            req.session.errorMsg = `Category ${category} does not exist!`
            res.redirect('/')
            return
          }
          Post.find({ public: true, category: cat.id }).then(posts => {
            // save the friend posts that are not already in our postsToSee
            friendPosts = friendPosts.filter((item) => {
              return posts.findIndex((post) => {
                return post._id.equals(item._id)
              }) === -1
            })
            posts = posts.concat(friendPosts)  // add the friend posts
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
                    res.render('user/newsfeed', { posts: postsInPage, failedPost: res.locals.failedPost, categories: categories, pages: pages })
                  })
                })
              })
            })
          })
        })
      })
    }
  }
}
