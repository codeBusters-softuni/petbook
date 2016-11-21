const mongoose = require('mongoose')

let postSchema = mongoose.Schema(
  {
    content: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()},
    public: {type: Boolean, required: true},
    likes: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like'}],
    tags: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tag'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment'}],
    category: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category'}
  }
)

const Post = mongoose.model('Photo', postSchema)

module.exports = Post
