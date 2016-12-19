const emailValidator = require('email-validator')  // module for validating email addresses
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Category = mongoose.model('Category')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const categories = require('../config/constants').categories
const userRegisterHbs = 'user/register/register'
const userRegisterLayoutHbs = 'user/register/register-layout'

module.exports = {
  registerGet: (req, res) => {
    Category.find({}).then(categories => {
      res.render(userRegisterHbs, { candidateUser: res.locals.candidateUser, categories: categories, layout: userRegisterLayoutHbs })
    })
  },

  registerPost: (req, res) => {
    let candidateUser = req.body
    if (!candidateUser.ownerName) {
      candidateUser.ownerName = 'nobody'
    }
    // Validate credentials
    let toRedirect = false
    if (!emailValidator.validate(candidateUser.email)) {
      req.session.errorMsg = 'Your e-mail is invalid!'
      toRedirect = true
    } else if (!candidateUser.fullName || (candidateUser.fullName.length < 3 || candidateUser.fullName.length > 20)) {
      req.session.errorMsg = 'Your full name has invalid length! It should be between 3 and 20 characters.'
      toRedirect = true
    } else if (candidateUser.ownerName.length < 3 || candidateUser.ownerName.length > 20) {
      req.session.errorMsg = "Your owner's name has invalid length! It should be between 3 and 20 characters."
      toRedirect = true
    } else if (!candidateUser.password || (candidateUser.password.length < 4 || candidateUser.password.length > 20)) {
      req.session.errorMsg = 'Your password has invalid length! It should be between 4 and 20 characters.'
      toRedirect = true
    } else if (candidateUser.password !== candidateUser.confirmedPassword) {
      req.session.errorMsg = 'Your passwords do not match!'
      toRedirect = true
    }
    if (toRedirect) {
      req.session.candidateUser = candidateUser
      res.redirect('/user/register')
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
    req.session.candidateUser = candidateUser

    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      req.session.errorMsg = 'Your e-mail is invalid!'
      res.redirect('/')
      return
    } else if (!candidateUser.password || (candidateUser.password.length < 4 || candidateUser.password.length > 20)) {
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

        let returnUrl = res.locals.returnUrl || '/'

        res.redirect(returnUrl)
      })
    })
  },

  logout: (req, res) => {
    req.logOut()
    return res.redirect('/')
  },

  cancelFriendship: (req, res) => {
    let returnUrl = res.locals.returnUrl || '/'
    let friendId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      req.session.errorMsg = 'Invalid friend id!'
      res.redirect(returnUrl)
      return
    }

    User.findById(friendId).then(friend => {
      if (!friend) {
        req.session.errorMsg = 'Such a user does not exist.'
        res.redirect(returnUrl)
        return
      } else if (!req.user.hasFriend(friendId) || !friend.hasFriend(req.user.id)) {
        req.session.errorMsg = 'You are not friends with that user.'
        res.redirect(returnUrl)
        return
      }
      // remove friends
      let cancelFriendPromise = req.user.removeFriend(friendId)
      let cancelFriendPromise2 = friend.removeFriend(req.user.id)

      Promise.all([cancelFriendPromise, cancelFriendPromise2]).then(() => {
        // Success - Attach message
        res.redirect(returnUrl)
        return
      })
    })
  },

  profilePageGet: (req, res) => {
    let page = null
    if (!Number.prototype.isNumeric(req.query.page)) {
      page = 0  // default to the first page
    } else {
      page = parseInt(req.query.page || '1') - 1
      if (page < 0) {
        page = 0
      }
    }
    let userId = req.params.id
    if (!Number.prototype.isNumeric(userId)) {
      req.session.errorMsg = 'Invalid user id!'
      res.redirect('/')
      return
    }
    User.findOne({ userId: userId }).populate('profilePic').then(user => {
      if (!user) {
        req.session.errorMsg = 'No such user exists.'
        res.redirect('/')
        return
      }
      // find the relation between the users
      let fSts = req.user.getFriendStatusWith(user)  // friendStatus

      new Promise((resolve, reject) => {
        if (fSts.areFriends || req.user.category._id.equals(user.category)) {
          // if they're friends or of the same category, all the posts should be visible
          Post.find({ author: user._id }).then(userPosts => {
            resolve(userPosts)
          })
        } else {  // load all the public posts from the user
          Post.find({ public: true, author: user._id }).then(publicPosts => {
            resolve(publicPosts)
          })
        }
      }).then(posts => {
        // sort by their date descending (newest first)
        posts = Post.sortPosts(posts)
        // get the posts in the page
        let postPages = Post.getPostsInPage(page, posts)
        let postsInPage = postPages.posts
        let pages = postPages.pages  // array of possible pages [1,2,3]
        Post.populate(postsInPage, 'author comments likes photos').then(() => {
          // populate each comment's author. Must be done after the initial populate
          Post.populate(postsInPage, [{ path: 'comments.author', model: 'User' }, { path: 'author.profilePic', model: 'Photo' }]).then(() => {
            Post.populate(postsInPage, [{ path: 'comments.author.profilePic', model: 'Photo' }]).then(() => {
              postsInPage = Post.initializeForView(postsInPage).then(postsInPage => {
                user.getLikesCount().then(user => {  // attached receivedPawsCount and etc to the user
                  res.render('user/profile', { profileUser: user, friendStatus: fSts, posts: postsInPage, categories: categories, pages: pages })
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
        let fSts = req.user.getFriendStatusWith(user)  // friendStatus

        new Promise((resolve, reject) => {
          if (fSts.areFriends || req.user.category._id.equals(user.category)) {
            // if they're friends or of the same category, all the photo/albums should be visible
            resolve([user.albums, user.photos])
          } else {  // load all the public photo/albums from the user
            let albums = user.albums.filter(album => {
              return album.public
            })
            let photos = user.photos.filter(photo => {
              return photo.public
            })
            resolve([albums, photos])
          }
        }).then((albumAndPhotos) => {
          let albums = albumAndPhotos[0]
          let photos = albumAndPhotos[1]
          Photo.initializeForView(photos).then(photos => {
            res.render('user/viewPhotos', { profileUser: user, photos: photos, albums: albums, categories: categories })
          })
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

    User.find({ fullName: { $regex: searchValue, $options: 'i' } }).populate('category profilePic pendingFriendRequests').then(users => {
      // attach a friendStatus object to each user, displaying thier relationship with the user doing the search
      users = users.map(user => {
        user.friendStatus = req.user.getFriendStatusWith(user)  // we need the req.user's viewpoint
        return user
      })
      res.render('searchOutput', { users: users, categories: categories })
    })
  }
}
