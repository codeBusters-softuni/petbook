const mongoose = require('mongoose')
const Photo = require('mongoose').model('Photo')
const Album = require('mongoose').model('Album')
const Post = mongoose.model('Post')

// For uploading photos!!!
var formidable = require('formidable');
var multer  =   require('multer');

var dest = __dirname.toString().split('\\');
dest[dest.length-1] = "public";
dest = dest.join('\\');
var upload = multer({ dest: dest + '/uploads/'}).array('uploadedPhotos');
// up to here for uploading photos!!!

module.exports = {
    allGet: (req, res) => {
        if(!req.user){
            let returnUrl = '/user/uploadPhotos';
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        res.render('user/uploadPhotos');


    },

    uploadPhotosPost: (req, res) =>{
        let albumArgs = req.body;
        albumArgs.author = req.user.id;

        var classForCss;
        var albumUp = new Album();

        var _id = albumUp._id;

            Album.findOne({name: "Your photos from NewsFeed" + " " + albumArgs.author}).then(album =>{
                if(!album){
                    albumUp.name = "Your photos from NewsFeed"+" "+albumArgs.author;
                    albumUp.author = albumArgs.author;
                    albumUp.public = true;
                    albumUp.classCss = "Your-photos-from-NewsFeed-DbStyle";

                    Album.create(albumUp).then(newAlbum =>{
                        newAlbum.prepareUploadAlbum();
                        _id = newAlbum._id;
                        classForCss = newAlbum.classCss;
                    });
                }
                else{
                    _id = album._id;
                    classForCss = album.classCss;
                }
            }).then(() => {
                upload(req, res, function () {

                    // logic for the post
                    var newPostArg = req.body
                    var newPost = new Post({
                        author: req.user._id,
                        category: req.user.category,
                        content: newPostArg.descriptionPostPhotos
                    })

                    if (newPost.content.length < 1) {
                        // ERROR - Content is too short!
                        // TODO: Attach an error message to req.session.errorMsg which will be displayed in the HTML
                        req.session.failedPost = newPost  // attach the post content to be displayed on the redirect
                        res.redirect('/')
                        return
                    }

                    if (newPostArg.photocheck.toString() === "publicvisible") {
                        newPost.public = true;
                    }

                    // TODO: Once User can set if he wants his post to be public or not, add functionality here
                    var _idNewPost = newPost._id;
                    Post.create(newPost).then(post => {
                        _idNewPost = post._id;
                    })


                    //Logic for the upload of photos

                    let photoArgs = req.body;
                    photoArgs.author = req.user.id;
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
                            author: photoArgs.author,
                            description: photoArgs[counter.toString()],
                            album: _id,
                            post: _idNewPost,
                            classCss: classForCss
                        });

                        counter += 1;
                        if(photoArgs.photocheck.toString() == "publicvisible"){
                            photoUp.public = true;
                        }
                        else
                        {
                            photoUp.public = false;
                        }

                        Photo.create(photoUp).then(photo => {
                                photo.prepareUploadSinglePhotos(photoUp.album);
                                photo.prepareUploadInPost(photoUp.post);
                            }
                        )

                    });
                })

                res.redirect('/')
            })
    }
};