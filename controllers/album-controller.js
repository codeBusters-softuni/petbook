const Album = require('mongoose').model('Album');
const Photo = require('mongoose').model('Photo');

// For uploading photos!!!
var formidable = require('formidable');
var multer  =   require('multer');

module.exports = {
    createAlbumGet: (req, res) => {
        if(!req.user){
            // console.log('HERE')
            let returnUrl = '/user/uploadPhotos';
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        res.render('user/uploadPhotos');
    },



    uploadAlbum: (req, res) => {
        var dest = __dirname.toString().split('\\');
        dest[dest.length-1] = "public";
        dest = dest.join('\\');
        var upload = multer({ dest: dest +'/uploads/'}).array('uploadAlbum');  //__dirname +

        upload(req, res, function () {
            let albumArgs = req.body;
            // console.log(photoArgs)
            albumArgs.author = req.user.id;
            var nameNewAlbum = albumArgs.nameAlbum;
            var descriptionNewAlbum = albumArgs.descriptionAlbum;


            var newAlbumUp = new Album({
                name: nameNewAlbum,
                description: descriptionNewAlbum,
                author: albumArgs.author
            });
            var _id = newAlbumUp._id;

            if(albumArgs.photocheckAlbum.toString() === "publicvisible") {
                newAlbumUp.public = true;
            }
            else{
                newAlbumUp.public = false;
            }
            console.log(newAlbumUp.public);

            Album.create(newAlbumUp).then(newAlbum => {
                newAlbum.prepareUploadAlbum();

            });

            let counter = 1

            req.files.forEach(function (item) {

                var photoUp = new Photo({
                    fieldname: item.fieldname,
                    originalname: item.originalname,
                    encoding: item.encoding,
                    mimetype: item.mimetype,
                    destination:item.destination,
                    filename: item.filename,
                    path: item.path,
                    size: item.size,
                    author: albumArgs.author,
                    description: albumArgs[counter.toString()],
                    album: _id
                });

                counter += 1;
                if(albumArgs.photocheckAlbum.toString() == "publicvisible"){
                    photoUp.public = true;
                }
                else
                {
                    photoUp.public = false;
                }



                Photo.create(photoUp).then(photo => {
                        photo.prepareUpload();
                        photo.prepareUploadInAlbum(photoUp.album);
                    }
                )
            });
        })

        res.redirect('/user/uploadPhotos');
    }

}
