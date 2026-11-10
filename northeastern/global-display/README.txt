Global Display — Northeastern University

Standalone static website. Upload this entire folder to your repository or web server.
Serve index.html at the site root. No install, build step, API keys, or external assets required.
All asset paths are relative, so it also works in a repository subdirectory.

Files:
- index.html: globe, campus menu and embedded map data
- display-theme.js: color palette (red default, including Lime Green)
- display-factoids.js: animated campus factoids

Local preview: open index.html in a browser, or run:
python3 -m http.server 8080
Then visit http://localhost:8080

Designed for a 1080 x 1920 portrait touchscreen. Drag to rotate, pinch to zoom.
Reset view restores the overview. Fullscreen is available beside the logo.

Based on Global Display Test 1. The original prototype folder is unchanged.

Test navigation: Display Test, then Global Display Tests 1–4.
All globe versions use the simplified menu. Test 2 retains patterned dots; Test 4 retains gradients and glow.
Upload the entire folder, including all HTML and JavaScript files.
