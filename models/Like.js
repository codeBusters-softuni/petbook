const mongoose = require('mongoose')

let likeSchema = mongoose.Schema({
  type: {type: String, required: true, unique: true},
  author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
})

const Like = mongoose.model('Like', likeSchema)

module.exports = Like

