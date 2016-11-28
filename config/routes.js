const controllers = require('./../controllers')

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
  app.get('/user/:id', controllers.userController.profilePageGet)  // must be below other user urls!

  app.post('/post/add', controllers.postController.addPost)
  app.post('/post/:id/addComment', controllers.postController.addComment)
  // Like a post
  app.post(/post\/(.+)\/add(.{3,7})/, controllers.postController.addLike)
}
