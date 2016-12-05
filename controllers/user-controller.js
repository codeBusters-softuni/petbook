const emailValidator = require('email-validator')  // module for validating email addresses
const encryption = require('./../utilities/encryption')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Role = mongoose.model('Role')
const Category = mongoose.model('Category')

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

        return res.redirect(returnUrl)
      })
    })
  },

  logout: (req, res) => {
    req.logOut()
    let returnUrl = '/'
    return res.redirect(returnUrl)
    // res.redirect('/');
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
      console.log(req.user)
      let areFriends = req.user.friends.indexOf(user.id) !== -1
      let hasSentRequest = req.user.hasSentRequest(user.id)
      let friendStatus = {
        sentRequest: hasSentRequest,
        areFriends: areFriends
      }
      res.render('user/profile', {profileUser: user, friendStatus: friendStatus})
    })
  }
}
