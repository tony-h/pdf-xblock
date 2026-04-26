function PdfXBlock(runtime, element, config) {
    var $ = window.jQuery || $;
    var canvas = element.querySelector('#pdf-render-canvas');
    var ctx = canvas.getContext('2d');
    
    var pdfDoc = null;
    var pageNum = 1;
    var pageRendering = false;
    var pageNumPending = null;
    var scale = 1.0; 
    
    var loadingOverlay = element.querySelector('.pdf-loading-overlay');
    var errorOverlay = element.querySelector('.pdf-error-overlay');
    var errorMsg = element.querySelector('.error-msg');

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then(function(page) {
            var viewport = page.getViewport({scale: scale});
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function() {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        element.querySelector('.pdf-page-num').textContent = num;
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    function onPrevPage() {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    }

    function onNextPage() {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    }

    function onZoomIn() {
        scale += 0.2;
        updateZoomLabel();
        queueRenderPage(pageNum);
    }

    function onZoomOut() {
        if (scale <= 0.4) return;
        scale -= 0.2;
        updateZoomLabel();
        queueRenderPage(pageNum);
    }

    function updateZoomLabel() {
        element.querySelector('.pdf-zoom-val').textContent = Math.round(scale * 100) + '%';
    }

    function loadPdf(url, pLib) {
        if (!url) return;
        loadingOverlay.style.display = 'flex';
        errorOverlay.style.display = 'none';

        var finalUrl = url;
        // Proxy remote URLs. Allow /static/ and /asset-v1: URLs to load directly
        if (url.startsWith('http') && !url.includes(window.location.host)) {
            var separator = config.proxy_url.indexOf('?') > -1 ? '&' : '?';
            finalUrl = config.proxy_url + separator + 'url=' + encodeURIComponent(url);
        }

        // Fetch worker via Blob to bypass strict CORS policies on Workers
        var workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        fetch(workerUrl)
            .then(function(response) { return response.text(); })
            .then(function(code) {
                var blob = new Blob([code], { type: 'text/javascript' });
                pLib.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(blob));
                
                return pLib.getDocument(finalUrl).promise;
            })
            .then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                element.querySelector('.pdf-page-count').textContent = pdfDoc.numPages;
                loadingOverlay.style.display = 'none';
                renderPage(pageNum);
            })
            .catch(function(err) {
                loadingOverlay.style.display = 'none';
                errorOverlay.style.display = 'block';
                errorMsg.textContent = 'Failed to load PDF: ' + err.message;
                console.error('PDF JS ERROR:', err);
            });
    }

    function initViewer(url) {
        if (!url) return;

        // If already loaded successfully on the page, use it immediately
        if (window.pdfjsLib) {
            loadPdf(url, window.pdfjsLib);
            return;
        }

        // Use native fetch to avoid jQuery injecting Django CSRF tokens
        fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(function(code) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                // Note: The \n before })(); is critical in case the CDN code ends with a // comment
                script.text = "(function() { var define = undefined;\n" + code + "\n})();";
                document.head.appendChild(script);
                
                // Allow a tiny delay for the script execution to finish attaching to window
                setTimeout(function() {
                    if (window.pdfjsLib) {
                        loadPdf(url, window.pdfjsLib);
                    } else {
                        errorMsg.textContent = 'PDF library failed to attach globally.';
                        errorOverlay.style.display = 'block';
                    }
                }, 50);
            })
            .catch(function(error) {
                errorMsg.textContent = 'Network Error: Failed to download PDF.js from CDN.';
                errorOverlay.style.display = 'block';
                console.error('Fetch Error:', error);
            });
    }

    // Bind UI events
    element.querySelector('.pdf-prev').addEventListener('click', onPrevPage);
    element.querySelector('.pdf-next').addEventListener('click', onNextPage);
    element.querySelector('.pdf-zoom-in').addEventListener('click', onZoomIn);
    element.querySelector('.pdf-zoom-out').addEventListener('click', onZoomOut);
    element.querySelector('.pdf-fullscreen').addEventListener('click', function() {
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    });

    // Fire the initialization
    initViewer(config.pdf_url);
}
