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
