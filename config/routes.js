const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index')
  })

  app.get('/user/profile', controllers.userController.profilePageGet)
  app.post('/user/profile', (req, res) => {
    //Here is POST request
  })

  app.get('/user/register', controllers.userController.registerGet)
  app.post('/user/register', (req, res) => {
    //Here is POST request
  })
}
