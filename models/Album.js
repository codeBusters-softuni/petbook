const mongoose = require('mongoose');

let albumSchema = mongoose.Schema(
    {
        name: String,
        description: String,
        author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
        photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}],
        public: {type: Boolean, required: true},
        date: {type: Date, default: Date.now()},
        classCss: String
    }
);


albumSchema.method({
    prepareUploadAlbum: function () {
        let User = mongoose.model('User');
        User.findById(this.author).then(user => {
            user.albums.push(this.id);
            user.save();
        })
    },


    // findAlbumID: function () {
    //     let Photos = mongoose.model('Photo');
    //
    // }

})

const Album = mongoose.model('Album', albumSchema)

module.exports = Album