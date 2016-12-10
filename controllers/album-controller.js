const mongoose = require('mongoose')
const Album = require('mongoose').model('Album');
const Photo = require('mongoose').model('Photo');
const Post = mongoose.model('Post')

// For uploading photos!!!
var formidable = require('formidable');
var multer  =   require('multer');

module.exports = {
    createAlbumGet: (req, res) => {
        if(!req.user){
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
        var upload = multer({ dest: dest +'/uploads/'}).array('uploadAlbum');

        upload(req, res, function () {

            // logic for the post
            var newPostArg = req.body
            var newPost = new Post({
                author: req.user._id,
                category: req.user.category,
                content: newPostArg.descriptionAlbum
            })

            if (newPost.content.length < 1) {
                // ERROR - Content is too short!
                // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
                req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
                res.redirect('/')
                return
            }

            if (newPostArg.photocheckAlbum.toString() === "publicvisible") {
                newPost.public = true;
            }

            // TODO: Once User can set if he wants his post to be public or not, add functionality here
            var _idNewPost = newPost._id;
            Post.create(newPost).then(post => {
                _idNewPost = post._id;
            })


            let albumArgs = req.body;
            albumArgs.author = req.user.id;
            var nameNewAlbum = albumArgs.nameAlbum;
            var descriptionNewAlbum = albumArgs.descriptionAlbum;
            var classForCss = nameNewAlbum.split(' ').filter(function(n){return n!=""});
            classForCss = classForCss.join('-')+"-DbStyle";

            var newAlbumUp = new Album({
                name: nameNewAlbum,
                description: descriptionNewAlbum,
                author: albumArgs.author,
                classCss: classForCss
            });
            var _id = newAlbumUp._id;

            if(albumArgs.photocheckAlbum.toString() === "publicvisible") {
                newAlbumUp.public = true;
            }
            else{
                newAlbumUp.public = false;
            }

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
                    album: _id,
                    post: _idNewPost,
                    classCss: classForCss
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
                        photo.prepareUploadInPost(photoUp.post);
                    }
                )
            });
        })
        res.redirect('/')
    }

}
