const expect = require('chai').expect
const config = require('../../config/config')
const dbConnectionString = config.development.connectionString + '_test'  // new database used for testing only
const mongoose = require('mongoose')
const encryption = require('../../utilities/encryption')

describe('User', function () {
  let User = null
  let registerUser = null  // function that registers a user
  let Category = null
  let dogCategoryName = 'Dog'
  // connect to the DB before and initialize roles
  beforeEach(function (done) {
    mongoose.connect(dbConnectionString).then(() => {
      let rolePromises = require('../../models/Role').initialize()  // create the Admin and User roles in the DB
      let categoryPromises = require('../../models/Category').initialize()  // create the available categories listed in config/constants.js
      // merge the promises
      let promises = rolePromises.concat(categoryPromises)

      User = require('../../models/User')
      Category = mongoose.model('Category')  // will create the Dog category
      registerUser = require('../../models/User').register
      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })

  it('duplicate emails should not be allowed',
    function (done) {
      registerUser('Stanislav Kozlovski', 'email@abv.bg', 'pass', dogCategoryName).then(() => {
        registerUser('Stanislav Kozlovski', 'email@abv.bg', 'pass', dogCategoryName).catch((err) => {
          console.log(err)
          expect(err).not.to.be.undefined
          expect(err).not.to.be.null
          expect(err.message).to.be.equal('User with the email email@abv.bg already exists!')
          done()
        })
      })
    })

  it('invalid categories (animal types) should not be allowed',
    function (done) {
      let invalidCategory = 'OrangutanInvalidCategory'
      registerUser('Stanislav Kozlovski', 'email@abv.bg', 'pass', invalidCategory).catch((err) => {
        expect(err).not.to.be.undefined
        expect(err).not.to.be.null
        expect(err.message).to.be.equal(`No category named ${invalidCategory} exists!`)
        done()
      })
    })

  it('two users with categories Dog should have the same category',
    function (done) {
      registerUser('first dog', 'first_dog@abv.bg', 'pass', dogCategoryName).then((firstDog) => {
        registerUser('second dog', 'second_dog@abv.bg', 'pass', dogCategoryName).then((secondDog) => {
          expect(firstDog.category).not.to.be.undefined
          expect(secondDog.category).not.to.be.undefined
          expect(firstDog.category).to.be.eqls(secondDog.category)
          done()
        })
      })
    })

  it('two users with different categories should not have the same category',
    function (done) {
      registerUser('dog', 'dog@abv.bg', 'dog', dogCategoryName).then(dog => {
        registerUser('cat', 'cat@abv.bg', 'cat', 'Cat').then(cat => {
          expect(dog.category).not.to.be.undefined
          expect(cat.category).not.to.be.undefined
          expect(dog.category).not.to.be.eqls(cat.category)
          done()
        })
      })
    })

  it('when registering a user, the password should be encrypted',
    function (done) {
      let rawPassword = 'password'
      registerUser('Stanislav Kozlovski', 'stanislav@abv.bg', rawPassword, dogCategoryName).then((newUser) => {
        expect(newUser.password).not.to.be.equal(rawPassword)
        done()
      })
    })

  it('when registering a user, he should not be an admin',
    function (done) {
      registerUser('Stanislav Kozlovski', 'SOMEBODY@abv.bg', 'password', dogCategoryName).then((newUser) => {
        newUser.isAdmin().then(isAdmin => {
          expect(isAdmin).to.be.false
          done()
        }).catch((err) => {console.log(err)})
      })
    })

  it('when a user is registered, we should be able to figure out his hashed password using his salt',
    function (done) {
      let rawPassword = 'password'
      registerUser('Stanislav Kozlovski', 'stanislav@abv.bg', rawPassword, dogCategoryName).then((newUser) => {
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
      registerUser('First Guy', 'FirstGuy@abv.bg', 'first', dogCategoryName).then(firstUser => {
        registerUser('Second Guy', 'SecondGuy@abv.bg', 'second', dogCategoryName).then(secondUser => {
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

