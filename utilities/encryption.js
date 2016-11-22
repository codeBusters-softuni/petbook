const encryption = require('crypto')

module.exports = {
  generateSalt: () => {
    // Generates a random 128-bit salt
    return encryption.randomBytes(128).toString('base64')
  },

  hashPassword: (password, salt) => {
    // Uses the salt to hash the password
    return encryption.createHmac('sha256', salt).update(password).digest('hex')
  }
}
