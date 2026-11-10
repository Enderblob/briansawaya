/*
 * Renders the whole page from content.json.
 * To change what the site says, edit content.json (see README.md). This file should rarely need edits.
 */
(() => {
  'use strict';

  const MAX_BULLETS = 3;
  const MAX_TAGS = 3;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ICONS = {
    download: '<path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7"/>',
    github: '<path d="M9 19c-4 1.5-4-2-6-2m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 00-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>'
  };

  const items = []; // { entry, node, open() }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealObserver = null;

  document.documentElement.classList.add('js');

  /* ---------- Small helpers ---------- */

  const $ = (selector, root = document) => root.querySelector(selector);

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child != null && child !== false) node.append(child);
    }
    return node;
  }

  function icon(name) {
    const span = el('span', { class: 'icon', 'aria-hidden': 'true' });
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return span;
  }

  // Only allow web links, mail links, and paths inside this site.
  function safeUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return null;
    const value = url.trim();
    if (/^(https?:|mailto:)/i.test(value)) return value;
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
    return value;
  }

  const isExternal = (url) => /^https?:/i.test(url);

  function link(label, url, iconName, className) {
    const href = safeUrl(url);
    if (!href) return null;
    return el(
      'a',
      { class: className, href, target: isExternal(href) ? '_blank' : null, rel: isExternal(href) ? 'noopener' : null },
      iconName ? icon(iconName) : null,
      label
    );
  }

  function resumeLink(links, label, className) {
    const href = safeUrl(links.resume);
    if (!href) return null;
    return el('a', { class: className, href, download: links.resumeFilename || true }, icon('download'), label);
  }

  // "2026-08" -> "Aug 2026"
  function formatMonth(value) {
    if (!value) return '';
    if (value === 'present') return 'Present';
    const [year, month] = value.split('-');
    return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
  }

  function formatDates(dates = {}) {
    if (dates.label) return dates.label;
    const start = formatMonth(dates.start);
    const end = formatMonth(dates.end);
    return end && end !== start ? `${start} – ${end}` : start;
  }

  // Newest first: ongoing entries on top, then by end date, then by start date.
  function sortKey(entry) {
    const dates = entry.dates || {};
    const end = !dates.end || dates.end === 'present' ? '9999-12' : dates.end;
    return `${end}|${dates.start || ''}`;
  }
  const newestFirst = (a, b) => sortKey(b).localeCompare(sortKey(a));

  // A bare file name ("hero.jpg") means a file in assets/projects/<slug>/.
  function resolveImage(src, slug) {
    if (typeof src !== 'string' || !src.trim()) return null;
    return src.includes('/') ? safeUrl(src) : `assets/projects/${slug}/${src.trim()}`;
  }

  // An image box that stays a clean gray placeholder until its photo exists.
  function media(src, alt, className, eager) {
    const box = el('div', { class: `media ${className || ''}`.trim() });
    if (!src) {
      box.classList.add('empty');
      return box;
    }
    const image = el('img', { src, alt: alt || '', loading: eager ? 'eager' : 'lazy', decoding: 'async' });
    image.addEventListener('error', () => {
      image.remove();
      box.classList.add('empty');
    });
    box.append(image);
    return box;
  }

  function reveal(node) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (observed) => {
          for (const item of observed) {
            if (item.isIntersecting) {
              item.target.classList.add('in');
              revealObserver.unobserve(item.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px' }
      );
    }
    node.classList.add('reveal');
    revealObserver.observe(node);
  }

  /* ---------- Hero, quick facts, footer ---------- */

  function contactLinks(links, className) {
    return [
      link('LinkedIn', links.linkedin, 'linkedin', className),
      links.email ? link('Email', `mailto:${links.email}`, 'mail', className) : null,
      link('GitHub', links.github, 'github', className)
    ].filter(Boolean);
  }

  function renderHero(data) {
    const profile = data.profile || {};
    const links = data.links || {};
    const about = data.about || {};

    for (const node of document.querySelectorAll('[data-bind]')) {
      const value = profile[node.dataset.bind];
      if (value) node.textContent = value;
    }

    const resume = safeUrl(links.resume);
    for (const node of document.querySelectorAll('[data-resume]')) {
      if (resume) {
        node.href = resume;
        node.setAttribute('download', links.resumeFilename || '');
      } else {
        node.hidden = true;
      }
    }

    $('#bio').append(...(about.bio || []).map((text) => el('p', { text })));
    $('#actions').append(...[resumeLink(links, 'Download Resume (PDF)', 'btn btn-primary'), ...contactLinks(links, 'btn')].filter(Boolean));

    const headshot = about.headshot || {};
    $('#headshot').append(media(safeUrl(headshot.src), headshot.alt || profile.name, 'portrait', true));

    const facts = profile.facts || [];
    $('#facts-list').append(...facts.map((text) => el('li', { text })));
    $('#facts').hidden = !facts.length;

    $('#footer-links').append(...contactLinks(links), ...[resumeLink(links, 'Resume (PDF)')].filter(Boolean));
    $('#footer-note').textContent = `© ${new Date().getFullYear()} ${profile.name || ''}`;
  }

  /* ---------- Entries (project cards and experience rows) ---------- */

  function buildVideo(video) {
    const source = typeof video === 'string' ? { url: video } : video || {};
    const url = safeUrl(source.url);
    if (!url) return null;
    const title = source.title || 'Project video';
    const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    let player;
    if (youtube || vimeo) {
      player = el('iframe', {
        src: youtube ? `https://www.youtube-nocookie.com/embed/${youtube[1]}` : `https://player.vimeo.com/video/${vimeo[1]}`,
        title,
        loading: 'lazy',
        allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen',
        allowfullscreen: true
      });
    } else {
      player = el('video', { src: url, controls: true, preload: 'none', playsinline: true, 'aria-label': title });
    }
    return el('div', { class: 'video' }, player);
  }

  let lightbox;
  function openLightbox(src, alt) {
    if (!lightbox) {
      lightbox = el(
        'dialog',
        { class: 'lightbox', 'aria-label': 'Image viewer' },
        el('button', { class: 'lightbox-close', type: 'button', 'aria-label': 'Close image', text: '×', onclick: () => lightbox.close() }),
        el('img', { alt: '' }),
        el('p')
      );
      lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) lightbox.close();
      });
      document.body.append(lightbox);
    }
    const image = $('img', lightbox);
    image.src = src;
    image.alt = alt || '';
    $('p', lightbox).textContent = alt || '';
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else window.open(src, '_blank', 'noopener');
  }

  // Gallery items are file names ("01.jpg") or { "src", "alt" } objects.
  function buildGallery(entry) {
    const photos = (entry.gallery || [])
      .map((item) => (typeof item === 'string' ? { src: item } : item || {}))
      .map((item) => ({ src: resolveImage(item.src, entry.slug), alt: item.alt || entry.title }))
      .filter((item) => item.src);
    if (!photos.length) return null;

    const gallery = el('div', { class: 'gallery' });
    for (const photo of photos) {
      const button = el(
        'button',
        { type: 'button', 'aria-label': `View image: ${photo.alt}`, onclick: () => openLightbox(photo.src, photo.alt) },
        el('img', { src: photo.src, alt: photo.alt, loading: 'lazy', decoding: 'async' })
      );
      // A gallery photo that is not there yet is simply left out.
      $('img', button).addEventListener('error', () => {
        button.remove();
        if (!gallery.children.length) gallery.remove();
      });
      gallery.append(button);
    }
    return gallery;
  }

  // Built on first expand, so collapsed entries cost nothing.
  function buildDetails(entry) {
    const details = [];
    const bullets = (entry.bullets || []).slice(0, MAX_BULLETS);
    if (bullets.length) details.push(el('ul', { class: 'bullets' }, bullets.map((text) => el('li', { text }))));

    const gallery = buildGallery(entry);
    if (gallery) details.push(gallery);

    const video = buildVideo(entry.video);
    if (video) details.push(video);

    const entryLinks = (entry.links || []).map((item) => link(item.label, item.url, isExternal(item.url || '') ? 'external' : null)).filter(Boolean);
    if (entryLinks.length) details.push(el('div', { class: 'entry-links' }, entryLinks));

    return details;
  }

  // variant: "card" (project) or "row" (experience timeline)
  function buildEntry(entry, variant) {
    const detailsId = `details-${entry.slug}`;
    const toggleLabel = el('span', { text: 'Details' });
    const toggle = el(
      'button',
      { class: 'entry-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailsId, 'aria-label': `Details: ${entry.title}` },
      toggleLabel,
      icon('chevron')
    );
    const details = el('div', { class: 'entry-details', id: detailsId, hidden: true });
    const meta = [entry.org, formatDates(entry.dates)].filter(Boolean).join(' · ');

    const node = el(
      'li',
      { class: `entry ${variant}`, id: entry.slug },
      // "imageFit": "contain" shows the whole image (for logos) instead of cropping it to fill the box.
      media(resolveImage(entry.image, entry.slug), entry.imageAlt || entry.title, entry.imageFit === 'contain' ? 'contain' : ''),
      el(
        'div',
        { class: 'entry-text' },
        el('h3', { class: 'entry-title', text: entry.title }),
        meta ? el('p', { class: 'entry-meta', text: meta }) : null,
        entry.impact ? el('p', { class: 'entry-impact', text: entry.impact }) : null,
        el('div', { class: 'entry-foot' }, el('ul', { class: 'tags' }, (entry.tags || []).slice(0, MAX_TAGS).map((tag) => el('li', { class: 'tag', text: tag }))), toggle),
        details
      )
    );

    let built = false;
    function setOpen(open) {
      if (open && !built) {
        details.append(...buildDetails(entry));
        built = true;
      }
      details.hidden = !open;
      node.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggleLabel.textContent = open ? 'Close' : 'Details';
    }
    toggle.addEventListener('click', () => setOpen(details.hidden));

    reveal(node);
    items.push({ entry, node, open: () => setOpen(true) });
    return node;
  }

  function renderEntries(data) {
    const entries = [...(data.timeline || [])].sort(newestFirst);
    const projects = entries.filter((entry) => entry.type !== 'job');
    // Featured cards keep the order they have in content.json, so the strongest project can go first.
    const featured = (data.timeline || []).filter((entry) => entry.type !== 'job' && entry.featured);
    const sections = [
      ['#featured-list', '#projects', featured, 'card'],
      ['#experience-list', '#experience', entries.filter((entry) => entry.type === 'job'), 'row'],
      ['#more-list', '#more-projects', projects.filter((entry) => !entry.featured), 'card']
    ];
    for (const [list, section, group, variant] of sections) {
      $(list).append(...group.map((entry) => buildEntry(entry, variant)));
      $(section).hidden = !group.length;
    }
  }

  /* ---------- Skills ---------- */

  function renderSkills(data) {
    const list = $('#skills-list');
    for (const group of data.skills || []) {
      const row = el('div', { class: 'skill-group' }, el('h3', { text: group.group }), el('ul', {}, (group.items || []).map((text) => el('li', { class: 'skill', text }))));
      reveal(row);
      list.append(row);
    }
  }

  /* ---------- Navigation ---------- */

  // Underlines the nav link of the section being read.
  function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const navLinks = [...document.querySelectorAll('.nav-link')];
    const spy = new IntersectionObserver(
      (observed) => {
        for (const item of observed) {
          if (!item.isIntersecting) continue;
          const target = `#${item.target.dataset.nav}`;
          for (const anchor of navLinks) anchor.classList.toggle('active', anchor.getAttribute('href') === target);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    for (const section of document.querySelectorAll('[data-nav]')) spy.observe(section);
  }

  // A link like /#autolab opens that entry directly.
  function handleHash() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const item = items.find((candidate) => candidate.entry.slug === hash);
    if (!item) return;
    item.open();
    item.node.scrollIntoView();
  }

  /* ---------- Start ---------- */

  function render(data) {
    renderHero(data);
    renderEntries(data);
    renderSkills(data);
    setupScrollSpy();
    window.addEventListener('hashchange', handleHash);
    handleHash();
    document.documentElement.classList.add('ready');
  }

  function showError(error) {
    console.error(error);
    $('#main').prepend(
      el('p', {
        class: 'load-error',
        text: 'Could not load content.json. If you opened index.html straight from disk, start a local server instead (see README.md). If you just edited content.json, check it for a JSON syntax error.'
      })
    );
  }

  fetch('content.json')
    .then((response) => {
      if (!response.ok) throw new Error(`content.json returned ${response.status}`);
      return response.json();
    })
    .then(render)
    .catch(showError);
})();
