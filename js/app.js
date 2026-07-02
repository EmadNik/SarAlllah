/* ===================================================================
   هیئت ثارالله — Upgraded Static Site Application
   -------------------------------------------------------------------
   Features:
   - Unified Media Gallery: scans PIC/, VID/, MUSIC/, SUKH/ folders via manifest.json
   - Category filters (All / Images / Videos / Audio / Speeches)
   - Unified Lightbox modal for all media types (image, video, audio)
   - Sticky Now Playing bar for audio playback
   - Announcements parser (NEW/*.txt with numeric sort)
   - Scroll-triggered animations (IntersectionObserver)
   - Animated navbar (transparent → solid on scroll)
   - Mobile menu, back-to-top FAB, progress bar
   =================================================================== */

(function () {
  'use strict';

  // ============== Configuration ==============
  const CONFIG = {
    folders: {
      images:        'PIC',
      videos:        'VID',
      music:         'MUSIC',
      speeches:      'SUKH',
      announcements: 'NEW',
    },
    supportedImageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'],
    supportedVideoExtensions: ['mp4', 'webm', 'ogg', 'mov', 'm4v'],
    supportedAudioExtensions: ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac'],
    emptyMessage: 'هنوز چیزی اضافه نشده است.',
  };

  // ============== State ==============
  const state = {
    // Unified media list — each item: { type, filename, folder, title, url, duration?, size? }
    // type: 'image' | 'video' | 'audio' | 'speech'
    mediaItems: [],
    currentFilter: 'all',
    lightboxIndex: -1,
    // Audio player
    currentAudioIndex: -1,
    isPlaying: false,
  };

  // ============== DOM Helpers ==============
  const $ = (id) => document.getElementById(id);
  const create = (tag, className, html) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html !== undefined) el.innerHTML = html;
    return el;
  };

  // ============== Utilities ==============

  function toPersianDigits(input) {
    if (input === null || input === undefined) return '';
    return String(input).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '۰:۰۰';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return toPersianDigits(m) + ':' + toPersianDigits(s).padStart(2, '۰');
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '';
    const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    let i = 0; let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return toPersianDigits(size.toFixed(i === 0 ? 0 : 1)) + ' ' + units[i];
  }

  function getExtension(filename) {
    const idx = filename.lastIndexOf('.');
    return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
  }

  function getBasename(filename) {
    const idx = filename.lastIndexOf('.');
    return idx === -1 ? filename : filename.slice(0, idx);
  }

  function filenameToTitle(filename) {
    return getBasename(filename)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-32');
    toast.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-32');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
  }

  // ============== Manifest Loader ==============

  async function loadManifest(folder) {
    try {
      const response = await fetch(`${folder}/manifest.json`, { cache: 'no-cache' });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !Array.isArray(data.files)) return null;
      return data.files;
    } catch (err) {
      console.warn(`[Tharullah] Manifest not found for /${folder}:`, err.message);
      return null;
    }
  }

  // ============== Empty / Error renderers ==============

  function renderEmptyState(container, message) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg></div>
        <p class="empty-state-message">${message || CONFIG.emptyMessage}</p>
      </div>`;
  }

  // ============== Load all media items into unified state ==============

  async function loadAllMedia() {
    const [images, videos, music, speeches] = await Promise.all([
      loadManifest(CONFIG.folders.images),
      loadManifest(CONFIG.folders.videos),
      loadManifest(CONFIG.folders.music),
      loadManifest(CONFIG.folders.speeches),
    ]);

    const items = [];

    if (images && images.length > 0) {
      images.filter(f => CONFIG.supportedImageExtensions.includes(getExtension(f)))
        .forEach(f => items.push({
          type: 'image',
          filename: f,
          folder: CONFIG.folders.images,
          title: filenameToTitle(f),
          url: `${CONFIG.folders.images}/${encodeURIComponent(f)}`,
        }));
    }

    if (videos && videos.length > 0) {
      videos.filter(f => CONFIG.supportedVideoExtensions.includes(getExtension(f)))
        .forEach(f => items.push({
          type: 'video',
          filename: f,
          folder: CONFIG.folders.videos,
          title: filenameToTitle(f),
          url: `${CONFIG.folders.videos}/${encodeURIComponent(f)}`,
        }));
    }

    if (music && music.length > 0) {
      music.filter(f => CONFIG.supportedAudioExtensions.includes(getExtension(f)))
        .forEach(f => items.push({
          type: 'audio',
          filename: f,
          folder: CONFIG.folders.music,
          title: filenameToTitle(f),
          url: `${CONFIG.folders.music}/${encodeURIComponent(f)}`,
        }));
    }

    if (speeches && speeches.length > 0) {
      speeches.filter(f => CONFIG.supportedAudioExtensions.includes(getExtension(f)))
        .forEach(f => items.push({
          type: 'speech',
          filename: f,
          folder: CONFIG.folders.speeches,
          title: filenameToTitle(f),
          url: `${CONFIG.folders.speeches}/${encodeURIComponent(f)}`,
        }));
    }

    state.mediaItems = items;
    return items;
  }

  // ============== Render Media Gallery ==============

  function renderMediaGallery() {
    const grid = $('mediaGrid');
    const items = state.mediaItems;

    if (items.length === 0) {
      renderEmptyState(grid);
      return;
    }

    grid.innerHTML = '';

    items.forEach((item, index) => {
      const card = create('div', 'media-card relative');
      card.dataset.index = index;
      card.dataset.type = item.type;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${typeLabel(item.type)}: ${item.title}`);

      // Type badge
      const badge = create('div', 'media-type-badge', typeBadgeHTML(item.type));

      // Media element (image / video thumbnail / audio icon)
      let mediaEl;
      if (item.type === 'image') {
        mediaEl = create('img');
        mediaEl.src = item.url;
        mediaEl.alt = item.title;
        mediaEl.loading = 'lazy';
        mediaEl.onerror = () => { card.style.display = 'none'; };
      } else if (item.type === 'video') {
        mediaEl = create('video');
        mediaEl.src = item.url;
        mediaEl.preload = 'metadata';
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        // Try to capture a frame at 1s for the thumbnail
        mediaEl.addEventListener('loadeddata', () => {
          try { mediaEl.currentTime = Math.min(1, mediaEl.duration / 4 || 1); } catch (_) {}
        });
        mediaEl.addEventListener('seeked', () => { try { mediaEl.pause(); } catch (_) {} });
        mediaEl.onerror = () => {
          // Fallback: show a dark gradient with icon
          card.style.background = 'linear-gradient(135deg, var(--blood), var(--charcoal))';
        };
      } else {
        // Audio: render a gradient placeholder with music icon
        const grad = item.type === 'audio'
          ? 'linear-gradient(135deg, #8B0000 0%, #5A0011 100%)'
          : 'linear-gradient(135deg, #7A0D2A 0%, #4A0818 100%)';
        card.style.background = grad;
        mediaEl = create('div', 'absolute inset-0 grid place-items-center text-gold-light');
        mediaEl.innerHTML = `<svg viewBox="0 0 24 24" class="w-12 h-12 opacity-80" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
      }

      // Play overlay (for video/audio)
      const overlay = create('div', 'media-play-overlay');
      const playBtn = create('div', 'media-play-btn');
      playBtn.innerHTML = playIconHTML(item.type);
      overlay.appendChild(playBtn);

      // Caption
      const caption = create('div', 'media-caption', `<div class="truncate">${item.title}</div>${item.duration ? `<div class="text-[10px] opacity-70 mt-1">${item.duration}</div>` : ''}`);

      card.appendChild(badge);
      card.appendChild(mediaEl);
      card.appendChild(overlay);
      card.appendChild(caption);

      const open = () => openLightbox(index);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });

      // For video/audio: try to fetch duration in background
      if (item.type === 'video' || item.type === 'audio' || item.type === 'speech') {
        const temp = document.createElement(item.type === 'video' ? 'video' : 'audio');
        temp.preload = 'metadata';
        temp.src = item.url;
        temp.addEventListener('loadedmetadata', () => {
          if (temp.duration && isFinite(temp.duration)) {
            item.duration = formatTime(temp.duration);
            const captionDur = caption.querySelector('.text-\\[10px\\]');
            if (captionDur) captionDur.textContent = item.duration;
          }
        });
        // Best-effort HEAD request for file size
        fetch(item.url, { method: 'HEAD' })
          .then(r => {
            const len = r.headers.get('Content-Length');
            if (len) {
              item.size = parseInt(len, 10);
            }
          })
          .catch(() => {});
      }

      grid.appendChild(card);
    });

    // Apply current filter
    applyFilter(state.currentFilter);
  }

  function typeLabel(type) {
    return { image: 'تصویر', video: 'ویدئو', audio: 'مداحی', speech: 'سخنرانی' }[type] || '';
  }

  function typeBadgeHTML(type) {
    const icons = {
      image: '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
      video: '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/></svg>',
      audio: '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      speech: '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
    };
    return `${icons[type] || ''}<span>${typeLabel(type)}</span>`;
  }

  function playIconHTML(type) {
    if (type === 'image') {
      return '<svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="w-7 h-7 ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }

  // ============== Filter Logic ==============

  function applyFilter(filter) {
    state.currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    document.querySelectorAll('.media-card').forEach(card => {
      const type = card.dataset.type;
      let show = false;
      if (filter === 'all') show = true;
      else if (filter === 'image') show = type === 'image';
      else if (filter === 'video') show = type === 'video';
      else if (filter === 'audio') show = type === 'audio';
      else if (filter === 'speech') show = type === 'speech';
      card.classList.toggle('hidden-by-filter', !show);
    });
  }

  function setupFilters() {
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => applyFilter(tab.dataset.filter));
    });
  }

  // ============== Unified Lightbox ==============

  function getFilteredIndices() {
    const indices = [];
    document.querySelectorAll('.media-card').forEach((card, i) => {
      if (!card.classList.contains('hidden-by-filter')) {
        indices.push(parseInt(card.dataset.index, 10));
      }
    });
    return indices;
  }

  function openLightbox(itemIndex) {
    state.lightboxIndex = itemIndex;
    const modal = $('lightboxModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderLightboxContent();
    // Pause audio player if running
    if (state.isPlaying) {
      const a = $('audioPlayer');
      a.pause();
    }
    refreshLucide();
  }

  function closeLightbox() {
    const modal = $('lightboxModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    // Stop any playing video/audio inside lightbox
    const content = $('lightboxContent');
    content.innerHTML = '';
    state.lightboxIndex = -1;
  }

  function renderLightboxContent() {
    const item = state.mediaItems[state.lightboxIndex];
    if (!item) return;
    const content = $('lightboxContent');
    const caption = $('lightboxCaption');
    const counter = $('lightboxCounter');

    content.innerHTML = '';

    if (item.type === 'image') {
      const img = create('img');
      img.src = item.url;
      img.alt = item.title;
      img.className = 'max-w-full max-h-[80vh] mx-auto rounded-lg border-2 border-gold shadow-2xl';
      content.appendChild(img);
    } else if (item.type === 'video') {
      const video = create('video');
      video.src = item.url;
      video.controls = true;
      video.autoplay = true;
      video.className = 'max-w-full max-h-[80vh] mx-auto rounded-lg border-2 border-gold shadow-2xl';
      content.appendChild(video);
    } else {
      // audio or speech — render a styled audio player card
      const card = create('div', 'glass-card rounded-2xl p-8 max-w-2xl mx-auto text-center');
      card.innerHTML = `
        <div class="grid place-items-center w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-blood to-crimson text-gold-light mb-6">
          <svg viewBox="0 0 24 24" class="w-16 h-16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <h3 class="font-display text-2xl text-gold-light mb-2">${item.title}</h3>
        <p class="text-cream/60 text-sm mb-6">${typeLabel(item.type)}${item.duration ? ' • ' + item.duration : ''}</p>
        <audio src="${item.url}" controls autoplay class="w-full"></audio>
      `;
      content.appendChild(card);
    }

    caption.textContent = item.title + (item.duration ? ` — ${item.duration}` : '');

    // Counter
    const filtered = getFilteredIndices();
    const currentPos = filtered.indexOf(state.lightboxIndex) + 1;
    counter.textContent = `${toPersianDigits(currentPos)} / ${toPersianDigits(filtered.length)}`;

    refreshLucide();
  }

  function lightboxNext() {
    const filtered = getFilteredIndices();
    if (filtered.length === 0) return;
    const currentPos = filtered.indexOf(state.lightboxIndex);
    const nextPos = (currentPos + 1) % filtered.length;
    state.lightboxIndex = filtered[nextPos];
    renderLightboxContent();
  }

  function lightboxPrev() {
    const filtered = getFilteredIndices();
    if (filtered.length === 0) return;
    const currentPos = filtered.indexOf(state.lightboxIndex);
    const prevPos = (currentPos - 1 + filtered.length) % filtered.length;
    state.lightboxIndex = filtered[prevPos];
    renderLightboxContent();
  }

  function setupLightbox() {
    $('lightboxClose').addEventListener('click', closeLightbox);
    $('lightboxBackdrop').addEventListener('click', closeLightbox);
    $('lightboxNext').addEventListener('click', lightboxNext);
    $('lightboxPrev').addEventListener('click', lightboxPrev);

    document.addEventListener('keydown', (e) => {
      if ($('lightboxModal').classList.contains('hidden')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxNext(); // RTL: Left = next
      if (e.key === 'ArrowRight') lightboxPrev(); // RTL: Right = prev
    });
  }

  // ============== Audio Player (sticky Now Playing bar) ==============
  // Used when user clicks an audio card's play button OUTSIDE the lightbox
  // (clicking inside lightbox uses its own embedded <audio>).

  function setupAudioPlayer() {
    const a = $('audioPlayer');

    a.addEventListener('play', () => {
      state.isPlaying = true;
      updatePlayerUI();
    });
    a.addEventListener('pause', () => {
      state.isPlaying = false;
      updatePlayerUI();
    });
    a.addEventListener('ended', () => {
      playNextAudio();
    });
    a.addEventListener('timeupdate', () => {
      if (!isFinite(a.duration) || a.duration === 0) return;
      const pct = (a.currentTime / a.duration) * 100;
      $('npFill').style.width = pct + '%';
      $('npCurrent').textContent = formatTime(a.currentTime);
    });
    a.addEventListener('loadedmetadata', () => {
      $('npDuration').textContent = formatTime(a.duration);
    });

    $('npPlayPause').addEventListener('click', togglePlayPause);
    $('npNext').addEventListener('click', playNextAudio);
    $('npPrev').addEventListener('click', playPrevAudio);
    $('npMute').addEventListener('click', () => {
      a.muted = !a.muted;
      $('muteIcon').setAttribute('data-lucide', a.muted ? 'volume-x' : 'volume-2');
      refreshLucide();
    });

    // Seek
    $('npTrack').addEventListener('click', (e) => {
      if (!isFinite(a.duration) || a.duration === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickedFromRight = rect.right - e.clientX;
      const pct = clickedFromRight / rect.width;
      a.currentTime = pct * a.duration;
    });
  }

  function playAudioAtIndex(index) {
    const item = state.mediaItems[index];
    if (!item || (item.type !== 'audio' && item.type !== 'speech')) return;

    state.currentAudioIndex = index;
    const a = $('audioPlayer');
    a.src = item.url;
    a.play().then(() => {
      state.isPlaying = true;
      $('nowPlayingBar').classList.remove('hidden');
      updatePlayerUI();
    }).catch(err => {
      console.error('Playback failed:', err);
      showToast('پخش ناموفق بود.');
    });
  }

  function togglePlayPause() {
    const a = $('audioPlayer');
    if (!a.src) return;
    if (state.isPlaying) a.pause();
    else a.play().catch(err => console.error(err));
  }

  function playNextAudio() {
    const audioIndices = state.mediaItems
      .map((m, i) => (m.type === 'audio' || m.type === 'speech') ? i : -1)
      .filter(i => i !== -1);
    if (audioIndices.length === 0) return;
    const currentPos = audioIndices.indexOf(state.currentAudioIndex);
    const nextPos = (currentPos + 1) % audioIndices.length;
    playAudioAtIndex(audioIndices[nextPos]);
  }

  function playPrevAudio() {
    const audioIndices = state.mediaItems
      .map((m, i) => (m.type === 'audio' || m.type === 'speech') ? i : -1)
      .filter(i => i !== -1);
    if (audioIndices.length === 0) return;
    const currentPos = audioIndices.indexOf(state.currentAudioIndex);
    const prevPos = (currentPos - 1 + audioIndices.length) % audioIndices.length;
    playAudioAtIndex(audioIndices[prevPos]);
  }

  function updatePlayerUI() {
    if (state.currentAudioIndex < 0) return;
    const item = state.mediaItems[state.currentAudioIndex];
    if (!item) return;

    $('npTitle').textContent = item.title;
    $('npMeta').textContent = typeLabel(item.type);
    $('playPauseIcon').setAttribute('data-lucide', state.isPlaying ? 'pause' : 'play');
    refreshLucide();
  }

  // ============== Announcements ==============

  async function loadAnnouncements() {
    const container = $('announcementsContainer');
    const files = await loadManifest(CONFIG.folders.announcements);

    if (!files || files.length === 0) {
      renderEmptyState(container);
      return;
    }

    const txtFiles = files.filter(f => getExtension(f) === 'txt');
    if (txtFiles.length === 0) {
      renderEmptyState(container);
      return;
    }

    // Sort by numeric prefix
    txtFiles.sort((a, b) => {
      const na = parseInt(getBasename(a), 10);
      const nb = parseInt(getBasename(b), 10);
      if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return na - nb;
    });

    const parsed = [];
    for (const filename of txtFiles) {
      try {
        const response = await fetch(`${CONFIG.folders.announcements}/${encodeURIComponent(filename)}`);
        if (!response.ok) continue;
        const text = await response.text();
        const item = parseAnnouncement(text, filename);
        if (item) parsed.push(item);
      } catch (err) {
        console.warn(`Failed to load ${filename}:`, err);
      }
    }

    if (parsed.length === 0) {
      renderEmptyState(container, 'هیچ اعلامیه معتبری یافت نشد.');
      return;
    }

    renderAnnouncements(parsed, container);
  }

  function parseAnnouncement(text, filename) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 4) {
      console.warn(`[Tharullah] ${filename} has fewer than 4 lines — skipped.`);
      return null;
    }
    const m = lines[0].trim().match(/^(\d+),([^,]+),(\d+)\s+(\d{1,2}):(\d{2})$/);
    if (!m) {
      console.warn(`[Tharullah] ${filename} line 1 has invalid format — skipped.`);
      return null;
    }
    const [, day, month, year, hour, minute] = m;
    return {
      filename,
      dateStr: `${toPersianDigits(day)} ${month.trim()} ${toPersianDigits(year)}`,
      timeStr: `${toPersianDigits(hour)}:${toPersianDigits(minute)}`,
      title: lines[1].trim(),
      speaker: lines[2].trim(),
      location: lines[3].trim(),
      description: lines.slice(4).join('\n').trim(),
    };
  }

  function renderAnnouncements(items, container) {
    const [featured, ...rest] = items;

    let html = `
      <div class="grid lg:grid-cols-5 gap-8">
        <!-- Featured -->
        <div class="lg:col-span-3 opacity-0" data-animate>
          <div class="glass-card rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-300" onclick='openAnnounceModal(0)'>
            <div class="bg-gradient-to-l from-black to-charcoal p-5 border-b-2 border-gold flex items-center justify-between">
              <span class="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full tracking-wider">منتخب</span>
              <span class="text-gold-light font-semibold text-sm">${featured.dateStr} • ${featured.timeStr}</span>
            </div>
            <div class="p-6 lg:p-8">
              <h3 class="font-display text-2xl lg:text-3xl text-gold-light mb-4 font-bold leading-snug">${featured.title}</h3>
              ${featured.speaker ? `<div class="flex items-center gap-2 text-cream/70 mb-2 text-sm"><svg viewBox="0 0 24 24" class="w-4 h-4 text-gold" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>${featured.speaker}</div>` : ''}
              ${featured.location ? `<div class="flex items-center gap-2 text-cream/70 mb-4 text-sm"><svg viewBox="0 0 24 24" class="w-4 h-4 text-gold" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${featured.location}</div>` : ''}
              ${featured.description ? `<p class="text-cream/80 leading-loose line-clamp-3">${featured.description.split('\n')[0]}</p>` : ''}
              <span class="inline-flex items-center gap-1 text-gold text-sm mt-4 font-medium">مشاهده جزئیات <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></span>
            </div>
          </div>
        </div>

        <!-- List -->
        <div class="lg:col-span-2 space-y-4 opacity-0" data-animate>
    `;

    rest.forEach((item, i) => {
      html += `
        <div class="glass-card rounded-xl p-5 cursor-pointer hover:scale-[1.02] hover:border-gold/60 transition-all duration-300" onclick='openAnnounceModal(${i + 1})'>
          <div class="flex items-center justify-between mb-2">
            <span class="bg-charcoal text-gold-light text-xs px-3 py-1 rounded-md font-semibold">${item.dateStr} • ${item.timeStr}</span>
          </div>
          <h4 class="font-display text-lg text-gold-light mb-1 font-bold">${item.title}</h4>
          ${item.speaker ? `<div class="text-cream/60 text-xs mb-2">${item.speaker}</div>` : ''}
          ${item.description ? `<p class="text-cream/70 text-sm line-clamp-2 leading-relaxed">${item.description.split('\n')[0]}</p>` : ''}
        </div>
      `;
    });

    html += `
        </div>
      </div>
      <!-- Announcement Modal -->
      <div id="announceModal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" id="announceBackdrop"></div>
        <div class="relative h-full flex items-center justify-center p-4">
          <div class="bg-paper text-ink rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gold relative">
            <button id="announceClose" class="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/80 text-gold-light border border-gold grid place-items-center hover:bg-blood transition-colors" aria-label="بستن">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div class="p-8">
              <div id="announceDate" class="inline-block bg-ink text-gold-light px-4 py-1.5 rounded-md text-sm font-semibold mb-4"></div>
              <h3 id="announceTitle" class="font-display text-2xl text-crimson-deep mb-4 font-bold leading-snug"></h3>
              <div id="announceSpeaker" class="flex items-center gap-2 text-ink-muted mb-2 text-sm"></div>
              <div id="announceLocation" class="flex items-center gap-2 text-ink-muted mb-6 text-sm"></div>
              <div class="h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent mb-6"></div>
              <div id="announceDesc" class="text-ink leading-loose whitespace-pre-wrap"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Store data for modal
    window._announcementsData = items;

    // Setup modal close
    $('announceClose').addEventListener('click', closeAnnounceModal);
    $('announceBackdrop').addEventListener('click', closeAnnounceModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('announceModal').classList.contains('hidden')) {
        closeAnnounceModal();
      }
    });

    // Trigger animations
    initScrollAnimations();
  }

  window.openAnnounceModal = function (index) {
    const item = window._announcementsData[index];
    if (!item) return;
    $('announceDate').textContent = `${item.dateStr} • ساعت ${item.timeStr}`;
    $('announceTitle').textContent = item.title;
    $('announceSpeaker').innerHTML = item.speaker
      ? `<svg viewBox="0 0 24 24" class="w-4 h-4 text-crimson-deep" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg> ${item.speaker}`
      : '';
    $('announceLocation').innerHTML = item.location
      ? `<svg viewBox="0 0 24 24" class="w-4 h-4 text-crimson-deep" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${item.location}`
      : '';
    $('announceDesc').textContent = item.description || '';
    $('announceModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  function closeAnnounceModal() {
    $('announceModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ============== Navbar behavior ==============

  function setupNavbar() {
    const navbar = $('navbar');
    const backToTop = $('backToTop');
    const progressBar = $('progressBar');

    function update() {
      const y = window.scrollY;
      // Solid navbar after 80px
      if (y > 80) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');

      // Back-to-top FAB after 600px
      if (y > 600) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');

      // Progress bar (RTL: scale-x from right)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (y / docHeight) : 0;
      progressBar.style.transform = `scaleX(${pct})`;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    // Back-to-top click
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile menu
    const menuToggle = $('menuToggle');
    const mobileMenu = $('mobileMenu');
    const menuIcon = $('menuIcon');
    const backdrop = $('mobileMenuBackdrop');

    function openMenu() {
      mobileMenu.classList.remove('hidden');
      menuIcon.setAttribute('data-lucide', 'x');
      document.body.style.overflow = 'hidden';
      refreshLucide();
    }
    function closeMenu() {
      mobileMenu.classList.add('hidden');
      menuIcon.setAttribute('data-lucide', 'menu');
      document.body.style.overflow = '';
      refreshLucide();
    }
    menuToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('hidden')) openMenu();
      else closeMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // ============== Scroll Animations ==============

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate]:not(.animate-in)').forEach(el => {
      observer.observe(el);
    });
  }

  // ============== Lucide icon refresh ==============

  function refreshLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ============== Init ==============

  async function init() {
    setupNavbar();
    setupFilters();
    setupLightbox();
    setupAudioPlayer();

    // Initialize Lucide icons first
    refreshLucide();

    // Initialize scroll animations for elements present at load
    initScrollAnimations();

    // Load media + announcements in parallel
    await Promise.allSettled([
      (async () => {
        await loadAllMedia();
        renderMediaGallery();
      })(),
      loadAnnouncements(),
    ]);

    // Re-init scroll animations after dynamic content
    initScrollAnimations();
    refreshLucide();

    console.log('[Tharullah] Site initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
