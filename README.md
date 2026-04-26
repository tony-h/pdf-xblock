# PDF XBlock

A clean, CORS-friendly PDF viewer XBlock for Open edX.

## Features
- Displays PDF files within Open edX courses.
- Supports Studio URLs (e.g., `/static/my-document.pdf`).
- Includes a CORS proxy to handle external PDF URLs that don't have permissive headers.
- Zoom controls, page navigation, and fullscreen mode.
- Optimized for Tutor v21.0.x.

## Installation

Add this repository to your Tutor `config.yml` in the `OPENEDX_EXTRA_PIP_REQUIREMENTS` section:

```yaml
OPENEDX_EXTRA_PIP_REQUIREMENTS:
    - git+https://github.com/tony-h/pdf-xblock.git
```

Then rebuild your Open edX images:

```bash
tutor images build openedx
```

## Usage

1. Go to **Studio > Settings > Advanced Settings**.
2. Add `"pdfxblock"` to the **Advanced Module List**.
3. In a unit, select **Advanced** and then **PDF Viewer**.
4. Paste the URL of your PDF (Remote URL or `/static/filename.pdf`).

## Attribution

This XBlock was developed using Google AI Studio.