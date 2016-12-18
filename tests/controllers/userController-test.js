const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Category = mongoose.model('Category')
const Like = mongoose.model('Like')
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
  const invalidOwnerNameMessage = "Your owner's name has invalid length! It should be between 3 and 20 characters."
  const invalidPasswordMessage = 'Your password has invalid length! It should be between 4 and 20 characters.'
  const nonMatchingPasswordsMessage = 'Your passwords do not match!'
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
        console.log()  // for some reason this test gives a timeout error, console log seems to fix it
        expect(user).to.not.be.null
        expect(user.ownerName).to.be.equal('nobody')
        done()
      })
    }, 110)
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

  it('A user with too long of an e-mail address, should redirect only', function (done) {
    sampleValidUser.email = 'VodkaTonicUpInMyBodySIttingOnTheFrontSeatIcallShawtyFF32callitFridayCuzIdontLikeBeefLikeMothefuckingGandhi@abv.com'
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

  it('A user with a short full name, should redirect only', function (done) {
    sampleValidUser.fullName = 'gn'
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

  it('A user with a long fullname, should redirect only', function (done) {
    sampleValidUser.fullName = 'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff, Sr.'
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

  it('A user with a short ownername, should redirect only', function (done) {
    sampleValidUser.ownerName = 'dd'
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidOwnerNameMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user with too long of an ownerName, should redirect onl', function (done) {
    sampleValidUser.ownerName = 'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff, Sr.'
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidOwnerNameMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user without a password field, should redirect only', function (done) {
    delete sampleValidUser.password
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user with too short of a password, should redirect only', function (done) {
    // password should be between 4 and 20 inclusive length
    sampleValidUser.password = 'car'
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user with too long of a password, should redirect only', function (done) {
    // password should be between 4 and 20 inclusive length
    sampleValidUser.password = '1234567891011121314151617181920'
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user with password and confirmpassword that do not match, should redirect', function (done) {
    // password should be between 4 and 20 inclusive length
    sampleValidUser.confirmedPassword = true
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(nonMatchingPasswordsMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)

      User.findOne({}).then(user => {
        // Assure that no user has been created
        expect(user).to.be.null
        done()
      })
    }, 50)
  })

  it('A user without a confirmedPassword field, should redirect', function (done) {
    // password should be between 4 and 20 inclusive length
    delete sampleValidUser.confirmedPassword
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(nonMatchingPasswordsMessage)
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

describe('loginPost function, logging in a user', function () {
  const invalidLogInMessage = 'Invalid e-mail/password.'
  const invalidEmailMessage = 'Your e-mail is invalid!'
  const invalidPasswordMessage = 'Your password has invalid length! It should be between 4 and 20 characters.'
  let sampleValidUser = null
  let requestMock = null
  let responseMock = null
  let reqUser = null
  let validUserEmail = 'somebody@abv.bg'
  let validUserPassword = '12345'
  let loggedIn = null
  let redirectUrl = 'demJohns'

  beforeEach(function (done) {
    loggedIn = false
    requestMock = {
      body: {},
      user: {},
      files: [],
      headers: {},
      session: {},
      logIn: function (user, func) {
        loggedIn = true
        func()
      }
    }
    responseMock = {
      locals: { returnUrl: redirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    User.register('Guyssmart', validUserEmail, 'TheOwner', validUserPassword, 'Dog').then(dog => {
      reqUser = dog
      requestMock.body = {
        email: validUserEmail,
        password: validUserPassword
      }
      done()
    })
  })

  it('Log in a valid user', function (done) {
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.be.undefined
      expect(loggedIn).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
      done()
    }, 50)
  })

  it('Log in a user without the email field, should redirect', function (done) {
    delete requestMock.body.email
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in a user with an invalid email, should redirect', function (done) {
    requestMock.body.email = 'dogman.com'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in a user with a short email, should redirect', function (done) {
    requestMock.body.email = 'd@b.c'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in a user with a too long email, should redirect', function (done) {
    requestMock.body.email = 'dFettyWapMyNameThoNoDaysOffMyGameThoWatchWhatYousayThoWatchWhatYouSayThoThoYOuWillSay@Thob.compact'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidEmailMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in without a password field, should redirect', function (done) {
    delete requestMock.body.password
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in with too short of a password, should redirect', function (done) {
    requestMock.body.password = '123'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in with too long of a password, should redirect', function (done) {
    requestMock.body.password = '123456789101112131415161711920'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPasswordMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in with an e-mail that is not in the db, should redirect', function (done) {
    requestMock.body.email = 'youdonthave@hotmail.com'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidLogInMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  it('Log in with a password that is not the correct one, should redirect', function (done) {
    requestMock.body.password = '12345as'
    userController.loginPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidLogInMessage)
      expect(loggedIn).to.be.false
      expect(responseMock.redirectUrl).to.be.equal('/')
      done()
    }, 50)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})

describe('logout function, logging out a user', function () {
  let sampleValidUser = null
  let requestMock = null
  let responseMock = null
  let reqUser = null
  let validUserEmail = 'somebody@abv.bg'
  let validUserPassword = '12345'
  let loggedOut = null
  let redirectUrl = 'demJohns'

  beforeEach(function (done) {
    requestMock = {
      user: {},
      loggedOut: false,
      logOut: function () {
        loggedOut = true
      }
    }
    responseMock = {
      locals: { returnUrl: redirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    User.register('Guyssmart', validUserEmail, 'TheOwner', validUserPassword, 'Dog').then(dog => {
      reqUser = dog
      requestMock.user = reqUser
      done()
    })
  })

  it('Normal call, should call req.logOut', function (done) {
    userController.logout(requestMock, responseMock)
    setTimeout(function () {
      // Assert that req.logOut has been called
      expect(requestMock.loggedOut).to.be.true
    }, 40)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})

describe('cancelFriendship function, cancelling a friendship between users', function () {
  /* Have two users be friends, one will be attached to the request.user and the
     other will have his ID in the req.params.id */
  const invalidFriendshipMessage = 'You are not friends with that user.'
  const nonExistingUserMessage = 'Such a user does not exist.'
  const invalidFriendIdMessage = 'Invalid friend id!'

  let firstUserName = 'FirstDog'
  let firstUserEmail = 'somebody@abv.bg'
  let firstUserOwner = 'TheOwner'
  let firstUserPassword = '12345'
  let firstUserCategory = 'Dog'

  let secondUserName = 'FirstCat'
  let secondUserEmail = 'somecat@abv.bg'
  let secondUserOwner = 'TheOwner'
  let secondUserPassword = '12345'
  let secondUserCategory = 'Cat'

  let requestMock = null
  let responseMock = null
  let reqUser = null
  let secondUser = null
  let redirectUrl = 'demJohns'

  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      files: [],
      headers: {},
      session: {},
      params: {}
    }
    responseMock = {
      locals: { returnUrl: redirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }

    // Register both users and make them friends
    User.register(firstUserName, firstUserEmail, firstUserOwner, firstUserPassword, firstUserCategory).then(firstUser => {
      User.register(secondUserName, secondUserEmail, secondUserOwner, secondUserPassword, secondUserCategory).then(secUser => {
        firstUser.friends.push(secUser)
        secUser.friends.push(firstUser)

        firstUser.save().then(() => {
          secUser.save().then(() => {
            reqUser = firstUser
            secondUser = secUser
            requestMock.params.id = secondUser.id
            requestMock.user = reqUser
            expect(reqUser.friends.length).to.be.equal(1)
            expect(secondUser.friends.length).to.be.equal(1)
            done()
          })
        })
      })
    })
  })

  it('Cancel valid friendship, users should not be friends anymore', function (done) {
    userController.cancelFriendship(requestMock, responseMock)

    setTimeout(function () {
      User.find({}).then(users => {
        let userOne = users[0]
        let userTwo = users[1]
        expect(userOne.friends).to.be.a('array')
        expect(userTwo.friends).to.be.a('array')
        expect(userOne.friends.length).to.be.equal(0)
        expect(userTwo.friends.length).to.be.equal(0)
        expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
        done()
      })
    }, 50)
  })

  it('Try to cancel a friendship where the reqUser does not have the other user as a friend, should give out an errorMsg and redirect', function (done) {
    requestMock.user.friends = []
    userController.cancelFriendship(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidFriendshipMessage)
      expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
      done()
    }, 40)
  })

  it('Try to cancel a friendship where other user does not have the requser as a friend, should give out an errorMsg and redirect', function (done) {
    User.findById(requestMock.params.id).then(user => {
      user.friends = []
      user.save().then(() => {
        userController.cancelFriendship(requestMock, responseMock)

        setTimeout(function () {
          expect(requestMock.session.errorMsg).to.not.be.undefined
          expect(requestMock.session.errorMsg).to.be.equal(invalidFriendshipMessage)
          expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
          done()
        }, 40)
      })
    })
  })

  it('Try to cancel with an invalid mongoose object id, should give out an error message and redirect', function (done) {
    requestMock.params.id = 'grindin'
    userController.cancelFriendship(requestMock, responseMock)

    setTimeout(function () {
      User.find({}).then(users => {
        // Assert that the users are still friends
        let userOne = users[0]
        let userTwo = users[1]
        expect(userOne.friends).to.be.a('array')
        expect(userTwo.friends).to.be.a('array')
        expect(userOne.friends.length).to.be.equal(1)
        expect(userTwo.friends.length).to.be.equal(1)
        expect(requestMock.session.errorMsg).to.not.be.undefined
        expect(requestMock.session.errorMsg).to.be.equal(invalidFriendIdMessage)
        expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
        done()
      })
    }, 40)
  })

  it('Try to cancel a friendship with a friendId that is not in the DB, should give out an error message and redirect', function (done) {
    requestMock.params.id = '4edd40c86762e0fb12000003'
    userController.cancelFriendship(requestMock, responseMock)

    setTimeout(function () {
      User.find({}).then(users => {
        // Assert that the users are still friends
        let userOne = users[0]
        let userTwo = users[1]
        expect(userOne.friends).to.be.a('array')
        expect(userTwo.friends).to.be.a('array')
        expect(userOne.friends.length).to.be.equal(1)
        expect(userTwo.friends.length).to.be.equal(1)
        expect(requestMock.session.errorMsg).to.not.be.undefined
        expect(requestMock.session.errorMsg).to.be.equal(nonExistingUserMessage)
        expect(responseMock.redirectUrl).to.be.equal(redirectUrl)
        done()
      })
    }, 40)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})

describe('profilePageGet, loading the profile page of a user', function () {
  /* The function should render the page of a user, showing him and all of the posts that the req.user can
    see from him with pagination. */
  require('../../config/config').initialize()  // function uses some prototype function we register
  let firstUserName = 'FirstDog'
  let firstUserEmail = 'somebody@abv.bg'
  let firstUserOwner = 'TheOwner'
  let firstUserPassword = '12345'
  let firstUserCategory = 'Dog'

  let secondUserName = 'FirstCat'
  let secondUserEmail = 'somecat@abv.bg'
  let secondUserOwner = 'TheOwner'
  let secondUserPassword = '12345'
  let secondUserCategory = 'Cat'

  const maxPostsPerPage = 20
  let expectedFriendStatus = null
  const expectedHbsPage = 'user/profile'

  let reqUser = null
  let secondUser = null
  let secondUserPosts = null
  let requestMock = null
  let responseMock = null
  let receivedHbsPage = null
  let renderedUser = null
  let receivedFriendStatus = null
  let receivedPosts = null
  let receivedCategories = null
  let receivedPages = null

  beforeEach(function (done) {
    requestMock = {
      user: {},
      params: {},
      headers: {},
      session: {},
      query: {}
    }

    responseMock = {
      locals: {},
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl },
      render: function (hbsPage, argumentsPassed) {
        receivedHbsPage = hbsPage
        renderedUser = argumentsPassed.profileUser
        receivedFriendStatus = argumentsPassed.friendStatus
        receivedPosts = argumentsPassed.posts
        receivedCategories = argumentsPassed.categories
        receivedPages = argumentsPassed.pages
      }
    }

    expectedFriendStatus = {
      sentRequest: false,
      areFriends: true,
      friendRequest: false,
      receivedRequest: false,
      receivedFriendRequest: false
    }

    // Register both users and make them friends
    User.register(firstUserName, firstUserEmail, firstUserOwner, firstUserPassword, firstUserCategory).then(firstUser => {
      User.register(secondUserName, secondUserEmail, secondUserOwner, secondUserPassword, secondUserCategory).then(secUser => {
        // Create 25 posts from the secondUser
        let postPromises = []
        for (let i = 0; i < 25; i++) {
          postPromises.push(new Promise((resolve, reject) => {
            Post.create({ content: i, public: false, author: secUser._id, category: secUser.category })
              .then(newPost => {
                resolve(newPost)
              })
          }))
        }

        firstUser.friends.push(secUser)
        secUser.friends.push(firstUser)

        firstUser.save().then(() => {
          secUser.save().then(() => {
            User.populate(firstUser, 'category').then(firstUser => {  // the req.user always has a populated category
              reqUser = firstUser
              secondUser = secUser
              requestMock.params.id = secondUser.userId
              requestMock.user = reqUser
              expect(reqUser.friends.length).to.be.equal(1)
              expect(secondUser.friends.length).to.be.equal(1)
              Promise.all(postPromises).then((posts) => {
                secondUserPosts = posts
                done()
              })
            })
          })
        })
      })
    })
  })

  it('Friend of diff category visits, all should work', function (done) {
    // Because we're friends with the user, we should see all of his posts
    // but the maximum for a page is 20
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(maxPostsPerPage)
      // Assert that the posts are sorted, the first post in receivedPost should be the newest
      let newestPost = secondUserPosts.sort((postOne, postTwo) => {
        return postTwo.date - postOne.date
      })[0]
      expect(newestPost.content).to.be.equal(receivedPosts[0].content)
      // assure that there are two pages
      expect(receivedPages).to.be.a('array')
      expect(receivedPages).to.deep.equal([1, 2])
      expect(receivedFriendStatus).to.deep.equal(expectedFriendStatus)
      expect(receivedHbsPage).to.deep.equal(expectedHbsPage)
      // assure that it rendered the correct user
      expect(renderedUser.id).to.equal(secondUser.id)
      // assure that he has receivedLikes objects
      expect(renderedUser.receivedPawsCount).to.not.be.undefined
      expect(renderedUser.receivedDislikesCount).to.not.be.undefined
      expect(renderedUser.receivedLovesCount).to.not.be.undefined
      done()
    }, 200)
  })

  it('Visit from a person who is not his friend and different category, should not see any posts', function (done) {
    // Because we are not his friend, are different categories and all his posts are private, 
    // we should not see any posts
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', 'Dog').then(newUser => {
      User.populate(newUser, 'category').then(newUser => {
        requestMock.user = newUser
        userController.profilePageGet(requestMock, responseMock)

        setTimeout(function () {
          // assert received posts
          expect(receivedFriendStatus.areFriends).to.be.false
          expect(receivedPosts).to.be.a('array')
          expect(receivedPosts.length).to.be.equal(0)
          expect(receivedPages).to.be.a('array')
          expect(receivedPages).to.deep.equal([])
          expect(receivedHbsPage).to.deep.equal(expectedHbsPage)
          // assure that it rendered the correct user
          expect(renderedUser.id).to.equal(secondUser.id)
          done()
        }, 50)
      })
    })
  })

  it('Visit from a person who is the same categories but are not friends, should see all posts', function (done) {
    // even though all the profile user's posts are private, they are of the same category, therefore should be visible
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', secondUserCategory).then(newUser => {
      User.populate(newUser, 'category').then(newUser => {
        requestMock.user = newUser
        userController.profilePageGet(requestMock, responseMock)

        setTimeout(function () {
          // assert received posts
          expect(receivedPosts).to.be.a('array')
          expect(receivedPosts.length).to.be.equal(maxPostsPerPage)
          expect(receivedPages).to.be.a('array')
          expect(receivedPages).to.deep.equal([1, 2])
          expect(receivedHbsPage).to.deep.equal(expectedHbsPage)
          // assure that it rendered the correct user
          expect(renderedUser.id).to.equal(secondUser.id)
          done()
        }, 50)
      })
    })
  })

  it('Visit a profile of a user who has likes on his posts, should be shown on his profile', function (done) {
    // create the user
    User.register('ChickOnGlance', 'DontDrip@abv.bg', secondUserOwner, secondUserPassword, secondUserCategory).then(newUser => {
      // Create 25 posts from the newUser, all with a love on them
      let postPromises = []
      for (let i = 0; i < 25; i++) {
        postPromises.push(new Promise((resolve, reject) => {
          Like.create({ type: 'Love', author: reqUser.id }).then(loveLike => {
            Post.create({ content: i, public: false, author: newUser._id, category: newUser.category, likes: [loveLike.id] })
              .then(newPost => {
                resolve(newPost)
              })
          })
        }))
      }
      Promise.all(postPromises).then(posts => {
        requestMock.params.id = newUser.userId  // visit the new user's profile
        userController.profilePageGet(requestMock, responseMock)

        setTimeout(function () {
          expect(renderedUser.receivedPawsCount).to.not.be.undefined
          expect(renderedUser.receivedPawsCount).to.be.equal(0)
          expect(renderedUser.receivedLovesCount).to.not.be.undefined
          expect(renderedUser.receivedLovesCount).to.be.equal(25)  // the number of posts he has (every post is loved once)
          expect(renderedUser.receivedDislikesCount).to.not.be.undefined
          expect(renderedUser.receivedDislikesCount).to.be.equal(0)
          done()
        }, 40)
      })
    })
  })

  it('Visit a profile with a profilePicture, it should be displayed', function (done) {
    // save a profile picture to the user
    let saveProfilePicturePromise = new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        Album.create({
          name: 'profiles',
          author: secondUser.id,
          public: true,
          photos: [],
          classCss: 'someCLass'
        }).then(album => { resolve(album) })
      }).then(album => {
        new Promise((resolve, reject) => {
          let profilePic = new Photo({
            fieldname: "addProfilePhoto",
            originalname: "WIN_20161210_10_23_56_Pro.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            filename: "a31328e9ebbb340ca64f9d42f7f0aa68",
            path: ":\\Work\\SoftUni\\Team Project\\petbook\\public\\uploads\\a31328e9ebbb340ca64f9d42f7f0aa68",
            size: 145203,
            author: secondUser.id,
            album: album.id,
            public: true
          })
          Photo.create(profilePic).then(photo => {
            resolve(photo)
          })
        }).then(profilePic => {
          secondUser.profilePic = profilePic.id
          secondUser.save().then(() => {
            resolve(profilePic)
          })
        })
      })
    }).then(profilePic => {
      userController.profilePageGet(requestMock, responseMock)

      setTimeout(function () {
        expect(renderedUser.profilePic).to.not.be.undefined
        expect(renderedUser.profilePic.id).to.be.equal(profilePic.id)
        expect(renderedUser.profilePic.filename).to.not.be.undefined
        done()
      }, 40)
    })
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      Post.remove({}).then(() => {
        done()
      })
    })
  })
})
