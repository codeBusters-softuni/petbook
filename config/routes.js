const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', controllers.homeController.homePageGet)

  app.get('/user/register', controllers.userController.registerGet)
  app.post('/user/register', controllers.userController.registerPost)
  app.post('/user/login', controllers.userController.loginPost)
  app.get('/user/:id', controllers.userController.profilePageGet)  // must be below other user urls!
}
