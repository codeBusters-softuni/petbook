const mongoose = require('mongoose');

let albumSchema = mongoose.Schema(
    {
            name: {type: String, unique: true},
            description: String,
            photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}],
            author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
            // public: { type: Boolean, required: true },
            date: {type: Date, default: Date.now()}
    }
);


albumSchema.method({
        prepareUploadAlbum: function () {
                let User = mongoose.model('User');
                User.findById(this.author).then(user =>{
                        user.albums.push(this.id);
                        user.save();
                })
        },

})

const Album = mongoose.model('Album', albumSchema)

module.exports = Album