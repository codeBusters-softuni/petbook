const mongoose = require('mongoose')
const categories = require('./../config/constants').categories

let categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true }
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
