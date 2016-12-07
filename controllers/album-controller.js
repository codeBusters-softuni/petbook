const Album = require('mongoose').model('Album');

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
    }



}
