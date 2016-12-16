// show thumbnail photos when upload from post
$(document).ready(function () {
    uploadPhotosFromPost();
})

function createPhotoHTMLinPost() {
    var output = document.getElementById("result-photos-in-post");

    var picFile = event.target;

    var article = document.createElement("article");
    article.className += "pic-container-article-in-post col-xs-12 col-sm-5 col-md-4";
    var section = document.createElement("section");

    section.className += " photo-cntnr";
    // section.innerHTML = "<a href='#' class='close remove_pict'>&times;</a>";
    article.appendChild(section);

    var div = document.createElement("div");
    div.className += "album-photo-content";
    section.appendChild(div);
    photoIndex += 1;
    div.innerHTML = "<img class='' src='" + picFile.result + "'" + "title='" + photoIndex + "'/>"

    var textarea = document.createElement("textarea");
    textarea.className += "cstm-input-register-style input-cstm-style";
    textarea.setAttribute("placeholder", "Say something about this photo...");
    textarea.setAttribute("name", photoIndex.toString() ); //  the photo's unique index, used to pair it with it's description
    textarea.setAttribute("rows", "3");
    textarea.setAttribute("cols", "30");
    section.appendChild(textarea);


    output.insertBefore(article, null);
}

function showPhotoInPost() {
    // console.log("Yes")
    var picContainerArticle = document.getElementsByClassName('pic-container-article-in-post');
    for (var i = picContainerArticle.length - 1; i >= 0; i--) {
        if (picContainerArticle[i] && picContainerArticle[i].parentNode) {
            picContainerArticle[i].parentNode.removeChild(picContainerArticle[i]);

        }
    }

    var files = event.target.files; //FileList object
    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if (!file.type.match('image')) { // only pictures should be read
            continue;
        }

        var picReader = new FileReader();

        picReader.addEventListener("load", createPhotoHTMLinPost);
        picReader.readAsDataURL(file);  // Read the image
    }
}

function uploadPhotosFromPost() {
    var filesInputInPost = document.getElementById('addPhotoToPost');
    // console.log("Yes")
    if (filesInputInPost!=null){
        filesInputInPost.addEventListener("change", showPhotoInPost);
    }

}

// show images when click on them and move next and prev

$(document).ready(function() {
    var img = $('.newsfeed-post-images .newsfeed-images img'); // selects all images
    var imgArticles = $('.newsfeed-post-images .newsfeed-images article');
    var lightBox = document.getElementById('box');
    var boxImages = document.createElement('div')
    boxImages.className +=" box-image"
    lightBox.insertBefore(boxImages, null)

    var currImgClone;

    // var description = $('.photo-description .description');
    var nextBtn = $('.next-newsfeed');
    var prevBtn = $('.prev-newsfeed');
    var closeLightBox = $('.close-light-box');

    var currentImg = '';
    var nextImg = '';
    var prevImg = '';

    var indexImg = 0;
    var indexArticle = 0;

    //open first image
    img.on('click', function() {
        indexImg = img.index($(this));
        indexArticle = indexImg;

        currImgClone = imgArticles.eq(indexArticle).addClass("selected")
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-4").appendTo(boxImages)

        $(this).parent().closest('.newsfeed-post-images').siblings().removeClass('newsfeed-post-images')
        img = $('.newsfeed-post-images .newsfeed-images img');

        imgArticles = $('.newsfeed-post-images .newsfeed-images article');


        nextImg = $(this).parent().closest('article').next().find('img');

        prevImg = $(this).parent().closest('article').prev().find('img');

        indexImg = img.index($(this));
        indexArticle = indexImg;

        $('#box').css('display', 'block');

        display();

    });

//    click on NEXT button
    nextBtn.on('click', function(e) {
        if(!nextImg.is('img')) {
            nextImg = img.first();
        }
        removeByClass('box-image', 'selected')

        imgArticles.eq(indexArticle).removeClass("selected")
        currentImg = nextImg;
        indexImg = img.index(currentImg);
        indexArticle = indexImg;

        currImgClone = imgArticles.eq(indexArticle).addClass("selected")
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-4").appendTo(boxImages)


        // var currentSrc = currentImg.attr('src');
        prevImg = currentImg.parent().closest('article').prev().find('img');
        nextImg = currentImg.parent().closest('article').next().find('img');


        display();
    });

//    click on PREV button
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
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-4").appendTo(boxImages)


        // var currentSrc = prevImg.attr('src');

        nextImg = currentImg.parent().closest('article').next().find('img');
        prevImg = currentImg.parent().closest('article').prev().find('img');


        display();
    });

//    click on CLOSE button
    closeLightBox.on('click', function() {
        removeByClass('box-image', 'selected')
        imgArticles.eq(indexArticle).removeClass("selected")

        currentImg.parent().closest('.post-view').siblings().addClass('newsfeed-post-images');

        img = $('.newsfeed-post-images .newsfeed-images img');
        imgArticles = $('.newsfeed-post-images .newsfeed-images article');

        $('#box').css('display', 'none');
    });

    function removeByClass(classParent, className) {
        $("." +classParent +" " + "."+className).remove();
    }

    //display LIGHT BOX IMAGE
    function display() { //, indexFooter, indexDescription
        $('.box-image')
    }
});

