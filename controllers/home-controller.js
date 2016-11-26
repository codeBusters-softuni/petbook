module.exports = {
  homePageGet: (req, res) => {
    if (req.user) {
      // load all the articles that the user should see
      let allPosts = []
      res.render('user/newsfeed', { posts: allPosts })
    } else {
      res.render('index')
    }
  }
}
