const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.render('index')
  })

  app.get('/user/profile', (req, res) => {
    res.render('user/profile')
  })
  app.post('/user/profile', (req, res) => {
    //Here is POST request
  })

  app.get('/user/register', (req, res) => {
    res.render('user/register')
  })
  app.post('/user/register', (req, res) => {
    //Here is POST request
  })
}
