const User = require('mongoose').model('User')

module.exports = {
  registerGet: (req, res) => {
    res.render('user/register')
  },

  profilePageGet: (req, res) => {
    res.render('user/profile')
  }
}
