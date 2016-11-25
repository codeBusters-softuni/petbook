const mongoose = require('mongoose')
const autoIncrement = require('mongoose-sequence')
const Role = mongoose.model('Role')
const encryption = require('./../utilities/encryption')

let userSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    fullName: { type: String, required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    owner: { type: String },
    profilePic: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },      //  Мисля, че това все пак трябва да е масив group и да има възможност за членство в няколко групи, например Dogs, Labradors,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
)
// Post save hook
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
    // TODO: Implement once Roles are functional!
    return new Promise((resolve, reject) => {
      resolve()
      return true
    })
  }
})

// using the mongoose-sequence module to have a unique integer Id for each user
userSchema.plugin(autoIncrement, { inc_field: 'userId' })

const User = mongoose.model('User', userSchema)

module.exports = User

module.exports.register = function (fullName, email, password) {
  // registers a new user
  return new Promise((resolve, reject) => {
    // See if a user with the given email already exists
    User.findOne({ email: email }).then(potentialUser => {
      if (potentialUser) {
        // ERROR
        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
        let err = Error(`User with the email ${email} already exists!`)
        reject(err)
        return
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
              password: encryption.hashPassword(password, salt),
              salt: salt,
              roles: [role.id]
            }

            User.create(newUser).then((newUser) => { resolve(newUser) }).catch(() => { reject() })
          }
        })
      }
    })
  })
}
