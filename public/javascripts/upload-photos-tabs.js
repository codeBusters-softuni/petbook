// Javascript used to load the photos and change tabs in the user's photos tab
var photoIndex = 0

function createPhotoHTML(event) {  // picReader.addEventListener("load",function(event)
    var output = document.getElementById("result");

    var picFile = event.target;

    var article = document.createElement("article");
    article.className += "pic-container-article col-xs-12 col-sm-5 col-md-4";
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
    textarea.setAttribute("name", photoIndex.toString()); //  the photo's unique index, used to pair it with it's description
    textarea.setAttribute("rows", "3");
    textarea.setAttribute("cols", "30");
    section.appendChild(textarea);


    output.insertBefore(article, null);
}

function showPhoto(event) {
    var picContainerArticle = document.getElementsByClassName('pic-container-article');
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

        picReader.addEventListener("load", createPhotoHTML);
        picReader.readAsDataURL(file);  // Read the image
    }
};

function switchTab(index) {
    var filesInput = "";
    if (index == 2) {
        filesInput = document.getElementById("uploadPhotos");
    }
    else {
        filesInput = document.getElementById("uploadAlbum");
    }

    filesInput.removeEventListener("change", showPhoto);
    photoIndex = 0;  // reset the index
    filesInput.addEventListener("change", showPhoto);
};

//add active section in add picture in album page
$(document).ready(function () {


    var title = $('#upload-photos'),
        activeTitle = $('#upload-photos>h2'),
        content = $('#upload-photos>ul>li'),
        titleContainer = [],
        titleIndex = '',
        fieldsetArea = $('#upload-photos fieldset'),
        picContainer = $('#upload-photos output');

    title.each(function () {
        titleContainer = $(this).find('>h2');
    });

    if (titleContainer.length > 0) {


        titleContainer.on('click', function () {
            titleIndex = $(this).index();
            picContainer.removeAttr("id");

            activeTitle.eq(titleIndex).addClass('active-title')
                .siblings().removeClass('active-title');

            content.eq(titleIndex)
                .addClass('active-section')
                .siblings().removeClass('active-section');

            picContainer.eq(titleIndex - 1).attr("id", "result");
            // remove the loaded pictures
            var picContainerArticle = document.getElementsByClassName('pic-container-article');
            for (var i = picContainerArticle.length - 1; i >= 0; i--) {
                if (picContainerArticle[i] && picContainerArticle[i].parentNode) {
                    picContainerArticle[i].parentNode.removeChild(picContainerArticle[i]);
                }
            }

            switchTab(titleIndex);

            var sendbtn = "";
            var browsePhotos = "";
            if (titleIndex - 1 == 1) {
                checker = $('#check-before-send');
                sendbtn = $('#publish-photos');
            }
            else { //if (titleIndex - 1 == 0)
                checker = $('#check-before-send-album');
                sendbtn = $('#publish-album');
            }
            browsePhotos = $('.add-photo-button');

            sendbtn.attr("disabled", "disabled");
            checker.on('click', function () {
                if (this.checked) {
                    sendbtn.removeAttr('disabled');
                    checker.attr("disabled", "disabled");
                    browsePhotos.css("display", "none");
                    if (titleIndex == 2) {
                        fieldsetArea.eq(0).attr("disabled", "disabled");
                    } else {
                        fieldsetArea.eq(1).attr("disabled", "disabled");
                    }
                }
            });
        });
    }
});

//add active section in tab Photos in uploadPhotos view
$(document).ready(function () {
    var tab = $('#view-tabs-in-photos'),
        activeTab = $('#view-tabs-in-photos h2.photos-tabs'),
        contentTabs = $('#view-tabs-in-photos>ul>li'),
        tabContainer = [],
        tabIndex = '';

    tab.each(function () {
        tabContainer = $(this).find('h2.photos-tabs');
    });

    if (tabContainer.length > 0) {


        tabContainer.on('click', function () {
            tabIndex = $(this).index();

            activeTab.eq(tabIndex).addClass('active-tab')
                .siblings().removeClass('active-tab');

            contentTabs.eq(tabIndex)
                .addClass('active-tab-section')
                .siblings().removeClass('active-tab-section');
        });
    }
});


// // show images when click on them and move next and prev

$(document).ready(function() {
    var img = $('.images img'); // selects all images
    console.log(img)
    var imgArticles = $('.images article'); // select all articles that contain images and buttons
    console.log(imgArticles)
    var lightBox = document.getElementById('box'); // select lightbox
    var boxImages = document.createElement('div') // create div that contains the image
    boxImages.className +=" box-image" // give that div class
    lightBox.insertBefore(boxImages, null) // insert that div in the lightbox

    var currImgClone; // initialize the clone of the article with img and buttons what we will show in the lightbox

    // var description = $('.photo-description .description');
    var nextBtn = $('.next'); // get next button
    var prevBtn = $('.prev'); // get prev button
    var closeLightBox = $('.close-light-box'); // get close button

    // initialize images to swap
    var currentImg = '';
    var nextImg = '';
    var prevImg = '';

    var indexImg = 0; //initialize index of clicked image
    var indexArticle = 0; //initialize index of the article that contains clicked image and its buttons

    //open first image
    img.on('click', function() {
        indexImg = img.index($(this)); // assign var to the index of the image that user clicked on
        indexArticle = indexImg; // assign var to the index of the image that user clicked on - they are the same

        currImgClone = imgArticles.eq(indexArticle).addClass("selected") //add class "selected" to the article that contains the selected image and buttons
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-3").appendTo(boxImages) // clone the selected article and append it to the div container that should contain the selected image

        nextImg = $(this).parent().closest('article').next().find('img'); //define next img
        // console.log(nextImg)

        prevImg = $(this).parent().closest('article').prev().find('img'); //define prev img
        // console.log(prevImg)

        indexImg = img.index($(this)); //define index of clicked image
        indexArticle = indexImg; //define index of the article that contains clicked image and its buttons

        $('#box').css('display', 'block'); // lightbox become visible

        display(); // call display function

    });

//    click on NEXT button
    nextBtn.on('click', function(e) {
        // console.log(nextImg)
        if(!nextImg.is('img')) {  //if next img is undefined
            nextImg = img.first(); // next img becomes the first from the img array
        }
        removeByClass('box-image', 'selected') //on next click we should remove the article with the special "selected" class
// and give that class to the next article which becomes current photo - currImgClone
        imgArticles.eq(indexArticle).removeClass("selected") //remove special class from the articles Array too,
        //so that when we give that special class to the next article then we can select it
        currentImg = nextImg;  // current image becomes the next image
        indexImg = img.index(currentImg); //define index of clicked image
        indexArticle = indexImg;  //define index of the article that contains clicked image and its buttons

        currImgClone = imgArticles.eq(indexArticle).addClass("selected") //add class "selected" to the article that contains the selected image and buttons
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-3").appendTo(boxImages) // clone the selected article and append it to the div container that should contain the selected image

        prevImg = currentImg.parent().closest('article').prev().find('img');  //define prev img
        nextImg = currentImg.parent().closest('article').next().find('img'); //define next img


        display();
    });

//    click on PREV button
    prevBtn.on('click', function() {  // same as next!!
        if(!prevImg.is('img')) {
            prevImg = img.last();
        }

        removeByClass('box-image', 'selected')
        imgArticles.eq(indexArticle).removeClass("selected")
        currentImg = prevImg;
        indexImg = img.index(currentImg);
        indexArticle = indexImg;

        currImgClone = imgArticles.eq(indexArticle).addClass("selected")
        $('.selected').clone().removeClass("col-xs-12 col-sm-6 col-md-4 col-lg-3").appendTo(boxImages)

        nextImg = currentImg.parent().closest('article').next().find('img');
        prevImg = currentImg.parent().closest('article').prev().find('img');


        display();
    });

//    click on CLOSE button
    closeLightBox.on('click', function() { //on close click we should remove the article with the special "selected" class
        removeByClass('box-image', 'selected') //remove special class from the articles Array too,
        imgArticles.eq(indexArticle).removeClass("selected") //so that when we give that special class to the next image when click on it

        img = $('.images img'); // selects all images
        imgArticles = $('.images article'); // select all articles that contain images and buttons

        $('#box').css('display', 'none'); // give style display: none to lightbox so that it is not visible
    });

    function removeByClass(classParent, className) { // on click on next or prev button, remove the current article(that contains img and buttons)
        $("." +classParent +" " + "."+className).remove();
    }

    //display LIGHT BOX IMAGE
    function display() { //, indexFooter, indexDescription
        $('.box-image')
    }
});

// filter photos by album

$(document).ready(function () {
    function filterHide(el) {
        for (var i = 0; i < el.length; ++i) {
            el[i].style.display = 'none';
        }
    }

    function filterShow(el) {
        for (var i = 0; i < el.length; ++i) {
            el[i].style.display = 'block';
        }
    }

    function filterMask() {
        var mask = document.getElementById('filter-mask');
        mask.className = 'filter-mask';
        setTimeout(function () {
            mask.className = ''
        }, 1000);
    }

    //get the unique classed of photos
    var photosDisplayed = $('#display-photos-in-selected-album .filter-wrap article');
    var uniqueClasses = []; //CSS3 doesn't support ID selectors that start with a digit - check is needed whed cssClass is assigned
    var access = true;
    for (var i = 0; i < photosDisplayed.length; i++) {
        var attributeClass = photosDisplayed[i].getAttribute('class').split(' ');
        var classNeeded = attributeClass[attributeClass.length - 1];
        // console.log(classNeeded)
        for (var k = 0; k < uniqueClasses.length; k++) {
            if (uniqueClasses[k].toString() === classNeeded.toString()) {
                access = false;
                break;
            }
        }
        if (access) {
            uniqueClasses.push(classNeeded);
            continue;
        }
        access = true;
    }


    var filterVars = uniqueClasses; // define filter categories here
    // console.log(filterVars)
    var filterItems = document.querySelectorAll('.filter-wrap .filter-item');
    for (var i = 0; i < filterVars.length; i++) {

        var querySelector = '.filter-wrap .' + filterVars[i].toString();

        window['btn' + filterVars[i]] = document.getElementById(filterVars[i]);
        window['get' + filterVars[i]] = document.querySelectorAll(querySelector);
        window['btn' + filterVars[i]].onclick = (function (i) {
            return function () {
                filterMask();
                setTimeout(function () {
                    filterHide(filterItems);
                    filterShow(window['get' + filterVars[i]]);
                }, 500);
            }
        }(i));
    }

    var albumPhotoFilter = $('#filter-all');

    if (albumPhotoFilter.length>0) {
        document.getElementById('filter-all').onclick = function(){
            filterMask();
            setTimeout(function(){ filterShow(filterItems); }, 500);
        }
    }
})





