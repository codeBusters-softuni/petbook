const User = require('mongoose').model('User')
const Post = require('mongoose').model('Post')
const Photo = require('mongoose').model('Photo')
const Album = require('mongoose').model('Album')

module.exports = {
    homePageGet: (req, res) => {
        if (req.user) {
            // load all the articles that the user should see
            Post.find({category: req.user.category}).then(categoryPosts => {
                Post.find({public: true}).then(publicPosts => {
                    // save the public posts that are not already in the category posts
                    publicPosts = publicPosts.filter((item) => {  // for every public post
                        return categoryPosts.findIndex((post) => {  // get his index in categoryPosts
                                return post._id.equals(item._id)          // using _id comparison
                            }) === -1                                   // if it's -1, it's not in categoryPosts, so its left publicPosts
                    })
                    // join the two arrays
                    let postsToSee = categoryPosts.concat(publicPosts)

                    Post.populate(postsToSee, 'author comments likes photos').then(() => {
                        // populate each comment's author. Must be done after the initial populate
                        Post.populate(postsToSee, {path: 'comments.author', model: 'User'}).then(() => {
                            postsToSee = Post.initializeForView(postsToSee)

                            res.render('user/newsfeed', {posts: postsToSee, failedPost: req.session.failedPost})
                        })
                    })
                })
            })
        } else {
            res.render('index')
        }
    },

    userOwnPhotosGet: (req, res) => {
        if (req.user) {
// Need to look in the user collection by user Id and from there get the photos id ....  !!!!!
//             Photo.find({author: req.user.id}).then(photos => {  //populate('destination filename')
//                 res.render('user/uploadPhotos', {photos: photos});
//             })
            User.findById(req.user.id).populate('photos').then(user => {
                res.render('user/uploadPhotos', {photos: user.photos});
            })



        }
        else {
            res.render('index')
        }
    }

}
