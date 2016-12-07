const moment = require('moment')
const mongoose = require('mongoose')

let photoSchema = mongoose.Schema(
  {
    // path: { type: String, required: true },
    // author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    // date: { type: Date, default: Date.now() },
    // dateStr: { type: String, default: '' },
    // public: { type: Boolean, required: true },
    // likes: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Like' }],
    // comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment' }],
    // category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' }

      fieldname: String, //{type: String, required: true},
      originalname: String, //{type: String, required: true},
      encoding: String, //{type: String, required: true},
      mimetype: String ,//{type: String, required: true},
      destination: String,
      filename: String, //new file name for the base
      path: String,
      size: Number,
      // content: {type: String, required: true},
      author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
      public: { type: Boolean, required: true, default: true },
      description: {type: String, required: false, default:""},
      album: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Album' },
      // tags: [{type: mongoose.Schema.Types.ObjectId, required:true, ref:'Tag'}],
      date: {type: Date, default: Date.now()}
  }
)

// Fills the dateStr field with a pretty string representation of the date the photo was created
// photoSchema.pre('save', true, function(next, done) {
//   if (!this.dateStr) {
//     this.dateStr = moment(this.date).format('MMM Do [at] hh:mmA')
//     this.save().then(() => {
//       next()
//       done()
//     })
//   } else {
//     next()
//     done()
//   }
// })

photoSchema.method({
    prepareUpload: function () {
        let User = mongoose.model('User');
        User.findById(this.author).then(user =>{
            user.photos.push(this.id);
            console.log(this);
            user.save();
        });

        let Album = mongoose.model('Album');
        Album.findOne({name: "Photos"+" "+this.author}).then(album =>{
            album.photos.push(this.id);
            console.log(this);
            album.save();
        })

    }


})

const Photo = mongoose.model('Photo', photoSchema)

module.exports = Photo
