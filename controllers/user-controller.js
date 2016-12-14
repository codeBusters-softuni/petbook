const emailValidator = require('email-validator')  // module for validating email addresses
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Category = mongoose.model('Category')
const Like = mongoose.model('Like')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const FriendRequest = mongoose.model('FriendRequest')
const categories = require('../config/constants').categories
const userRegisterHbs = 'user/register/register'
const userRegisterLayoutHbs = 'user/register/register-layout'

module.exports = {
  registerGet: (req, res) => {
    Category.find({}).then(categories => {
      res.render(userRegisterHbs, { categories: categories, layout: userRegisterLayoutHbs })
    })
  },

  registerPost: (req, res) => {
    let candidateUser = req.body
    if (!candidateUser.ownerName) {
      candidateUser.ownerName = 'nobody'
    }
    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      let errorMessage = 'Your e-mail is invalid!'
      res.render(userRegisterHbs, { user: candidateUser, categories: categories, layout: userRegisterLayoutHbs, errorMessage: errorMessage })
      return
    } else if (candidateUser.fullName.length < 3 || candidateUser.fullName.length > 20) {
      let errorMessage = 'Your full name has invalid length! It should be between 3 and 20 characters.'
      res.render(userRegisterHbs, { user: candidateUser, categories: categories, layout: userRegisterLayoutHbs, errorMessage: errorMessage })
      return
    } else if (candidateUser.ownerName.length < 3 || candidateUser.ownerName.length > 20) {
      let errorMessage = "Your owner's name has invalid length! It should be between 3 and 20 characters."
      res.render(userRegisterHbs, { user: candidateUser, categories: categories, layout: userRegisterLayoutHbs, errorMessage: errorMessage })
      return
    } else if (candidateUser.password.length < 4 || candidateUser.password.length > 20) {
      let errorMessage = 'Your password has invalid length! It should be between 4 and 20 characters.'
      res.render(userRegisterHbs, { user: candidateUser, categories: categories, layout: userRegisterLayoutHbs, errorMessage: errorMessage })
      return
    } else if (candidateUser.password !== candidateUser.confirmedPassword) {
      let errorMessage = 'Your passwords do not match!'
      res.render(userRegisterHbs, { user: candidateUser, categories: categories, layout: userRegisterLayoutHbs, errorMessage: errorMessage })
      return
    }
    User  // function in the User.js model
      .register(candidateUser.fullName, candidateUser.email, candidateUser.ownerName, candidateUser.password, candidateUser.category)
      .then(newUser => {
        req.logIn(newUser, function (err, newUser) {
          if (err) {
            req.session.errorMsg = 'Error while logging in after registration :('
            return
          }

          // TODO: Add success message that the user is registered
          return res.redirect('/')
        })
      }).catch((err) => {
        console.log(err.message)
        // Error when saving the user

        req.session.errorMsg = err.message
        res.redirect('/')
        return
      })
  },

  loginPost: (req, res) => {
    let candidateUser = req.body

    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      req.session.errorMsg = 'Your e-mail is invalid!'
      res.redirect('/')
      return
    } else if (candidateUser.password.length < 4 || candidateUser.password.length > 20) {
      req.session.errorMsg = 'Your password has invalid length! It should be between 4 and 20 characters.'
      res.redirect('/')
      return
    }

    User.findOne({ email: candidateUser.email }).then(user => {
      if (!user) {
        req.session.errorMsg = 'Invalid e-mail/password.'
        res.redirect('/')
        return
      }

      if (!user.authenticate(candidateUser.password)) {
        req.session.errorMsg = 'Invalid e-mail/password.'
        res.redirect('/')
        return
      }

      req.logIn(user, function (err) {
        if (err) {
          req.session.errorMsg = 'Error while logging in :('
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
        req.session.errorMsg = 'Such a user does not exist.'
        res.redirect('/')
        return
      } else if (!req.user.hasFriend(friendId) || !friend.hasFriend(req.user.id)) {
        res.redirect('/')
        return
      }
      // remove friends
      let cancelFriendPromise = req.user.removeFriend(friendId)
      let cancelFriendPromise2 = friend.removeFriend(req.user.id)

      Promise.all([cancelFriendPromise, cancelFriendPromise2]).then(() => {
        // Success - Attach message
        res.redirect('/')
        return
      })
    })
  },

  profilePageGet: (req, res) => {
    let userId = req.params.id
    User.findOne({ userId: userId }).populate('profilePic').then(user => {
      if (!user) {
        req.session.errorMsg = 'No such user exists.'
        res.redirect('/')
      }

      // find the relation between the users
      let areFriends = req.user.friends.indexOf(user.id) !== -1
      let friendRequestId = req.user.getFriendRequestTo(user._id)
      let hasSentRequest = Boolean(friendRequestId)
      let receivedFriendRequestId = req.user.getFriendRequestFrom(user._id)
      let hasReceivedRequest = Boolean(receivedFriendRequestId)
      let friendStatus = {
        sentRequest: hasSentRequest,
        areFriends: areFriends,
        friendRequest: friendRequestId,
        receivedRequest: hasReceivedRequest,
        receivedFriendRequest: receivedFriendRequestId
      }
      new Promise((resolve, reject) => {
        if (areFriends) {
          // if they're friends, the user should see all the posts
          Post.find({ author: user._id }).then(userPosts => {
            resolve(userPosts)
          })
        } else {
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
              resolve(postsToSee)
            })
          })
        }
      }).then(postsToSee => {
        Post.populate(postsToSee, 'author comments likes photos').then(() => {
          // populate each comment's author. Must be done after the initial populate
          Post.populate(postsToSee, [{ path: 'comments.author', model: 'User' }, { path: 'author.profilePic', model: 'Photo' }]).then(() => {
            Post.populate(postsToSee, [{ path: 'comments.author.profilePic', model: 'Photo' }]).then(() => {
              postsToSee = Post.initializeForView(postsToSee).then(postsToSee => {
                user.getLikesCount().then(user => {  // attached receivedPawsCount and etc to the user
                  req.session.returnUrl = req.originalUrl
                  res.render('user/profile', { profileUser: user, friendStatus: friendStatus, posts: postsToSee, categories: categories })
                })
              })
            })
          })
        })
      })
    })
  },

  userPhotosGet: (req, res) => {
    let userId = req.params.id  // userId in the User model
    if (userId === req.user.userId.toString()) {
      // load the page with the ability to upload photos/albums
      User.findById(req.user.id).populate('photos albums').then(user => {
        Photo.initializeForView(user.photos).then(photos => {
          req.session.returnUrl = req.originalUrl
          res.render('user/uploadPhotos', { photos: photos, albums: user.albums, categories: categories })
        })
      })
    } else {
      User.findOne({ userId: userId }).populate('photos albums').then(user => {
        if (!user) {
          req.session.errorMsg = 'No such user exists!'
          res.redirect('/')
          return
        }
        Photo.initializeForView(user.photos).then(photos => {
          req.session.returnUrl = req.originalUrl
          res.render('user/viewPhotos', { profileUser: user, photos: photos, albums: user.albums, categories: categories })
        })
      })
    }
  },

  userSearchPost: (req, res) => {
    let searchValue = req.body.searchValue
    if (!searchValue) {
      // ERROR - You cannot search for nothing
      req.session.errorMsg = "Sorry, we couldn't understand this search. Please try saying this another way."
      res.redirect('/')
    }

    User.find({ fullName: { $regex: searchValue, $options: 'i' } }).populate('category profilePic').then(users => {
      // attach a friendStatus object to each user, displaying thier relationship with the user doing the search
      users = users.map(user => {
        let areFriends = req.user.friends.indexOf(user.id) !== -1
        let friendRequestId = req.user.getFriendRequestTo(user._id)
        let hasSentRequest = Boolean(friendRequestId)
        let receivedFriendRequestId = req.user.getFriendRequestFrom(user._id)
        let hasReceivedRequest = Boolean(receivedFriendRequestId)
        let friendStatus = {
          sentRequest: hasSentRequest,
          areFriends: areFriends,
          friendRequest: friendRequestId,
          receivedRequest: hasReceivedRequest,
          receivedFriendRequest: receivedFriendRequestId
        }
        user.friendStatus = friendStatus
        return user
      })
      res.render('searchOutput', { users: users })
    })
  }
}
