const mongoose = require('mongoose')

let categorySchema = mongoose.Schema({
  name: {type: String, required: true, unique: true},
  users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
  photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}]
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category
