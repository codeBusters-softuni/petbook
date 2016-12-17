const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const Album = mongoose.model('Album')
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
  let newsfeedAlbumName = null
  beforeEach(function (done) {
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        newsfeedAlbumName = 'newsfeed-photos-' + user.id
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

  it('multiple posts, should be saved in the DB', function (done) {
    let postContent = 'These posts are a test :@'
    requestMock.body = { publicPost: publicPost, content: postContent }
    postController.addPost(requestMock, responseMock)
    postController.addPost(requestMock, responseMock)
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      // assert that the posts are there and that they have the same content
      Post.find({ content: postContent }).then(posts => {
        expect(posts).to.be.a('array')
        expect(posts.length).to.be.equal(3)
        expect(posts[0].content).to.be.equal(posts[1].content)
        expect(posts[0].content).to.be.equal(posts[2].content)
        done()
      })
    }, 50)
  })

  it('normal post, newsfeed album should be created', function (done) {
    requestMock.body = { publicPost: 'tetste', content: 'teststes' }
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      // assert that the album is created
      Album.findOne({}).then(album => {
        expect(album).to.not.be.null
        expect(album.author.toString()).to.be.equal(reqUser.id)
        expect(album.name).to.be.equal(newsfeedAlbumName)
        done()
      })
    }, 50)
  })

  it('multiple posts, there should be only one newsfeed album', function (done) {
    // we hold only one newsfeed album for each user
    requestMock.body = { publicPost: 'SOMETING', content: 'teats' }
    // Add the posts with some slight delay, otherwise multiple albums get created due to the asynchrocity
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      postController.addPost(requestMock, responseMock)
      setTimeout(function () {
        postController.addPost(requestMock, responseMock)
        setTimeout(function () {
          Album.find({}).then(albums => {
            expect(albums).to.be.a('array')
            expect(albums.length).to.be.equal(1)
            let album = albums[0]
            expect(album).to.not.be.null
            expect(album.author.toString()).to.be.equal(reqUser.id)
            expect(album.name).to.be.equal(newsfeedAlbumName)
            done()
          })
        }, 50)
      }, 5)
    }, 5)
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
        Album.remove({}).then(() => {
          done()
        })
      })
    })
  })
})