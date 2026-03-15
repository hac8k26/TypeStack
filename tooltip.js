/**
 * TypeStack — Universal Tooltip System
 * Covers all interactive elements across all pages.
 * Priority: data-tooltip > aria-label > title > auto-detected label
 */
(function () {
  'use strict';

  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #ts-tooltip {
      position: fixed;
      z-index: 999999;
      pointer-events: none;
      padding: 5px 10px;
      background: rgba(10,11,20,0.95);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 7px;
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.82);
      white-space: nowrap;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset;
      letter-spacing: 0.1px;
      opacity: 0;
      transform: translateY(5px) scale(0.97);
      transition: opacity 0.14s ease, transform 0.14s ease;
      max-width: 240px;
      white-space: normal;
      text-align: center;
      line-height: 1.4;
    }
    #ts-tooltip.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #ts-tooltip .tip-shortcut {
      display: inline-block;
      margin-left: 6px;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      font-size: 10px;
      color: rgba(255,255,255,0.45);
      font-family: 'JetBrains Mono', monospace;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);

  // ── Tooltip element ──────────────────────────────────────────────────────────
  const tip = document.createElement('div');
  tip.id = 'ts-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  let hideTimer, showTimer, currentTarget = null;

  // ── Auto-label rules ─────────────────────────────────────────────────────────
  // Maps selector → tooltip text (checked in order, first match wins)
  const AUTO_LABELS = [
    // ── Nav links ──
    { sel: 'a[href="fonts.html"]',         tip: 'Browse & preview fonts' },
    { sel: 'a[href="icons.html"]',         tip: 'Browse 1000+ icons' },
    { sel: 'a[href="colors.html"]',        tip: 'Explore color palettes' },
    { sel: 'a[href="motion.html"]',        tip: 'Animation primitives & CSS' },
    { sel: 'a[href="illustrations.html"]', tip: 'Free SVG illustrations' },
    { sel: 'a[href="index.html"].brand',   tip: 'Back to home' },
    { sel: '.brand',                       tip: 'TypeStack home' },
    { sel: 'a[href="terms.html"]',         tip: 'Terms of service' },
    { sel: 'a[href="privacy.html"]',       tip: 'Privacy policy' },
    { sel: 'a[href*="github.com"]',        tip: 'View on GitHub ↗' },
    { sel: 'a[href="#features"]',          tip: 'See all features' },

    // ── Index page ──
    { sel: '#music-btn, .bg-music',        tip: 'Toggle background music' },
    { sel: '.btn-primary, .btn-cta',       tip: 'Get started' },
    { sel: '.lm-close',                    tip: 'Close' },
    { sel: '.lm-card-fonts',              tip: 'Open Fonts page' },
    { sel: '.lm-card-icons',              tip: 'Open Icons page' },
    { sel: '.lm-card-colors',             tip: 'Open Colors page' },
    { sel: '.lm-card-motion',             tip: 'Open Motion page' },
    { sel: '.social-btn',                  tip: 'Share on social' },
    { sel: 'button.btn[onclick*="library"]', tip: 'Browse the library' },

    // ── Chatbot ──
    { sel: '#chatbot-toggle, .chatbot-toggle, [id*="chatbot"]', tip: 'Ask TypeStack AI' },

    // ── Hamburger ──
    { sel: '#hamburger-btn, .hamburger',   tip: 'Open navigation menu' },

    // ── Fonts page ──
    { sel: '#masterInput',                 tip: 'Type to preview all fonts live' },
    { sel: 'button[onclick*="copyCSS"], button.copy-css', tip: 'Copy @font-face CSS' },
    { sel: 'button[onclick*="WOFF2"], button[data-fmt="woff2"]', tip: 'Download WOFF2 font file' },
    { sel: 'button[onclick*="OTF"], button[data-fmt="otf"]',     tip: 'Download OTF font file' },
    { sel: '.font-card',                   tip: 'Click to copy font name' },

    // ── Icons page ──
    { sel: '#searchInput[placeholder*="icon"]', tip: 'Search by icon name' },
    { sel: 'button[data-size="16"]',       tip: 'Preview at 16px' },
    { sel: 'button[data-size="24"]',       tip: 'Preview at 24px' },
    { sel: 'button[data-size="32"]',       tip: 'Preview at 32px' },
    { sel: '.icon-card',                   tip: 'Click to copy SVG code' },
    { sel: '.size-btn',                    tip: 'Change icon size' },

    // ── Colors page ──
    { sel: '#searchInput[placeholder*="color"]', tip: 'Search colors by name or hex' },
    { sel: '.color-card, .swatch',         tip: 'Click to copy hex value' },
    { sel: '.copy-hex',                    tip: 'Copy hex color' },
    { sel: '.copy-rgb',                    tip: 'Copy RGB value' },
    { sel: '.copy-hsl',                    tip: 'Copy HSL value' },

    // ── Motion page ──
    { sel: '#searchInput[placeholder*="motion"]', tip: 'Search animations by name' },
    { sel: '.btn[onclick*="replay"], .btn[onclick*="Replay"]', tip: 'Replay animation' },
    { sel: '.copy-btn',                    tip: 'Copy CSS to clipboard' },
    { sel: '.copy-btn.copied',             tip: 'Copied!' },
    { sel: '.cat-btn',                     tip: 'Filter by category' },
    { sel: '.cat-btn.active',              tip: 'Active filter — click to show all' },
    { sel: '.demo-card',                   tip: 'Animation preview' },

    // ── Illustrations page ──
    { sel: '#searchInput[placeholder*="illus"]', tip: 'Search illustrations by name' },
    { sel: '.color-swatch',                tip: 'Change illustration accent color' },
    { sel: '.illus-btn[onclick*="copy"]',  tip: 'Copy SVG to clipboard' },
    { sel: '.illus-btn[onclick*="open"]',  tip: 'View details & download' },
    { sel: '.illus-card',                  tip: 'Click to open illustration' },
    { sel: '.modal-close',                 tip: 'Close (Esc)' },
    { sel: '.modal-btn[onclick*="Embed"]', tip: 'Copy full SVG embed code' },
    { sel: '.modal-btn.primary',           tip: 'Download as .svg file' },
    { sel: '.copy-code-btn',               tip: 'Copy SVG code' },

    // ── CSS Peeps ──
    { sel: '.peep-btn[onclick*="HTML"]',   tip: 'Copy HTML snippet' },
    { sel: '.peep-btn[onclick*="CSS"]',    tip: 'Copy CSS variables' },
    { sel: '.peep-card',                   tip: 'CSS-only character — no images' },

    // ── Generic fallbacks ──
    { sel: 'button[onclick*="copy"], button[onclick*="Copy"]', tip: 'Copy to clipboard' },
    { sel: 'button[onclick*="download"], button[onclick*="Download"]', tip: 'Download file' },
    { sel: 'button[onclick*="close"], button[onclick*="Close"]', tip: 'Close' },
    { sel: 'button[onclick*="replay"], button[onclick*="Replay"]', tip: 'Replay' },
    { sel: 'input[type="text"]',           tip: 'Type to search or filter' },
    { sel: 'input[type="search"]',         tip: 'Search' },
    { sel: 'input[type="color"]',          tip: 'Pick a color' },
    { sel: 'input[type="range"]',          tip: 'Drag to adjust' },
    { sel: 'select',                       tip: 'Choose an option' },
  ];

  // ── Resolve tooltip text for an element ─────────────────────────────────────
  function resolveText(el) {
    // 1. Explicit data-tooltip
    const dt = el.getAttribute('data-tooltip');
    if (dt && dt.trim()) return dt.trim();

    // 2. aria-label
    const al = el.getAttribute('aria-label');
    if (al && al.trim()) return al.trim();

    // 3. title (we'll strip it to avoid native tooltip)
    const ti = el.getAttribute('title') || el._tsTitle;
    if (ti && ti.trim()) return ti.trim();

    // 4. Auto-label rules
    for (const rule of AUTO_LABELS) {
      try {
        if (el.matches(rule.sel)) return rule.tip;
      } catch (e) { /* invalid selector, skip */ }
    }

    // 5. Ancestor check (e.g. SVG inside button)
    const parent = el.closest('button, a, [data-tooltip]');
    if (parent && parent !== el) return resolveText(parent);

    return null;
  }

  // ── Positioning ──────────────────────────────────────────────────────────────
  function position(target) {
    const r = target.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const gap = 9;

    let top = r.top - th - gap;
    let left = r.left + r.width / 2 - tw / 2;

    // Flip below if off top
    if (top < 6) top = r.bottom + gap;
    // Flip above if off bottom
    if (top + th > innerHeight - 6) top = r.top - th - gap;
    // Clamp horizontally
    left = Math.max(8, Math.min(left, innerWidth - tw - 8));

    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  }

  // ── Show / hide ──────────────────────────────────────────────────────────────
  function show(text, target) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    tip.innerHTML = text;
    currentTarget = target;
    // Small delay to avoid flicker on fast mouse moves
    showTimer = setTimeout(() => {
      tip.classList.add('visible');
      position(target);
    }, 80);
  }

  function hide() {
    clearTimeout(showTimer);
    tip.classList.remove('visible');
    currentTarget = null;
  }

  // ── Reposition on scroll/resize ──────────────────────────────────────────────
  function reposition() {
    if (currentTarget) position(currentTarget);
  }

  // ── Event delegation ─────────────────────────────────────────────────────────
  const INTERACTIVE = 'button, a, input, select, textarea, [data-tooltip], [role="button"], [tabindex], .icon-card, .font-card, .color-card, .swatch, .illus-card, .demo-card, .peep-card, .cat-btn, .copy-btn, .color-swatch, .nav-link, .hamburger, .modal-close, .illus-btn, .peep-btn, .size-btn, .lm-card, .social-btn, .bg-music, #music-btn, .brand';

  document.addEventListener('mouseover', e => {
    const target = e.target.closest(INTERACTIVE);
    if (!target) return;

    // Strip native title to prevent double tooltip
    if (target.hasAttribute('title')) {
      target._tsTitle = target.getAttribute('title');
      target.removeAttribute('title');
    }

    const text = resolveText(target);
    if (!text) return;
    show(text, target);
  }, { passive: true });

  document.addEventListener('mouseout', e => {
    const target = e.target.closest(INTERACTIVE);
    if (!target) return;
    clearTimeout(showTimer);
    hideTimer = setTimeout(hide, 60);
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    if (currentTarget) position(currentTarget);
  }, { passive: true });

  document.addEventListener('click', hide, { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); }, { passive: true });
  document.addEventListener('scroll', hide, { passive: true, capture: true });
  window.addEventListener('resize', reposition, { passive: true });

  // ── Focus tooltips for keyboard users ────────────────────────────────────────
  document.addEventListener('focusin', e => {
    const target = e.target.closest(INTERACTIVE);
    if (!target) return;
    const text = resolveText(target);
    if (!text) return;
    show(text, target);
  }, { passive: true });

  document.addEventListener('focusout', hide, { passive: true });

  // ── MutationObserver: handle dynamically added elements ──────────────────────
  // Strip title from any newly added elements to prevent native tooltip flicker
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const els = [node, ...node.querySelectorAll('[title]')];
        els.forEach(el => {
          if (el.hasAttribute && el.hasAttribute('title')) {
            el._tsTitle = el.getAttribute('title');
            el.removeAttribute('title');
            el.setAttribute('data-tooltip', el._tsTitle);
          }
        });
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
