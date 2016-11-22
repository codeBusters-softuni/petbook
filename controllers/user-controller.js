const emailValidator = require('email-validator')  // module for validating email addresses
const encryption = require('./../utilities/encryption')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Role = mongoose.model('Role')

module.exports = {
  registerGet: (req, res) => {
    res.render('user/register')
  },

  registerPost: (req, res) => {
    let candidateUser = req.body

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
    // See if a user with the given email already exists
    User.findOne({ email: candidateUser.email }).then((potentialUser) => {
      if (potentialUser) {
        // ERROR
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        return
      }
      Role.findOne({ name: 'User' }).then(role => {
        if (!role) {
          // ERROR - such a role does not exist
          res.redirect('/')
          return
        }
        // create user
        let salt = encryption.generateSalt()
        let newUser = {
          fullName: candidateUser.fullName,
          email: candidateUser.email,
          password: encryption.hashPassword(candidateUser.password, salt),
          salt: salt,
          roles: [role._id]
        }

        User.create(newUser).then((newUser) => {
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
          return
        })
      })
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

      req.logIn(user, function (err, user) {
        if (err) {
          // req.session.errorMsg = 'Error while logging in :('
          // ERROR
          // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
          return
        }

        return res.redirect('/')
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

      res.render('user/profile', user)
    })
  }
}
