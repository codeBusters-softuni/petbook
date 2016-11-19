const controllers = require('./../controllers')

module.exports = (app) => {
  app.get('/', () => { console.log('Home page accessed!') })
}
