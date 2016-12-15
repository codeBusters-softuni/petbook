const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')

module.exports = (app, config) => {
  require('./handlebar-helpers')  // load handlebars helpers
  app.set('views', path.join(config.rootFolder, '/views'))
  app.set('view engine', 'hbs')

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(cookieParser())

  // cookie storage
  app.use(session({ secret: 's3cr3t5tr1ng', resave: false, saveUninitialized: false }))

  app.use(express.static(path.join(config.rootFolder, 'public')))

  app.use(passport.initialize())
  app.use(passport.session())

  // adds the current user/error message to res.locals for easy access in the HTML files
  app.use((req, res, next) => {
    if (req.session.errorMsg) {
      res.locals.errorMessage = req.session.errorMsg
      delete req.session.errorMsg
    }
    if (req.session.failedPost) {
      res.locals.failedPost = req.session.failedPost
      delete req.session.failedPost
    }
    if (req.user) {
      res.locals.user = req.user
      res.locals.user.hasRequest = req.user.hasFriendRequest()
      req.user.isAdmin().then(isAdmin => {
        res.locals.user.isAdministrator = isAdmin
        next()
      })
    } else {
      next()
    }
  })
}
