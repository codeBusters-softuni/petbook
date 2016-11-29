//add active section in add picture in album page
$(document).ready(function() {
    var title = $('#upload-photos'),
        activeTitle = $('#upload-photos>h2'),
        content = $('#upload-photos>ul>li'),
        titleContainer = [],
        titleIndex = '',
        picContainer =$('#upload-photos output');



    title.each(function() {
        titleContainer = $(this).find('>h2');
    });

    titleContainer.on('click', function() {
        titleIndex = $(this).index();

        picContainer.removeAttr("id");

        activeTitle.eq(titleIndex - 1).addClass('active-title')
            .siblings().removeClass('active-title');

        content.eq(titleIndex - 1)
            .addClass('active-section')
            .siblings().removeClass('active-section');

        picContainer.eq(titleIndex-2).attr("id", "result");

    });


});

//add active section in tab Photos in uploadPhotos view
$(document).ready(function() {
    var tab = $('#view-tabs-in-photos'),
        activeTab = $('#view-tabs-in-photos h2.photos-tabs'),
        contentTabs = $('#view-tabs-in-photos>ul>li'),
        tabContainer = [],
        tabIndex = '';

    tab.each(function() {
        tabContainer = $(this).find('h2.photos-tabs');
    });

    tabContainer.on('click', function() {
        tabIndex = $(this).index();

        activeTab.eq(tabIndex).addClass('active-tab')
            .siblings().removeClass('active-tab');

        contentTabs.eq(tabIndex)
            .addClass('active-tab-section')
            .siblings().removeClass('active-tab-section');
    });
});


$(document).ready(function(){
    brawsePicture();
})




function brawsePicture(){
    window.onload = function(){

        //Check File API support
        if(window.File && window.FileList && window.FileReader)
        {

            var filesInput = document.getElementById("files");

            filesInput.addEventListener("change", function(event){

                var files = event.target.files; //FileList object
                var output = document.getElementById("result");

                for(var i = 0; i< files.length; i++)
                {
                    var file = files[i];

                    //Only pics
                    if(!file.type.match('image'))
                        continue;

                    var picReader = new FileReader();

                    picReader.addEventListener("load",function(event){

                        var picFile = event.target;

                        var article = document.createElement("article");
                        article.className+=" col-xs-12 col-sm-5 col-md-4";
                        var section = document.createElement("section");

                        section.className+=" photo-cntnr";
                        section.innerHTML = "<a href='#' class='close remove_pict'>&times;</a>";
                        article.appendChild(section);

                        var div = document.createElement("div");
                        div.className+= "album-photo-content";
                        section.appendChild(div);



                        div.innerHTML = "<img class='' src='" + picFile.result + "'" + "title='" + picFile.name + "'/>"

                        var textarea = document.createElement("textarea");
                        textarea.className+="cstm-input-register-style input-cstm-style";
                        textarea.setAttribute("placeholder", "Say something about this photo...");
                        textarea.setAttribute("rows", "3");
                        textarea.setAttribute("cols", "30");
                        section.appendChild(textarea);


                        output.insertBefore(article,null);
                        section.children[0].addEventListener("click", function(event){
                            article.parentNode.removeChild(article);
                        });

                    });

                    //Read the image
                    picReader.readAsDataURL(file);
                }

            });
        }
        else
        {
            console.log("Your browser does not support File API");
        }
    }
}