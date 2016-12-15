const moment = require('moment')
const mongoose = require('mongoose')
const postsPerPage = require('../config/constants').postsPerPage
function initializeForView (posts) {
  const Photo = mongoose.model('Photo')
  // this function initializes an array of posts to be ready to be sent to a view
  // Splits the post's likes array into arrays of paws, loves and dislikes so that we can handle it properly in the view
  return new Promise((resolve, reject) => {
    posts = posts.map(post => {
      return new Promise((resolve, reject) => {
        post.splitLikes()
        Photo.initializeForView(post.photos).then(photos => {
          post.photos = photos
        })
        resolve(post)
      })
    })
    Promise.all(posts).then(posts => {
      resolve(posts)
    })
  })
}

function sortPosts (posts) {
  return posts.sort((postOne, postTwo) => {
    return postTwo.date - postOne.date
  })
}

function getPostsInPage (page, allPosts) {
  // get the start and end index for the appropriate posts in the array
  let startIndex = page * postsPerPage
  let endIndex = startIndex + postsPerPage
  let pageCount = Math.ceil(allPosts.length / 20)
  let pages = pageCount.getPagesArray()  // an array of the pages - ex: [1,2,3] if we have 60 elements
  let postsInPage = allPosts.slice(startIndex, endIndex)  // slice here for optimization
  return {
    posts: postsInPage,
    pages: pages
  }
}

let postSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, default: Date.now },
    dateStr: { type: String, default: '' },
    public: { type: Boolean, required: true, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like', default: [] }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment', default: [] }],
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' },
    photos: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Photo', default: [] }]
  }
)

// Fills the dateStr field with a pretty string representation of the date the post was created
postSchema.pre('save', true, function (next, done) {
  if (!this.dateStr) {
    this.dateStr = moment(this.date).format('MMM Do [at] hh:mmA')
    this.save().then(() => {
      next()
      done()
    })
  } else {
    next()
    done()
  }
})

postSchema.post('save', function (post) {
  const Photo = mongoose.model('Photo')
  // add the post to each Photo object
  post.photos.forEach(photo => {
    Photo.findById(photo).then(photo => {
      photo.post = post._id
      photo.save()
    })
  })
})

postSchema.method({
  addComment: function (commentId) {
    return new Promise((resolve, reject) => {
      this.comments.push(commentId)
      this.save().then(() => {
        resolve()
      }).catch((err) => { reject(err) })
    })
  },
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

const Post = mongoose.model('Post', postSchema)

module.exports = Post
module.exports.initializeForView = initializeForView
module.exports.sortPosts = sortPosts
module.exports.getPostsInPage = getPostsInPage
