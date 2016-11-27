const moment = require('moment')
const mongoose = require('mongoose')

let commentSchema = mongoose.Schema({
  content: {type: String, required: true},
  author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  date: {type: Date, default: Date.now},
  dateStr: {type: String, default: ''}
})

// Fills the dateStr field with a pretty string representation of the date the post was created
commentSchema.pre('save', true, function (next, done) {
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

const Comment_ = mongoose.model('Comment', commentSchema)
module.exports = Comment_
