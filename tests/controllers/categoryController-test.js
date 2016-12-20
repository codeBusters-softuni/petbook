const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models

const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Category = mongoose.model('Category')
const User = mongoose.model('User')
const categories = require('../../config/constants').categories

const categoryController = require('../../controllers/category-controller')

describe('showArticles function', function () {
  /* The function should render a newsfeed-like page, showing all the posts
     from the given category to the user, bearing in mind his relationship to the
     authors and the post's publicity */
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
  const expectedHbsPage = 'home/newsfeed'
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
        // Create 5 posts from the secondUser
        let postPromises = []
        for (let i = 0; i < 5; i++) {
          postPromises.push(new Promise((resolve, reject) => {
            Post.create({ content: i, public: false, author: secUser._id, category: secUser.category })
              .then(newPost => {
                resolve(newPost)
              })
          }))
        }

        firstUser.save().then(() => {
          secUser.save().then(() => {
            User.populate(firstUser, 'category').then(firstUser => {  // the req.user always has a populated category
              reqUser = firstUser
              secondUser = secUser
              requestMock.params.id = secondUser.userId
              requestMock.user = reqUser
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

  it('Dog user loads categories of Cats, cats have only private posts, should not see anything', function (done) {
    requestMock.params.category = 'cat'
    categoryController.showArticles(requestMock, responseMock)

    setTimeout(function () {
      expect(receivedPosts).to.be.deep.equal([])
      expect(receivedPages).to.be.deep.equal([])
      done()
    }, 40)
  })


  afterEach(function (done) {
    Post.remove({}).then(() => {
      User.remove({}).then(() => {
        done()
      })
    })
  })
})
