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
    console.log("Yes")
    if (fileInputPhoto != null) {
        fileInputPhoto.addEventListener("change", showProfilePhoto);
    }
}