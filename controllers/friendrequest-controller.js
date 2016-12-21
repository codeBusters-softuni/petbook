const mongoose = require('mongoose')
const FriendRequest = mongoose.model('FriendRequest')
const User = mongoose.model('User')
const categories = require('../config/constants').categories

module.exports = {
  showRequests: (req, res) => {
    // remove the requests that are sent by the user
    let receivedFriendRequests = req.user.pendingFriendRequests.filter(frReq => {
      return !frReq.sender.equals(req.user.id)
    })
    FriendRequest.populate(receivedFriendRequests, { path: 'sender' }).then(reqs => {
      FriendRequest.populate(receivedFriendRequests, [{ path: 'sender.profilePic', model: 'Photo' }, { path: 'sender.category', model: 'Category' }]).then(reqs => {
        res.render('user/friendRequests', { friendRequests: receivedFriendRequests, categories: categories })
      })
    })
  },

  sendRequest: (req, res) => {
    // sends a friend request to the given user
    // Validate given ID
    let receiverId = req.params.receiverId
    if (req.user.id === receiverId) {
      req.session.errorMsg = 'You cannot friend yourself!'
      res.redirect('/')
      return
    } else if (req.user.hasFriend(receiverId)) {
      res.render('home/index', { categories: categories })
      return
    }

    User.findById(receiverId).populate('pendingFriendRequests').then(user => {
      if (!user) {
        // ERROR - User does not exist
        // Something is wrong with the logic or the user is malicious
        req.session.errorMsg = 'User does not exist!'
        res.redirect('/')
        return
      } else if (user.hasFriend(req.user.id)) {
        // ERROR - User already has the logged in user as a friend
        console.log(`ERROR: Inconsistency with friends, user ${req.user.email} does not have user ${user.email} as a friend, but ${user.email} does`)
        req.session.errorMsg = 'You are already friends.'
        res.redirect('/')
      }
      // validate that such a request does not exist
      let potentialRequestIdx = user.pendingFriendRequests.findIndex(frReq => {
        return frReq.sender === req.user.id
      })
      if (potentialRequestIdx !== -1) {
        // ERROR, Such a request already exists!
        req.session.errorMsg = 'You already have a pending request to that user.'
        res.redirect('/')
        return
      }

      FriendRequest.create({ sender: req.user.id, receiver: receiverId }).then(() => {
        let returnUrl = res.locals.returnUrl || `/user/${user.userId}`
        res.redirect(returnUrl)
      })
    })
  },

  acceptRequest: (req, res) => {
    let frReqId = req.params.id
    FriendRequest.findById(frReqId).populate('sender receiver').then(friendRequest => {
      if (!friendRequest) {
        req.session.errorMsg = 'No such friend request exists!'
        res.redirect('/')
        return
      } else if (!friendRequest.receiver.equals(req.user._id)) {
        req.session.errorMsg = 'You do not have permission to accept that request!'
        res.redirect('/')
        return
      }
      let sender = friendRequest.sender
      let receiver = friendRequest.receiver
      let promises = [
        // make them friends
        sender.addFriend(frReqId, receiver.id),
        receiver.addFriend(frReqId, sender.id)
      ]
      Promise.all(promises).then(() => {
        // Success - users are now friends, delete the FriendRequest
        friendRequest.remove()
        req.session.successMsg = `You have become friends with ${sender.fullName}!`
        let returnUrl = res.locals.returnUrl || '/friendRequests'
        res.redirect(returnUrl)
      })
    })
  },

  declineRequest: (req, res) => {
    let frReqId = req.params.id
    FriendRequest.findById(frReqId).populate('sender receiver').then(friendRequest => {
      if (!friendRequest) {
        req.session.errorMsg = 'Invalid friend request!'
        res.redirect('/')
        return
      } else if (!(friendRequest.receiver.equals(req.user._id) || friendRequest.sender.equals(req.user._id))) {
        req.session.errorMsg = 'You do not have permission to decline that request!'
        res.redirect('/')
        return
      }
      let sender = friendRequest.sender
      let receiver = friendRequest.receiver
      let promises = [
        // remove the user's friend requests
        sender.removeFriendRequest(frReqId),
        receiver.removeFriendRequest(frReqId)
      ]

      Promise.all(promises).then(() => {
        friendRequest.remove()
        let returnUrl = res.locals.returnUrl || '/friendRequests'
        res.redirect(returnUrl)
      })
    })
  }
}
