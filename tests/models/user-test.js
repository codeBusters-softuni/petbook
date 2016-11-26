const expect = require('chai').expect
const config = require('../../config/config')
const dbConnectionString = config.development.connectionString + '_test'  // new database used for testing only
const mongoose = require('mongoose')
const encryption = require('../../utilities/encryption')

describe('User', function () {
  let User = null
  let registerUser = null  // function that registers a user
  // connect to the DB before and initialize roles
  beforeEach(function (done) {
    mongoose.connect(dbConnectionString).then(() => {
      let rolePromises = require('../../models/Role').initialize()  // create the Admin and User roles in the DB
      User = require('../../models/User')
      console.log('bb')
      registerUser = require('../../models/User').register

      Promise.all(rolePromises)
        .then(() => {
          done()
        })
    })
  })

  it('duplicate emails should not be allowed',
    function (done) {
      registerUser('Stanislav Kozlovski', 'email@abv.bg', 'pass').then(() => {
        registerUser('Stanislav Kozlovski', 'email@abv.bg', 'pass').catch((err) => {
          expect(err).not.to.be.undefined
          expect(err).not.to.be.null
          expect(err.message).to.be.equal('User with the email email@abv.bg already exists!')
          done()
        })
      })
    })

  it('when registering a user, the password should be encrypted',
    function (done) {
      let rawPassword = 'password'
      registerUser('Stanislav Kozlovski', 'stanislav@abv.bg', rawPassword).then((newUser) => {
        expect(newUser.password).not.to.be.equal(rawPassword)
        done()
      })
    })

  it('when a user is registered, we should be able to figure out his hashed password using his salt',
    function (done) {
      let rawPassword = 'password'
      registerUser('Stanislav Kozlovski', 'stanislav@abv.bg', rawPassword).then((newUser) => {
        // see if the salt exists
        expect(newUser.salt).not.to.be.undefined
        expect(newUser.salt).not.to.be.empty
        // manually hash the password
        let hashedPassword = encryption.hashPassword(rawPassword, newUser.salt)
        expect(hashedPassword).to.be.equal(newUser.password)
        // use the User's authenticate function
        expect(newUser.authenticate(rawPassword))
        done()
      })
    })

  it("Users' unique integer userId should be automatically incremented on each new user",
    function (done) {
      // register two new users and assure that the second one's ID is bigger than the first user's
      registerUser('First Guy', 'FirstGuy@abv.bg', 'first').then(firstUser => {
        registerUser('Second Guy', 'SecondGuy@abv.bg', 'second').then(secondUser => {
          expect(firstUser.userId).not.to.be.NaN
          expect(secondUser.userId).not.to.be.NaN
          expect(firstUser.userId).not.to.be.equal(secondUser.userId)
          expect(secondUser.userId).to.be.greaterThan(firstUser.userId)
          done()
        })
      })
    })
  // close connection to the DB after the test
  afterEach(function (done) {
    User.remove({}).then(() => {
      mongoose.connection.close(() => { done() })
    })
  })
})

