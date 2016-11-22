const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', controllers.homeController.homePageGet)

  app.get('/user/profile', controllers.userController.profilePageGet)

  app.get('/user/register', controllers.userController.registerGet)
  app.post('/user/register', controllers.userController.registerPost)
}
