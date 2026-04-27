function PdfStudioView(runtime, element, config) {
    var $ = window.jQuery || $;
    var el = $(element);
    var courseId = config.course_id;

    // 1. Dynamically set the Content Library URL for the Authoring MFE
    if (courseId) {
        var currentHost = window.location.hostname;
        var appsHost = currentHost.replace('studio.', 'apps.');
        
        // Build the correct Authoring MFE path
        var libraryUrl = window.location.protocol + '//' + appsHost + '/authoring/course/' + courseId + '/assets';
        el.find('.studio-link').attr('href', libraryUrl);
    }

    // 2. Handle Asset Search with fuzzy client-side filtering
    el.find('.search-btn').bind('click', function(e) {
        e.preventDefault();
        var listContainer = el.find('.asset-list');
        
        if (!courseId) {
            listContainer.html('<p style="color:red;">Asset search is only available in Open edX Studio.</p>');
            return;
        }

        var query = el.find('.asset-search-input').val().toLowerCase();
        listContainer.html('<p>Searching...</p>');

        // Fetch up to 100 PDFs and filter client-side to bypass API character/casing issues
        $.ajax({
            url: '/api/content/v1/assets/?course_id=' + encodeURIComponent(courseId) + '&asset_type=pdf&page_size=100',
            type: 'GET',
            success: function(data) {
                if (data.results && data.results.length > 0) {
                    
                    var filtered = data.results.filter(function(asset) {
                        return asset.display_name.toLowerCase().indexOf(query) !== -1;
                    });

                    if (filtered.length > 0) {
                        listContainer.empty();
                        filtered.forEach(function(asset) {
                            var assetItem = $('<div style="cursor:pointer; padding:8px; border-bottom:1px solid #eee;">' + asset.display_name + '</div>');
                            
                            // Add a hover effect for better UX
                            assetItem.hover(
                                function() { $(this).css('background-color', '#f5f5f5'); },
                                function() { $(this).css('background-color', 'transparent'); }
                            );
                            
                            assetItem.bind('click', function() {
                                el.find('#edit_pdf_url').val(asset.url.replace('/c4x', ''));
                                listContainer.html('<p style="color:green; font-weight:bold;">Selected: ' + asset.display_name + '</p>');
                            });
                            listContainer.append(assetItem);
                        });
                    } else {
                        listContainer.html('<p>No PDFs found matching "' + query + '".</p>');
                    }
                } else {
                    listContainer.html('<p>No PDFs found in this course.</p>');
                }
            },
            error: function() {
                listContainer.html('<p style="color:red;">Error fetching course assets.</p>');
            }
        });
    });

    // 3. Return the save method to hook into Open edX's native modal buttons
    return {
        save: function() {
            var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
            var data = {
                display_name: el.find('#edit_display_name').val(),
                pdf_url: el.find('#edit_pdf_url').val()
            };
            
            // Return the deferred object so Studio knows when saving completes
            return $.post(handlerUrl, JSON.stringify(data));
        }
    };
}
