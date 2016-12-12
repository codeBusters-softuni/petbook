/**
 * this module exports an object holding ANOTHER OBJECT holding functions for each of the pages the controllers manages
 * ex: homeControllers returns an object holding as key the page and as value a functions
 * {
    index: (req, res) => {
      res.render('home/index')
    },
    about: (req, res) => {
      res.render('home/about')
    }
   }
 */
const homeController = require('./home-controller')
const faqController = require('./faq-controller')
const userController = require('./user-controller')
const postController = require('./post-controller')
const categoryController = require('./category-controller')
const photoController = require('./photo-controller')
const albumController = require('./album-controller')
const friendRequestController = require('./friendrequest-controller')

module.exports = {
  userController,
  homeController,
  faqController,
  postController,
  categoryController,
  friendRequestController,
  photoController,
  albumController
}
