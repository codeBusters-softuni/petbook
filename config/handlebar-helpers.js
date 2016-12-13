// This module registers our helper functions for handlebars
const handlebars = require('hbs')

// Tells us if the user has liked a post/photo
let hasLiked = function (likes, user, options) {
  if (likes.findIndex((like) => { return like.author.equals(user) }) !== -1) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

// Function that says if this is the logged in user
let isSameUser = function (userId, userId2, options) {
  if (userId === userId2) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

// Join an array of categories to return a string. Ex: ['cat', 'dog', 'parrot'] => cats, dogs and parrots
let joinCategoriesString = function (arr) {
  // make the categories plural
  arr = arr.map((category) => {
    return category + 's'
  })
  let resultString = arr.join(', ')
  let lastCommaIdx = resultString.lastIndexOf(',')
  if (lastCommaIdx !== -1) {
    resultString = resultString.substr(0, lastCommaIdx) + ' and ' + resultString.substr(lastCommaIdx + 1)
  }
  return resultString
}

handlebars.registerHelper({
  hasPawed: hasLiked,
  hasDisliked: hasLiked,
  hasLoved: hasLiked,
  isSameUser: isSameUser,
  joinCategoriesString: joinCategoriesString
})
