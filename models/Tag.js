const mongoose = require('mongoose')

let tagSchema = mongoose.Schema({
  name: {type: String, required: true, unique: true},
  posts: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Post' } ],
  photos: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Photo' } ]
})

const Tag = mongoose.model('Tag', tagSchema)

module.exports = Tag
