const mongoose = require('mongoose')
const categories = require('./../config/constants').categories

let categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }]
})

const Category = mongoose.model('Category', categorySchema)

module.exports = Category

module.exports.initialize = () => {
  // this creates all our categories in case they don't exist
  for (let category of categories) {
    Category.findOne({ name: category }).then(categ => {
      if (!categ) {
        Category.create({ name: category })
      }
    })
  }
}
