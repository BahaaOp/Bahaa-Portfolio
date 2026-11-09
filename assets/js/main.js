/* Bahaa Abdelkhaliq — portfolio interactions (no dependencies) */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let reduced = reduceMQ.matches;
  reduceMQ.addEventListener?.('change', e => { reduced = e.matches; });

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  const AR = (window.I18N && window.I18N.ar) || {};
  const JS = (window.I18N && window.I18N.js) || { en: {}, ar: {} };
  let lang = root.lang === 'ar' ? 'ar' : 'en';
  const t = key => (JS[lang] && JS[lang][key]) || JS.en[key] || key;

  /* ------------------------------------------------------------------
     Focus trap helper
  ------------------------------------------------------------------ */
  const FOCUSABLE = 'a[href], button:not([disabled]), iframe, video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function trapTab(container, e) {
    if (e.key !== 'Tab') return;
    const items = $$(FOCUSABLE, container).filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ------------------------------------------------------------------
     i18n
  ------------------------------------------------------------------ */
  const original = new Map();
  $$('[data-i18n]').forEach(el => original.set(el, el.textContent.trim()));
  $$('[data-i18n-html]').forEach(el => original.set(el, el.innerHTML.trim()));
  const originalAttrs = new Map();
  $$('[data-i18n-attr]').forEach(el => {
    const [attr] = el.dataset.i18nAttr.split(':');
    originalAttrs.set(el, el.getAttribute(attr) || '');
  });
  const titles = { en: document.title, ar: 'بهاء عبد الخالق — صانع فيديو تجاري ومحتوى إبداعي بالذكاء الاصطناعي' };

  function splitText(el, startIndex) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    // Arabic letters must stay joined, so Arabic rises word by word.
    const parts = lang === 'ar' ? text.split(/(\s+)/).filter(Boolean) : Array.from(text);
    const count = parts.filter(p => p.trim()).length;
    let i = 0;
    parts.forEach(part => {
      const span = document.createElement('span');
      if (!part.trim()) {
        span.className = 'ch ch--space';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'ch';
        span.textContent = part;
        span.style.setProperty('--mix', `${count > 1 ? Math.round((i / (count - 1)) * 100) : 0}%`);
        i++;
      }
      span.style.setProperty('--i', startIndex + i);
      el.appendChild(span);
    });
    return startIndex + i;
  }

  function applyLang(next) {
    lang = next;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = titles[lang];

    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = lang === 'ar' && AR[key] != null ? AR[key] : original.get(el);
    });
    $$('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = lang === 'ar' && AR[key] != null ? AR[key] : original.get(el);
    });
    $$('[data-i18n-attr]').forEach(el => {
      const [attr, key] = el.dataset.i18nAttr.split(':');
      el.setAttribute(attr, lang === 'ar' && AR[key] != null ? AR[key] : originalAttrs.get(el));
    });

    let idx = 0;
    $$('[data-split]').forEach(el => { idx = splitText(el, idx); });

    const toggle = $('[data-lang-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-label', t('toggle'));
      $$('[data-l]', toggle).forEach(s => s.classList.toggle('is-on', s.dataset.l === lang));
    }

    buildMarquee();
    if (videos.length) renderWork();
    store.set('lang', lang);
    requestAnimationFrame(() => { updatePill(); });
  }

  $('[data-lang-toggle]')?.addEventListener('click', () => applyLang(lang === 'en' ? 'ar' : 'en'));

  /* ------------------------------------------------------------------
     Navigation: scrolled state, active section pill
  ------------------------------------------------------------------ */
  const nav = $('#nav');
  const navLinks = $('.nav__links');
  const pill = $('.nav__pill');
  let activeId = null;

  function updatePill() {
    if (!navLinks || !pill) return;
    const link = activeId && $(`[data-nav="${activeId}"]`, navLinks);
    $$('a', navLinks).forEach(a => {
      const on = a === link;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    navLinks.classList.toggle('has-active', !!link);
    if (link) {
      pill.style.left = `${link.offsetLeft}px`;
      pill.style.width = `${link.offsetWidth}px`;
    }
  }

  const sectionIds = ['top', 'about', 'work', 'experience', 'skills', 'contact'];
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeId = entry.target.id === 'top' ? null : entry.target.id;
        updatePill();
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sectionIds.forEach(id => { const s = document.getElementById(id); if (s) sectionObserver.observe(s); });
  addEventListener('resize', () => updatePill(), { passive: true });
  document.fonts?.ready.then(updatePill);

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const menu = $('#menu');
  const menuBtn = $('[data-menu-open]');
  let menuTimer;

  function openMenu() {
    clearTimeout(menuTimer);
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    $('[data-menu-close]', menu).focus();
  }
  function closeMenu(returnFocus = true) {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    menuTimer = setTimeout(() => { menu.hidden = true; }, reduced ? 0 : 450);
    if (returnFocus) menuBtn.focus();
  }
  menuBtn?.addEventListener('click', openMenu);
  $('[data-menu-close]')?.addEventListener('click', () => closeMenu());
  menu?.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
    trapTab(menu, e);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => closeMenu(false)));
  matchMedia('(min-width: 960px)').addEventListener?.('change', e => { if (e.matches && !menu.hidden) closeMenu(false); });

  /* ------------------------------------------------------------------
     Hero: cursor light, viewfinder tilt, timecode, audio bars
  ------------------------------------------------------------------ */
  const hero = $('.hero');
  const vf = $('[data-tilt]');
  let heroVisible = true;

  if (hero) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

    let raf = 0, px = 0, py = 0;
    hero.addEventListener('pointermove', e => {
      if (reduced || !finePointer.matches) return;
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${px - r.left}px`);
        hero.style.setProperty('--my', `${py - r.top}px`);
        if (vf) {
          const v = vf.getBoundingClientRect();
          const dx = Math.max(-1, Math.min(1, (px - (v.left + v.width / 2)) / (r.width / 2)));
          const dy = Math.max(-1, Math.min(1, (py - (v.top + v.height / 2)) / (r.height / 2)));
          vf.style.setProperty('--ry', `${(dx * 7).toFixed(2)}deg`);
          vf.style.setProperty('--rx', `${(-dy * 6).toFixed(2)}deg`);
        }
      });
    });
    hero.addEventListener('pointerleave', () => {
      vf?.style.setProperty('--rx', '0deg');
      vf?.style.setProperty('--ry', '0deg');
    });
  }

  const tc = $('[data-timecode]');
  if (tc) {
    const start = performance.now();
    const pad = n => String(n).padStart(2, '0');
    let last = -1;
    const tick = now => {
      if (heroVisible && !reduced) {
        const totalFrames = Math.floor(((now - start) / 1000) * 24);
        if (totalFrames !== last) {
          last = totalFrames;
          const f = totalFrames % 24, s = Math.floor(totalFrames / 24);
          tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  $$('.vf__audio i').forEach((bar, i) => {
    const h = 0.35 + Math.abs(Math.sin(i * 1.7)) * 0.6;
    bar.style.setProperty('--h', h.toFixed(2));
    bar.style.setProperty('--t', `${(0.45 + ((i * 37) % 9) / 14).toFixed(2)}s`);
    bar.style.setProperty('--dl', `${(-(i * 0.13)).toFixed(2)}s`);
  });

  /* ------------------------------------------------------------------
     Scroll reveals
  ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  const observeReveals = scope => $$('.reveal:not(.is-in)', scope).forEach(el => revealObserver.observe(el));
  observeReveals(document);

  /* ------------------------------------------------------------------
     Scroll-linked: nav state, timeline fill, tile parallax
  ------------------------------------------------------------------ */
  const timeline = $('.timeline');
  const timelineFill = $('.timeline__fill');
  const visibleTiles = new Set();
  let scrollRaf = 0;

  function onScroll() {
    scrollRaf = 0;
    const vh = innerHeight;
    nav?.classList.toggle('is-scrolled', scrollY > 20);

    if (timeline && timelineFill) {
      const r = timeline.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
      timelineFill.style.setProperty('--p', p.toFixed(4));
    }

    if (!reduced) {
      visibleTiles.forEach(media => {
        const r = media.parentElement.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) / vh; // ≈ -1 … 1
        const limit = r.height * 0.07;
        const y = Math.max(-limit, Math.min(limit, -offset * r.height * 0.08));
        media.style.setProperty('--py', `${y.toFixed(1)}px`);
      });
    }
  }
  const requestScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); };
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Selected work
  ------------------------------------------------------------------ */
  const grid = $('#work-grid');
  let videos = [];
  let tileObserver;

  const ICON_SHORTS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 9.6l-2-1.2 2.1-1.2a3.4 3.4 0 0 0-3.4-5.9l-8 4.6a3.4 3.4 0 0 0 0 5.9l2 1.2-2.1 1.2a3.4 3.4 0 0 0 3.4 5.9l8-4.6a3.4 3.4 0 0 0 0-5.9zM10 15V9l5 3z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = v => (v && typeof v === 'object') ? (v[lang] || v.en || '') : (v || '');
  const pad2 = n => String(n).padStart(2, '0');
  const hasSources = v => v.sources && (v.sources.webm || v.sources.mp4);

  function mediaMarkup(v) {
    if (hasSources(v)) {
      return `<video muted loop playsinline preload="none" poster="${esc(v.posterFallback || v.poster)}">
          ${v.sources.webm ? `<source src="${esc(v.sources.webm)}" type="video/webm">` : ''}
          ${v.sources.mp4 ? `<source src="${esc(v.sources.mp4)}" type="video/mp4">` : ''}
        </video>`;
    }
    const webp = /\.webp$/i.test(v.poster || '') ? `<source srcset="${esc(v.poster)}" type="image/webp">` : '';
    return `<picture>${webp}<img src="${esc(v.posterFallback || v.poster)}" alt="" loading="lazy" decoding="async" width="720" height="1280"></picture>`;
  }

  function renderWork() {
    if (!grid) return;
    playingLi = null;
    tileObserver?.disconnect();
    visibleTiles.clear();
    grid.innerHTML = videos.map((v, i) => `
      <li class="reveal${i === 0 ? ' is-featured' : ''}" style="--d:${((i % 4) * 0.06).toFixed(2)}s">
        <button class="tile" type="button" data-index="${i}"${window.PORTFOLIO_LINK_ONLY ? ' aria-haspopup="dialog"' : ''}
          aria-label="${esc(`${t('play')}: ${L(v.title)} (${L(v.category)})`)}">
          <span class="tile__media">${mediaMarkup(v)}</span>
          <span class="tile__shade"></span>
          <span class="tile__top">
            <span class="chip">${ICON_SHORTS}<span>${esc(v.platform || 'Video')}</span></span>
            <span class="tile__index">${esc(t('no'))} ${pad2(i + 1)}</span>
          </span>
          <span class="tile__bottom">
            <span class="tile__text">
              <span class="tile__cat">${esc(L(v.category))}</span>
              <span class="tile__title">${esc(L(v.title))}</span>
            </span>
            <span class="tile__play">${ICON_PLAY}</span>
          </span>
        </button>
      </li>`).join('');
    grid.classList.remove('is-loading');

    // Keep tiles that were already revealed fully visible after a re-render.
    if (grid.dataset.revealed) $$('.reveal', grid).forEach(li => li.classList.add('is-in'));
    observeReveals(grid);
    fillLastRow();

    tileObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const media = $('.tile__media', entry.target);
        const video = $('video', entry.target);
        if (entry.isIntersecting) {
          visibleTiles.add(media);
          grid.dataset.revealed = '1';
          if (video && !reduced) { video.preload = 'auto'; video.play().catch(() => {}); }
        } else {
          visibleTiles.delete(media);
          if (video) video.pause();
          if (playingLi && playingLi.contains(entry.target)) stopInline(false);
        }
      });
      requestScroll();
    }, { threshold: 0.2 });
    $$('.tile', grid).forEach(tile => tileObserver.observe(tile));
  }

  // If the last row is short, widen the final tile so the grid ends flush.
  function fillLastRow() {
    if (!grid) return;
    const items = $$(':scope > li', grid);
    if (!items.length) return;
    const cols = parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 2;
    items.forEach(li => { li.classList.remove('is-wide'); li.style.removeProperty('--span'); });
    const featuredCells = cols >= 2 ? 4 : 1;
    const cells = featuredCells + (items.length - 1);
    const remainder = cells % cols;
    if (remainder && items.length > 1) {
      const last = items[items.length - 1];
      last.classList.add('is-wide');
      last.style.setProperty('--span', String(cols - remainder + 1));
    }
  }
  let fillRaf = 0;
  addEventListener('resize', () => { cancelAnimationFrame(fillRaf); fillRaf = requestAnimationFrame(fillLastRow); }, { passive: true });

  /* Hero viewfinder: cycle through the work covers */
  const reel = $('[data-vf-reel]');
  const clipLabel = $('[data-vf-clip]');
  const reelText = i => `CLIP ${pad2(i + 1)} · ${String((videos[i].category && videos[i].category.en) || '').toUpperCase()}`;
  function buildReel() {
    if (!reel || !videos.length) return;
    reel.innerHTML = videos.map((v, i) => {
      const webp = /\.webp$/i.test(v.poster || '') ? `<source srcset="${esc(v.poster)}" type="image/webp">` : '';
      return `<picture${i === 0 ? ' class="is-on"' : ''}>${webp}<img class="vf__img" src="${esc(v.posterFallback || v.poster)}" alt="" width="720" height="1280" decoding="async"${i ? ' loading="lazy"' : ''}></picture>`;
    }).join('');
    if (clipLabel) clipLabel.textContent = reelText(0);
    if (reduced || videos.length < 2) return;
    let current = 0;
    setInterval(() => {
      if (!heroVisible || document.hidden || reduced) return;
      const pics = $$('picture', reel);
      pics[current].classList.remove('is-on');
      current = (current + 1) % pics.length;
      pics[current].classList.add('is-on');
      if (clipLabel) clipLabel.textContent = reelText(current);
    }, 3600);
  }

  if (grid) {
    grid.classList.add('is-loading');
    fetch('data/videos.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        videos = Array.isArray(data) ? data : (data.videos || []);
        renderWork();
        buildReel();
      })
      .catch(() => {
        grid.classList.remove('is-loading');
        $('#work-error').hidden = false;
      });

    grid.addEventListener('click', e => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      const i = Number(tile.dataset.index);
      if (window.PORTFOLIO_LINK_ONLY && !hasSources(videos[i])) openPlayer(i, tile);
      else playInline(i, tile);
    });
    grid.addEventListener('keydown', e => {
      if (e.key === 'Escape' && playingLi && playingLi.contains(e.target)) stopInline(true);
    });
  }

  /* ------------------------------------------------------------------
     Inline playback: the player loads inside the clicked card
  ------------------------------------------------------------------ */
  let playingLi = null;
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function playInline(i, tile) {
    const v = videos[i];
    if (!v) return;
    stopInline(false);
    const li = tile.closest('li');
    const box = document.createElement('div');
    box.className = 'tile-player';
    if (hasSources(v)) {
      box.innerHTML = `<video controls autoplay playsinline poster="${esc(v.posterFallback || v.poster)}">
          ${v.sources.webm ? `<source src="${esc(v.sources.webm)}" type="video/webm">` : ''}
          ${v.sources.mp4 ? `<source src="${esc(v.sources.mp4)}" type="video/mp4">` : ''}
        </video>`;
    } else {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtubeId)}?autoplay=1&rel=0&playsinline=1&modestbranding=1${lang === 'ar' ? '&hl=ar' : ''}`;
      box.innerHTML = `<iframe src="${src}" title="${esc(L(v.title))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tile-player__close round-btn';
    close.setAttribute('aria-label', `${t('stop')}: ${L(v.title)}`);
    close.innerHTML = ICON_CLOSE;
    close.addEventListener('click', () => stopInline(true));
    box.appendChild(close);

    $('video', tile)?.pause();
    tile.tabIndex = -1;
    tile.setAttribute('aria-hidden', 'true');
    li.classList.add('is-playing');
    li.appendChild(box);
    playingLi = li;
    $('iframe, video', box).focus();
  }

  function stopInline(returnFocus) {
    if (!playingLi) return;
    const li = playingLi;
    playingLi = null;
    $('.tile-player', li)?.remove();
    li.classList.remove('is-playing');
    const tile = $('.tile', li);
    if (!tile) return;
    tile.removeAttribute('tabindex');
    tile.removeAttribute('aria-hidden');
    if (returnFocus) tile.focus();
  }

  /* ------------------------------------------------------------------
     Video modal
  ------------------------------------------------------------------ */
  const player = $('#player');
  const stage = $('#player-stage');
  let lastTrigger = null;
  let closeTimer;

  function openPlayer(i, trigger) {
    const v = videos[i];
    if (!v || !player) return;
    clearTimeout(closeTimer);
    lastTrigger = trigger;

    if (hasSources(v)) {
      stage.innerHTML = `<video controls autoplay playsinline poster="${esc(v.posterFallback || v.poster)}">
          ${v.sources.webm ? `<source src="${esc(v.sources.webm)}" type="video/webm">` : ''}
          ${v.sources.mp4 ? `<source src="${esc(v.sources.mp4)}" type="video/mp4">` : ''}
        </video>`;
    } else if (window.PORTFOLIO_LINK_ONLY) {
      // Hosts that block third-party frames: show the cover and link out.
      stage.innerHTML = `<img src="${esc(v.posterFallback || v.poster)}" alt="">
        <a class="player__ext-cta" href="https://www.youtube.com/shorts/${encodeURIComponent(v.youtubeId)}" target="_blank" rel="noopener">${ICON_PLAY}<span>${esc(t('openYt'))}</span></a>`;
    } else {
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtubeId)}?autoplay=1&rel=0&playsinline=1&modestbranding=1${lang === 'ar' ? '&hl=ar' : ''}`;
      stage.innerHTML = `<iframe src="${src}" title="${esc(L(v.title))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }

    $('#player-index').textContent = `${t('no')} ${pad2(i + 1)} / ${pad2(videos.length)}`;
    $('#player-cat').textContent = L(v.category);
    $('#player-title').textContent = L(v.title);
    const ext = $('#player-ext');
    if (v.youtubeId) { ext.hidden = false; ext.href = `https://www.youtube.com/shorts/${encodeURIComponent(v.youtubeId)}`; }
    else ext.hidden = true;

    player.showModal();
    root.style.overflow = 'hidden';
    requestAnimationFrame(() => player.classList.add('is-visible'));
    $('[data-player-close]', player).focus();
  }

  function closePlayer() {
    if (!player?.open) return;
    player.classList.remove('is-visible');
    const finish = () => {
      player.close();
      stage.innerHTML = '';
      root.style.overflow = '';
      lastTrigger?.focus();
    };
    if (reduced) finish(); else closeTimer = setTimeout(finish, 280);
  }

  if (player) {
    $('[data-player-close]', player).addEventListener('click', closePlayer);
    player.addEventListener('cancel', e => { e.preventDefault(); closePlayer(); });
    player.addEventListener('keydown', e => trapTab(player, e));
    player.addEventListener('click', e => {
      if (e.target === player || e.target.classList.contains('player__inner')) closePlayer();
    });
  }

  /* ------------------------------------------------------------------
     Skills spotlight
  ------------------------------------------------------------------ */
  $$('[data-spotlight]').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (reduced) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });

  /* ------------------------------------------------------------------
     Copy to clipboard
  ------------------------------------------------------------------ */
  const copyStatus = $('#copy-status');
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }
  $$('[data-copy]').forEach(btn => {
    let timer;
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      const label = $('[data-copy-label]', btn);
      clearTimeout(timer);
      if (ok) {
        btn.classList.add('is-done');
        label.textContent = t('copied');
        copyStatus.textContent = t('copyDone');
      } else {
        copyStatus.textContent = t('copyFail');
      }
      timer = setTimeout(() => {
        btn.classList.remove('is-done');
        label.textContent = lang === 'ar' ? AR['contact.copy'] : original.get(label);
        copyStatus.textContent = '';
      }, 2200);
    });
  });

  /* ------------------------------------------------------------------
     Marquee
  ------------------------------------------------------------------ */
  const STAR = '<svg class="marquee__star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>';
  function buildMarquee() {
    const track = $('[data-marquee]');
    if (!track) return;
    const words = t('marquee');
    const group = words.map((w, i) =>
      `<span class="marquee__word${i % 2 ? ' marquee__word--outline' : ''}">${esc(w)}</span>${STAR}`).join('');
    track.innerHTML = `<div class="marquee__group">${group}</div><div class="marquee__group">${group}</div>`;
  }

  /* ------------------------------------------------------------------
     Misc + init
  ------------------------------------------------------------------ */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const initial = new URLSearchParams(location.search).get('lang') || store.get('lang') || 'en';
  applyLang(initial === 'ar' ? 'ar' : 'en');
})();
