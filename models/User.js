const mongoose = require('mongoose')
const autoIncrement = require('mongoose-sequence')
const Role = mongoose.model('Role')
const Category = mongoose.model('Category')
const encryption = require('./../utilities/encryption')

let userSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    fullName: { type: String, required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    ownerName: { type: String },
    profilePic: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FriendRequest' }]
  }
)
// Pre save hook
userSchema.pre('save', function (next) {
  let rolePromises = this.roles.map((role) => {
    Role.findById(role).then((role) => {
      if (!role) {
        var err = new Error("Role in User's roles array does not exist")
        next(err)
        return new Promise((resolve, reject) => { reject() })
      }
      return role.addUser(this._id)
    })
  })
  Promise.all(rolePromises).then(() => {
    next()
  })
})

userSchema.method({
  authenticate: function (password) {
    let inputPasswordHash = encryption.hashPassword(password, this.salt)

    return inputPasswordHash === this.password
  },

  isAdmin: function () {
    return new Promise((resolve, reject) => {
      Role.findOne({ name: 'Admin' }).then(role => {
        if (!role) {
          // No such role exists!
          let err = new Error('Admin role does not exist!')
          reject(err)
        } else {
          resolve(this.roles.indexOf(role._id) !== -1)
        }
      })
    })
  },
  getFriendRequestTo: function (userId) {
    // friendRequests msut be populated!
    // returns the friend request if it exists, otherwise returns false
    let friendReqIndex = this.pendingFriendRequests.findIndex(frReq => {
      return frReq.sender.equals(this._id) && frReq.receiver.equals(userId)
    })
    if (friendReqIndex === -1) {
      return false
    } else {
      return this.pendingFriendRequests[friendReqIndex]
    }
  },

  getFriendRequestFrom: function (userId) {
    // friendRequests msut be populated!
    // returns the friend request if it exists, otherwise returns false
    let friendReqIndex = this.pendingFriendRequests.findIndex(frReq => {
      return frReq.sender.equals(userId) && frReq.receiver.equals(this._id)
    })
    if (friendReqIndex === -1) {
      return false
    } else {
      return this.pendingFriendRequests[friendReqIndex]
    }
  },

  hasFriendRequest: function () {
    // returns a boolean indicating if the user has a pending friend request
    let friendReqIndex = this.pendingFriendRequests.findIndex(frRex => {
      return frRex.receiver.equals(this.id)
    })
    return friendReqIndex !== -1
  },

  addFriendRequest: function (friendReqId) {
    return new Promise((resolve, reject) => {
      this.pendingFriendRequests.push(friendReqId)
      this.save().then(() => {
        resolve()
      })
    })
  },

  removeFriendRequest: function (friendReqId) {
    return new Promise((resolve, reject) => {
      this.pendingFriendRequests.remove(friendReqId)
      this.save().then(() => {
        resolve()
      })
    })
  },

  addFriend: function (friendId) {
    return new Promise((resolve, reject) => {
      this.friends.push(friendId)
      this.save().then(() => {
        resolve()
      })
    })
  },

  removeFriend: function (friendId) {
    return new Promise((resolve, reject) => {
      this.friends.remove(friendId)
      this.save().then(() => {
        resolve()
      })
    })
  },

  hasFriend: function (friendId) {
    return this.friends.indexOf(friendId) !== -1
  },


  /**
   * @returns a FriendStatus object consisting of
   *   @param {boolean} areFriends - areFriends: - boolean indicating if you are friends with the user
   *   @param {boolean} sentRequest - boolean indicating if you have sent a still-pending friend request to that user
   *   @param {object} friendRequest - the sent Friend Request object
   *   @param {boolean} receivedRequest - boolean indicating if you have received a still-pending friend request from that user
   *   @param {object} receivedFriendRequest - the received Friend Request Object
   *
   * Obviously only three variants of the object can be found -
   * one with areFriends to true,
   * one with sentRequest and friendRequest
   * and one with receivedRequest and receivedFriendRequest
   */
  getFriendStatusWith: function (friendObj) {
    let areFriends = this.friends.indexOf(friendObj.id) !== -1
    let friendRequestId = this.getFriendRequestTo(friendObj._id)
    let hasSentRequest = Boolean(friendRequestId)
    let receivedFriendRequestId = this.getFriendRequestFrom(friendObj._id)
    let hasReceivedRequest = Boolean(receivedFriendRequestId)

    let friendStatus = {
      sentRequest: hasSentRequest,
      areFriends: areFriends,
      friendRequest: friendRequestId,
      receivedRequest: hasReceivedRequest,
      receivedFriendRequest: receivedFriendRequestId
    }

    return friendStatus
  },

  updateProfilePicture: function (photoId) {
    return new Promise((resolve, reject) => {
      this.profilePic = photoId
      this.save(() => {
        resolve(this)
      })
    })
  },

  getLikesCount: function () {
    // Get all the likes that the user has received and split them by their type
    const Post = mongoose.model('Post')
    const Photo = mongoose.model('Photo')
    return new Promise((resolve, reject) => {
      let postLikes = []
      let postPromise = new Promise((resolve, reject) => {
        Post.find({ author: this._id }).populate('likes').then(posts => {
          posts.forEach(post => {
            postLikes.push.apply(postLikes, post.likes)
          })
          resolve()
        })
      })

      let photoLikes = []
      let photoPromise = new Promise((resolve, reject) => {
        Photo.find({ author: this._id }).populate('likes').then(photos => {
          photos.forEach(photo => {
            photoLikes.push.apply(photoLikes, photo.likes)
          })
          resolve()
        })
      })

      Promise.all([postPromise, photoPromise]).then(() => {
        // merge all the likes into one array
        let receivedLikes = photoLikes.concat(postLikes)
        this.receivedPawsCount = receivedLikes.filter(like => { return like.type === 'Paw' }).length
        this.receivedLovesCount = receivedLikes.filter(like => { return like.type === 'Love' }).length
        this.receivedDislikesCount = receivedLikes.filter(like => { return like.type === 'Dislike' }).length
        resolve(this)
      })
    })
  },

  getPostsByFriends: function () {
    const Post = mongoose.model('Post')
    // returns all the posts by the user's friends
    return new Promise((resolve, reject) => {
      let friendPostsPromises = []
      this.friends.forEach(friend => {                               // for each friend
        friendPostsPromises.push(new Promise((resolve, reject) => {  // add a promise
          Post.find({ author: friend }).then(posts => {
            resolve(posts)                                           // which resolves his posts
          }).catch(err => reject(err))
        }))
      })
      Promise.all(friendPostsPromises).then(friendPosts => {
        resolve([].concat.apply([], friendPosts))  // flatten the array of arrays into one array
      })
    })
  }
})

// using the mongoose-sequence module to have a unique integer Id for each user
userSchema.plugin(autoIncrement, { inc_field: 'userId' })

const User = mongoose.model('User', userSchema)

module.exports = User

module.exports.register = function (fullName, email, ownerName, password, category) {
  // registers a new user
  return new Promise((resolve, reject) => {
    // See if a user with the given email already exists
    User.findOne({ email: email }).then(potentialUser => {
      if (potentialUser) {
        let err = Error(`User with the email ${email} already exists!`)
        reject(err)
        return
      } else {
        // get the Category from the DB
        Category.findOne({ name: category }).then(potentialCategory => {
          if (!potentialCategory) {
            // no such category exists
            let err = new Error(`No category named ${category} exists!`)
            reject(err)
          } else {
            // get the User role from the DB
            Role.findOne({ name: 'User' }).then(role => {
              if (!role) {
                // no such role exists
                let err = new Error('No User role exists!')
                reject(err)
              } else {
                let salt = encryption.generateSalt()
                let newUser = {
                  fullName: fullName,
                  email: email,
                  ownerName: ownerName,
                  password: encryption.hashPassword(password, salt),
                  salt: salt,
                  roles: [role.id],
                  category: potentialCategory._id
                }
                User.create(newUser).then((newUser) => {
                  resolve(newUser)
                }).catch(() => { reject() })
              }
            })
          }
        })
      }
    })
  })
}
