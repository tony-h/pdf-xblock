function PdfStudioView(runtime, element, config) {
    var saveUrl = runtime.handlerUrl(element, 'studio_submit');

    $(element).find('.save-button').bind('click', function() {
        var data = {
            display_name: $(element).find('#edit_display_name').val(),
            pdf_url: $(element).find('#edit_pdf_url').val()
        };

        runtime.notify('save', {state: 'start'});
        $.post(saveUrl, JSON.stringify(data)).done(function(response) {
            runtime.notify('save', {state: 'end'});
        });
    });

    $(element).find('.cancel-button').bind('click', function() {
        runtime.notify('cancel', {});
    });

    // Asset Search Simulation
    var searchInput = $(element).find('.asset-search-input');
    var assetList = $(element).find('.asset-list');

    $(element).find('.search-btn').bind('click', function() {
        var term = searchInput.val().toLowerCase();
        if (!term) return;

        // In a real XBlock, we would fetch from /api/courses/v1/assets/
        // Here we mock a response for demonstration
        assetList.html('<p class="text-secondary italic">Searching assets...</p>');

        setTimeout(function() {
            var mockAssets = [
                { name: 'lecture_notes.pdf', url: '/static/lecture_notes.pdf' },
                { name: 'syllabus_v2.pdf', url: '/static/syllabus_v2.pdf' },
                { name: 'lab_guide.pdf', url: '/static/lab_guide.pdf' }
            ];

            var filtered = mockAssets.filter(function(a) { 
                return a.name.toLowerCase().indexOf(term) > -1; 
            });

            if (filtered.length === 0) {
                assetList.html('<p class="text-secondary italic">No assets found matching "' + term + '"</p>');
            } else {
                assetList.empty();
                filtered.forEach(function(asset) {
                    var item = $('<div class="asset-item">' +
                        '<span class="asset-name">' + asset.name + '</span>' +
                        '<button class="btn btn-secondary select-asset" data-url="' + asset.url + '">Select</button>' +
                    '</div>');
                    assetList.append(item);
                });

                assetList.find('.select-asset').click(function() {
                    $(element).find('#edit_pdf_url').val($(this).data('url'));
                });
            }
        }, 600);
    });
}
