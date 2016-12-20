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

  it('Normal upload, should update profile picture and create album', function (done) {
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

  it('Consecutive valid uploads, should update profile picture but have only one album', function (done) {
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

describe('deletePhoto function', function () {
  let username = 'dog'
  let email = 'dog@abv.bg'
  let owner = 'OwnerMan'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let samplePhoto = null
  const expectedErrorRedirectUrl = 'lalala'
  let expectedSuccessfulRedirectURL = null
  let originalSamplePhotoName = null
  let samplePhotoId = null

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
    samplePhotoId = null
    originalSamplePhotoName = 'testpic.jpg'
    requestMock = {
      body: {},
      user: {},
      headers: {},
      session: {},
      params: {}
    }
    responseMock = {
      locals: { returnUrl: expectedErrorRedirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }

    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        Album.create({ name: 'bra', author: user.id, public: true }).then(album => {
          Photo.create(Object.assign(samplePhoto, { author: user.id, classCss: 'dd', public: true, album: album.id })).then((photo) => {
            samplePhotoId = photo.id
            reqUser = user
            requestMock.user = reqUser
            done()
          })
        })
      })
    })
  })

  // it('Valid delete request, should remove the photo', function (done) {
  //   requestMock.params.id = samplePhotoId
  //   photoController.deletePhoto(requestMock, responseMock)
  //   setTimeout(function () {
  //     Photo.findOne({}).then(photo => {
  //       expect(photo).to.be.null
  //       done()
  //     })
  //   }, 1350)
  // })

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

describe('addLike function', function () {
  let username = 'dog'
  let email = 'dog@abv.bg'
  let owner = 'OwnerMan'
  let userCategory = 'Dog'
  let reqUser = null
  let requestMock = null
  let responseMock = null
  let samplePhoto = null
  const expectedErrorRedirectUrl = 'lalala'
  const nonExistingPhotoErrorMsg = 'No such photo exists.'
  let expectedSuccessfulRedirectURL = null
  let originalSamplePhotoName = null
  let samplePhotoId = null

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
    samplePhotoId = null

    requestMock = {
      body: {},
      user: {},
      headers: {},
      session: {},
      params: []
    }
    responseMock = {
      locals: { returnUrl: expectedErrorRedirectUrl },
      redirected: false,
      redirectUrl: null,
      redirect: function (redirectUrl) { this.redirected = true; this.redirectUrl = redirectUrl }
    }

    User.register(username, email, owner, 'dogpass123', userCategory).then(dog => {
      User.populate(dog, { path: 'category', model: 'Category' }).then(user => {
        Album.create({ name: 'bra', author: user.id, public: true }).then(album => {
          Photo.create(Object.assign(samplePhoto, { author: user.id, classCss: 'dd', public: true, album: album.id })).then(photo => {
            samplePhotoId = photo.id
            reqUser = user
            requestMock.user = reqUser
            done()
          })
        })
      })
    })
  })

  it('Add like to the photo, should show up', function (done) {
    requestMock.params = [samplePhotoId, 'Paw']
    photoController.addLike(requestMock, responseMock)

    setTimeout(function () {
      Photo.findOne({}).populate('likes').then(photo => {
        expect(photo.likes).to.not.be.undefined
        expect(photo.likes.length).to.be.equal(1)
        let like = photo.likes[0]
        expect(like.author.toString()).to.be.equal(reqUser.id)
        expect(like.type).to.be.equal('Paw')
        done()
      })
    }, 50)
  })

  it('Add two consecutive likes from the same user, should redirect the second time', function (done) {
    requestMock.params = [samplePhotoId, 'Paw']
    photoController.addLike(requestMock, responseMock)
    setTimeout(function () {
      photoController.addLike(requestMock, responseMock)
      setTimeout(function () {
        Photo.findOne({}).populate('likes').then(photo => {
          expect(photo.likes).to.not.be.undefined
          expect(photo.likes.length).to.be.equal(1)
          let like = photo.likes[0]
          expect(like.author.toString()).to.be.equal(reqUser.id)
          expect(like.type).to.be.equal('Paw')

          expect(responseMock.redirectUrl).to.be.equal('/')
          done()
        })
      }, 50)
    }, 50)
  })

  it('Add a like, then a love from the same user, should overwrite', function (done) {
    requestMock.params = [samplePhotoId, 'Paw']
    photoController.addLike(requestMock, responseMock)

    setTimeout(function () {
      requestMock.params = [samplePhotoId, 'Love']

      photoController.addLike(requestMock, responseMock)
      setTimeout(function () {
        Photo.findOne({}).populate('likes').then(photo => {
          expect(photo.likes).to.not.be.undefined
          expect(photo.likes.length).to.be.equal(1)
          let like = photo.likes[0]
          expect(like.author.toString()).to.be.equal(reqUser.id)
          expect(like.type).to.be.equal('Love')
          expect(responseMock.redirectUrl).to.be.equal(expectedErrorRedirectUrl)
          done()
        })
      }, 50)
    }, 50)
  })

  it('photoId that does not exist in the DB, should redirect', function (done) {
    requestMock.params = ['4edd40c86762e0fb12000003', 'Paw']
    photoController.addLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal(nonExistingPhotoErrorMsg)
      expect(responseMock.redirectUrl).to.be.equal(expectedErrorRedirectUrl)
      done()
    }, 40)
  })

  it('invalid photoId, should redirect', function (done) {
    requestMock.params = ['grindin', 'Paw']
    photoController.addLike(requestMock, responseMock)

    setTimeout(function () {
      expect(requestMock.session.errorMsg).to.not.be.undefined
      expect(requestMock.session.errorMsg).to.be.equal('Invalid photo id!')
      expect(responseMock.redirectUrl).to.be.equal(expectedErrorRedirectUrl)
      done()
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
