const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index')
  })

  app.get('/user/profile', controllers.userController.profilePageGet)

  app.get('/user/register', controllers.userController.registerGet)
  app.post('/user/register', controllers.userController.registerPost)
}
