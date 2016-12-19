const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Category = mongoose.model('Category')
const Comment_ = mongoose.model('Comment')
const Like = mongoose.model('Like')
const FriendRequest = mongoose.model('FriendRequest')
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
  const logInErrorMessage = 'Error while logging in after registration :('
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

  it('Valid registration, error in logIn function, should output a message and redict, user should be created', function (done) {
    requestMock.logIn = function (user, func) {
      func(true, null)
    }
    requestMock.body = sampleValidUser
    userController.registerPost(requestMock, responseMock)
    setTimeout(function () {
      User.findOne({}).populate('category').then(user => {
        // Assure that the message has been logged
        expect(requestMock.session.errorMsg).to.not.be.undefined
        expect(requestMock.session.errorMsg).to.be.equal(logInErrorMessage)
        expect(responseMock.redirectUrl).to.be.equal('/')

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
      User.findOne({}).then(user => {
        expect(user).to.not.be.null
        expect(user.ownerName).to.be.equal('nobody')
        done()
      })
    }, 300)
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
  let requestMock = null
  let responseMock = null

  beforeEach(function (done) {
    requestMock = {
      loggedOut: false,
      logOut: function () {
        this.loggedOut = true
      }
    }
    responseMock = {
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    done()
  })

  it('Normal call, should call req.logOut', function (done) {
    userController.logout(requestMock, responseMock)
    // Assert that req.logOut has been called
    expect(requestMock.loggedOut).to.be.true
    expect(responseMock.redirectUrl).to.be.equal('/')
    done()
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
  const nonExistingUserMessage = 'No such user exists.'
  const invalidUserIdMessage = 'Invalid user id!'

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
    // Nullify all the received values
    receivedHbsPage = null
    renderedUser = null
    receivedFriendStatus = null
    receivedPosts = null
    receivedCategories = null
    receivedPages = null
    secondUserPosts = null

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

  it('Friend of diff category visits page 0, all should work', function (done) {
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

  it('Friend of diff category visits page 2, should see 5 posts', function (done) {
    // Because we're friends with the user, we should see all of his posts
    // but the maximum for a page is 20, he has 25 posts,
    // so on the second post we should see 5 posts
    requestMock.query.page = '2'
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(5)
      // Assert that the posts are sorted, the first post in receivedPost should be the newest
      let newestPost = secondUserPosts.sort((postOne, postTwo) => {
        return postTwo.date - postOne.date
      })[20] // <-------------- take the first post that should be on the second page
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
    }, 100)
  })

  it('Visit page 20414, should see 0 posts', function (done) {
    // Because we're friends with the user, we should see all of his posts
    // but because we're at an invalid page, we should not see any posts
    requestMock.query.page = '21514'
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(0)
      done()
    }, 100)
  })

  it('Visit page -3105, should load the first page', function (done) {
    // Because we're friends with the user, we should see all of his posts
    // but because we're at an invalid page, we should not see any posts
    requestMock.query.page = '-3105'
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(maxPostsPerPage)
      expect(receivedPages).to.be.a('array')
      expect(receivedPages).to.deep.equal([1, 2])
      done()
    }, 40)
  })

  it('Visit page 1.1, should load the first page', function (done) {
    requestMock.query.page = '1.1'
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(maxPostsPerPage)
      expect(receivedPages).to.be.a('array')
      expect(receivedPages).to.deep.equal([1, 2])
      done()
    }, 40)
  })

  it('Visit page "SOMEPAGE", should load the first page', function (done) {
    requestMock.query.page = 'SOMEPAGE'
    userController.profilePageGet(requestMock, responseMock)

    setTimeout(function () {
      // assert received posts
      expect(receivedPosts).to.be.a('array')
      expect(receivedPosts.length).to.be.equal(maxPostsPerPage)
      expect(receivedPages).to.be.a('array')
      expect(receivedPages).to.deep.equal([1, 2])
      done()
    }, 40)
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

  it('Visit a profile of a user who has comments on his posts, should be shown on his posts', function (done) {
    // create the user
    User.register('ChickOnGlance', 'DontDrip@abv.bg', secondUserOwner, secondUserPassword, secondUserCategory).then(newUser => {
      // Create 25 posts from the newUser, all with a love on them
      let postPromises = []
      for (let i = 0; i < 25; i++) {
        postPromises.push(new Promise((resolve, reject) => {
          Comment_.create({ content: 'Love this man', author: reqUser.id }).then(comment => {
            Post.create({ content: i, public: false, author: newUser._id, category: newUser.category, comments: [comment.id] })
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
          receivedPosts.forEach(post => {
            expect(post.comments).to.not.be.undefined
            expect(post.comments).to.be.a('array')
            expect(post.comments.length).to.be.equal(1)
            expect(post.comments[0].author.toString()).to.be.equal(reqUser.id)
          })
          done()
        }, 40)
      })
    })
  })

  it('Visit a profile with a user that has likes on his posts and photos, the posts should display their likes', function (done) {
    // This display is done by the Post model's initializeForView function
    // wwhich basically attaches likes to the post and to it's photos
    // create the user
    User.register('ChickOnGlance', 'DontDrip@abv.bg', secondUserOwner, secondUserPassword, secondUserCategory).then(newUser => {
      new Promise((resolve, reject) => {
        // Create the album
        Album.create({
          name: 'newsfeed',
          author: newUser.id,
          public: true,
          photos: [],
          classCss: 'someCLass'
        }).then(album => { resolve(album) })
      }).then(album => {
        // Create 25 posts from the newUser, all with a love on them and with a picture that has a paw
        let postPromises = []
        for (let i = 0; i < 25; i++) {
          postPromises.push(new Promise((resolve, reject) => {
            Like.create({ type: 'Love', author: reqUser.id }).then(loveLike => {
              Like.create({ type: 'Paw', author: reqUser.id }).then(pawLike => {
                new Promise((resolve, reject) => {
                  let postPic = new Photo({
                    fieldname: 'addProfilePhoto',
                    originalname: 'WIN_20161210_10_23_56_Pro.jpg',
                    encoding: '7bit',
                    mimetype: 'image/jpeg',
                    filename: 'a31328e9ebbb340ca64f9d42f7f0aa68',
                    path: ':\\Work\\SoftUni\\Team Project\\petbook\\public\\uploads\\a31328e9ebbb340ca64f9d42f7f0aa68',
                    size: 145203,
                    author: secondUser.id,
                    album: album.id,
                    likes: [pawLike.id],
                    public: true
                  })
                  // Create the profile picture
                  Photo.create(postPic).then(photo => {
                    resolve(photo)
                  })
                }).then(postPic => {
                  Post.create({ content: i, public: true, author: newUser._id, category: newUser.category, likes: [loveLike.id], photos: [postPic.id] })
                    .then(newPost => {
                      resolve(newPost)
                    })
                })
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
            // Assert that every photo has a paw on it
            receivedPosts.forEach(post => {
              post.photos.forEach(photo => {
                expect(photo.paws).to.not.be.undefined
                expect(photo.paws).to.be.a('array')
                expect(photo.paws.length).to.be.equal(1)
                expect(photo.loves).to.not.be.undefined
                expect(photo.loves).to.be.a('array')
                expect(photo.loves.length).to.be.equal(0)  // the number of posts he has (every post is loved once)
                expect(photo.dislikes).to.not.be.undefined
                expect(photo.dislikes).to.be.a('array')
                expect(photo.dislikes.length).to.be.equal(0)
              })
            })
            done()
          }, 90)
        })
      })
    })
  })

  it('Visit a profile with a profilePicture, it should be displayed', function (done) {
    // save a profile picture to the user
    new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        // Create the album
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
            fieldname: 'addProfilePhoto',
            originalname: 'WIN_20161210_10_23_56_Pro.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            filename: 'a31328e9ebbb340ca64f9d42f7f0aa68',
            path: ':\\Work\\SoftUni\\Team Project\\petbook\\public\\uploads\\a31328e9ebbb340ca64f9d42f7f0aa68',
            size: 145203,
            author: secondUser.id,
            album: album.id,
            public: true
          })
          // Create the profile picture
          Photo.create(profilePic).then(photo => {
            resolve(photo)
          })
        }).then(profilePic => {
          // Attach the profile picture
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

  it('Visit a profile with an invalid id, should give out an error message and redirect', function (done) {
    requestMock.params.id = 'grindin'
    userController.profilePageGet(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidUserIdMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      done()
    }, 40)
  })

  it('Visit a profile with a float id, should give out an error message and redirect', function (done) {
    requestMock.params.id = '1.1'
    userController.profilePageGet(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidUserIdMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      done()
    }, 40)
  })

  it("Visit a profile with a infinity number for the user's id, should give out an error message and redirect", function (done) {
    requestMock.params.id = '1e10000'
    userController.profilePageGet(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidUserIdMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      done()
    }, 40)
  })

  it("Visit a profile with a user id that's not in the DB, should give out an error message and redirect", function (done) {
    requestMock.params.id = '31'
    userController.profilePageGet(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(nonExistingUserMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      done()
    }, 40)
  })

  it("Visit a user profile which you have sent a friend request to, should have a property that describes that you've sent a friend request", function (done) {
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', 'Dog').then(newUser => {
      FriendRequest.create({ sender: newUser.id, receiver: secondUser.id }).then(frReq => {
        User.findById(newUser.id).then(newUser => {  // user should now have a friend request in him
          User.populate(newUser, 'category pendingFriendRequests').then(newUser => {
            requestMock.user = newUser
            userController.profilePageGet(requestMock, responseMock)
            setTimeout(function () {
              expect(receivedFriendStatus.areFriends).to.be.false
              expect(receivedFriendStatus.sentRequest).to.be.true
              expect(receivedFriendStatus.receivedRequest).to.be.false
              expect(receivedFriendStatus.friendRequest.id).to.be.equal(frReq.id)
              done()
            }, 40)
          })
        })
      })
    })
  })

  it("Visit the profile of a user who has sent a friend request to you, should have a property confirming that", function (done) {
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', 'Dog').then(newUser => {
      FriendRequest.create({ sender: secondUser.id, receiver: newUser.id }).then(frReq => {
        User.findById(newUser.id).then(newUser => {  // user should now have a friend request in him
          User.populate(newUser, 'category pendingFriendRequests').then(newUser => {
            requestMock.user = newUser
            userController.profilePageGet(requestMock, responseMock)
            setTimeout(function () {
              expect(receivedFriendStatus.areFriends).to.be.false
              expect(receivedFriendStatus.sentRequest).to.be.false
              expect(receivedFriendStatus.receivedRequest).to.be.true
              expect(receivedFriendStatus.receivedFriendRequest.id).to.be.equal(frReq.id)
              done()
            }, 40)
          })
        })
      })
    })
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      Post.remove({}).then(() => {
        Photo.remove({}).then(() => {
          Album.remove({}).then(() => {
            Like.remove({}).then(() => {
              done()
            })
          })
        })
      })
    })
  })
})

describe('userPhotosGet, loading the photos of a user', function () {
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

  const expectedPhotosCount = 25
  const expectedAlbumsCount = 25
  const expectedHbsPage = 'user/viewPhotos'
  const nonExistingUserMessage = 'No such user exists!'
  const invalidUserIdMessage = 'Invalid user id!'

  let reqUser = null
  let secondUser = null
  let requestMock = null
  let responseMock = null
  let receivedHbsPage = null
  let renderedUser = null
  let receivedPhotos = null
  let receivedAlbums = null

  beforeEach(function (done) {
    // Nullify all the received values
    reqUser = null
    secondUser = null
    requestMock = null
    responseMock = null
    receivedHbsPage = null
    renderedUser = null
    receivedPhotos = null
    receivedAlbums = null

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
        receivedPhotos = argumentsPassed.photos
        receivedAlbums = argumentsPassed.albums
      }
    }

    // Register both users and make them friends
    User.register(firstUserName, firstUserEmail, firstUserOwner, firstUserPassword, firstUserCategory).then(firstUser => {
      User.register(secondUserName, secondUserEmail, secondUserOwner, secondUserPassword, secondUserCategory).then(secUser => {
        // Create 25 photos from the secondUser and 25 different albums
        let photoPromises = []
        for (let i = 0; i < 25; i++) {
          photoPromises.push(new Promise((resolve, reject) => {
            new Promise((resolve, reject) => {
              Album.create({
                name: 'newsfeed' + i.toString(),
                author: secUser.id,
                public: false,
                photos: [],
                classCss: 'someCLass'
              }).then(album => {
                album.addToUser().then(() => {
                  resolve(album)
                })
              })
            }).then(album => {
              let albumPic = new Photo({
                fieldname: 'somePh',
                originalname: 'WIN_20161210_10_23_56_Pro.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                filename: 'a31328e9ebbb340ca64f9d42f7f0aa68',
                path: ':\\Work\\SoftUni\\Team Project\\petbook\\public\\uploads\\a31328e9ebbb340ca64f9d42f7f0aa68',
                size: 145203,
                author: secUser.id,
                album: album.id,
                public: false
              })
              Photo.create(albumPic)
                .then(photo => {
                  resolve(photo)
                })
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
              requestMock.params.id = secondUser.userId.toString()
              requestMock.user = reqUser
              expect(reqUser.friends.length).to.be.equal(1)
              expect(secondUser.friends.length).to.be.equal(1)
              Promise.all(photoPromises).then((photos) => {
                done()
              })
            })
          })
        })
      })
    })
  })

  it('Normal visit, should load all albums and photos', function (done) {
    userController.userPhotosGet(requestMock, responseMock)
    setTimeout(function () {
      expect(receivedHbsPage).to.be.equal(expectedHbsPage)
      expect(receivedPhotos).to.not.be.null
      expect(receivedPhotos).to.be.a('array')
      expect(receivedPhotos.length).to.be.equal(expectedPhotosCount)
      expect(receivedAlbums).to.not.be.null
      expect(receivedAlbums).to.be.a('array')
      expect(receivedAlbums.length).to.be.equal(expectedAlbumsCount)
      expect(renderedUser).to.not.be.null
      expect(renderedUser.id.toString()).to.be.equal(secondUser.id)

      receivedAlbums.forEach(album => {
        expect(album.photos).to.not.be.undefined
        expect(album.photos).to.be.a('array')
        expect(album.photos.length).to.be.equal(1)  // 1 photo per album
      })
      // assert that each photo has a reference to an album we've received
      receivedPhotos.forEach(photo => {
        expect(photo.album).to.not.be.null
        let albumIsValid = receivedAlbums.findIndex(album => {
          return album.id.toString() === photo.album.toString()
        }) !== -1
        expect(albumIsValid).to.be.true
      })
      done()
    }, 40)
  })

  it("User visits his own profile's photos, should load another page that allows uploads", function (done) {
    requestMock.user = secondUser
    userController.userPhotosGet(requestMock, responseMock)

    setTimeout(function () {
      // assert that the correct page has loaded
      expect(receivedHbsPage).to.be.deep.equal('user/uploadPhotos')

      // validate the received albums/photos
      expect(receivedPhotos).to.not.be.null
      expect(receivedPhotos).to.be.a('array')
      expect(receivedPhotos.length).to.be.equal(expectedPhotosCount)
      expect(receivedAlbums).to.not.be.null
      expect(receivedAlbums).to.be.a('array')
      expect(receivedAlbums.length).to.be.equal(expectedAlbumsCount)
      expect(renderedUser).to.be.undefined  // we don't receive a user here

      receivedAlbums.forEach(album => {
        expect(album.photos).to.not.be.undefined
        expect(album.photos).to.be.a('array')
        expect(album.photos.length).to.be.equal(1)  // 1 photo per album
      })
      // assert that each photo has a reference to an album we've received
      receivedPhotos.forEach(photo => {
        expect(photo.album).to.not.be.null
        let albumIsValid = receivedAlbums.findIndex(album => {
          return album.id.toString() === photo.album.toString()
        }) !== -1
        expect(albumIsValid).to.be.true
      })
      done()
    }, 45)
  })

  it('User of different category who is not friends visits, should not see any photos/albums', function (done) {
    User.register(firstUserName, 'carlos@ferregamo.com', firstUserOwner, firstUserPassword, firstUserCategory).then(diffUser => {
      User.populate(diffUser, 'category pendingFriendRequests').then(diffUser => {
        requestMock.user = diffUser
        userController.userPhotosGet(requestMock, responseMock)
        setTimeout(function () {
          expect(receivedPhotos).to.not.be.null
          expect(receivedPhotos).to.be.a('array')
          expect(receivedPhotos.length).to.be.equal(0)
          expect(receivedAlbums).to.not.be.null
          expect(receivedAlbums).to.be.a('array')
          expect(receivedAlbums.length).to.be.equal(0)
          expect(renderedUser).to.not.be.null
          expect(renderedUser.id.toString()).to.be.equal(secondUser.id)
          done()
        }, 50)
      })
    })
  })

  it('User of same category but is not friends visits, should see all posts/albums', function (done) {
    User.register(firstUserName, 'carlos@ferregamo.com', firstUserOwner, firstUserPassword, secondUserCategory).then(diffUser => {
      User.populate(diffUser, 'category pendingFriendRequests').then(diffUser => {
        requestMock.user = diffUser
        userController.userPhotosGet(requestMock, responseMock)

        setTimeout(function () {
          expect(receivedPhotos).to.not.be.null
          expect(receivedPhotos).to.be.a('array')
          expect(receivedPhotos.length).to.be.equal(expectedPhotosCount)
          expect(receivedAlbums).to.not.be.null
          expect(receivedAlbums).to.be.a('array')
          expect(receivedAlbums.length).to.be.equal(expectedAlbumsCount)
          expect(renderedUser).to.not.be.null
          expect(renderedUser.id.toString()).to.be.equal(secondUser.id)

          receivedAlbums.forEach(album => {
            expect(album.photos).to.not.be.undefined
            expect(album.photos).to.be.a('array')
            expect(album.photos.length).to.be.equal(1)  // 1 photo per album
          })
          // assert that each photo has a reference to an album we've received
          receivedPhotos.forEach(photo => {
            expect(photo.album).to.not.be.null
            let albumIsValid = receivedAlbums.findIndex(album => {
              return album.id.toString() === photo.album.toString()
            }) !== -1
            expect(albumIsValid).to.be.true
          })
          done()
        }, 40)
      })
    })
  })

  it('Using a string as a userId, should give out an errorMessage and redirect', function (done) {
    requestMock.params.id = 'grindin'
    userController.userPhotosGet(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidUserIdMessage)
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      expect(receivedPhotos).to.be.null
      expect(receivedAlbums).to.be.null
      done()
    }, 40)
  })

  it('Using a userId that is not in the db, should give out an errorMessage and redirect', function (done) {
    requestMock.params.id = '1738'
    userController.userPhotosGet(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(nonExistingUserMessage)
      expect(responseMock.redirectUrl).to.be.equal('/')
      expect(renderedUser).to.be.null
      expect(receivedPhotos).to.be.null
      expect(receivedAlbums).to.be.null
      done()
    }, 40)
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      Post.remove({}).then(() => {
        Photo.remove({}).then(() => {
          Album.remove({}).then(() => {
            Like.remove({}).then(() => {
              done()
            })
          })
        })
      })
    })
  })
})

describe('userSearchPost, searching for users', function () {
  let firstUserName = 'FirstDaog'
  let firstUserEmail = 'somebody@abv.bg'
  let firstUserOwner = 'TheOwner'
  let firstUserPassword = '12345'
  let firstUserCategory = 'Dog'

  let secondUserName = 'FirstCat'
  let secondUserEmail = 'somecat@abv.bg'
  let secondUserOwner = 'TheOwner'
  let secondUserPassword = '12345'
  let secondUserCategory = 'Cat'

  const expectedHbsPage = 'searchOutput'
  const invalidUserIdMessage = 'Invalid user id!'

  let reqUser = null
  let secondUser = null
  let requestMock = null
  let responseMock = null
  let receivedHbsPage = null
  let renderedUsers = null
  let dogCategoryId = null

  beforeEach(function (done) {
    // Nullify all the received values
    reqUser = null
    secondUser = null
    requestMock = null
    responseMock = null
    receivedHbsPage = null
    renderedUsers = null
    dogCategoryId = null
    requestMock = {
      user: {},
      params: {},
      session: {},
      body: {}
    }

    responseMock = {
      locals: {},
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl },
      render: function (hbsPage, argumentsPassed) {
        receivedHbsPage = hbsPage
        renderedUsers = argumentsPassed.users
      }
    }

    // Register both users and make them friends
    User.register(firstUserName, firstUserEmail, firstUserOwner, firstUserPassword, firstUserCategory).then(firstUser => {
      User.register(secondUserName, secondUserEmail, secondUserOwner, secondUserPassword, secondUserCategory).then(secUser => {
        firstUser.friends.push(secUser)
        secUser.friends.push(firstUser)

        firstUser.save().then(() => {
          secUser.save().then(() => {
            User.populate(firstUser, 'category').then(firstUser => {  // the req.user always has a populated category
              reqUser = firstUser
              secondUser = secUser
              requestMock.user = reqUser
              expect(reqUser.friends.length).to.be.equal(1)
              expect(secondUser.friends.length).to.be.equal(1)
              Category.findOne({ name: 'Dog' }).then(category => {
                dogCategoryId = category.id
                done()
              })
            })
          })
        })
      })
    })
  })

  it('Normal search for exact username, should show the user', function (done) {
    requestMock.body.searchValue = secondUserName
    userController.userSearchPost(requestMock, responseMock)
    setTimeout(function () {
      expect(renderedUsers).to.not.be.null
      expect(renderedUsers).to.be.a('array')
      expect(renderedUsers.length).to.be.equal(1)
      expect(renderedUsers[0].id.toString()).to.be.equal(secondUser.id)
      expect(renderedUsers[0].friendStatus.areFriends).to.be.true
      done()
    }, 40)
  })

  it('Normal search for user, should load his profile pic', function (done) {
    // save a profile picture to the user
    new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        // Create the album
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
            fieldname: 'addProfilePhoto',
            originalname: 'WIN_20161210_10_23_56_Pro.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            filename: 'a31328e9ebbb340ca64f9d42f7f0aa68',
            path: ':\\Work\\SoftUni\\Team Project\\petbook\\public\\uploads\\a31328e9ebbb340ca64f9d42f7f0aa68',
            size: 145203,
            author: secondUser.id,
            album: album.id,
            public: true
          })
          // Create the profile picture
          Photo.create(profilePic).then(photo => {
            resolve(photo)
          })
        }).then(profilePic => {
          // Attach the profile picture
          secondUser.profilePic = profilePic.id
          secondUser.save().then(() => {
            resolve(profilePic)
          })
        })
      })
    }).then(profilePic => {
      requestMock.body.searchValue = secondUserName
      userController.userSearchPost(requestMock, responseMock)

      setTimeout(function () {
        expect(renderedUsers).to.not.be.null
        expect(renderedUsers).to.be.a('array')
        expect(renderedUsers.length).to.be.equal(1)
        let renderedUser = renderedUsers[0]
        expect(renderedUser.id.toString()).to.be.equal(secondUser.id)
        expect(renderedUser.friendStatus.areFriends).to.be.true

        expect(renderedUser.profilePic).to.not.be.undefined
        expect(renderedUser.profilePic.id.toString()).to.be.equal(profilePic.id)
        done()
      }, 40)
    })
  })

  it('Search for users with similar name, should show all', function (done) {
    User.create([
      { email: 'd', password: 'd', salt: 'd', fullName: 'Carlos Ferragamo', category: dogCategoryId },
      { email: 'da', password: 'd', salt: 'd', fullName: 'Carlos FeAmo', category: dogCategoryId },
      { email: 'daa', password: 'd', salt: 'd', fullName: 'Carl ragamo', category: dogCategoryId },
      { email: 'daaa', password: 'd', salt: 'd', fullName: 'Carlo Krustev', category: dogCategoryId },
      { email: 'daaaa', password: 'd', salt: 'd', fullName: 'Carlos Depp', category: dogCategoryId }
    ]).then(users => {
      requestMock.body.searchValue = 'Carl'
      userController.userSearchPost(requestMock, responseMock)
      setTimeout(function () {
        expect(renderedUsers).to.not.be.null
        expect(renderedUsers).to.be.a('array')
        expect(renderedUsers.length).to.be.equal(5)
        renderedUsers.forEach(user => {
          expect(user.friendStatus.areFriends).to.not.be.undefined
          expect(user.friendStatus.areFriends).to.be.false
          expect(user.friendStatus.receivedRequest).to.be.false
          expect(user.friendStatus.sentRequest).to.be.false
        })
        done()
      }, 50)
    })
  })

  it('Search for users with similar name by their lastname, should show all', function (done) {
    User.create([
      { email: 'd', password: 'd', salt: 'd', fullName: 'Carlos Ferragamo', category: dogCategoryId },
      { email: 'da', password: 'd', salt: 'd', fullName: 'Aylos FerRAmo', category: dogCategoryId },
      { email: 'daa', password: 'd', salt: 'd', fullName: 'Carl fER3', category: dogCategoryId },
      { email: 'daaa', password: 'd', salt: 'd', fullName: 'Torlo fer', category: dogCategoryId },
      { email: 'daaaa', password: 'd', salt: 'd', fullName: 'Dom FeRoDDepp', category: dogCategoryId }
    ]).then(users => {
      requestMock.body.searchValue = 'fer'
      userController.userSearchPost(requestMock, responseMock)
      setTimeout(function () {
        expect(renderedUsers).to.not.be.null
        expect(renderedUsers).to.be.a('array')
        expect(renderedUsers.length).to.be.equal(5)
        renderedUsers.forEach(user => {
          expect(user.friendStatus.areFriends).to.not.be.undefined
          expect(user.friendStatus.areFriends).to.be.false
          expect(user.friendStatus.receivedRequest).to.be.false
          expect(user.friendStatus.sentRequest).to.be.false
        })
        done()
      }, 50)
    })
  })

  it('Search for users with similar name using an UPPER CASE character present in all names, should show all with letter in name', function (done) {
    User.create([
      { email: 'd', password: 'd', salt: 'd', fullName: 'Carlos Ferragamo', category: dogCategoryId },
      { email: 'da', password: 'd', salt: 'd', fullName: 'Carlos FeAmo', category: dogCategoryId },
      { email: 'daa', password: 'd', salt: 'd', fullName: 'Carl ragamo', category: dogCategoryId },
      { email: 'daaa', password: 'd', salt: 'd', fullName: 'Carlo Krustev', category: dogCategoryId },
      { email: 'daaaa', password: 'd', salt: 'd', fullName: 'Carlos Depp', category: dogCategoryId }
    ]).then(users => {
      requestMock.body.searchValue = 'a'
      userController.userSearchPost(requestMock, responseMock)
      setTimeout(function () {
        expect(renderedUsers).to.not.be.null
        expect(renderedUsers).to.be.a('array')
        expect(renderedUsers.length).to.be.equal(7)
        renderedUsers.forEach(user => {
          expect(user.fullName.indexOf(requestMock.body.searchValue) !== -1).to.be.true  // assert 'a' is in the name
        })
        done()
      }, 50)
    })
  })

  it('Search for a username that is not in the db, should not load anybody', function (done) {
    requestMock.body.searchValue = 'Wallace'
    userController.userSearchPost(requestMock, responseMock)
    setTimeout(function () {
      expect(renderedUsers).to.not.be.null
      expect(renderedUsers).to.be.a('array')
      expect(renderedUsers.length).to.be.equal(0)
      done()
    }, 50)
  })

  it('Search for a user youve sent a request to, should show that a request is pending', function (done) {
    requestMock.body.searchValue = 'Firstn'
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', 'Dog').then(newUser => {
      FriendRequest.create({ sender: reqUser.id, receiver: newUser.id }).then(frReq => {
        User.findById(newUser.id).then(newUser => {  // user should now have a friend request in him
          User.findById(reqUser.id).populate('pendingFriendRequests').then(reqUser => {  // load again to update the friend requests array
            requestMock.user = reqUser
            userController.userSearchPost(requestMock, responseMock)
            setTimeout(function () {
              expect(renderedUsers).to.not.be.null
              expect(renderedUsers).to.be.a('array')
              expect(renderedUsers.length).to.be.equal(1)
              expect(renderedUsers[0].id.toString()).to.be.equal(newUser.id.toString())
              let receivedFriendStatus = renderedUsers[0].friendStatus
              expect(receivedFriendStatus.areFriends).to.be.false
              expect(receivedFriendStatus.sentRequest).to.be.true
              expect(receivedFriendStatus.friendRequest.id).to.be.equal(frReq.id)
              expect(receivedFriendStatus.receivedRequest).to.be.false
              done()
            }, 40)
          })
        })
      })
    })
  })

  it('Search for a user youve received a request from, should show that a request is pending', function (done) {
    requestMock.body.searchValue = 'Firstn'
    User.register('Firstname', 'Firstname@son.bg', 'OwnerMan', '12345', 'Dog').then(newUser => {
      FriendRequest.create({ sender: newUser.id, receiver: reqUser.id }).then(frReq => {
        User.findById(newUser.id).then(newUser => {  // user should now have a friend request in him
          User.findById(reqUser.id).populate('pendingFriendRequests').then(reqUser => {  // load again to update the friend requests array
            requestMock.user = reqUser
            userController.userSearchPost(requestMock, responseMock)
            setTimeout(function () {
              expect(renderedUsers).to.not.be.null
              expect(renderedUsers).to.be.a('array')
              expect(renderedUsers.length).to.be.equal(1)
              expect(renderedUsers[0].id.toString()).to.be.equal(newUser.id.toString())
              let receivedFriendStatus = renderedUsers[0].friendStatus
              expect(receivedFriendStatus.areFriends).to.be.false
              expect(receivedFriendStatus.sentRequest).to.be.false
              expect(receivedFriendStatus.receivedRequest).to.be.true
              expect(receivedFriendStatus.receivedFriendRequest.id).to.be.equal(frReq.id)
              done()
            }, 40)
          })
        })
      })
    })
  })

  afterEach(function (done) {
    User.remove({}).then(() => {
      done()
    })
  })
})
