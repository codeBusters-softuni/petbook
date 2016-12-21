const mongoose = require('mongoose')
const Category = mongoose.model('Category')
const User = mongoose.model('User')

const constants = require('../config/constants')
const categories = constants.categories
const usersPerPage = constants.usersPerPage


function getUsersInPage(page, allPosts, usersPerPage) {
  // get the start and end index for the appropriate posts in the array
  let startIndex = page * usersPerPage
  let endIndex = startIndex + usersPerPage
  let pageCount = Math.ceil(allPosts.length / usersPerPage)
  let pages = pageCount.getPagesArray()  // an array of the pages - ex: [1,2,3] if we have 60 elements
  let usersInPage = allPosts.slice(startIndex, endIndex)  // slice here for optimization
  return [usersInPage, pages]
}

module.exports = {
  userSearchPost: (req, res) => {
    let searchValue = req.body.searchValue
    if (!searchValue) {
      // ERROR - You cannot search for nothing
      req.session.errorMsg = "Sorry, we couldn't understand this search. Please try saying this another way."
      res.redirect('/')
    }

    User.find({ fullName: { $regex: searchValue, $options: 'i' } }).populate('category profilePic pendingFriendRequests').then(users => {
      // attach a friendStatus object to each user, displaying thier relationship with the user doing the search
      users = users.map(user => {
        user.friendStatus = req.user.getFriendStatusWith(user)  // we need the req.user's viewpoint
        return user
      })
      res.render('user/searchOutput', { users: users, categories: categories })
    })
  },

  showUsersOfCategory: (req, res) => {
    let page = parseInt(req.query.page || '1') - 1
    let category = req.params.category.toLowerCase().capitalize()

    if (categories.indexOf(category) === -1) {
      req.session.errorMsg = `Category ${category} does not exist!`
      res.redirect('/')
      return
    }
    Category.findOne({ name: category }).then(cat => {
      if (!cat) {
        req.session.errorMsg = `Category ${category} does not exist!`
        res.redirect('/')
        return
      }
      // get all the users of this category
      User.find({ category: cat.id }).sort({ friends: -1 }).populate('pendingFriendRequests category profilePic').then(users => {
        let [usersToShow, pages] = getUsersInPage(page, users, usersPerPage)

        // attach a friendStatus object to each user, displaying thier relationship with the user doing the search
        usersToShow = usersToShow.map(user => {
          user.friendStatus = req.user.getFriendStatusWith(user)  // we need the req.user's viewpoint
          return user
        })
        res.render('user/searchOutput', { users: usersToShow, categories: categories, pages: pages, selectedPage: page + 1 })
      })
    })
  }
}
