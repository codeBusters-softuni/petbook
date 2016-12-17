// show thumbnail photos when upload from post
$(document).ready(function () {

    uploadProfilePhoto();
})

function createProfilePhotoHTML() {
    var output = document.getElementById("result-profile-photo");

    var picFile = event.target;

    var article = document.createElement("article");
    article.className += "pic-container-article-in-post";
    var section = document.createElement("section");

    section.className += " photo-cntnr";
    article.appendChild(section);

    var div = document.createElement("div");
    div.className += "album-photo-content";
    section.appendChild(div);
    photoIndex += 1;
    div.innerHTML = "<img class='' src='" + picFile.result + "'" + "title='" + photoIndex + "'/>"
    output.insertBefore(article, null);
    var uploadButton = $('#upload-profile-pic');
    uploadButton.css("display", "block")
}

function showProfilePhoto() {
    // console.log("Yes")
    var picContainerArticle = document.getElementsByClassName('pic-container-article-in-post');
    for (var i = picContainerArticle.length - 1; i >= 0; i--) {
        if (picContainerArticle[i] && picContainerArticle[i].parentNode) {
            picContainerArticle[i].parentNode.removeChild(picContainerArticle[i]);

        }
    }

    var files = event.target.files;
    var file = files[0];//FileList object
    // for (var i = 0; i < file.length; i++) {
        if (!file.type.match('image')) { // only pictures should be read
            // continue;
        }

        var picReader = new FileReader();

        picReader.addEventListener("load", createProfilePhotoHTML);
        picReader.readAsDataURL(file);  // Read the image
    // }
}

function uploadProfilePhoto() {

    var fileInputPhoto = document.getElementById('addProfilePhoto');
    // console.log("Yes")
    if (fileInputPhoto != null) {
        fileInputPhoto.addEventListener("change", showProfilePhoto);
    }
}



$(document).ready(function() {
    var img = $('.profile-post-images .profile-images img'); // selects all images
    var imgArticles = $('.profile-post-images  .profile-images article'); // select all articles that contain images and buttons
    var lightBox = document.getElementById('box-profile-photos'); // select lightbox
    if(lightBox!=null){
        var boxImages = document.createElement('div') // create div that contains the image
        boxImages.className +=" box-image" // give that div class
        lightBox.insertBefore(boxImages, null) // insert that div in the lightbox

        var currImgClone; // initialize the clone of the article with img and buttons what we will show in the lightbox

        // var description = $('.photo-description .description');
        var nextBtn = $('.next-profile-photos'); // get next button
        var prevBtn = $('.prev-profile-photos'); // get prev button
        var closeLightBox = $('.close-light-box'); // get close button

        // initialize images to swap
        var currentImg = img.eq(1); //it is needed because if user open 1 pic and then click on close, it gives error
        var nextImg = '';
        var prevImg = '';

        var indexImg = 0; //initialize index of clicked image
        var indexArticle = 0; //initialize index of the article that contains clicked image and its buttons

        //open first image
        img.on('click', function() {
            indexImg = img.index($(this)); // assign var to the index of the image that user clicked on
            indexArticle = indexImg; // assign var to the index of the image that user clicked on - they are the same

            currImgClone = imgArticles.eq(indexArticle).addClass("selected") //add class "selected" to the article that contains the selected image and buttons
            $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-6 col-lg-6").appendTo(boxImages) // clone the selected article and append it to the div container that should contain the selected image

            //So that in newsfeed we have many different post and we need to see only the photos from one specific post
            // we remove the class newsfeed-post-images from all the post but the one that we want to see the images from
            $(this).parent().closest('.profile-post-images').siblings().removeClass('profile-post-images')
            img = $('.profile-post-images .profile-images img'); // then again assign the img Array to contain only images from that post

            imgArticles = $('.profile-post-images .profile-images article'); // and assign the article Array to contain only that articles(that contain the images) from that specific post


            nextImg = $(this).parent().closest('article').next().find('img'); //define next img

            prevImg = $(this).parent().closest('article').prev().find('img');  //define prev img

            indexImg = img.index($(this)); //define index of clicked image
            indexArticle = indexImg; //define index of the article that contains clicked image and its buttons

            $('#box-profile-photos').css('display', 'block'); // lightbox become visible
            $('#backdrop-profile-photos').css('display', 'block')

            display(); // call display function

        });

//    click on NEXT button
        nextBtn.on('click', function(e) {
            if(!nextImg.is('img')) { //if next img is undefined
                nextImg = img.first(); // next img becomes the first from the img array
            }
            removeByClass('box-image', 'selected') //on next click we should remove the article with the special "selected" class
// and give that class to the next article which becomes current photo - currImgClone
            imgArticles.eq(indexArticle).removeClass("selected") //remove special class from the articles Array too,
            //so that when we give that special class to the next article then we can select it
            currentImg = nextImg; // current image becomes the next image
            indexImg = img.index(currentImg); //define index of clicked image
            indexArticle = indexImg; //define index of the article that contains clicked image and its buttons

            currImgClone = imgArticles.eq(indexArticle).addClass("selected") //add class "selected" to the article that contains the selected image and buttons
            $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-6 col-lg-6").appendTo(boxImages) // clone the selected article and append it to the div container that should contain the selected image

            prevImg = currentImg.parent().closest('article').prev().find('img'); //define prev img
            nextImg = currentImg.parent().closest('article').next().find('img');    //define next img

            // call display function
            display();
        });

//    click on PREV button  // same as next!!
        prevBtn.on('click', function() {
            if(!prevImg.is('img')) {
                prevImg = img.last();
            }

            removeByClass('box-image', 'selected')
            imgArticles.eq(indexArticle).removeClass("selected")
            currentImg = prevImg;
            indexImg = img.index(currentImg);
            indexArticle = indexImg;

            currImgClone = imgArticles.eq(indexArticle).addClass("selected")
            $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-6 col-lg-6").appendTo(boxImages)

            nextImg = currentImg.parent().closest('article').next().find('img');
            prevImg = currentImg.parent().closest('article').prev().find('img');


            display();
        });

//    click on CLOSE button
        closeLightBox.on('click', function() {
            removeByClass('box-image', 'selected') //on close click we should remove the article with the special "selected" class
            imgArticles.eq(indexArticle).removeClass("selected") //remove special class from the articles Array too,
//so that when we give that special class to the next image when click on it
            if(img.length>=1){
                currentImg.parent().closest('.post-view').siblings().addClass('profile-post-images'); // add to all post that class so that user can click on another img from another post and start lightbox again
            }

            img = $('.profile-post-images .profile-images img'); // selects all images
            imgArticles = $('.profile-post-images .profile-images article');  // select all articles that contain images and buttons

            $('#box-profile-photos').css('display', 'none'); // give style display: none to lightbox so that it is not visible
            $('#backdrop-profile-photos').css('display', 'none');

        });

        function removeByClass(classParent, className) { // on click on next or prev button, remove the current article(that contains img and buttons)
            $("." +classParent +" " + "."+className).remove();
        }

        //display LIGHT BOX IMAGE
        function display() { // display lightbox
            $('.box-image')
        }
    }

});

// function to show lightbox and backdrop at the position of the scroll
$(document).ready(function () {

    $(window).on("scroll", function () {
        var scrollPoint = $(this).scrollTop();
        pictureBoxPosition(scrollPoint)
    });

    function pictureBoxPosition(scroll) {
        $('#box-profile-photos').css('top', scroll+100+'px' );
        $('#backdrop-profile-photos').css('top', scroll+'px' );
    }
})