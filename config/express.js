const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const favicon = require('serve-favicon')
const constants = require('./constants')
const favIconPath = constants.favIconPath
const viewsDirPath = constants.viewsDirPath
const publicDirPath = constants.publicDirPath

module.exports = (app, config) => {
  require('./handlebar-helpers')  // load handlebars helpers
  app.set('views', viewsDirPath)
  app.set('view engine', 'hbs')

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(favicon(favIconPath))

  app.use(cookieParser())

  // cookie storage
  // TODO: Store somehwere else
  app.use(session({ secret: 's3cr3t5tr1ng', resave: false, saveUninitialized: false }))

  app.use(express.static(publicDirPath))

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
    if (req.session.candidateUser) {
      res.locals.candidateUser = req.session.candidateUser
      delete req.session.candidateUser
    }
    if (req.session.returnUrl) {
      res.locals.returnUrl = req.session.returnUrl
      delete req.session.returnUrl
    }
    if (req.method === 'GET') {
      // attach the URL to returnUrl so that we can use it come next POST request
      if (req.session.toLogIn) {
        // If the user has tried to access a page he did not have permission to view,
        // juggle the URL to it until he logs in and gets redirected to it
        req.session.returnUrl = res.locals.returnUrl
        delete req.session.toLogIn
      } else {
        req.session.returnUrl = req.originalUrl
      }
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
