const moment = require('moment')
const mongoose = require('mongoose')

function initializeForView(photos) {
  // this function initializes an array of posts to be ready to be sent to a view
  // Splits the post's likes array into arrays of paws, loves and dislikes so that we can handle it properly in the view
  const Photo = mongoose.model('Photo')
  return new Promise((resolve, reject) => {
    Photo.populate(photos, { path: 'likes' }).then(() => {
      photos = photos.map(photo => {
        photo.splitLikes()
        return photo
      })

      resolve(photos)
    })
  })
}

let photoSchema = mongoose.Schema(
  {
    fieldname: { type: String, required: true },
    originalname: { type: String, required: true },
    encoding: { type: String, required: true },
    mimetype: { type: String, required: true },
    filename: { type: String, required: true }, // new file name for the base
    path: { type: String, required: true },
    size: { type: Number },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    public: { type: Boolean, required: true, default: true },
    description: { type: String, default: '' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like', default: [] }],
    album: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Album' },
    date: { type: Date, default: Date.now() },
    dateStr: { type: String, default: ' ' },
    classCss: { type: String }
  }
)

// Fills the dateStr field with a pretty string representation of the date the photo was created
photoSchema.pre('save', true, function (next, done) {
  if (!this.isNew) {
    next()
    done()
    return
  }
  let User = mongoose.model('User')
  let Album = mongoose.model('Album')

  let datePromise = new Promise((resolve, reject) => {
    if (!this.dateStr) {
      this.dateStr = moment(this.date).format('MMM Do [at] hh:mmA')
      this.save().then(() => {
        resolve()
      })
    } else {
      resolve()
    }
  })

  let userPromise = new Promise((resolve, reject) => {
    User.findById(this.author).then(user => {
      if (!user) {
        reject(Error(`User with id ${this.author} does not exist!`))
      }
      user.photos.push(this.id)
      user.save().then(() => {
        resolve()
      })
    })
  })
  let albumPromise = new Promise((resolve, reject) => {
    Album.findOne(this.album).then(album => {
      if (!album) {
        reject(Error(`Album with id ${this.album} does not exist!`))
      }
      album.photos.push(this.id)
      album.save().then(() => {
        resolve()
      })
    })
  })

  Promise.all([datePromise, userPromise, albumPromise]).then(() => {
    next()
    done()
  })
})

photoSchema.pre('remove', true, function (next, done) {
  let User = mongoose.model('User')
  let Album = mongoose.model('Album')
  let Post = mongoose.model('Post')


  let userPromise = new Promise((resolve, reject) => {
    User.findById(this.author).then(user => {
      user.photos.remove(this.id)
      user.save().then(() => {
        resolve()
      })
    })
  })
  let albumPromise = new Promise((resolve, reject) => {
    Album.findById(this.album).then(album => {
      album.photos.remove(this.id)
      album.save().then(() => {
        resolve()
      })
    })
  })
  let postPromise = new Promise((resolve, reject) => {
    Post.findById(this.post).then(post => {
      post.photos.remove(this.id)
      post.save().then(() => {
        resolve()
      })
    })
  })

  Promise.all([albumPromise, postPromise, userPromise]).then(() => {
    next()
    done()
  })
})

photoSchema.method({
  // adds a like to the post, assumes that validation has been done
  addLike: function (likeId) {
    return new Promise((resolve, reject) => {
      this.likes.push(likeId)
      this.save().then(() => {
        resolve()
      }).catch((err) => { reject(err) })
    })
  },
  // removes a like from the post's likes, assumes that the appropriate validation has been done
  removeLike: function (likeId) {
    return new Promise((resolve, reject) => {
      this.likes.remove(likeId)
      this.save().then(() => {
        resolve()
      }).catch((err) => { reject(err) })
    })
  },

  splitLikes: function () {
    // Split the main likes array into TEMPORARY arrays of each like type.
    this.paws = this.likes.filter(like => { return like.type === 'Paw' })
    this.loves = this.likes.filter(like => { return like.type === 'Love' })
    this.dislikes = this.likes.filter(like => { return like.type === 'Dislike' })
  }
})

const Photo = mongoose.model('Photo', photoSchema)

module.exports = Photo
module.exports.initializeForView = initializeForView
// function that validates if an uploaded file is an image.
// also handles err object sent from multer
module.exports.validateImages = (req, res, err, images) => {
  // returns a boolean indicating if the images are valid
  if (!Array.isArray(images)) { images = [images] }

  let isInvalidType = false

  images.forEach(file => {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg') {
      isInvalidType = true
    }
  })

  if (isInvalidType) {
    req.session.errorMsg = 'Supported image types are PNG, JPG and JPEG!'
    return false
  } else if (err) {
    if (err.message === 'File too large') {
      req.session.errorMsg = 'An image you uploaded was too large. Maximum size for an image is 2MB!'
    } else if (err.message === 'Too many files') {
      req.session.errorMsg = 'You cannot upload more than 10 images at once!'
    } else {
      req.session.errorMsg = err.message
    }
    return false
  }

  return true
}
