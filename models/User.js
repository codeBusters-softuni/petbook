const mongoose = require('mongoose');

const encryption = require('./../utilities/encryption');

let userSchema = mongoose.Schema(
  {
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
    salt: {type: String, required: true},
    fullName: {type: String, required: true},
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    owner: {type: String},
    profilePic: {type: mongoose.Schema.Types.ObjectId, ref: 'Photo'},
    posts: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Post' } ],
    photos: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' } ],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},      //Мисля, че това все пак трябва да е масив group и да има възможност за членство в няколко групи, например Dogs, Labradors,
    friends: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ]
  }
)

userSchema.method({
  authenticate: function (password) {
    let inputPasswordHash = encryption.hashPassword(password, this.salt)
    let isSamePasswordHash = inputPasswordHash === this.passwordHash

    return isSamePasswordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
