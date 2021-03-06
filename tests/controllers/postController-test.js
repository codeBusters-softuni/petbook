const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Post = mongoose.model('Post')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Like = mongoose.model('Like')
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
  const unsupportedImageTypeErrorMsg = 'Supported image types are PNG, JPG and JPEG!'
  let newsfeedAlbumName = null
  let newsfeedAlbumDisplayName = null

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
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
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
        newsfeedAlbumName = 'Newsfeed Photos' + user.id
        newsfeedAlbumDisplayName = 'Newsfeed Photos'
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
    }, 80)
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
        expect(album.displayName).to.be.equal(newsfeedAlbumDisplayName)
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
            expect(album.displayName).to.be.equal(newsfeedAlbumDisplayName)
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
            expect(album.displayName).to.be.equal(newsfeedAlbumDisplayName)
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
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(unsupportedImageTypeErrorMsg)
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

  it('post with invalid photo, should redirect to the last URL', function (done) {
    // we only accept jpg, jpeg and png mimetypes
    requestMock.body = {
      publicPost: publicPost,
      content: 'Me, Myself and all my millions'
    }
    responseMock.locals.returnUrl = '/new/bugatti/'
    let invalidPhoto = samplePhoto
    invalidPhoto.mimetype = 'file/zip'
    requestMock.files = [invalidPhoto]
    postController.addPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(unsupportedImageTypeErrorMsg)
      // should have redirected to our returnUrl
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.not.be.undefined
      expect(responseMock.redirectUrl).to.be.equal(responseMock.locals.returnUrl)
      done()
    }, 60)
  })

  it('post without content, should not be created', function (done) {
    requestMock.body = {
      publicPost: publicPost
    }

    postController.addPost(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(shortContentErrorMsg)
      expect(responseMock.redirected).to.be.true

      Post.findOne({}).then(post => {
        // the post should not be created
        expect(post).to.be.null
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
    }, 50)
  })

  it('post without the publicPost variable, should be set to public', function (done) {
    requestMock.body = { content: 'smoking down!' }

    postController.addPost(requestMock, responseMock)

    setTimeout(function () {
      Post.findOne({}).then(post => {
        expect(post.public).to.not.be.undefined
        expect(post.public).to.be.true
        done()
      })
    }, 40)
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
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        requestMock.user = reqUser
        Post.create({ content: 'Sample Post', public: true, author: reqUser._id, category: reqUser.category.id })
          .then(newPost => {
            requestMock.params.id = newPost.id  // the addComment function reads from req.params.id
            done()
          })
      })
    })
  })

  it('add comment, should be saved in DB', function (done) {
    let commentContent = 'never going to jail'
    responseMock.locals.returnUrl = 'ReturnUrl!'
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

          // assert that we were redirected to the right URL
          expect(responseMock.redirectUrl).to.be.equal(responseMock.locals.returnUrl)
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
    requestMock.body = { content: 'b' }
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

  it('comment without content, should not save anything', function (done) {
    requestMock.body = {}
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

  it('comment with an invalid postId in the URL', function (done) {
    requestMock.body = { content: 'Remy Boyz' }
    requestMock.params.id = 'GrindingHard'  // change the postId that supposedly comes from the url

    postController.addComment(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPostIdErrorMessage)
      expect(responseMock.redirected).to.be.true
      done()
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


describe('addLike function', function () {
  const likeTypePaw = 'Paw'
  const likeTypeLove = 'Love'
  const likeTypeDislike = 'Dislike'
  const returnUrl = 'returnurl :)'

  let username = 'dogLike'
  let email = 'dogLike@abv.bg'
  let owner = 'FettyCashmyName'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let invalidPostIdErrorMessage = 'No such post exists.'

  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      params: [],
      files: [],
      headers: {},
      session: {}
    }
    responseMock = {
      locals: { returnUrl: returnUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        requestMock.user = reqUser
        Post.create({ content: 'Sample Post', public: true, author: reqUser._id, category: reqUser.category.id })
          .then(newPost => {
            requestMock.params.push(newPost.id)
            requestMock.params.push('Paw')
            done()
          })
      })
    })
  })

  it('Add a paw to the post, should be saved', function (done) {
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      Post.findOne({}).then(post => {
        Like.findOne({}).then(like => {
          expect(post.likes).to.not.be.undefined
          expect(post.likes).to.be.a('array')
          expect(post.likes.length).to.be.equal(1)
          // assure that the like has been saved in the DB
          let postLike = post.likes[0]
          expect(postLike.toString()).to.be.equal(like.id)
          expect(like.author.toString()).to.be.equal(reqUser.id)
          expect(like.type).to.be.equal(likeTypePaw)
          expect(responseMock.redirected).to.be.true
          expect(responseMock.redirectUrl).to.be.equal(returnUrl)
          done()
        })
      })
    }, 40)
  })

  it('Add a love to the post, should be saved', function (done) {
    requestMock.params[1] = likeTypeLove
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      Post.findOne({}).then(post => {
        Like.findOne({}).then(like => {
          expect(post.likes).to.not.be.undefined
          expect(post.likes).to.be.a('array')
          expect(post.likes.length).to.be.equal(1)
          // assure that the like has been saved in the DB
          let postLike = post.likes[0]
          expect(postLike.toString()).to.be.equal(like.id)
          expect(like.author.toString()).to.be.equal(reqUser.id)
          expect(like.type).to.be.equal(likeTypeLove)
          expect(responseMock.redirected).to.be.true
          expect(responseMock.redirectUrl).to.be.equal(returnUrl)
          done()
        })
      })
    }, 40)
  })

  it('Add a dislike to the post, should be saved', function (done) {
    requestMock.params[1] = likeTypeDislike
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      Post.findOne({}).then(post => {
        Like.findOne({}).then(like => {
          expect(post.likes).to.not.be.undefined
          expect(post.likes).to.be.a('array')
          expect(post.likes.length).to.be.equal(1)
          // assure that the like has been saved in the DB
          let postLike = post.likes[0]
          expect(postLike.toString()).to.be.equal(like.id)
          expect(like.author.toString()).to.be.equal(reqUser.id)
          expect(like.type).to.be.equal(likeTypeDislike)
          expect(responseMock.redirected).to.be.true
          expect(responseMock.redirectUrl).to.be.equal(returnUrl)
          done()
        })
      })
    }, 40)
  })

  it('Add a dislike to a post you have pawed, should overwrite itself', function (done) {
    // add the like first
    requestMock.params[1] = likeTypePaw
    postController.addLike(requestMock, responseMock)
    setTimeout(function () {
      // add the dislike
      requestMock.params[1] = likeTypeDislike
      postController.addLike(requestMock, responseMock)

      setTimeout(function () {
        expect(responseMock.redirected).to.be.true
        expect(responseMock.redirectUrl).to.be.equal(returnUrl)

        Post.findOne({}).then(post => {
          Like.findOne({}).then(like => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes).to.be.a('array')
            expect(post.likes.length).to.be.equal(1)  // there should be only one like
            // assure that the like has been saved in the DB
            let postLike = post.likes[0]
            expect(postLike.toString()).to.be.equal(like.id)
            expect(like.author.toString()).to.be.equal(reqUser.id)
            expect(like.type).to.be.equal(likeTypeDislike)

            // Assert that the previous like was deleted from the DB
            Like.find({}).then(allLikes => {
              expect(allLikes.length).to.be.equal(1)  // we should have only one like in the DB - the newest dislike
              done()
            })
          })
        })
      }, 40)
    }, 40)
  })

  it('Add a paw to a post you have loved, should overwrite itself', function (done) {
    // add the like first
    requestMock.params[1] = likeTypeLove
    postController.addLike(requestMock, responseMock)
    setTimeout(function () {
      // add the dislike
      requestMock.params[1] = likeTypePaw
      postController.addLike(requestMock, responseMock)

      setTimeout(function () {
        expect(responseMock.redirected).to.be.true
        expect(responseMock.redirectUrl).to.be.equal(returnUrl)

        Post.findOne({}).then(post => {
          Like.findOne({}).then(like => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes).to.be.a('array')
            expect(post.likes.length).to.be.equal(1)  // there should be only one like
            // assure that the like has been saved in the DB
            let postLike = post.likes[0]
            expect(postLike.toString()).to.be.equal(like.id)
            expect(like.author.toString()).to.be.equal(reqUser.id)
            expect(like.type).to.be.equal(likeTypePaw)

            // Assert that the previous like was deleted from the DB
            Like.find({}).then(allLikes => {
              expect(allLikes.length).to.be.equal(1)  // we should have only one like in the DB - the newest paw
              done()
            })
          })
        })
      }, 40)
    }, 40)
  })

  it('Add a love to a post you have disliked, should overwrite itself', function (done) {
    // add the like first
    requestMock.params[1] = likeTypeDislike
    postController.addLike(requestMock, responseMock)
    setTimeout(function () {
      // add the dislike
      requestMock.params[1] = likeTypeLove
      postController.addLike(requestMock, responseMock)

      setTimeout(function () {
        expect(responseMock.redirected).to.be.true
        expect(responseMock.redirectUrl).to.be.equal(returnUrl)

        Post.findOne({}).then(post => {
          Like.findOne({}).then(like => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes).to.be.a('array')
            expect(post.likes.length).to.be.equal(1)  // there should be only one like
            // assure that the like has been saved in the DB
            let postLike = post.likes[0]
            expect(postLike.toString()).to.be.equal(like.id)
            expect(like.author.toString()).to.be.equal(reqUser.id)
            expect(like.type).to.be.equal(likeTypeLove)

            // Assert that the previous like was deleted from the DB
            Like.find({}).then(allLikes => {
              expect(allLikes.length).to.be.equal(1)  // we should have only one like in the DB - the newest love
              done()
            })
          })
        })
      }, 40)
    }, 40)
  })

  it('Add a paw -> love -> dislike -> paw, should be one paw only', function (done) {
    requestMock.params[1] = likeTypePaw
    postController.addLike(requestMock, responseMock)
    setTimeout(function () {
      requestMock.params[1] = likeTypeLove
      postController.addLike(requestMock, responseMock)

      setTimeout(function () {
        requestMock.params[1] = likeTypeDislike
        postController.addLike(requestMock, responseMock)

        setTimeout(function () {
          requestMock.params[1] = likeTypePaw
          postController.addLike(requestMock, responseMock)

          setTimeout(function () {
            expect(responseMock.redirected).to.be.true
            expect(responseMock.redirectUrl).to.be.equal(returnUrl)

            Post.findOne({}).then(post => {
              Like.findOne({}).then(like => {
                expect(post.likes).to.not.be.undefined
                expect(post.likes).to.be.a('array')
                expect(post.likes.length).to.be.equal(1)  // there should be only one like
                // assure that the like has been saved in the DB
                let postLike = post.likes[0]
                expect(postLike.toString()).to.be.equal(like.id)
                expect(like.author.toString()).to.be.equal(reqUser.id)
                expect(like.type).to.be.equal(likeTypePaw)

                // Assert that the previous like was deleted from the DB
                Like.find({}).then(allLikes => {
                  expect(allLikes.length).to.be.equal(1)  // we should have only one like in the DB - the newest paw
                  done()
                })
              })
            })
          }, 40)
        }, 40)
      }, 40)
    }, 40)
  })

  it('Add a paw and then add a paw again, nothing should happen on the second paw', function (done) {
    requestMock.params[1] = likeTypePaw
    postController.addLike(requestMock, responseMock)
    setTimeout(function () {
      postController.addLike(requestMock, responseMock)
      setTimeout(function () {
        Post.findOne({}).then(post => {
          Like.findOne({}).then(like => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes).to.be.a('array')
            expect(post.likes.length).to.be.equal(1)
            // assure that the like has been saved in the DB
            let postLike = post.likes[0]
            expect(postLike.toString()).to.be.equal(like.id)
            expect(like.author.toString()).to.be.equal(reqUser.id)
            expect(like.type).to.be.equal(likeTypePaw)
            expect(responseMock.redirected).to.be.true
            expect(responseMock.redirectUrl).to.be.equal(returnUrl)
            done()
          })
        })
      }, 40)
    }, 40)
  })

  it('Two users add a paw, should be two paws', function (done) {
    // create the other user
    User.register('Cat@abv.bg', 'Maaan', 'SomeOwner', 'catpass123', 'Cat').then(catUser => {
      // add the like with the default dog user
      postController.addLike(requestMock, responseMock)
      setTimeout(function () {
        // add the like with the cat user
        requestMock.user = catUser
        postController.addLike(requestMock, responseMock)

        setTimeout(function () {
          Post.findOne({}).populate('likes').then(post => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes).to.be.a('array')
            expect(post.likes.length).to.be.equal(2)  // there should be only one like
            // assure that the like has been saved in the DB
            post.likes.forEach(like => {
              expect(like.type).to.be.equal(likeTypePaw)
            })
            // Assert that the previous like was deleted from the DB
            Like.find({}).then(allLikes => {
              expect(allLikes.length).to.be.equal(2)  // we should have only two likes in the DB
              done()
            })
          })
        }, 40)
      }, 40)
    })
  })

  it('Two users add a paw, one adds a dislike, should be one paw and one dislike', function (done) {
    // create the other user
    User.register('Cat@abv.bg', 'Maaan', 'SomeOwner', 'catpass123', 'Cat').then(catUser => {
      // add the like with the default dog user
      postController.addLike(requestMock, responseMock)
      setTimeout(function () {
        // add the like with the cat user
        requestMock.user = catUser
        postController.addLike(requestMock, responseMock)

        setTimeout(function () {
          requestMock.params[1] = likeTypeDislike
          postController.addLike(requestMock, responseMock)

          setTimeout(function () {
            Post.findOne({}).populate('likes').then(post => {
              expect(post.likes.length).to.be.equal(2)
              let firstLike = post.likes[0]
              let secondLike = post.likes[1]
              // they should be different types
              expect(firstLike.type).to.not.be.equal(secondLike.type)
              expect(firstLike.author.toString()).to.not.be.equal(secondLike.author.toString())
            })
            done()
          }, 40)
        }, 40)
      }, 40)
    })
  })

  it('Add an invalid like type, should not be saved', function (done) {
    let invalidLikeType = 'Laugh'
    requestMock.params[1] = invalidLikeType
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(`${invalidLikeType} is not a valid type of like!`)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        // No like should have been created
        expect(like).to.be.null
        done()
      })
    }, 40)
  })

  it('Add an like with an invalid postid, should redirect without saving anything', function (done) {
    requestMock.params[0] = 'grindin'
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal('Invalid post id!')
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        // No like should have been created
        expect(like).to.be.null
        done()
      })
    }, 40)
  })

  it('Add a like with a postId that does not exist, should redirect', function (done) {
    requestMock.params[0] = '4edd40c86762e0fb12000003'
    postController.addLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPostIdErrorMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        // No like should have been created
        expect(like).to.be.null
        done()
      })
    }, 40)
  })
})

// delete all the created models
afterEach(function (done) {
  Post.remove({}).then(() => {
    User.remove({}).then(() => {
      Album.remove({}).then(() => {
        Photo.remove({}).then(() => {
          Comment_.remove({}).then(() => {
            Like.remove({}).then(() => {
              done()
            })
          })
        })
      })
    })
  })
})

describe('removeLike function', function () {
  /* Have a post in the DB with a like on it */
  const likeTypePaw = 'Paw'
  const likeTypeLove = 'Love'
  const likeTypeDislike = 'Dislike'
  const returnUrl = 'returnurl :)'

  let username = 'dogLike'
  let email = 'dogLike@abv.bg'
  let owner = 'FettyCashmyName'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let invalidPostIdErrorMessage = 'No such post exists.'
  let haveNotLikedPostErrorMessage = "You can't unlike something you haven't liked at all!"

  beforeEach(function (done) {
    requestMock = {
      body: {},
      user: {},
      params: [],
      files: [],
      headers: {},
      session: {}
    }
    responseMock = {
      locals: { returnUrl: returnUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }
    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        reqUser = user
        requestMock.user = reqUser
        Post.create({ content: 'Sample Post', public: true, author: reqUser._id, category: reqUser.category.id })
          .then(newPost => {
            Like.create({ author: reqUser.id, type: 'Paw' }).then(like => {
              newPost.addLike(like.id).then(() => {
                requestMock.params.push(newPost.id)
                requestMock.params.push('Paw')
                done()
              })
            })
          })
      })
    })
  })

  it('Remove a paw from a post with a paw like', function (done) {
    postController.removeLike(requestMock, responseMock)

    setTimeout(function () {
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        // like should be deleted
        expect(like).to.be.null
        Post.findOne({}).then(post => {
          expect(post.likes).to.not.be.undefined
          expect(post.likes.length).to.be.equal(0)
          done()
        })
      })
    }, 40)
  })

  it('Try to remove a paw from a post which has a paw but not from the same user, should redirect only', function (done) {
    User.register('TestUser', 'TestMan@abv.bg', 'OwnerMan', 'dogpass123', userCategory).then(maliciousUser => {
      requestMock.user = maliciousUser  // change the user in the request
      postController.removeLike(requestMock, responseMock)
      setTimeout(function () {
        expect(requestMock.session.errorMsg).to.not.be.undefined
        expect(requestMock.session.errorMsg).to.be.equal(haveNotLikedPostErrorMessage)
        expect(responseMock.redirected).to.be.true
        expect(responseMock.redirectUrl).to.be.equal(returnUrl)
        Like.findOne({}).then(like => {
          // like should be there
          expect(like).to.not.be.null
          expect(like.author.toString()).to.be.equal(reqUser.id)
          Post.findOne({}).then(post => {
            expect(post.likes).to.not.be.undefined
            expect(post.likes.length).to.be.equal(1)
            expect(post.likes[0].toString()).to.be.equal(like.id)
            done()
          })
        })
      }, 40)
    })
  })

  it('Try to remove a love from a post with a paw like, should redirect only', function (done) {
    requestMock.params[1] = likeTypeLove
    postController.removeLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal("You can't unLove this post because your like is a Paw!")
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        // paw like should be there
        expect(like).to.not.be.null
        expect(like.type).to.be.equal(likeTypePaw)
        Post.findOne({}).then(post => {
          expect(post.likes).to.not.be.undefined
          expect(post.likes.length).to.be.equal(1)
          expect(post.likes[0].toString()).to.be.equal(like.id)
          done()
        })
      })
    }, 40)
  })

  it('Try to remove an invalid like type, should redirect', function (done) {
    let invalidLikeType = 'Laughed'
    requestMock.params[1] = invalidLikeType
    postController.removeLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(`${invalidLikeType} is not a valid type of like!`)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        expect(like).to.not.be.null
        Post.findOne({}).then(post => {
          expect(post.likes.length).to.be.equal(1)
          expect(post.likes[0].toString()).to.be.equal(like.id)
          expect(like.type).to.be.equal(likeTypePaw)
          done()
        })
      })
    }, 40)
  })

  it('Try to remove a like from an invalid post id, should redirect', function (done) {
    requestMock.params[0] = 'grindin'
    postController.removeLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal('Invalid post id!')
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        expect(like).to.not.be.null
        Post.findOne({}).then(post => {
          expect(post.likes.length).to.be.equal(1)
          expect(post.likes[0].toString()).to.be.equal(like.id)
          expect(like.type).to.be.equal(likeTypePaw)
          done()
        })
      })
    }, 40)
  })

  it('Try to remove a like from a post id that does not exist, should recirect', function (done) {
    requestMock.params[0] = '4edd40c86762e0fb12000003'
    postController.removeLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(invalidPostIdErrorMessage)
      expect(responseMock.redirected).to.be.true
      expect(responseMock.redirectUrl).to.be.equal(returnUrl)

      Like.findOne({}).then(like => {
        expect(like).to.not.be.null
        Post.findOne({}).then(post => {
          expect(post.likes.length).to.be.equal(1)
          expect(post.likes[0].toString()).to.be.equal(like.id)
          expect(like.type).to.be.equal(likeTypePaw)
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
              Like.remove({}).then(() => {
                done()
              })
            })
          })
        })
      })
    })
  })
})
