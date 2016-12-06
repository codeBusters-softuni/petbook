const Photo = require('mongoose').model('Photo');

// For uploading photos!!!
var formidable = require('formidable');
var multer  =   require('multer');


var storage =   multer.memoryStorage({ //diskStorage
    destination: function (req, file, callback) { //file   ???
        callback(null, __dirname + '/uploads/');
    },
    filename: function (req, file, callback) {  //file    ???
        var originalname = file.originalname;  //file  ???
        var extension = originalname.split(".");
        callback(null, file.fieldname + '-' + Date.now()+ '.' + extension[extension.length-1]);  //file   ???
    }
});
var upload = multer({ dest: __dirname + '/uploads/'}).array('uploadedPhotos');
// up to here for uploading photos!!!


module.exports = {
    allGet: (req, res) => {
        console.log(req.user)
        if(!req.user){
            console.log('HERE')
            let returnUrl = '/user/uploadPhotos';
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        res.render('user/uploadPhotos');


    },

    uploadPhotosPost: (req, res) =>{
        upload(req, res, function () {
            let photoArgs = req.body;
            console.log(photoArgs)
            photoArgs.author = req.user.id;
            let counter = 0
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
                    author: photoArgs.author
                });
                counter += 1
                console.log(photoArgs[counter.toString()])
                console.log(item.originalname)
                if(photoArgs.photocheck.toString() == "publicvisible"){
                    photoUp.public = true;
                }
                else
                {
                    photoUp.public = false;
                }

                // photoUp.save(function (err, resp) {
                //     if(err){
                //         console.log(err);
                //         res.send({
                //             message :'something went wrong'
                //         });
                //     }
                //     else {
                //         // res.send({
                //         //     message:'the photos has bees saved'
                //         // });
                //     }
                // });

                Photo.create(photoUp).then(photo => {
                        photo.prepareUpload();
                    }
                )


            });
        })


        res.render('user/uploadPhotos');
    }
};