#!/usr/bin/env node
/* ===================================================================
   manifest-builder.js — regenerate all manifest.json files
   -------------------------------------------------------------------
   Run with:   node manifest-builder.js
   (or)        bun manifest-builder.js

   This script scans each content folder (PIC, VID, MUSIC, SUKH, NEW)
   and writes a manifest.json file inside each one, listing all files.

   After running this script, commit the updated manifest.json files
   to your repository so the live website can see the new content.
   =================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const FOLDERS = [
  { name: 'PIC',  filter: (f) => /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(f) },
  { name: 'VID',  filter: (f) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(f) },
  { name: 'MUSIC',filter: (f) => /\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(f) },
  { name: 'SUKH', filter: (f) => /\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(f) },
  { name: 'NEW',  filter: (f) => /\.txt$/i.test(f) },
];

let totalFiles = 0;
let totalManifests = 0;

FOLDERS.forEach(({ name, filter }) => {
  const folderPath = path.join(ROOT, name);

  // Create folder if missing
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Created folder: ${name}/`);
  }

  // Read all files in folder (excluding manifest.json itself, hidden files, and subfolders)
  let files = [];
  try {
    files = fs.readdirSync(folderPath)
      .filter(f => !f.startsWith('.') && f !== 'manifest.json')
      .filter(f => {
        const fullPath = path.join(folderPath, f);
        return fs.statSync(fullPath).isFile();
      });
  } catch (err) {
    console.error(`❌ Could not read ${name}/:`, err.message);
    return;
  }

  // Apply type filter
  const filtered = files.filter(filter);

  // Write manifest.json
  const manifest = { files: filtered };
  const manifestPath = path.join(folderPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  totalFiles += filtered.length;
  totalManifests++;

  console.log(`✓ ${name}/manifest.json  →  ${filtered.length} file(s)`);
  if (filtered.length > 0) {
    filtered.slice(0, 5).forEach(f => console.log(`    • ${f}`));
    if (filtered.length > 5) console.log(`    ... and ${filtered.length - 5} more`);
  }
});

console.log('');
console.log(`========================================`);
console.log(`✅ Done! Updated ${totalManifests} manifest(s), ${totalFiles} file(s) total.`);
console.log(``);
console.log(`Next steps:`);
console.log(`  1. git add .`);
console.log(`  2. git commit -m "Update content manifests"`);
console.log(`  3. git push origin main`);
console.log(`========================================`);
