//add active section in add picture in album page
$(document).ready(function() {
    var title = $('#upload-photos'),
        activeTitle = $('#upload-photos h2'),
        content = $('#upload-photos ul li'),
        titleContainer = [],
        titleIndex = '';

    title.each(function() {
        titleContainer = $(this).find('>h2');
    });

    titleContainer.on('click', function() {
        titleIndex = $(this).index();

        activeTitle.eq(titleIndex - 1).addClass('active-title')
            .siblings().removeClass('active-title');

        content.eq(titleIndex - 1)
            .addClass('active-section')
            .siblings().removeClass('active-section');
    });
});