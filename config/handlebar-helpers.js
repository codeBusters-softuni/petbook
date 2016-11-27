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

handlebars.registerHelper({
  hasPawed: hasLiked,
  hasDisliked: hasLiked,
  hasLoved: hasLiked
})