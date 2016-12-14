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

albumSchema.method({
  addToUser: function () {
    return new Promise((resolve, reject) => {
      let User = mongoose.model('User')
      User.findById(this.author).then(user => {
        if (!user) {
          reject(Error(`No user with ID ${this.author} exists!`))
        }
        user.albums.push(this.id)
        user.save().then(() => {
          resolve(user)
        })
      })
    })
  }
})

const Album = mongoose.model('Album', albumSchema)

module.exports = Album
// Tries to find an album with the given name, otherwise creates it
module.exports.findOrCreateAlbum = (albumName, potentialAuthor) => {
  return new Promise((resolve, reject) => {
    Album.findOne({ name: albumName }).then(album => {
      if (!album) {
        let cssClassName = albumName.replace(/\s+/g, '-') + '-DbStyle'

        // create the new album
        let newAlbum = new Album({
          name: albumName,
          author: potentialAuthor,
          public: true,
          classCss: cssClassName
        })

        Album.create(newAlbum).then(newAlbum => {
          newAlbum.addToUser().then(() => {
            resolve(newAlbum)
          })
        })
      } else {
        resolve(album)
      }
    })
  })
}
