const path = require('path')

module.exports = {
  test: {
    rootFolder: path.normalize(path.join(__dirname, '/../')),
    connectionString: 'mongodb://localhost:27017/petbook_test'
  },
  development: {
    rootFolder: path.normalize(path.join(__dirname, '/../')),
    connectionString: 'mongodb://localhost:27017/petbook'
  },
  production: {}
}

module.exports.initialize = () => {
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }
  Number.prototype.getPagesArray = function () {
    // get an array of all the pages we want to display in articles/list
    let pages = []
    for (let i = 1; i <= this; i++) {
      pages.push(i)
    }
    return pages
  }
}
