const moment = require('moment')
const mongoose = require('mongoose')

let photoSchema = mongoose.Schema(
  {
    path: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, default: Date.now() },
    dateStr: { type: String, default: '' },
    public: { type: Boolean, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment' }],
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' }
  }
)

// Fills the dateStr field with a pretty string representation of the date the photo was created
photoSchema.pre('save', true, function(next, done) {
  if (!this.dateStr) {
    this.dateStr = moment(this.date).format('MMM Do [at] hh:mmA')
    this.save().then(() => {
      next()
      done()
    })
  } else {
    next()
    done()
  }
})

const Photo = mongoose.model('Photo', photoSchema)

module.exports = Photo
