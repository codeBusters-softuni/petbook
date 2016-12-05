const moment = require('moment')
const mongoose = require('mongoose')

function initializeForView (posts) {
  // this function initializes an array of posts to be ready to be sent to a view
  // Splits the post's likes array into arrays of paws, loves and dislikes so that we can handle it properly in the view
  posts = posts.map(post => {
    post.splitLikes()
    return post
  })
  // Sort the posts in descending date order. (Newest ones first!)
  posts.sort((a, b) => {
    return b.date - a.date
  })

  return posts
}

let postSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, default: Date.now },
    dateStr: { type: String, default: '' },
    public: { type: Boolean, required: true, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like', default: [] }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tag', default: [] }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment', default: [] }],
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' }
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
