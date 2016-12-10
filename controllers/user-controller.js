const emailValidator = require('email-validator')  // module for validating email addresses
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Category = mongoose.model('Category')
const Like = mongoose.model('Like')
const Post = mongoose.model('Post')

module.exports = {
  registerGet: (req, res) => {
    Category.find({}).then(categories => {
      res.render('user/register', { categories: categories })
    })
  },

  registerPost: (req, res) => {
    let candidateUser = req.body
    console.log(candidateUser)
    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      // ERROR - Email is invalid!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('user/register', candidateUser)
      return
    } else if (candidateUser.fullName.length < 3 || candidateUser.fullName.length > 20) {
      // ERROR - Full name is of invalid length
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('user/register', candidateUser)
      return
    } else if (candidateUser.password.length < 4 || candidateUser.password.length > 20) {
      // ERROR - Password is of invalid length
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('user/register', candidateUser)
      return
    } else if (candidateUser.password !== candidateUser.confirmedPassword) {
      // ERROR - Passwords do not match!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('user/register', candidateUser)
      return
    }
    User  // function in the User.js model
      .register(candidateUser.fullName, candidateUser.email, candidateUser.password, candidateUser.category)
      .then(newUser => {
        req.logIn(newUser, function (err, newUser) {
          if (err) {
            // req.session.errorMsg = 'Error while logging in after registration :('
            // ERROR
            // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
            return
          }

          // TODO: Add success message that the user is registered
          return res.redirect('/')
        })
      }).catch((err) => {
        console.log(err.message)
        // Error when saving the user

        // req.session.errorMsg = 'Error while logging in after registration :('
        // ERROR
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        res.redirect('/')
        return
      })
  },

  loginPost: (req, res) => {
    let candidateUser = req.body

    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      // ERROR - Email is invalid!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('index', candidateUser)
      return
    } else if (candidateUser.password.length < 4 || candidateUser.password.length > 20) {
      // ERROR - Password is of invalid length
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      res.render('index', candidateUser)
      return
    }

    User.findOne({ email: candidateUser.email }).then(user => {
      if (!user) {
        // ERROR - Such a user does not exist!
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        res.render('index', candidateUser)
        return
      }

      if (!user.authenticate(candidateUser.password)) {
        // Error - Password is invalid!
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        res.render('index', candidateUser)
        return
      }

      req.logIn(user, function (err) {
        if (err) {
          // req.session.errorMsg = 'Error while logging in :('
          // ERROR
          // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
          return
        }

        let returnUrl = '/'
        if (req.session.returnUrl) {
          returnUrl = req.session.returnUrl
          delete req.session.returnUrl
        }

        res.redirect(returnUrl)
      })
    })
  },

  logout: (req, res) => {
    req.logOut()
    let returnUrl = '/'
    return res.redirect(returnUrl)
    // res.redirect('/');
  },

  cancelFriendship: (req, res) => {
    let friendId = req.params.id
    User.findById(friendId).then(friend => {
      if (!friend) {
        // ERROR - Friend does not exist!
        res.render('index')
        return
      } else if (!req.user.hasFriend(friendId) || !friend.hasFriend(req.user.id)) {
        // ERROR - Users are not friends!
        res.render('index')
        return
      }
      // remove friends
      let cancelFriendPromise = req.user.removeFriend(friendId)
      let cancelFriendPromise2 = friend.removeFriend(req.user.id)

      Promise.all([cancelFriendPromise, cancelFriendPromise2]).then(() => {
        // Success - Attach message
        res.redirect('user/newsfeed')
        return
      })
    })
  },

  profilePageGet: (req, res) => {
    let userId = req.params.id
    User.findOne({ userId: userId }).then(user => {
      if (!user) {
        // ERROR - Email is invalid!
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        res.redirect('/')
      }
      // find the relation between the users
      let areFriends = req.user.friends.indexOf(user.id) !== -1
      let hasSentRequest = req.user.hasSentRequest(user.id)
      let friendStatus = {
        sentRequest: hasSentRequest,
        areFriends: areFriends
      }
      // load all the articles that the user should see
      Post.find({ category: req.user.category, author: user._id }).then(categoryPosts => {
        Post.find({ public: true, author: user._id }).then(publicPosts => {
          // save the public posts that are not already in the category posts
          publicPosts = publicPosts.filter((item) => {  // for every public post
            return categoryPosts.findIndex((post) => {  // get his index in categoryPosts
              return post._id.equals(item._id)          // using _id comparison
            }) === -1                                   // if it's -1, it's not in categoryPosts, so its left publicPosts
          })
          // join the two arrays
          let postsToSee = categoryPosts.concat(publicPosts)

          Post.populate(postsToSee, 'author comments likes photos').then(() => {
            // populate each comment's author. Must be done after the initial populate
            Post.populate(postsToSee, { path: 'comments.author', model: 'User' }).then(() => {
              postsToSee = Post.initializeForView(postsToSee)
              // get the user's likes
              let pawLikesPromise = Like.getUserLikes('Paw', user._id).then(pawCount => {
                user.totalLikeCount = pawCount
              })
              let loveLikesPromise = Like.getUserLikes('Love', user._id).then(likeCount => {
                user.totalLoveCount = likeCount
              })
              let dislikesLikesPromise = Like.getUserLikes('Dislike', user._id).then(dislikeCount => {
                user.totalDislikeCount = dislikeCount
              })
              let promises = [pawLikesPromise, loveLikesPromise, dislikesLikesPromise]
              Promise.all(promises).then(() => {
                req.session.returnUrl = req.originalUrl
                console.log(req.originalUrl)
                res.render('user/profile', { profileUser: user, friendStatus: friendStatus, posts: postsToSee })
              })
            })
          })
        })
      })
    })
  },

  userPhotosGet: (req, res) => {
    User.findById(req.user.id).populate('photos albums').then(user => {
      res.render('user/uploadPhotos', { photos: user.photos, albums: user.albums })
    })
  }
}
