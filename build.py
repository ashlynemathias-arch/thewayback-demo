#!/usr/bin/env python3
"""
Build the single-file Artifact bundle (page.html fragment) for The Wayback.

The Artifact tool wraps whatever we publish in its own <html><head><body>
skeleton, so this script must NOT emit doctype/html/head/body tags -- just
the content: a <style> block, the body markup, and the script tags, in
the right order:

  1. <style> = vendor maplibre-gl.css + our own style.css
  2. body markup from index.html (banner, landing screen, layout/panel,
     map div, card, etc.) with the local <script src> tags stripped out
  3. <script> that sets window.WAYBACK_NO_TILES = true and, via a base64
     blob (no eval/Function -- CSP safe), gives maplibre a worker URL
  4. <script> = the raw CSP-safe maplibre-gl-csp.js bundle
  5. <script> that calls maplibregl.setWorkerUrl(...)
  6. <script> = data.js
  7. <script> = app.js
"""
import base64
import os
import re
import sys

SRC = os.path.dirname(os.path.abspath(__file__))
SCR = os.path.join(SRC, "vendor-csp")
OUT = os.path.join(SRC, "page.html")

def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def read_bytes(path):
    with open(path, "rb") as f:
        return f.read()

def main():
    index_html = read(f"{SRC}/index.html")
    style_css = read(f"{SRC}/style.css")
    data_js = read(f"{SRC}/data.js")
    app_js = read(f"{SRC}/app.js")

    maplibre_css = read(f"{SCR}/maplibre-gl.css")
    maplibre_csp_js = read(f"{SCR}/maplibre-gl-csp.js")
    worker_bytes = read_bytes(f"{SCR}/maplibre-gl-csp-worker.js")
    worker_b64 = base64.b64encode(worker_bytes).decode("ascii")

    # the landing-page hero photo: inline it as a data: URI since the hosted
    # Artifact build is a single file with no separate media/ folder to load
    # images from.
    hero_bytes = read_bytes(f"{SRC}/media/landing-hero.jpg")
    hero_b64 = base64.b64encode(hero_bytes).decode("ascii")
    hero_data_uri = "data:image/jpeg;base64," + hero_b64
    style_css = style_css.replace(
        'url("media/landing-hero.jpg")', 'url("' + hero_data_uri + '")'
    )

    # --- extract body inner markup, stripping local <script src> tags ---
    body_match = re.search(r"<body>(.*)</body>", index_html, re.S)
    if not body_match:
        sys.exit("ERROR: could not find <body>...</body> in index.html")
    body = body_match.group(1)
    body = re.sub(r'\s*<script src="[^"]*"></script>\s*', "\n", body)

    parts = []

    # 1. style block
    parts.append("<style>\n" + maplibre_css + "\n" + style_css + "\n</style>")

    # 2. body markup
    parts.append(body.strip())

    # 3. CSP worker-blob setup
    worker_setup = (
        "<script>\n"
        "window.WAYBACK_NO_TILES = true;\n"
        "(function () {\n"
        '  var b64 = "' + worker_b64 + '";\n'
        "  var binary = atob(b64);\n"
        "  var len = binary.length;\n"
        "  var bytes = new Uint8Array(len);\n"
        "  for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);\n"
        '  var blob = new Blob([bytes], { type: "application/javascript" });\n'
        "  window.__WAYBACK_SET_WORKER_URL = URL.createObjectURL(blob);\n"
        "})();\n"
        "</script>"
    )
    parts.append(worker_setup)

    # 4. the CSP-safe maplibre bundle itself
    parts.append("<script>\n" + maplibre_csp_js + "\n</script>")

    # 5. point maplibre at the worker blob
    parts.append("<script>maplibregl.setWorkerUrl(window.__WAYBACK_SET_WORKER_URL);</script>")

    # 6. data.js
    parts.append("<script>\n" + data_js + "\n</script>")

    # 7. app.js
    parts.append("<script>\n" + app_js + "\n</script>")

    out = "\n\n".join(parts) + "\n"

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)

    print("Wrote", OUT, "(", len(out), "chars )")

if __name__ == "__main__":
    main()
