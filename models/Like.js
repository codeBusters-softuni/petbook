const mongoose = require('mongoose')
const AVAILABLE_LIKES = require('./../config/constants').likes

function likeValidator (candidateLikeType) {
  // checks if the like that is given exists in our pre-defined available likes
  return AVAILABLE_LIKES.indexOf(candidateLikeType) !== -1
}
let invalidLikeErrorMessage = "The like you passed does not exist in constants.js's likes array"
let validatorErrorPair = [likeValidator, invalidLikeErrorMessage]  // passes the validator function and the error message we want it to return in case it does not work

let likeSchema = mongoose.Schema({
  type: {type: String, required: true, unique: true, validator: validatorErrorPair},
  author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
})

const Like = mongoose.model('Like', likeSchema)

module.exports = Like
