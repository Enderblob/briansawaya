/*
 * Robotic heart: scroll progress (0 to 1) assembles it part by part; at the bottom of the page it beats.
 * The parts and their timing live in index.html (data-s, data-e, data-dx, data-dy, data-rot, data-cx, data-cy).
 * The beat, glow, ECG line, and gear spin are CSS animations in styles.css, switched on by the "complete" class.
 */
(() => {
  'use strict';

  const root = document.getElementById('heart');
  if (!root) return;

  const COMPLETE_AT = 0.98; // scroll progress where the heart is finished and starts beating
  const SMOOTHING_MS = 90;  // how quickly the animation catches up to the scroll position (smaller = snappier)
  const BPM = 70;

  const label = document.getElementById('heart-label');
  const parts = [...root.querySelectorAll('[data-s]')].map((node) => ({
    node,
    start: Number(node.dataset.s),
    end: Number(node.dataset.e),
    dx: Number(node.dataset.dx || 0),
    dy: Number(node.dataset.dy || 0),
    rot: Number(node.dataset.rot || 0),
    cx: Number(node.dataset.cx || 0),
    cy: Number(node.dataset.cy || 0),
    t: -1
  }));

  const clamp = (value) => Math.min(1, Math.max(0, value));

  // Overshoots slightly past 1, which makes each part "snap" into place.
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  let lastLabel = '';
  function setLabel(text) {
    if (label && text !== lastLabel) {
      label.textContent = text;
      lastLabel = text;
    }
  }

  function draw(progress) {
    for (const part of parts) {
      const t = clamp((progress - part.start) / (part.end - part.start));
      if (t === part.t) continue; // nothing changed for this part
      part.t = t;
      if (t >= 1) {
        part.node.removeAttribute('transform');
        part.node.style.opacity = '1';
        continue;
      }
      const away = 1 - easeOutBack(t); // 1 = fully apart, 0 = in place
      const x = (part.dx * away).toFixed(2);
      const y = (part.dy * away).toFixed(2);
      const angle = (part.rot * away).toFixed(2);
      part.node.setAttribute('transform', `translate(${x} ${y}) rotate(${angle} ${part.cx} ${part.cy})`);
      part.node.style.opacity = Math.min(1, t * 2.5).toFixed(3);
    }

    const complete = progress >= COMPLETE_AT;
    root.classList.toggle('complete', complete);
    setLabel(complete ? `${BPM} bpm` : `assembly ${Math.round((progress / COMPLETE_AT) * 100)}%`);
  }

  // Visitors who asked for less motion get the finished heart: no flying parts, no beating.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('static');
    draw(1);
    setLabel('');
    return;
  }

  // How far down the page the reader is, 0 to 1.
  function scrollProgress() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if (range <= 0) {
      // A page with nothing to scroll counts as finished, but only once the content has loaded.
      return document.documentElement.classList.contains('ready') ? 1 : 0;
    }
    return clamp(window.scrollY / range);
  }

  let current = 0;
  let frame = 0;
  let lastTime = 0;

  function tick(now) {
    const goal = scrollProgress();
    // Ease toward the scroll position. Based on elapsed time, so it feels the same at any frame rate.
    const elapsed = lastTime ? Math.min(now - lastTime, 100) : 16;
    lastTime = now;
    current += (goal - current) * (1 - Math.exp(-elapsed / SMOOTHING_MS));
    if (Math.abs(goal - current) < 0.0008) current = goal;
    draw(current);
    if (current === goal) {
      frame = 0;
      lastTime = 0;
    } else {
      frame = requestAnimationFrame(tick);
    }
  }

  // Only run frames while something is changing.
  function wake() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  if ('ResizeObserver' in window) new ResizeObserver(wake).observe(document.body); // page grows when content loads or a card opens

  draw(0);
  wake();
})();
