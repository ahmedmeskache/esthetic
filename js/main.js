(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- loader ---------- */
  const loader = $('.loader');
  if (loader) {
    const done = () => {
      loader.classList.add('done');
      document.body.classList.add('page-enter');
      document.documentElement.classList.remove('lock');
    };
    window.addEventListener('load', () => setTimeout(done, reduceMotion ? 0 : 500));
    setTimeout(done, 2600);
  }

  /* ---------- header + progress + to-top ---------- */
  const header = $('#siteHeader');
  const toTop = $('#toTop');
  const progress = $('.progress-bar');

  const onScroll = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('scrolled', y > 30);
    if (toTop) toTop.classList.toggle('show', y > 500);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- custom cursor ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-cursor');

    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    };
    loop();

    const hot = 'a, button, .svc-row, input, textarea, select, summary, .g-card, .gm';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hot)) { dot.classList.add('is-active'); ring.classList.add('is-active'); }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hot)) { dot.classList.remove('is-active'); ring.classList.remove('is-active'); }
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.btn, .nav-cta').forEach(el => {
      const strength = 0.3;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- mobile menu ---------- */
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  if (navToggle && mobileMenu) {
    const closeMenu = () => {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('lock');
      document.body.style.overflow = '';
    };
    navToggle.addEventListener('click', () => {
      const open = !mobileMenu.classList.contains('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.documentElement.classList.toggle('lock', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- counters ---------- */
  const counters = $$('.stat-num');
  if ('IntersectionObserver' in window) {
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        cObs.unobserve(el);
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cObs.observe(c));
  }

  /* ---------- parallax images ---------- */
  if (finePointer && !reduceMotion && 'IntersectionObserver' in window) {
    const els = $$('[data-parallax]');
    const pObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const speed = parseFloat(el.dataset.parallax) || 0.1;
          const rect = el.parentElement.getBoundingClientRect();
          const shift = Math.max(rect.height * 0.04, 12);
          let last = 0;
          const move = () => {
            const vw = window.innerHeight / 2 - (rect.top + rect.height / 2) + window.innerHeight / 2;
            const ty = Math.max(-shift, Math.min(shift, vw * speed));
            if (Math.abs(ty - last) > 0.5) { el.style.transform = `translate3d(0, ${ty}px, 0) scale(1.08)`; last = ty; }
            raf = requestAnimationFrame(move);
          };
          let raf = requestAnimationFrame(move);
          window.addEventListener('scroll', () => { rect.top = el.parentElement.getBoundingClientRect().top; }, { passive: true });
          pObs.unobserve(el);
        }
      });
    }, { threshold: 0.05 });
    els.forEach(el => pObs.observe(el));
  }

  /* ---------- hero rotating word ---------- */
  const rot = $('#rot');
  if (rot) {
    const words = (rot.dataset.words || '').split(',');
    if (words.length > 1) {
      let i = 0;
      const swap = () => {
        i = (i + 1) % words.length;
        rot.classList.add('swap-out');
        setTimeout(() => {
          rot.textContent = words[i];
          rot.classList.remove('swap-out');
          rot.classList.add('swap-in');
          setTimeout(() => rot.classList.remove('swap-in'), 500);
        }, 400);
      };
      setInterval(swap, 3200);
    }
  }

  /* ---------- home gallery auto-scroll ---------- */
  const autoTrack = $('#autoTrack');
  if (autoTrack) {
    let paused = false;
    const cards = $$('.g-card', autoTrack);
    if (cards.length > 2) {
      const step = () => cards[0].offsetWidth + 22;
      const advance = () => {
        if (paused || reduceMotion) return;
        const max = autoTrack.scrollWidth - autoTrack.clientWidth;
        if (autoTrack.scrollLeft >= max - 10) autoTrack.scrollTo({ left: 0, behavior: 'smooth' });
        else autoTrack.scrollBy({ left: step(), behavior: 'smooth' });
      };
      setInterval(advance, 3000);
      autoTrack.addEventListener('mouseenter', () => { paused = true; });
      autoTrack.addEventListener('mouseleave', () => { paused = false; });
      $('.gallery-nav').addEventListener('click', () => autoTrack.scrollBy({ left: step(), behavior: 'smooth' }));
    }
  }

  /* ---------- manual gallery prev/next ---------- */
  const track = $('#galleryTrack');
  const prevBtn = $('#galleryPrev');
  const nextBtn = $('#galleryNext');
  if (track) {
    const step = () => Math.min(window.innerWidth * 0.82, 560);
    if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  /* ---------- reviews auto slider ---------- */
  const stage = $('.review-stage');
  const slides = $$('.review-slide', stage);
  const dots = $$('.review-dots .dot', stage);
  if (slides.length) {
    let cur = 0;
    let timer;
    const show = i => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
      cur = i;
    };
    const next = () => show((cur + 1) % slides.length);
    const restart = () => { clearInterval(timer); timer = setInterval(next, 5500); };
    dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.slide); restart(); }));
    restart();
    stage.addEventListener('mouseenter', () => clearInterval(timer));
    stage.addEventListener('mouseleave', restart);
  }

  /* ---------- book form ---------- */
  const form = $('#bookForm');
  const success = $('#formSuccess');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (success) {
        success.classList.add('show');
        form.reset();
        setTimeout(() => success.classList.remove('show'), 6000);
      }
    });
  }

  /* ---------- service menu preview (swap photo on hover) ---------- */
  const menuRows = $$('.menu-row');
  const pvImgs = $$('.menu-preview .pv');
  const pvName = $('.menu-preview-name');
  if (menuRows.length && pvImgs.length) {
    const show = (i, name) => {
      pvImgs.forEach(img => img.classList.toggle('active', img === pvImgs[i]));
      if (pvName && name !== undefined) pvName.textContent = name;
    };
    menuRows.forEach(row => {
      const enter = () => {
        const h3 = row.querySelector('h3');
        show(Number(row.dataset.preview), h3 ? h3.textContent : undefined);
      };
      row.addEventListener('mouseenter', enter);
      row.addEventListener('focus', enter);
    });
  }

  /* ---------- newsletter ---------- */
  const newsletter = $('#newsletterForm');
  if (newsletter) {
    newsletter.addEventListener('submit', e => {
      e.preventDefault();
      newsletter.reset();
      const note = newsletter.parentElement.querySelector('h4');
      if (note) {
        const orig = note.textContent;
        note.textContent = 'You\u2019re on the list!';
        setTimeout(() => { note.textContent = orig; }, 3200);
      }
    });
  }

  /* ---------- image fallback (until real photos are added) ---------- */
  document.addEventListener('error', e => {
    const img = e.target;
    if (img && img.tagName === 'IMG') {
      const parent = img.parentElement;
      if (parent) {
        const hold = document.createElement('div');
        hold.className = 'img-hold';
        hold.textContent = 'The Glow';
        parent.appendChild(hold);
      }
      img.remove();
    }
  }, true);

  /* ---------- reduced motion safety ---------- */
  if (reduceMotion) {
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{animation-duration:0.001s!important;transition-duration:0.001s!important}';
    document.head.appendChild(style);
    revealEls.forEach(el => el.classList.add('in'));
  }
})();