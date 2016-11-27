const mongoose = require('mongoose')

let postSchema = mongoose.Schema(
  {
    content: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()},
    public: {type: Boolean, required: true, default: false},
    likes: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like', default: []}],
    tags: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tag', default: []}],
    comments: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment', default: []}],
    category: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category'}
  }
)

const Post = mongoose.model('Post', postSchema)

module.exports = Post
