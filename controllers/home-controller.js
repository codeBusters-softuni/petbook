const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const User = mongoose.model('User')
const categories = require('../config/constants').categories

module.exports = {
  homePageGet: (req, res) => {
    let errorMsg = ''

    if (req.user) {
      // load all the articles from the user's friends
      User.findById(req.user._id).then(user => {
        let friendPostsPromises = []
        user.friends.forEach(friend => {
          friendPostsPromises.push(new Promise((resolve, reject) => {
            Post.find({author: friend}).then(posts => {
              resolve(posts)
            }).catch(err => reject(err))
          }))
        })
        Promise.all(friendPostsPromises).then(friendPosts => {
          friendPosts = [].concat.apply([], friendPosts)  // flatten the array of arrays into one array
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

              Post.populate(postsToSee, 'author comments likes photos').then(() => {
                // populate each comment's author. Must be done after the initial populate
                Post.populate(postsToSee, { path: 'comments.author', model: 'User' }).then(() => {
                  postsToSee = Post.initializeForView(postsToSee).then(postsToSee => {
                    req.session.returnUrl = '/'
                    if (req.session.errorMsg) {
                      errorMsg = req.session.errorMsg
                      delete req.session.errorMsg
                    }
                    res.render('user/newsfeed', { posts: postsToSee, failedPost: req.session.failedPost, categories: categories, errorMessage: errorMsg })
                  })
                })
              })
            })
          })
        })
      })
    } else {
      if (req.session.errorMsg) {
        errorMsg = req.session.errorMsg
        delete req.session.errorMsg
      }
      res.render('index', { categories: categories, errorMessage: errorMsg })
    }
  },
  learnMoreGet: (req, res) => {
    res.render('learnMore')
  }
}
