function PdfStudioView(runtime, element, config) {
    var $ = window.jQuery || $;
    var el = $(element);
    var courseId = config.course_id;

    // 1. Dynamically set the Content Library URL for the Authoring MFE
    if (courseId) {
        var currentHost = window.location.hostname;
        var appsHost = currentHost.replace('studio.', 'apps.');
        var libraryUrl = window.location.protocol + '//' + appsHost + '/authoring/course/' + courseId + '/assets';
        el.find('.studio-link').attr('href', libraryUrl);
    }

    // 2. Allow Enter Key to trigger search
    el.find('.asset-search-input').on('keypress', function(e) {
        if (e.which === 13) { // 13 is the Enter key
            e.preventDefault();
            el.find('.search-btn').click();
        }
    });

    // 3. Handle Asset Search
    el.find('.search-btn').bind('click', function(e) {
        e.preventDefault();
        var listContainer = el.find('.asset-list');
        
        if (!courseId) {
            listContainer.html('<p style="color:red;">Asset search is only available in Open edX Studio.</p>');
            return;
        }

        var query = el.find('.asset-search-input').val().toLowerCase();
        listContainer.html('<p>Searching...</p>');

        // Hook directly into Studio's core asset manager instead of the Content API
        $.ajax({
            url: '/assets/' + encodeURIComponent(courseId) + '/',
            type: 'GET',
            headers: {
                'Accept': 'application/json' // Forces Open edX to return JSON instead of an HTML page
            },
            success: function(data) {
                // The core endpoint returns an array named "assets"
                if (data && data.assets && data.assets.length > 0) {
                    
                    var filtered = data.assets.filter(function(asset) {
                        return asset.display_name.toLowerCase().indexOf(query) !== -1;
                    });

                    if (filtered.length > 0) {
                        listContainer.empty();
                        filtered.forEach(function(asset) {
                            var assetItem = $('<div style="cursor:pointer; padding:8px; border-bottom:1px solid #eee;">' + asset.display_name + '</div>');
                            
                            assetItem.hover(
                                function() { $(this).css('background-color', '#f5f5f5'); },
                                function() { $(this).css('background-color', 'transparent'); }
                            );
                            
                            assetItem.bind('click', function() {
                                el.find('#edit_pdf_url').val(asset.url);
                                listContainer.html('<p style="color:green; font-weight:bold;">Selected: ' + asset.display_name + '</p>');
                            });
                            listContainer.append(assetItem);
                        });
                    } else {
                        listContainer.html('<p>No PDFs found matching "' + query + '".</p>');
                    }
                } else {
                    listContainer.html('<p>No files found in this course.</p>');
                }
            },
            error: function() {
                listContainer.html('<p style="color:red;">Error fetching course assets. Please check your connection.</p>');
            }
        });
    });

    // 4. Properly Save via Studio Modal
    return {
        save: function() {
            var data = {
                display_name: el.find('#edit_display_name').val(),
                pdf_url: el.find('#edit_pdf_url').val()
            };
            
            // Explicitly setting contentType to application/json prevents Studio from throwing a 404
            return $.ajax({
                type: "POST",
                url: runtime.handlerUrl(element, 'studio_submit'),
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            });
        }
    };
}
