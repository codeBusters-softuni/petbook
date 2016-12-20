const expect = require('chai').expect
const config = require('../../config/config')['test']
require('../../config/database')(config)  // load the DB models
const mongoose = require('mongoose')

const User = mongoose.model('User')
const Photo = mongoose.model('Photo')
const Album = mongoose.model('Album')
const Post = mongoose.model('Post')
const Like = mongoose.model('Like')

const photoController = require('../../controllers/photo-controller')

describe('uploadProfilePhoto function', function () {
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
  const unsupportedImageTypeErrorMsg = 'Supported image types are PNG, JPG and JPEG!'
  const expectedAlbumDisplayName = 'Profile Photos'
  const expectedPostContent = 'I updated my profile picture!'
  const expectedErrorRedirectUrl = 'lalala'
  let expectedSuccessfulRedirectURL = null
  let expectedAlbumName = null
  let originalSamplePhotoName

  beforeEach(function (done) {
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
    originalSamplePhotoName = 'testpic.jpg'
    requestMock = {
      body: {},
      user: {},
      file: samplePhoto,
      headers: {},
      session: {}
    }
    responseMock = {
      locals: { returnUrl: expectedErrorRedirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }

    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        expectedSuccessfulRedirectURL = `/user/${user.userId}`
        reqUser = user
        expectedAlbumName = 'Profile Photos' + user.id
        requestMock.user = reqUser
        done()
      })
    })
  })

  it('Normal post, should update profile picture and create album', function (done) {
    photoController.uploadProfilePhoto(requestMock, responseMock)
    setTimeout(function () {
      expect(responseMock.redirectUrl).to.be.equal(expectedSuccessfulRedirectURL)

      User.findOne({ fullName: username }).populate('profilePic').then(user => {
        expect(user.profilePic).to.not.be.undefined
        expect(user.profilePic.originalname).to.be.equal(originalSamplePhotoName)
        expect(user.profilePic.public).to.be.true  // all profile pictures should be public
        let profilePicAlbumId = user.profilePic.album
        Album.findById(profilePicAlbumId).then(album => {
          expect(album.author.toString()).to.be.equal(user.id)
          expect(album.displayName).to.be.equal(expectedAlbumDisplayName)
          expect(album.name).to.be.equal(expectedAlbumName)
          expect(album.public).to.be.true  // all profile pictures should be public
          // Assert that the post has been made
          Post.findOne({}).then(profilePost => {
            expect(profilePost).to.not.be.null
            expect(profilePost.author.toString()).to.be.equal(user.id)
            expect(profilePost.public).to.be.true
            expect(profilePost.photos.length).to.be.equal(1)
            expect(profilePost.photos[0].toString()).to.be.equal(user.profilePic.id)
            expect(profilePost.content).to.be.equal(expectedPostContent)
            done()
          })
        })
      })
    }, 150)
  })

  it('Consecutive valid posts, should update profile picture but have only one album', function (done) {
    let samplePhoto2Name = 'samplephoto2.jpg'
    let samplePhoto2 = {
      fieldname: 'addPhotoToPost',
      originalname: samplePhoto2Name,
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'somewhere',
      size: 2000
    }
    let samplePhoto3Name = 'Carlos.jpg'
    let samplePhoto3 = {
      fieldname: 'addPhotoToPost',
      originalname: samplePhoto3Name,
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'Somewhere',
      filename: 'somefile',
      path: 'somewhere',
      size: 2000
    }
    // first request with the sample photo
    photoController.uploadProfilePhoto(requestMock, responseMock)

    setTimeout(function () {
      User.findOne({ fullName: username }).populate('profilePic').then(user => {
        expect(user.profilePic).to.not.be.undefined
        expect(user.profilePic.originalname).to.be.equal(originalSamplePhotoName)

        requestMock.file = samplePhoto2
        photoController.uploadProfilePhoto(requestMock, responseMock)

        setTimeout(function () {
          User.findOne({ fullName: username }).populate('profilePic').then(user => {
            expect(user.profilePic).to.not.be.undefined
            expect(user.profilePic.originalname).to.be.equal(samplePhoto2Name)
            requestMock.file = samplePhoto3
            photoController.uploadProfilePhoto(requestMock, responseMock)

            setTimeout(function () {
              User.findOne({ fullName: username }).populate('profilePic').then(user => {
                expect(user.profilePic).to.not.be.undefined
                expect(user.profilePic.originalname).to.be.equal(samplePhoto3Name)
                Album.findOne({}).then(profileAlbum => {
                  expect(profileAlbum).to.not.be.null
                  expect(profileAlbum.displayName).to.be.equals(expectedAlbumDisplayName)
                  expect(profileAlbum.photos).to.not.be.undefined
                  expect(profileAlbum.photos).to.be.a('array')
                  expect(profileAlbum.photos.length).to.be.equal(3)
                  done()
                })
              })
            }, 100)
          })
        }, 100)
      })
    }, 100)
  })

  it('Invalid file upload, should and give out an error message', function (done) {
    requestMock.file.mimetype = 'image/gif'
    photoController.uploadProfilePhoto(requestMock, responseMock)

    setTimeout(function () {
      expect(responseMock.redirectUrl).to.be.equal(expectedErrorRedirectUrl)
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(unsupportedImageTypeErrorMsg)

      // Assure no profile pic has been updated
      User.findOne({}).then(user => {
        expect(user.profilePic).to.be.undefined
        done()
      })
    }, 90)
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
