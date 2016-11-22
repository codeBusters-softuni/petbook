const mongoose = require('mongoose')

let roleSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})

roleSchema.method({
  addUser: function (userId) {
    return new Promise((resolve, reject) => {
      this.users.push(userId)
      this.save().then(() => {
        resolve()
      })
    })
  }
})

const Role = mongoose.model('Role', roleSchema)

module.exports = Role

module.exports.initialize = () => {
  Role.findOne({ name: 'User' }).then(role => {
    if (!role) {
      Role.create({ name: 'User' })
    }
  })

  Role.findOne({ name: 'Admin' }).then(role => {
    if (!role) {
      Role.create({ name: 'Admin' })
    }
  })
}

