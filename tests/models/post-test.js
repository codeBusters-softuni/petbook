const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const postController = require('../../controllers/post-controller')

let requestMock = {
  body: {},
  user: {},
  files: [],
  headers: {},
  session: {}
}
let responseMock = {
  locals: {},
  redirected: false,
  redirect: function () { this.redirected = true }
}


describe('Post', function () {
  let username = 'dog'
  let email = 'dog@abv.bg'
  let owner = 'OwnerMan'
  let userCategory = 'Dog'
  let reqUser = null
  const publicPost = 'publicvisible'
  const nonPublicPost = 'groupvisible'
  const shortContentErrorMsg = "Your post's content is too short! It must be longer than 3 characters."

  beforeEach(function (done) {
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        requestMock.user = reqUser
        done()
      })
    })
  })

  it('normal post, should be saved in the DB', function (done) {
    let postContent = 'This post is a test :@'
    requestMock.body = { publicPost: publicPost, content: postContent }
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      // assert that the post is there and has the correct values
      Post.findOne({ content: postContent }).then(post => {
        expect(post).to.not.be.null
        expect(post.content).to.equal(postContent)
        expect(post.public).to.be.true
        expect(post.author.toString()).to.equal(reqUser.id)
        expect(post.category.toString()).to.equal(reqUser.category.id)
        done()
      })
    }, 50)
  })

  it('non-public post, should not be public', function (done) {
    let postContent = 'I am not public'
    requestMock.body = {
      publicPost: nonPublicPost,
      content: postContent
    }
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      Post.findOne({ content: postContent }).then(post => {
        expect(post.public).to.not.be.null
        expect(post.public).to.be.false
        done()
      })
    }, 50)
  })

  it('short post content, should not be created', function (done) {
    let postContent = 'sh'
    requestMock.body = {
      publicPost: publicPost,
      content: postContent
    }
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      Post.findOne({ content: postContent }).then(post => {
        // the post should not be created
        expect(post).to.be.null
        // our request must have an errorMessage and the failed post attached to it!
        expect(requestMock.session.errorMsg).to.not.be.null
        expect(requestMock.session.errorMsg).to.be.equal(shortContentErrorMsg)
        expect(requestMock.session.failedPost).to.not.be.null
        expect(requestMock.session.failedPost.content).to.be.equal(postContent)
        expect(responseMock.redirected).to.be.true
        done()
      })
    })
  })
  // delete all the created models
  afterEach(function (done) {
    Post.remove({}).then(() => {
      User.remove({}).then(() => {
        done()
      })
    })
  })
})