const mongoose = require('mongoose')

let photoSchema = mongoose.Schema(
  {
    path: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()},
    public: {type: Boolean, required: true},
    likes: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment'}],
    category: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category'}
  }
)

const Photo = mongoose.model('Photo', photoSchema)

module.exports = Photo
