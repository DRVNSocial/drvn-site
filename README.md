# DRVN Social — drvn.social

Hand-coded static site. No build step, no dependencies.

## Hosting
GitHub Pages, published from the `main` branch (root). Pages serves `about.html` at `/about`,
and all internal links and canonicals use that extension-less form. `.nojekyll` keeps
GitHub from running Jekyll over the files. `404.html` also bounces old-site paths to the
right pages (GitHub Pages has no server-side redirects). `_redirects` and `_headers` are
kept for a future move to a host that reads them (Cloudflare / Netlify / Bunny) — GitHub ignores them.

## Local preview
`npx serve ~/Sites/drvn-site -l 8000` then open http://localhost:8000 — `serve` handles
the extension-less URLs the same way GitHub Pages does. (Python's http.server does not.)

## Making changes
Edit the files, then from the site folder:

    git add -A && git commit -m "describe the change" && git push

GitHub republishes in about a minute. Cache-busting: bump `?v=N` on `style.css` /
`main.js` / `project.js` in the HTML when you change them.

## Layout
    index.html, work.html, about.html, insights.html, contact.html, privacy.html
    work-<client>.html            case studies (generated from a template, same blocks)
    <post-slug>.html              Insight posts
    assets/css/style.css          all styles
    assets/js/main.js             site-wide behaviour; project.js, about.js, work.js, contact.js per page
    assets/js/glass3d.js          the 3D glass emojis (built from glass3d.src.js)
    assets/projects/<client>/     hero.mp4 + hero-sm.mp4 (mobile), hero-still.jpg, lf/ ph/ so/ deliverables
    assets/img/, assets/video/    site imagery and homepage loops
    sitemap.xml, robots.txt, _redirects, _headers, site.webmanifest, favicons, og-default.jpg

`_archive/` holds old versions and is not deployed.
