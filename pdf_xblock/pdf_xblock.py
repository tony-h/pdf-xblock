# -*- coding: utf-8 -*-

import pkg_resources
import requests
from django.core.files.storage import default_storage
from xblock.core import XBlock
from xblock.fields import Scope, String, Integer
from xblock.fragment import Fragment
from xblock.exceptions import JsonHandlerError
from webob.response import Response

class PdfXBlock(XBlock):
    """
    An XBlock providing a clean PDF viewer with CORS proxy support.
    """

    display_name = String(
        display_name="Display Name",
        default="PDF Viewer",
        scope=Scope.settings,
        help="The name of the component as it appears in the course."
    )

    pdf_url = String(
        display_name="PDF URL",
        default="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        scope=Scope.content,
        help="The URL to the PDF file (Remote URL or /static/filename.pdf)."
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our static directory."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        """
        The primary view of the PdfXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/pdf_viewer.html")
        frag = Fragment(html.format(self=self))
        
        # Add CSS
        frag.add_css(self.resource_string("static/css/pdf_viewer.css"))
        
        # Add JavaScript and initialize
        frag.add_javascript(self.resource_string("static/js/src/pdf_viewer.js"))
        
        frag.initialize_js('PdfXBlock', {
            'pdf_url': self.pdf_url,
            'proxy_url': self.runtime.handler_url(self, 'proxy_pdf')
        })
        return frag

    def studio_view(self, context=None):
        """
        The view shown to instructors in Studio to edit settings.
        """
        html = self.resource_string("static/html/pdf_edit.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/pdf_edit.css"))
        frag.add_javascript(self.resource_string("static/js/src/pdf_edit.js"))
        
        # Safely get course_id if running in actual Studio (SDK doesn't have it)
        course_id = str(self.course_id) if hasattr(self, 'course_id') else ''

        frag.initialize_js('PdfStudioView', {
            'pdf_url': self.pdf_url,
            'display_name': self.display_name,
            'course_id': course_id
        })
        return frag

    @XBlock.handler
    def proxy_pdf(self, request, suffix=''):
        """
        A proxy to fetch remote PDFs to bypass CORS.
        """
        target_url = request.params.get('url')
        
        if not target_url or not target_url.startswith(('http://', 'https://')):
            return Response(status=400, body="Valid URL parameter required.")

        try:
            # Stream the request to avoid memory limits on large PDFs
            response = requests.get(target_url, stream=True, timeout=15)
            response.raise_for_status()
            
            return Response(
                app_iter=response.iter_content(chunk_size=8192),
                content_type='application/pdf',
                headerlist=[('Access-Control-Allow-Origin', '*')]
            )
        except requests.exceptions.RequestException as e:
            return Response(status=502, body=f"Failed to fetch PDF: {str(e)}")

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Handler to save Studio edits.
        """
        self.display_name = data.get('display_name', self.display_name)
        self.pdf_url = data.get('pdf_url', self.pdf_url)
        return {'result': 'success'}

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("PDF XBlock",
             """<pdfxblock/>
             """),
            ("PDF XBlock (Workbench)",
             """<pdfxblock pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"/>
             """),
        ]
