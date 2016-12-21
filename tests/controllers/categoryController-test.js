const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models

const mongoose = require('mongoose')
const Post = mongoose.model('Post')
const Category = mongoose.model('Category')
const User = mongoose.model('User')
const categories = require('../../config/constants').categories

const categoryController = require('../../controllers/category-controller')

describe('showPosts function', function () {
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
  let receivedSelectedPage = null

  beforeEach(function (done) {
    // Nullify all the received values
    receivedHbsPage = null
    renderedUser = null
    receivedFriendStatus = null
    receivedPosts = null
    receivedCategories = null
    receivedPages = null
    receivedSelectedPage = null
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
        receivedSelectedPage = argumentsPassed.selectedPage
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
    categoryController.showPosts(requestMock, responseMock)

    setTimeout(function () {
      expect(receivedPosts).to.be.deep.equal([])
      expect(receivedPages).to.be.deep.equal([])
      expect(receivedHbsPage).to.be.equal(expectedHbsPage)
      expect(receivedHbsPage).to.be.equal(expectedHbsPage)
      done()
    }, 40)
  })

  it('Dog user loads categories of Cats, cats have only public posts, should see all of them', function (done) {
    Post.find({}).then(posts => {
      let postPromsies = posts.map(post => {
        return new Promise((resolve, reject) => {
          post.public = true
          post.save().then(() => {
            resolve(post)
          })
        })
      })

      Promise.all(postPromsies).then(posts => {
        requestMock.params.category = 'cat'
        categoryController.showPosts(requestMock, responseMock)

        setTimeout(function () {
          expect(receivedPosts.length).to.be.equal(posts.length)
          expect(receivedPages).to.be.deep.equal([1])
          receivedPosts.forEach(post => {
            expect(post.category.toString()).to.be.equal(secondUser.category.toString())
            // Check if the post is initialized for the view (has his likes shown)
            expect(post.paws).to.not.be.undefined
            expect(post.loves).to.not.be.undefined
            expect(post.dislikes).to.not.be.undefined
          })
          expect(receivedHbsPage).to.be.equal(expectedHbsPage)
          done()
        }, 40)
      })
    })
  })

  it('Dog user loads categories of category with uPpErCasE characters, should see all of them', function (done) {
    // convert the cat posts to public
    Post.find({}).then(posts => {
      let postPromsies = posts.map(post => {
        return new Promise((resolve, reject) => {
          post.public = true
          post.save().then(() => {
            resolve(post)
          })
        })
      })

      Promise.all(postPromsies).then(posts => {
        requestMock.params.category = 'cAT'
        categoryController.showPosts(requestMock, responseMock)

        setTimeout(function () {
          expect(receivedPosts.length).to.be.equal(posts.length)
          expect(receivedPages).to.be.deep.equal([1])
          receivedPosts.forEach(post => {
            expect(post.category.toString()).to.be.equal(secondUser.category.toString())
            // Check if the post is initialized for the view (has his likes shown)
            expect(post.paws).to.not.be.undefined
            expect(post.loves).to.not.be.undefined
            expect(post.dislikes).to.not.be.undefined
          })
          expect(receivedHbsPage).to.be.equal(expectedHbsPage)
          done()
        }, 40)
      })
    })
  })


  it('Dog user loads categories of Cats, cats have only private posts but the Dog is friends with the authors, should see all of them', function (done) {
    // Make the users friends
    secondUser.friends.push(requestMock.user.id)
    secondUser.save().then(() => {
      requestMock.user.friends.push(secondUser.id)
      requestMock.user.save().then(() => {
        requestMock.params.category = 'cat'
        categoryController.showPosts(requestMock, responseMock)

        setTimeout(function () {
          expect(receivedPosts.length).to.be.equal(secondUserPosts.length)
          expect(receivedPages).to.be.deep.equal([1])
          receivedPosts.forEach(post => {
            expect(post.category.toString()).to.be.equal(secondUser.category.toString())
            // Check if the post is initialized for the view (has his likes shown)
            expect(post.paws).to.not.be.undefined
            expect(post.loves).to.not.be.undefined
            expect(post.dislikes).to.not.be.undefined
          })
          expect(receivedHbsPage).to.be.equal(expectedHbsPage)
          done()
        }, 40)
      })
    })
  })

  it('Dog loads categories of Dogs, should see every post', function (done) {
    User.register('Started', 'botom@abv.bg', secondUserOwner, secondUserPassword, 'Dog').then(secUser => {
      // Create 4 posts from the secondUser
      let postPromises = []
      for (let i = 0; i < 4; i++) {
        postPromises.push(new Promise((resolve, reject) => {
          Post.create({ content: i, public: false, author: secUser._id, category: secUser.category })
            .then(newPost => {
              resolve(newPost)
            })
        }))
      }
      postPromises.push(new Promise((resolve, reject) => {
        Post.create({ content: '5', public: true, author: secUser._id, category: secUser.category })
          .then(newPost => {
            resolve(newPost)
          })
      }))

      secUser.save().then(() => {
        Promise.all(postPromises).then((posts) => {
          secondUserPosts = posts

          requestMock.params.category = 'dog'
          categoryController.showPosts(requestMock, responseMock)

          setTimeout(function () {
            expect(receivedPosts.length).to.be.equal(posts.length)
            expect(receivedPages).to.be.deep.equal([1])
            receivedPosts.forEach(post => {
              expect(post.category.toString()).to.be.equal(reqUser.category.id)
              // Check if the post is initialized for the view (has his likes shown)
              expect(post.paws).to.not.be.undefined
              expect(post.loves).to.not.be.undefined
              expect(post.dislikes).to.not.be.undefined
            })
            expect(receivedHbsPage).to.be.equal(expectedHbsPage)
            done()
          }, 40)
        })
      })
    })
  })

  it('Dog loads photos of category Elephant, which has no posts, should not see anything', function (done) {
    requestMock.params.category = 'elephant'
    categoryController.showPosts(requestMock, responseMock)

    setTimeout(function () {
      expect(receivedPosts).to.be.deep.equal([])
      expect(receivedPages).to.be.deep.equal([])
      expect(receivedHbsPage).to.be.equal(expectedHbsPage)
      done()
    }, 40)
  })

  it('Dog loads page 2 of Dog posts, should see some posts', function (done) {
    User.register('Started', 'botom@abv.bg', secondUserOwner, secondUserPassword, 'Dog').then(secUser => {
      // Create 25 posts from the secondUser
      let postPromises = []
      for (let i = 0; i < 24; i++) {
        postPromises.push(new Promise((resolve, reject) => {
          Post.create({ content: i, public: false, author: secUser._id, category: secUser.category })
            .then(newPost => {
              resolve(newPost)
            })
        }))
      }
      postPromises.push(new Promise((resolve, reject) => {
        Post.create({ content: '5', public: true, author: secUser._id, category: secUser.category })
          .then(newPost => {
            resolve(newPost)
          })
      }))
      Promise.all(postPromises).then(posts => {
        requestMock.query.page = '2'
        requestMock.params.category = 'dog'
        categoryController.showPosts(requestMock, responseMock)

        setTimeout(function () {
          expect(receivedPosts.length).to.be.equal(5) // max posts per page are 20, so the second should have 5
          expect(receivedPages).to.be.deep.equal([1, 2])
          expect(receivedSelectedPage).to.be.equal(2)
          expect(receivedHbsPage).to.be.equal(expectedHbsPage)
          receivedPosts.forEach(post => {
            // Check if the post is initialized for the view (has his likes shown)
            expect(post.paws).to.not.be.undefined
            expect(post.loves).to.not.be.undefined
            expect(post.dislikes).to.not.be.undefined
          })
          done()
        }, 40)
      })
    })
  })

  afterEach(function (done) {
    Post.remove({}).then(() => {
      User.remove({}).then(() => {
        done()
      })
    })
  })
})
