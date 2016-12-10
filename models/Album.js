const mongoose = require('mongoose')

let albumSchema = mongoose.Schema(
  {
    name: String,
    description: String,
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
    public: { type: Boolean, required: true },
    date: { type: Date, default: Date.now() },
    classCss: String
  }
)

albumSchema.pre('save', true, function (next, done) {
  let User = mongoose.model('User')
  User.findById(this.author).then(user => {
    user.albums.push(this.id)
    user.save().then(() => {
      next()
      done()
    })
  })
})

const Album = mongoose.model('Album', albumSchema)

module.exports = Album
// Tries to find an album with the given name, otherwise creates it
module.exports.findOrCreateAlbum = (albumName, potentialAuthor) => {
  return new Promise((resolve, reject) => {
    Album.findOne({ name: albumName }).then(album => {
      if (!album) {
        // create the new album
        let newAlbum = new Album({
          name: albumName,
          author: potentialAuthor,
          public: true,
          classCss: 'Your-photos-from-NewsFeed-DbStyle'
        })

        Album.create(newAlbum).then(newAlbum => {
          newAlbum.prepareUploadAlbum()
          resolve(newAlbum)
        })
      } else {
        resolve(album)
      }
    })
  })
}
