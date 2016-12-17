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
    locals: { candidateUser: successfullCandidateUserMessage },

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
  const invalidEmailAddressMessage = 'Your e-mail is invalid!'
  const invalidFullNameMessage = 'Your full name has invalid length! It should be between 3 and 20 characters.'
  let requestMock = null
  let responseMock = null
  const redirectUrl = '/user/register'

  let sampleFullName = 'Lewis the Dog'
  let sampleEmail = 'Lewis@the.dog'
  let samplePassword = 'Lewis12'
  let sampleOwner = 'E-dubble'
  let sampleCategory = 'Dog'
  let sampleValidUser = null

  beforeEach(function (done) {
    sampleValidUser = {
      fullName: sampleFullName,
      email: sampleEmail,
      password: samplePassword,
      confirmedPassword: samplePassword,
      ownerName: sampleOwner,
      category: sampleCategory
    }
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

  it('A user without an ownername, should turn his ownerName to nobody', function (done) {
    sampleValidUser.ownerName = null
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)
    setTimeout(function () {
      User.findOne({}).populate('category').then(user => {
        expect(user).to.not.be.null
        expect(user.ownerName).to.be.equal('nobody')
        done()
      })
    }, 170)
  })

  it('A user with an invalid email address, should redirect only', function (done) {
    sampleValidUser.email = 'ThisIsNotAnEmail.com'
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailAddressMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user without an email address field, should redirect only', function (done) {
    delete sampleValidUser.email
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailAddressMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user without a fullName field, should redirect only', function (done) {
    delete sampleValidUser.fullName
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidFullNameMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})
