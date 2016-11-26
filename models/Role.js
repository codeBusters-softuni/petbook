const mongoose = require('mongoose')

let roleSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})

roleSchema.method({
  addUser: function (userId) {
    return new Promise((resolve, reject) => {
      if (this.users.indexOf(userId) === -1) {
        this.users.push(userId)
        this.save().then(() => {
          resolve()
        })
      } else { resolve() }
    })
  }
})

const Role = mongoose.model('Role', roleSchema)

module.exports = Role

module.exports.initialize = () => {
  let promises = [
    new Promise((resolve, reject) => {
      Role.findOne({ name: 'User' }).then(role => {
        if (!role) {
          Role.create({ name: 'User' }).then(() => {
            resolve()
          })
        } else { resolve() }
      })
    }),
    new Promise((resolve, reject) => {
      Role.findOne({ name: 'Admin' }).then(role => {
        if (!role) {
          Role.create({ name: 'Admin' }).then(() => {
            resolve()
          })
        } else { resolve() }
      })
    })
  ]

  return promises
}

