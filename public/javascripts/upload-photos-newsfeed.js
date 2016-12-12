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
    console.log("Yes")
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
    console.log("Yes")
    if (filesInputInPost!=null){
        filesInputInPost.addEventListener("change", showPhotoInPost);
    }

}

