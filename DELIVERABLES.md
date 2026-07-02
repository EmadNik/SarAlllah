# Static Site — Final Deliverables

This folder contains the complete static website for **Hey'at Tharullah**, ready for deployment to GitHub Pages (or any static host).

## Quick File Reference

| File | Purpose |
|------|---------|
| `index.html` | Main HTML page (entry point) |
| `css/styles.css` | All styling — Muharram dark theme, RTL, mobile-first |
| `js/app.js` | All application logic — manifest loading, players, modals |
| `manifest-builder.js` | Node.js script to regenerate all manifest.json files |
| `README.md` | Quick start guide (Persian) |
| `ADMIN-GUIDE.md` | Comprehensive admin manual (Persian, ~600 lines) |
| `404.html` | Custom 404 page |
| `.gitignore` | Git ignore rules (preserves manifest.json) |
| `PIC/` | Image Gallery folder |
| `VID/` | Video Gallery folder |
| `MUSIC/` | Music/Madahi folder |
| `SUKH/` | Speeches folder |
| `NEW/` | Announcements folder (.txt files) |

## Section Order (Top to Bottom on Website)

1. Hero
2. Image Gallery (scans `/PIC`)
3. Video Gallery (scans `/VID`)
4. Speeches (scans `/SUKH`)
5. Live Broadcast (always shows "inactive" message)
6. Music/Madahi (scans `/MUSIC`)
7. Announcements (scans `/NEW`, parses .txt files)
8. Contact (shows "under development" message)
9. Footer

## Test Locally

```bash
cd static-site
python3 -m http.server 8765
# Open http://localhost:8765/ in your browser
```

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push all files: `git init && git add . && git commit -m "Initial" && git push`
3. In repo Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`
4. Site will be live at `https://USERNAME.github.io/REPO-NAME/`

## Add New Content (Workflow)

1. Drop files into the appropriate folder (`PIC/`, `VID/`, `MUSIC/`, `SUKH/`, or `NEW/`)
2. Run `node manifest-builder.js` (regenerates all manifest.json files)
3. `git add . && git commit -m "Add content" && git push`
4. Wait 1-5 minutes for GitHub Pages to deploy

## Sample Content Included

For testing, sample files are included:
- 6 SVG placeholder images in `PIC/`
- 2 short MP4 videos in `VID/`
- 5 short MP3 audio files in `MUSIC/`
- 3 short MP3 audio files in `SUKH/`
- 5 properly-formatted announcement .txt files in `NEW/` (showing the Featured + grid layout)

Delete these samples before going live with real content.
