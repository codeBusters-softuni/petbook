const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Comment_ = mongoose.model('Comment')
const postController = require('../../controllers/post-controller')


describe('addPost function', function () {
  let username = 'dog'
  let email = 'dog@abv.bg'
  let owner = 'OwnerMan'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let samplePhoto = null
  const publicPost = 'publicvisible'
  const nonPublicPost = 'groupvisible'
  const shortContentErrorMsg = "Your post's content is too short! It must be longer than 3 characters."
  let newsfeedAlbumName = null

  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      files: [],
      headers: {},
      session: {}
    }
    responseMock = {
      locals: {},
      redirected: false,
      redirect: function () { this.redirected = true }
    }
    samplePhoto = {
      fieldname: 'addPhotoToPost',
      originalname: 'testpic.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'somewhere',
      size: 2000
    }
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

  it('post with photo, photo should be saved in the DB', function (done) {
    let postContent = 'This post is a test :@'
    requestMock.body = { publicPost: publicPost, content: postContent }
    requestMock.files = [samplePhoto]
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      // assert that the post is there and has the correct values
      Post.findOne({ content: postContent }).then(post => {
        expect(post).to.not.be.null
        // the post should have a photo in his array
        expect(post.photos).to.be.a('array')
        expect(post.photos.length).to.be.equal(1)
        Photo.findById(post.photos[0]).then(photo => {
          expect(photo).to.not.be.null
          expect(photo.author.toString()).to.be.equal(reqUser.id)
          expect(photo.post.toString()).to.be.equal(post.id)
          // the reqUser should have the photo saved in his photos array
          User.findById(reqUser.id).then(user => {
            expect(user.photos).to.not.be.null
            expect(user.photos).to.be.a('array')
            expect(user.photos.length).to.be.equal(1)
            done()
          })
        })
      })
    }, 100)
  })

  it('post with multiple photos, photos should be saved in the DB', function (done) {
    let postContent = 'This post is a test :@'
    requestMock.body = { publicPost: publicPost, content: postContent }
    requestMock.files = [samplePhoto, samplePhoto, samplePhoto, samplePhoto]
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      Post.findOne({ content: postContent }).then(post => {
        expect(post.photos).to.not.be.null
        expect(post.photos).to.be.a('array')
        expect(post.photos.length).to.be.equal(4)
        Album.findOne({}).then(album => {
          // assure that the album has all 4 photos
          expect(album.photos.length).to.be.equal(4)
          let photoPromises = post.photos.map(photo => {
            return new Promise((resolve, reject) => {
              Photo.findById(photo).then(photo => {
                expect(photo.album.toString()).to.be.equal(album.id)
                resolve(photo.id)
              })
            })
          })
          Promise.all(photoPromises).then(photosInDB => {
            // assure that all 4 photos are in the DB
            // convert the array of id objects to an array of strings for easy compare
            let stringifiedAlbumPhotos = album.photos.map(photo => { return photo.toString() })
            expect(photosInDB).to.include.members(stringifiedAlbumPhotos)
            expect(photosInDB.length).to.be.equal(4)
            done()
          })
        })
      })
    }, 120)
  })

  it('post with two photos and descriptions, photos should have the correct desc', function (done) {
    // create two photo objects with different paths and differentiate them by that
    let samplePhoto1 = {
      fieldname: 'addPhotoToPost',
      originalname: 'testpic.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'first',
      size: 2000
    }
    let samplePhoto2 = {
      fieldname: 'addPhotoToPost',
      originalname: 'testpic.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'second',
      size: 2000
    }
    let firstPhotoDesc = 'first photo desc'
    let secondPhotoDesc = 'second photo desc'
    requestMock.body = { publicPost: publicPost, content: 'fresh to them', '1': firstPhotoDesc, '2': secondPhotoDesc }
    requestMock.files = [samplePhoto1, samplePhoto2]

    postController.addPost(requestMock, responseMock)

    setTimeout(function () {
      // get the first photo
      Photo.findOne({ path: 'first' }).then(firstPhoto => {
        Photo.findOne({ path: 'second' }).then(secondPhoto => {
          expect(firstPhoto).to.not.be.null
          expect(secondPhoto).to.not.be.null
          expect(firstPhoto.description).to.not.be.undefined
          expect(secondPhoto.description).to.not.be.undefined
          expect(firstPhoto.description).to.be.equal(firstPhotoDesc)
          expect(secondPhoto.description).to.be.equal(secondPhotoDesc)
          done()
        })
      })
    }, 60)
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
    }, 160)
  })

  it('normal post WITHOUT photo, newsfeed album should be created', function (done) {
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

  it('normal post with photo, newsfeed album should be correct', function (done) {
    requestMock.body = { publicPost: 'tetste', content: 'teststes' }
    requestMock.files = [samplePhoto]
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      // assert that the album is created
      Post.findOne({}).then(post => {
        let photoId = post.photos[0]
        Photo.findById(photoId).then(photo => {
          Album.findOne({}).then(album => {
            expect(album).to.not.be.null
            expect(album.author.toString()).to.be.equal(reqUser.id)
            expect(album.name).to.be.equal(newsfeedAlbumName)
            expect(album.photos).to.be.a('array')
            expect(album.photos).to.not.be.null
            expect(album.photos.length).to.be.equal(1)
            expect(photo.album.toString()).to.be.equal(album.id)
            done()
          })
        })
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

  it('non-public post with photo, post and photo should not be public', function (done) {
    let postContent = 'I am not public'
    requestMock.body = {
      publicPost: nonPublicPost,
      content: postContent
    }
    requestMock.files = [samplePhoto]
    postController.addPost(requestMock, responseMock)
    setTimeout(function () {
      Post.findOne({ content: postContent }).then(post => {
        Photo.findById(post.photos[0]).then(photo => {
          expect(photo.public).to.be.false
          expect(post.public).to.not.be.null
          expect(post.public).to.be.false
          done()
        })
      })
    }, 80)
  })

  it('short post content, should not be created', function (done) {
    let postContent = 'sh'
    requestMock.body = {
      publicPost: publicPost,
      content: postContent
    }
    requestMock.files = [samplePhoto]

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
        // Assure that a newsfeed album has not been created
        Album.findOne({}).then(album => {
          expect(album).to.be.null
          // Assure that the photo has not been created
          Photo.findOne({}).then(photo => {
            expect(photo).to.be.null
            done()
          })
        })
      })
    })
  })

  it('post with invalid photo, should not be created', function (done) {
    // we only accept jpg, jpeg and png mimetypes
    requestMock.body = {
      publicPost: publicPost,
      content: 'Me, Myself and all my millions'
    }
    let invalidPhoto = samplePhoto
    invalidPhoto.mimetype = 'file/zip'
    requestMock.files = [invalidPhoto]
    postController.addPost(requestMock, responseMock)

    setTimeout(function () {
      expect(responseMock.redirected).to.be.true
      Post.findOne({}).then(post => {
        expect(post).to.be.null
        Photo.findOne({}).then(photo => {
          expect(photo).to.be.null
          Album.findOne({}).then(album => {
            expect(album).to.be.null
            done()
          })
        })
      })
    }, 60)
  })
  // delete all the created models
  afterEach(function (done) {
    Post.remove({}).then(() => {
      User.remove({}).then(() => {
        Album.remove({}).then(() => {
          Photo.remove({}).then(() => {
            done()
          })
        })
      })
    })
  })
})

describe('addComment function', function () {
  let username = 'dog2'
  let email = 'dog2@abv.bg'
  let owner = 'OwnerMan2'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let samplePhoto = null
  let post = null
  let invalidPostIdErrorMessage = 'No such post exists.'
  let shortCommentErrorMessage = 'Your comment is too short! All comments must be longer than 2 characters.'

  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      params: {},
      files: [],
      headers: {},
      session: {}
    }
    responseMock = {
      locals: {},
      redirected: false,
      redirect: function () { this.redirected = true }
    }
    samplePhoto = {
      fieldname: 'addPhotoToPost',
      originalname: 'testpic.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'somewhere',
      size: 2000
    }
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        requestMock.user = reqUser
        Post.create({ content: 'Sample Post', public: true, author: reqUser._id, category: reqUser.category.id })
          .then(newPost => {
            requestMock.params.id = newPost.id  // the addComment function reads from req.params.id
            post = newPost
            done()
          })
      })
    })
  })

  it('add comment, should be saved in DB', function (done) {
    let commentContent = 'never going to jail'
    requestMock.body = { content: commentContent }
    postController.addComment(requestMock, responseMock)

    setTimeout(function () {
      // Assert that the comment has been created
      Comment_.findOne({}).then(createdComment => {
        expect(createdComment).to.not.be.null
        expect(createdComment.content).to.be.equal(commentContent)
        expect(createdComment.author.toString()).to.be.equal(reqUser.id)
        // Assert that the comment is in the post's comments
        Post.findOne({}).then(post => {
          expect(post.comments).to.not.be.undefined
          expect(post.comments).to.be.a('array')
          expect(post.comments.length).to.be.equal(1)
          expect(post.comments[0].toString()).to.be.equal(createdComment.id)
          done()
        })
      })
    }, 50)
  })

  it('multiple comments, should be saved in DB', function (done) {
    let commentContent = 'never going to jail'
    requestMock.body = { content: commentContent }
    postController.addComment(requestMock, responseMock)
    setTimeout(function () {
      postController.addComment(requestMock, responseMock)
      setTimeout(function () {
        postController.addComment(requestMock, responseMock)
        setTimeout(function () {
          // Assert that the comment has been created
          Comment_.find({}).then(createdComments => {
            expect(createdComments).to.not.be.null
            expect(createdComments).to.be.a('array')
            expect(createdComments.length).to.be.equal(3)
            // Assert that the comment is in the post's comments
            Post.findOne({}).then(post => {
              expect(post.comments).to.not.be.undefined
              expect(post.comments).to.be.a('array')
              expect(post.comments.length).to.be.equal(3)
              expect(post.comments[0].toString()).to.be.equal(createdComments[0].id)
              expect(post.comments[1].toString()).to.be.equal(createdComments[1].id)
              expect(post.comments[2].toString()).to.be.equal(createdComments[2].id)
              done()
            })
          })
        }, 50)
      }, 15)
    }, 15)
  })

  it('short comment, should not be saved in DB', function (done) {
    requestMock.body = {content: 'b'}
    postController.addComment(requestMock, responseMock)
    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(shortCommentErrorMessage)
      expect(responseMock.redirected).to.be.true

      // check the DB
      Comment_.findOne({}).then(comment => {
        // there should not be a comment
        expect(comment).to.be.null
        // assert that it hasn't been saved to the post
        Post.findOne({}).then(post => {
          expect(post.comments.length).to.be.equal(0)
          done()
        })
      })
    }, 40)
  })

  // delete all the created models
  afterEach(function (done) {
    Post.remove({}).then(() => {
      User.remove({}).then(() => {
        Album.remove({}).then(() => {
          Photo.remove({}).then(() => {
            Comment_.remove({}).then(() => {
              done()
            })
          })
        })
      })
    })
  })
})
