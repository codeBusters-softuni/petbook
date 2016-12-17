const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Category = mongoose.model('Category')
const userController = require('../../controllers/user-controller')

describe('registerGet function', function () {
  /* the registerGet function renders the register page with 
  an optional candidateUser( for when he failed to register ), 
  the possible categories he can  register as,
  a special layout for the register page */
  let successfullCandidateUserMessage = 'USER OK!'
  let expectedHbsPage = 'user/register/register'
  let expectedLayoutHbsPage = 'user/register/register-layout'
  let receivedHbsPage = null
  let receivedLayoutHbsPage = null
  let receivedCategories = null
  let candidateUser = null
  let requestMock = {
  }
  let responseMock = {
    locals: {candidateUser: successfullCandidateUserMessage},

    render: function (hbsPage, argumentsPassed) {
      receivedHbsPage = hbsPage
      candidateUser = argumentsPassed.candidateUser
      receivedCategories = argumentsPassed.categories
      receivedLayoutHbsPage = argumentsPassed.layout
    }
  }

  it('should render userRegisterHbs with the expected values', function (done) {
    userController.registerGet(requestMock, responseMock)
    setTimeout(function () {
      Category.find({}).then(categories => {
        expect(categories).to.deep.include(receivedCategories)
        expect(receivedHbsPage).to.be.equal(expectedHbsPage)
        expect(receivedLayoutHbsPage).to.be.equal(expectedLayoutHbsPage)
        expect(candidateUser).to.be.equal(successfullCandidateUserMessage)
        done()
      })
      done()
    }, 40)
  })
})

describe('registerPost function', function () {
  let requestMock = null
  let responseMock = null

  let sampleFullName = 'Lewis the Dog'
  let sampleEmail = 'Lewis@the.dog'
  let samplePassword = 'Lewis12'
  let sampleOwner = 'E-dubble'
  let sampleCategory = 'Dog'
  let sampleValidUser = {
    fullName: sampleFullName,
    email: sampleEmail,
    password: samplePassword,
    confirmedPassword: samplePassword,
    ownerName: sampleOwner,
    category: sampleCategory
  }
  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      files: [],
      headers: {},
      session: {},
      logIn: function (user, func) {
        func()
      }
    }
    responseMock = {
      locals: {},
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }

    done()
  })

  it('A valid user should be registered', function (done) {
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)
    setTimeout(function () {
      User.findOne({}).populate('category').then(user => {
        expect(user).to.not.be.null
        expect(user.fullName).to.be.equal(sampleFullName)
        expect(user.ownerName).to.be.equal(sampleOwner)
        expect(user.email).to.be.equal(sampleEmail)
        expect(user.category.name).to.be.equal(sampleCategory)
        // Password should be hashed
        expect(user.salt).to.not.be.undefined
        expect(user.password).to.not.be.equal(samplePassword)
        expect(user.password.length).to.be.greaterThan(samplePassword.length)
        done()
      })
    }, 200)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})
