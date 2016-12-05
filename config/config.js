const path = require('path')

module.exports.initialize = () => {
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }

  return {
    development: {
      rootFolder: path.normalize(path.join(__dirname, '/../')),
      connectionString: 'mongodb://localhost:27017/petbook'
    },
    production: {}
  }
}



