/* ============================================================
   GeoElite Sphere — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ---- Navbar: scroll behaviour ---- */
  const navbar = document.getElementById('navbar');

  function handleNavScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ---- Mobile menu toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');

  navToggle.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen.toString());
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close mobile menu on link click */
  navMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* Close mobile menu on outside click */
  document.addEventListener('click', function (e) {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)) {
      navMenu.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---- Hero canvas particle animation ---- */
  (function initCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h, particles, animFrame;

    /* Resize handler */
    function resize() {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }

    window.addEventListener('resize', function () {
      resize();
      buildParticles();
    });

    /* Particle factory */
    function Particle() {
      this.reset();
    }

    Particle.prototype.reset = function () {
      this.x  = Math.random() * w;
      this.y  = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r  = Math.random() * 1.5 + 0.5;
      /* Alternate between gold and cyan */
      this.gold = Math.random() > 0.55;
      this.alpha = Math.random() * 0.5 + 0.2;
    };

    Particle.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;
      /* Wrap around edges */
      if (this.x < 0)  this.x = w;
      if (this.x > w)  this.x = 0;
      if (this.y < 0)  this.y = h;
      if (this.y > h)  this.y = 0;
    };

    function buildParticles() {
      /* Density: 1 per 14 000 px², min 40 max 120 */
      const count = Math.max(40, Math.min(120, Math.floor((w * h) / 14000)));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    const LINK_DIST    = 140;  /* px — max distance to draw a connecting line */
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      /* Draw edges */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < LINK_DIST_SQ) {
            const opacity = (1 - distSq / LINK_DIST_SQ) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].gold
              ? `rgba(201,162,39,${opacity})`
              : `rgba(0,212,255,${opacity})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      /* Draw nodes */
      particles.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201,162,39,${p.alpha})`
          : `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
        p.update();
      });

      animFrame = requestAnimationFrame(draw);
    }

    resize();
    buildParticles();
    draw();

    /* Pause animation when hero is off screen to save CPU */
    if ('IntersectionObserver' in window) {
      const heroSection = document.getElementById('hero');
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!animFrame) draw();
          } else {
            cancelAnimationFrame(animFrame);
            animFrame = null;
          }
        });
      }, { threshold: 0 });
      if (heroSection) obs.observe(heroSection);
    }
  })();

  /* ---- Animated counters (hero stats) ---- */
  function animateCounter(el, target, duration) {
    const start     = performance.now();
    const startVal  = 0;

    function step(timestamp) {
      const progress = Math.min((timestamp - start) / duration, 1);
      /* Ease out cubic */
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(startVal + (target - startVal) * ease);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* Trigger counters once hero stats enter viewport */
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let countersStarted = false;

  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          statNumbers.forEach(function (el) {
            animateCounter(el, parseInt(el.dataset.target, 10), 1800);
          });
          statsObs.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const statsWrap = document.querySelector('.hero-stats');
    if (statsWrap) statsObs.observe(statsWrap);
  } else {
    /* Fallback: just show target values */
    statNumbers.forEach(function (el) {
      el.textContent = el.dataset.target;
    });
  }

  /* ---- Service filter ---- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const filter = btn.dataset.filter;

      /* Update active state */
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      /* Show/hide cards */
      serviceCards.forEach(function (card) {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
          /* Tiny delay so CSS transition works */
          requestAnimationFrame(function () {
            card.style.opacity   = '';
            card.style.transform = '';
          });
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ---- Intersection Observer: fade-in reveal ---- */
  if ('IntersectionObserver' in window) {

    /* Hero fade-in elements - trigger once */
    const heroFades = document.querySelectorAll('.hero-content .fade-in');
    heroFades.forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.12) + 's';
    });

    const heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          heroFades.forEach(function (el) { el.classList.add('visible'); });
          heroObs.disconnect();
        }
      });
    }, { threshold: 0.1 });

    const heroSection = document.getElementById('hero');
    if (heroSection) heroObs.observe(heroSection);

    /* General section content reveal */
    const revealTargets = document.querySelectorAll(
      '.service-card, .project-card, .expert-card, .industry-card, ' +
      '.workflow-step, .result-item, .bimgis-feature, .tech-category, ' +
      '.section-header, .bimgis-content, .bimgis-visual, .contact-info, .contact-form-wrap'
    );

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
    });

    const revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(function (el) { revealObs.observe(el); });
  } else {
    /* No IntersectionObserver — make everything visible */
    document.querySelectorAll('.fade-in, .reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ---- Contact form: client-side validation + submit state ---- */
  const form        = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) return;

      /* Show loading state */
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      /* Simulate async submission (replace with actual fetch/API call) */
      setTimeout(function () {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        form.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'flex';
      }, 1400);
    });

    function validateForm() {
      let valid = true;

      /* Name */
      const name = form.querySelector('#cf-name');
      setError(name, name.value.trim().length < 2 ? 'Please enter your full name.' : '');
      if (name.value.trim().length < 2) valid = false;

      /* Email */
      const email = form.querySelector('#cf-email');
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setError(email, !emailRe.test(email.value.trim()) ? 'Please enter a valid email address.' : '');
      if (!emailRe.test(email.value.trim())) valid = false;

      /* Service */
      const service = form.querySelector('#cf-service');
      setError(service, !service.value ? 'Please select a service.' : '');
      if (!service.value) valid = false;

      /* Message */
      const message = form.querySelector('#cf-message');
      setError(message, message.value.trim().length < 15 ? 'Please provide a brief description (min. 15 characters).' : '');
      if (message.value.trim().length < 15) valid = false;

      return valid;
    }

    function setError(input, msg) {
      const errorEl = input.closest('.form-group')
                           .querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = msg;
        input.style.borderColor = msg ? 'rgba(248,113,113,0.6)' : '';
      }
    }

    /* Clear errors on input */
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        const errorEl = el.closest('.form-group').querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = '';
          el.style.borderColor = '';
        }
      });
    });
  }

  /* ---- Smooth-scroll for anchor links (fallback for older browsers) ---- */
  if (!CSS.supports('scroll-behavior', 'smooth')) {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---- Keyboard: service cards & project cards focusable ---- */
  document.querySelectorAll('.service-card, .project-card, .industry-card, .result-item, .workflow-step, .expert-card').forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        card.classList.toggle('focus-highlight');
      }
    });
  });

})();
