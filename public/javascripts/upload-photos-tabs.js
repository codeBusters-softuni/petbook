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
//
// $(document).ready(function() {
//
//     var img = $('.images article img');
//     var footer = $('.photo-buttons .preview-photo-thumbnail-footer');
//     var description = $('.photo-description .description');
//     var nextBtn = $('.next');
//     var prevBtn = $('.prev');
//     var closeLightBox = $('.close-light-box');
//
//     var currentImg = '';
//     var nextImg = '';
//     var prevImg = '';
//
//     var indexImg = 0;
//     var indexFooter = 0;
//     var indexDescription = 0;
//
//     // var paws ='';
//     // var loves ='';
//     // var hates ='';
//     // var formAction = ''
//
//     //open first image
//     img.on('click', function() {
//         var src = $(this).attr('src');
//         nextImg = $(this).parent().closest('article').next().find('img');
//         prevImg = $(this).parent().closest('article').prev().find('img');
//
//         // paws = $(this).parent().closest('article').find()
//
//         indexImg = img.index($(this));
//         indexFooter = indexImg;
//         indexDescription = indexImg;
//
//
//         $('#box').css('display', 'block');
//
//         display(src, indexFooter, indexDescription);
//
//     });
//
// //    click on NEXT button
//     nextBtn.on('click', function(e) {
//         if(!nextImg.is('img')) {
//             nextImg = img.first();
//         }
//
//         currentImg = nextImg;
//         var currentSrc = currentImg.attr('src');
//         prevImg = currentImg.parent().closest('article').prev().find('img');
//         nextImg = currentImg.parent().closest('article').next().find('img');
//
//         indexImg = img.index(currentImg);
//         indexFooter = indexImg;
//         indexDescription = indexImg;
//
//         display(currentSrc, indexFooter, indexDescription);
//     });
//
// //    click on PREV button
//     prevBtn.on('click', function() {
//
//         if(!prevImg.is('img')) {
//             prevImg = img.last();
//         }
//
//         currentImg = prevImg;
//         var currentSrc = prevImg.attr('src');
//
//         nextImg = currentImg.parent().closest('article').next().find('img');
//         prevImg = currentImg.parent().closest('article').prev().find('img');
//
//         indexImg = img.index(currentImg);
//         indexFooter = indexImg;
//         indexDescription = indexImg;
//
//         display(currentSrc, indexFooter, indexDescription);
//     });
//
// //    click on CLOSE button
//     closeLightBox.on('click', function() {
//         $('#box').css('display', 'none');
//     });
//
//     //display LIGHT BOX IMAGE
//     function display(src, indexFooter, indexDescription) {
//         $('.box-image').html('<img src=' + src + '>');
//         footer.eq(indexFooter).css('display', 'block').siblings().css('display', 'none');
//         description.eq(indexDescription).css('display', 'block').siblings().css('display', 'none');
//     }
// });

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





