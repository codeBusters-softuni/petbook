const mongoose = require('mongoose')
const FriendRequest = mongoose.model('FriendRequest')
const User = mongoose.model('User')
// TODO: Add Accept Friendship button in profile.hbs
module.exports = {
  showRequests: (req, res) => {
    // remove the requests that are sent by the user
    let receivedFriendRequests = req.user.pendingFriendRequests.filter(frReq => {
      return !frReq.sender.equals(req.user.id)
    })
    FriendRequest.populate(receivedFriendRequests, { path: 'sender' }).then(reqs => {
      res.render('user/friendRequests', { friendRequests: receivedFriendRequests })
    })
  },

  sendRequest: (req, res) => {
    // sends a friend request to the given user
    // Validate given ID
    let receiverId = req.params.id
    if (req.user.id === receiverId) {
      // ERROR - You cannot friend yourself!
      res.render('index')
      return
    }

    User.findById(receiverId).populate('pendingFriendRequests').then(user => {
      if (!user) {
        // ERROR - User does not exist
        // Something is wrong with the logic or the user is malicious
        res.render('index')
        return
      }
      // validate that such a request does not exist
      let potentialRequestIdx = user.pendingFriendRequests.findIndex(frReq => {
        return frReq.sender === req.user.id
      })
      if (potentialRequestIdx !== -1) {
        // ERROR, Such a request already exists!
        res.render('index')
        return
      }

      FriendRequest.create({ sender: req.user.id, receiver: receiverId }).then(() => {
        res.redirect(`/user/${user.userId}`)
      })
    })
  },

  acceptRequest: (req, res) => {
    let frReqId = req.params.id
    FriendRequest.findById(frReqId).populate('sender receiver').then(friendRequest => {
      if (!friendRequest) {
        // ERROR - No such friend request exists!
        res.render('index')
        return
      }
      let sender = friendRequest.sender
      let receiver = friendRequest.receiver
      let promises = [
        // make them friends
        sender.addFriend(receiver.id),
        receiver.addFriend(sender.id),
        // remove their friend requests
        sender.removeFriendRequest(frReqId),
        receiver.removeFriendRequest(frReqId)
      ]

      Promise.all(promises).then(() => {
        // Success - users are now friends, delete the FriendRequest
        friendRequest.remove()
        // TODO: Attach success message
        res.redirect('/friendRequests')
      })
    })
  }
}
