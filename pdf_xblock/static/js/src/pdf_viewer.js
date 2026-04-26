function PdfXBlock(runtime, element, config) {
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
        // Using getPage to fetch a specific page
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

    function loadPdf(url, passedLib) {
        if (!url) return;

        // Ensure we have the library loaded and accessible
        var pLib = passedLib || window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!pLib) {
            errorOverlay.style.display = 'block';
            errorMsg.textContent = 'PDF.js library is not defined/loaded.';
            return;
        }

        loadingOverlay.style.display = 'flex';
        errorOverlay.style.display = 'none';

        // Check if we should use the proxy (remote URL)
        var finalUrl = url;
        if (url.startsWith('http') && !url.includes(window.location.host)) {
            finalUrl = config.proxy_url + '?url=' + encodeURIComponent(url);
        }

        // Set worker
        if (pLib.GlobalWorkerOptions) {
            pLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        pLib.getDocument(finalUrl).promise.then(function(pdfDoc_) {
            pdfDoc = pdfDoc_;
            element.querySelector('.pdf-page-count').textContent = pdfDoc.numPages;
            loadingOverlay.style.display = 'none';
            renderPage(pageNum);
        }).catch(function(err) {
            loadingOverlay.style.display = 'none';
            errorOverlay.style.display = 'block';
            errorMsg.textContent = 'Failed to load PDF: ' + err.message;
            console.error('PDF JS ERROR:', err);
        });
    }

    // Helper to safely load pdf.js via RequireJS (Open edX) or plain script injection
    function initViewer(url) {
        if (!url) return;

        if (typeof window.pdfjsLib !== 'undefined') {
            loadPdf(url, window.pdfjsLib);
        } else if (typeof require !== 'undefined') {
            require(['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'], function (pdfjs) {
                if (pdfjs) {
                    window.pdfjsLib = pdfjs;
                }
                loadPdf(url, pdfjs);
            });
        } else {
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = function() {
                loadPdf(url);
            };
            document.head.appendChild(script);
        }
    }

    // Bind events
    element.querySelector('.pdf-prev').addEventListener('click', onPrevPage);
    element.querySelector('.pdf-next').addEventListener('click', onNextPage);
    element.querySelector('.pdf-zoom-in').addEventListener('click', onZoomIn);
    element.querySelector('.pdf-zoom-out').addEventListener('click', onZoomOut);
    element.querySelector('.pdf-fullscreen').addEventListener('click', function() {
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    });

    // Initial Load
    if (config.pdf_url) {
        initViewer(config.pdf_url);
    }
}
