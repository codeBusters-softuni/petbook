const mongoose = require('mongoose')
const categories = require('./../config/constants').categories

let categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }]
})

categorySchema.method({
  // adds a user to the category's users array
  addUser: function (userId) {
    return new Promise((resolve, reject) => {
      this.users.push(userId)
      this.save().then(() => {
        resolve()
      }).catch((err) => { reject(err) })
    })
  }
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category

module.exports.initialize = () => {
  // this creates all our categories in case they don't exist
  return categories.map(category => {
    return new Promise((resolve, reject) => {
      Category.findOne({ name: category }).then(categ => {
        if (!categ) {
          Category.create({ name: category }).then(() => {
            resolve()
          }).catch((err) => { reject(err) })
        } else {
          resolve()
        }
      })
    })
  })
}
