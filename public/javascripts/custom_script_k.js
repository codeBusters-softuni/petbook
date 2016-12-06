// //add active section in add picture in album page
// $(document).ready(function() {
//     var title = $('#upload-photos'),
//         activeTitle = $('#upload-photos>h2'),
//         content = $('#upload-photos>ul>li'),
//         titleContainer = [],
//         titleIndex = '',
//         picContainer =$('#upload-photos output');
//
//
//
//     title.each(function() {
//         titleContainer = $(this).find('>h2');
//     });
//
//     titleContainer.on('click', function() {
//         titleIndex = $(this).index();
//
//         picContainer.removeAttr("id");
//
//         activeTitle.eq(titleIndex - 1).addClass('active-title')
//             .siblings().removeClass('active-title');
//
//         content.eq(titleIndex - 1)
//             .addClass('active-section')
//             .siblings().removeClass('active-section');
//
//         picContainer.eq(titleIndex-2).attr("id", "result");
//
//     });
//
//
// });
//
// //add active section in tab Photos in uploadPhotos view
// $(document).ready(function() {
//     var tab = $('#view-tabs-in-photos'),
//         activeTab = $('#view-tabs-in-photos h2.photos-tabs'),
//         contentTabs = $('#view-tabs-in-photos>ul>li'),
//         tabContainer = [],
//         tabIndex = '';
//
//     tab.each(function() {
//         tabContainer = $(this).find('h2.photos-tabs');
//     });
//
//     tabContainer.on('click', function() {
//         tabIndex = $(this).index();
//
//         activeTab.eq(tabIndex).addClass('active-tab')
//             .siblings().removeClass('active-tab');
//
//         contentTabs.eq(tabIndex)
//             .addClass('active-tab-section')
//             .siblings().removeClass('active-tab-section');
//     });
// });
//
//
// $(document).ready(function(){
//     brawsePicture();
// })
//
//
//
//
// function brawsePicture(){
//     window.onload = function(){
//
//         //Check File API support
//         if(window.File && window.FileList && window.FileReader)
//         {
//
//             var filesInput = document.getElementById("files");
//
//             filesInput.addEventListener("change", function(event){
//
//                 var files = event.target.files; //FileList object
//                 var output = document.getElementById("result");
//
//                 for(var i = 0; i< files.length; i++)
//                 {
//                     var file = files[i];
//
//                     //Only pics
//                     if(!file.type.match('image'))
//                         continue;
//
//                     var picReader = new FileReader();
//
//                     picReader.addEventListener("load",function(event){
//
//                         var picFile = event.target;
//
//                         var article = document.createElement("article");
//                         article.className+=" col-xs-12 col-sm-5 col-md-4";
//                         var section = document.createElement("section");
//
//                         section.className+=" photo-cntnr";
//                         section.innerHTML = "<a href='#' class='close remove_pict'>&times;</a>";
//                         article.appendChild(section);
//
//                         var div = document.createElement("div");
//                         div.className+= "album-photo-content";
//                         section.appendChild(div);
//
//
//
//                         div.innerHTML = "<img class='' src='" + picFile.result + "'" + "title='" + picFile.name + "'/>"
//
//                         var textarea = document.createElement("textarea");
//                         textarea.className+="cstm-input-register-style input-cstm-style";
//                         textarea.setAttribute("placeholder", "Say something about this photo...");
//                         textarea.setAttribute("rows", "3");
//                         textarea.setAttribute("cols", "30");
//                         section.appendChild(textarea);
//
//
//                         output.insertBefore(article,null);
//                         section.children[0].addEventListener("click", function(event){
//                             article.parentNode.removeChild(article);
//                         });
//
//                     });
//
//                     //Read the image
//                     picReader.readAsDataURL(file);
//                 }
//
//             });
//         }
//         else
//         {
//             console.log("Your browser does not support File API");
//         }
//     }
// }


var counter = 0
function saveAsHTML(event) {  // picReader.addEventListener("load",function(event)
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
    counter += 1;
    div.innerHTML = "<img class='' src='" + picFile.result + "'" + "title='" + counter + "'/>"

    var textarea = document.createElement("textarea");
    textarea.className += "cstm-input-register-style input-cstm-style";
    textarea.setAttribute("placeholder", "Say something about this photo...");
    textarea.setAttribute("name", counter);
    textarea.setAttribute("rows", "3");
    textarea.setAttribute("cols", "30");
    section.appendChild(textarea);


    output.insertBefore(article, null);
}

function uploadPhoto(event) {

    var files = event.target.files; //FileList object
    console.log(1);
    console.log(files);
    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        //Only pics
        if (!file.type.match('image'))
            continue;

        var picReader = new FileReader();

        picReader.removeEventListener("load", saveAsHTML);
        picReader.addEventListener("load", saveAsHTML);

        //Read the image
        picReader.readAsDataURL(file);

    }

};

function browsePicture() {
    var filesInput = document.getElementById("uploadPhotos");

    filesInput.removeEventListener("change", uploadPhoto);
    filesInput.addEventListener("change", uploadPhoto);
};

//add active section in add picture in album page
$(document).ready(function () {
    var title = $('#upload-photos'),
        activeTitle = $('#upload-photos>h2'),
        content = $('#upload-photos>ul>li'),
        titleContainer = [],
        titleIndex = '',
        fieldsetArea = $('#upload-photos fieldset'),
        formUploadPhotos = $('#upload-photos .pic-form'),
        picContainer = $('#upload-photos output'),
        formInputFilesBtn = $('#upload-photos input[type=file]'),
        browseLabelBtn = $('#upload-photos .browseBtnLabel'),
        checkBtn = $('#upload-photos .check-before-send-btn'),
        publishBtn = $('#upload-photos .btn-publish'),
        btnBrowse = "";

    title.each(function () {
        titleContainer = $(this).find('>h2');
    });

    titleContainer.on('click', function () {
        titleIndex = $(this).index();
        formUploadPhotos.removeAttr('action method enctype id');
        picContainer.removeAttr("id");
        formInputFilesBtn.removeAttr('id name type');
        browseLabelBtn.removeAttr('for');

        checkBtn.removeAttr('type id disabled checked');
        publishBtn.removeAttr('type id');


        activeTitle.eq(titleIndex).addClass('active-title')
            .siblings().removeClass('active-title');

        content.eq(titleIndex)
            .addClass('active-section')
            .siblings().removeClass('active-section');

        formUploadPhotos.eq(titleIndex - 1).attr({
            action: "/photo/all/single",
            method: "POST",
            enctype: "multipart/form-data",
            id: "single-photos-form"
        });
        picContainer.eq(titleIndex - 1).attr("id", "result");
        formInputFilesBtn.eq(titleIndex - 1).attr({id: "uploadPhotos", name: "uploadedPhotos", type: "file"});
        browseLabelBtn.eq(titleIndex - 1).attr("for", "uploadPhotos");
        checkBtn.eq(titleIndex - 1).attr({type: "checkbox", id: "check-before-send"});
        publishBtn.eq(titleIndex - 1).attr({type: "submit", id: "publish-photos"});


        var picContainerArticle = document.getElementsByClassName('pic-container-article');
        for (var i = picContainerArticle.length - 1; i >= 0; i--) {
            if (picContainerArticle[i] && picContainerArticle[i].parentNode) {
                picContainerArticle[i].parentNode.removeChild(picContainerArticle[i]);

            }
        }

        browsePicture();


        var checker = $('#check-before-send');
        var sendbtn = $('#publish-photos');
        var browsePhotos = $('.add-photo-button');
        sendbtn.attr("disabled", "disabled");
        checker.on('click', function () {
            console.log("yes");
            if (!!this.checked) {
                sendbtn.removeAttr('disabled');
                checker.attr("disabled", "disabled");
                browsePhotos.css("display", "none");
                console.log(titleIndex);
                if (titleIndex == 2) {
                    fieldsetArea.eq(0).attr("disabled", "disabled");
                }
                else {
                    fieldsetArea.eq(1).attr("disabled", "disabled");
                }

            }

            // store files in input[type=file]

            // var data = $('#uploadPhotos');
            //     // console.log(data);
            // for (var i = 0, len = storedFiles.length; i < len; i++) {
            //             data.append('uploadedPhotos', storedFiles[i]);
            //         }
            // console.log(data);

            // if(checker.disabled){
            //     var data = $('#files').files;
            //     console.log(data);
            //     data[data.length-1] = null;
            //
            //     for (var i = 0, len = storedFiles.length; i < len; i++) {
            //         data.append('files', storedFiles[i]);
            //     }
            //     // console.log("yes");
            // }


        });


    });


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

    tabContainer.on('click', function () {
        tabIndex = $(this).index();

        activeTab.eq(tabIndex).addClass('active-tab')
            .siblings().removeClass('active-tab');

        contentTabs.eq(tabIndex)
            .addClass('active-tab-section')
            .siblings().removeClass('active-tab-section');
    });
});