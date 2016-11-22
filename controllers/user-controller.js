const emailValidator = require('email-validator')  // module for validating email addresses
const encryption = require('./../utilities/encryption')
const User = require('mongoose').model('User')

module.exports = {
  registerGet: (req, res) => {
    res.render('user/register')
  },

  registerPost: (req, res) => {
    let candidateUser = req.body
    console.log(candidateUser)
    // Validate credentials
    if (!emailValidator.validate(candidateUser.email)) {
      // ERROR - Email is invalid!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      return
    } else if (candidateUser.fullName.length < 3 || candidateUser.fullName.length > 20) {
      // ERROR - Full name is of invalid length
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      return
    } else if (candidateUser.password.length < 4 || candidateUser.password.length > 20) {
      // ERROR - Password is of invalid length
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      return
    } else if (candidateUser.password !== candidateUser.confirmedPassword) {
      // ERROR - Passwords do not match!
      // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
      return
    }
    // See if a user with the given email already exists
    User.findOne({ email: candidateUser.email }).then((potentialUser) => {
      if (potentialUser) {
        // ERROR
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        return
      }

      // create user
      let salt = encryption.generateSalt()
      let newUser = {
        fullName: candidateUser.fullName,
        email: candidateUser.email,
        password: encryption.hashPassword(candidateUser.password, salt),
        salt: salt
      }

      User.create(newUser).then(() => {
        req.logIn(newUser, (err, user) => {
          if (err) {
            // req.session.errorMsg = 'Error while logging in after registration :('
            // ERROR
            // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
            return
          }

          // TODO: Add success message that the user is registered
          res.redirect('/')
        })
      })
    })
  },

  profilePageGet: (req, res) => {
    res.render('user/profile')
  }
}
