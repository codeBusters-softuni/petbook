module.exports = {
  homePageGet: (req, res) => {
    if (req.user) {
      // load all the articles that the user should see
      let allPosts = []
      res.render('user/newsfeed', { posts: allPosts, failedPost: req.session.failedPost })
    } else {
      res.render('index')
    }
  }
}
