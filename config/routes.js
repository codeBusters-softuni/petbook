const controllers = require('./../controllers')
const photoController = require('./../controllers/photo-controller');
const albumController = require('./../controllers/album-controller');

module.exports = (app) => {
  app.get('/', controllers.homeController.homePageGet)

  app.get('/user/register', controllers.userController.registerGet)
  app.post('/user/register', controllers.userController.registerPost)
  app.post('/user/login', controllers.userController.loginPost)

  app.get('/user/logout', controllers.userController.logout)

  // EVERYTHING BELOW REQUIRES AUTHENTICATION
  app.use((req, res, next) => {
    if (!req.isAuthenticated()) {
      req.session.returnUrl = req.url
      res.redirect('/')  // lets the user log in. The loginPost function returns him to the URL he originally wanted to visit
    } else {
      next()
    }
  })

  app.get('/category/:category', controllers.categoryController.showArticles)
  // app.get('/user/uploadPhotos', photoController.allGet)
  app.get('/user/uploadPhotos', controllers.homeController.userOwnPhotosGet)  //allGet

  app.get('/user/:id', controllers.userController.profilePageGet)  // must be below other user urls!
  app.post('/friendRequest/:receiverId/send', controllers.friendRequestController.sendRequest)
  app.post('/friendRequest/:id/accept', controllers.friendRequestController.acceptRequest)
  app.post('/friendRequest/:id/decline', controllers.friendRequestController.declineRequest)

  app.get('/friendRequests', controllers.friendRequestController.showRequests)

  app.post('/post/add', controllers.postController.addPost)
  app.post('/post/:id/addComment', controllers.postController.addComment)
  // Like a post
  app.post(/post\/(.+)\/add(.{3,7})/, controllers.postController.addLike)
  // Dislike a post
  app.post(/post\/(.+)\/remove(.{3,7})/, controllers.postController.removeLike)


  //Upload single photos in default album
  app.post('/photo/all/single', photoController.uploadPhotosPost)
    //Upload album with photos
  app.post('/photo/all/album', albumController.uploadAlbum)

}
