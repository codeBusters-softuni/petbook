const mongoose = require('mongoose')

let friendReqSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }
)

// Once accepted, our friend request should be deleted from the User model
const FriendRequest = mongoose.model('FriendRequest', friendReqSchema)

module.exports = FriendRequest
