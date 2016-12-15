const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const constants = require('../config/constants')
const categories = constants.categories

module.exports = {
  homePageGet: (req, res) => {
    if (req.user) {
      let page = parseInt(req.query.page || '1') - 1

      // load all the articles from the user's friends
      req.user.getPostsByFriends().then(friendPosts => {
        // load all the articles that the user should see
        Post.find({ category: req.user.category }).then(categoryPosts => {
          Post.find({ public: true }).then(publicPosts => {
            // save the public posts that are not already in the category posts
            publicPosts = publicPosts.filter((item) => {  // for every public post
              return categoryPosts.findIndex((post) => {  // get his index in categoryPosts
                return post._id.equals(item._id)          // using _id comparison
              }) === -1                                   // if it's -1, it's not in categoryPosts, so its left publicPosts
            })

            // join the two arrays
            let postsToSee = categoryPosts.concat(publicPosts)
            // save the friend posts that are not already in our postsToSee
            friendPosts = friendPosts.filter((item) => {
              return postsToSee.findIndex((post) => {
                return post._id.equals(item._id)
              }) === -1
            })
            postsToSee = postsToSee.concat(friendPosts)  // add the friend posts
            // sort by their date descending (newest first)
            postsToSee = Post.sortPosts(postsToSee)
            // get the posts in the page
            let postPages = Post.getPostsInPage(page, postsToSee)
            let postsInPage = postPages.posts
            let pages = postPages.pages  // array of possible pages [1,2,3]

            Post.populate(postsInPage, 'author comments likes photos').then(() => {
              // populate each comment's author. Must be done after the initial populate
              Post.populate(postsInPage, [{ path: 'comments.author', model: 'User' }, { path: 'author.profilePic', model: 'Photo' }]).then(() => {
                Post.populate(postsInPage, [{ path: 'comments.author.profilePic', model: 'Photo' }]).then(() => {
                  postsInPage = Post.initializeForView(postsInPage).then(postsInPage => {
                    req.session.returnUrl = '/'
                    res.render('user/newsfeed', { posts: postsInPage, failedPost: req.session.failedPost, categories: categories, pages: pages })
                  })
                })
              })
            })
          })
        })
      })
    } else {
      res.render('index', { categories: categories, candidateUser: req.session.candidateUser })
    }
  },
  learnMoreGet: (req, res) => {
    res.render('learnMore', { categories: categories, candidateUser: req.session.candidateUser })
  }
}
