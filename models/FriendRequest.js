const mongoose = require('mongoose')
const User = mongoose.model('User')

let friendReqSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }
)

// Pre-save hook to add the request to the users involved
friendReqSchema.pre('save', function (next) {
  User.findById(this.sender).then(sender => {
    if (!sender) {
      // ERROR - Sender does not exist!
      let err = new Error('Sender does not exist!')
      next(err)
    }

    User.findById(this.receiver).then(receiver => {
      if (!receiver) {
        // ERROR - Receiver does not exist!
        let err = new Error('Receiver does not exist!')
        next(err)
      }

      let senderPromise = sender.addFriendRequest(this.id)
      let receiverPromise = receiver.addFriendRequest(this.id)
      Promise.all([senderPromise, receiverPromise]).then(() => {
        next()
      })
    })
  })
})

// Once accepted, our friend request should be deleted from the User model
const FriendRequest = mongoose.model('FriendRequest', friendReqSchema)

module.exports = FriendRequest
