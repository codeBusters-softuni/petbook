const mongoose = require('mongoose')
const FriendRequest = mongoose.model('FriendRequest')
const User = mongoose.model('User')

module.exports = {
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
  }
}
