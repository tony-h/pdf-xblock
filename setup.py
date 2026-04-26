from setuptools import setup

setup(
    name='pdf-xblock',
    version='1.0.0',
    description='A clean, CORS-friendly PDF viewer XBlock for Open edX.',
    packages=['pdf_xblock'],
    install_requires=[
        'XBlock',
        'requests',
    ],
    entry_points={
        'xblock.v1': [
            'pdfxblock = pdf_xblock:PdfXBlock',
        ]
    },
    package_data={
        'pdf_xblock': [
            'static/html/*.html',
            'static/css/*.css',
            'static/js/src/*.js',
        ],
    },
)
