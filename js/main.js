/**
 * Holistic Place — main.js
 * Vanilla JS: nawigacja, animacje, formularz
 * Brak zewnętrznych bibliotek, brak globalnego scope pollution
 */

(function () {
  'use strict';

  /* ============================================================
     SMOOTH SCROLL
     Obsługuje wszystkie linki kotwicowe a[href^="#"]
     Uwzględnia wysokość sticky nav jako offset
  ============================================================ */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute('href');
      if (targetId === '#') return;

      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      var navHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72',
        10
      );

      var targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });

      // Zamknij mobile menu jeśli otwarte
      closeMobileMenu();

      // Ustaw focus na docelową sekcję (dostępność)
      targetEl.setAttribute('tabindex', '-1');
      targetEl.focus({ preventScroll: true });
      targetEl.addEventListener('blur', function () {
        targetEl.removeAttribute('tabindex');
      }, { once: true });
    });
  }

  /* ============================================================
     NAV: transparent → frosted glass przy scrollowaniu
  ============================================================ */
  function initNavBehavior() {
    var header = document.getElementById('site-header');
    if (!header) return;

    function updateNav() {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav(); // sprawdź stan przy ładowaniu (np. po odświeżeniu z pozycją scrolla)
  }

  /* ============================================================
     HAMBURGER — mobile menu
  ============================================================ */
  var mobileMenuOpen = false;

  function openMobileMenu() {
    var btn = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-menu');
    if (!btn || !menu) return;

    mobileMenuOpen = true;
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('is-active');
    menu.classList.add('nav__menu--open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    var btn = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-menu');
    if (!btn || !menu) return;

    mobileMenuOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('is-active');
    menu.classList.remove('nav__menu--open');
    document.body.style.overflow = '';
  }

  function initHamburger() {
    var btn = document.getElementById('nav-hamburger');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (mobileMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Zamknij przy Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
        btn.focus();
      }
    });

    // Zamknij przy kliknięciu poza menu
    document.addEventListener('click', function (e) {
      if (!mobileMenuOpen) return;
      var header = document.getElementById('site-header');
      if (header && !header.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Zamknij przy resize do desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        closeMobileMenu();
      }
    }, { passive: true });
  }

  /* ============================================================
     HERO ANIMATION — staggered fade-up
     Przypisuje --delay do każdego .fade-up w hero
  ============================================================ */
  function initHeroAnimation() {
    var heroSection = document.querySelector('.section-hero');
    if (!heroSection) return;

    var fadeElements = heroSection.querySelectorAll('.fade-up');

    fadeElements.forEach(function (el, i) {
      el.style.setProperty('--delay', (i * 0.15) + 's');
    });

    // Uruchom animację po załadowaniu DOM
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fadeElements.forEach(function (el) {
          el.classList.add('is-visible');
        });
      });
    });
  }

  /* ============================================================
     REVEAL OBSERVER — IntersectionObserver dla sekcji
     Fade-up przy wejściu w viewport
  ============================================================ */
  function initRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback dla starszych przeglądarek: pokaż wszystko
      document.querySelectorAll('.reveal-item').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    // Observer dla kart i bloków treści (reveal-item) z stagger delay
    var itemObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          var parent = el.parentElement;
          var siblings = parent ? Array.from(parent.querySelectorAll('.reveal-item')) : [el];
          var index = siblings.indexOf(el);

          // Stagger delay: max 5 elementów z opóźnieniem
          var delay = Math.min(index, 5) * 0.12;
          el.style.setProperty('--reveal-delay', delay + 's');

          el.classList.add('is-visible');
          itemObserver.unobserve(el);
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    document.querySelectorAll('.reveal-item').forEach(function (el) {
      itemObserver.observe(el);
    });
  }

  /* ============================================================
     WALIDACJA FORMULARZA KONTAKTOWEGO
     Honeypot, walidacja pól, komunikaty po polsku
     UWAGA: formularz nie wysyła danych (brak backendu).
     Podłącz do Formspree / Netlify Forms / własnego API.
  ============================================================ */
  function initFormValidation() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var successMsg = document.getElementById('form-success');

    // Regex email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(fieldId, errorId, message) {
      var field = document.getElementById(fieldId);
      var errorEl = document.getElementById(errorId);
      if (!field || !errorEl) return;

      field.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      field.classList.add('form__input--error');
    }

    function clearError(fieldId, errorId) {
      var field = document.getElementById(fieldId);
      var errorEl = document.getElementById(errorId);
      if (!field || !errorEl) return;

      field.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      field.classList.remove('form__input--error');
    }

    function clearAllErrors() {
      clearError('contact-name', 'name-error');
      clearError('contact-email', 'email-error');
      clearError('contact-message', 'message-error');
    }

    // Walidacja live (przy opuszczeniu pola)
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var messageInput = document.getElementById('contact-message');

    if (nameInput) {
      nameInput.addEventListener('blur', function () {
        if (this.value.trim().length < 2) {
          setError('contact-name', 'name-error', 'Proszę podać imię i nazwisko (min. 2 znaki)');
        } else {
          clearError('contact-name', 'name-error');
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener('blur', function () {
        if (!emailRegex.test(this.value.trim())) {
          setError('contact-email', 'email-error', 'Proszę podać prawidłowy adres e-mail');
        } else {
          clearError('contact-email', 'email-error');
        }
      });
    }

    if (messageInput) {
      messageInput.addEventListener('blur', function () {
        if (this.value.trim().length < 10) {
          setError('contact-message', 'message-error', 'Wiadomość musi mieć co najmniej 10 znaków');
        } else {
          clearError('contact-message', 'message-error');
        }
      });
    }

    // Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Sprawdź honeypot
      var honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        // Bot — cicha rezygnacja
        return;
      }

      clearAllErrors();

      var hasErrors = false;

      // Walidacja: imię
      var nameVal = nameInput ? nameInput.value.trim() : '';
      if (nameVal.length < 2) {
        setError('contact-name', 'name-error', 'Proszę podać imię i nazwisko (min. 2 znaki)');
        hasErrors = true;
      }

      // Walidacja: email
      var emailVal = emailInput ? emailInput.value.trim() : '';
      if (!emailRegex.test(emailVal)) {
        setError('contact-email', 'email-error', 'Proszę podać prawidłowy adres e-mail');
        hasErrors = true;
      }

      // Walidacja: wiadomość
      var msgVal = messageInput ? messageInput.value.trim() : '';
      if (msgVal.length < 10) {
        setError('contact-message', 'message-error', 'Wiadomość musi mieć co najmniej 10 znaków');
        hasErrors = true;
      }

      if (hasErrors) {
        // Skup na pierwszym błędzie
        var firstError = form.querySelector('[aria-invalid="true"]');
        if (firstError) firstError.focus();
        return;
      }

      // ✅ Walidacja przeszła
      // TODO: wysyłaj dane do backendu / Formspree / Netlify Forms
      // Przykład Formspree:
      //   fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal })
      //   });

      // Pokaż komunikat sukcesu
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      form.reset();

      // Ukryj sukces po 8 sekundach
      setTimeout(function () {
        if (successMsg) successMsg.hidden = true;
      }, 8000);
    });
  }

  /* ============================================================
     AKORDEONY CENNIKA
  ============================================================ */
  function initAccordion() {
    var triggers = document.querySelectorAll('.accordion__trigger');
    if (!triggers.length) return;

    triggers.forEach(function (trigger) {
      var bodyId = trigger.getAttribute('aria-controls');
      var body = document.getElementById(bodyId);
      if (!body) return;

      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // Zamknij wszystkie inne
        triggers.forEach(function (t) {
          var bid = t.getAttribute('aria-controls');
          var b = document.getElementById(bid);
          if (!b) return;
          t.setAttribute('aria-expanded', 'false');
          b.classList.remove('is-open');
        });

        // Otwórz kliknięty (jeśli był zamknięty)
        if (!isOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          body.classList.add('is-open');
        }
      });
    });
  }

  /* ============================================================
     ACTIVE NAV LINK — podświetl aktywną sekcję
  ============================================================ */
  function initActiveNavLinks() {
    var sections = document.querySelectorAll('main section[id]');
    var navLinks = document.querySelectorAll('.nav__link');

    if (!sections.length || !navLinks.length) return;

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.remove('nav__link--active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('nav__link--active');
            }
          });
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ============================================================
     EFEKTY — POKAŻ WIĘCEJ
  ============================================================ */
  function initEffectsToggle() {
    var btn = document.getElementById('effects-toggle');
    if (!btn) return;

    var extra = document.querySelectorAll('.effect-card--extra');
    var expanded = false;

    btn.addEventListener('click', function () {
      expanded = !expanded;
      extra.forEach(function (card) {
        card.style.display = expanded ? 'block' : 'none';
      });
      btn.textContent = expanded ? 'Zwiń' : 'Pokaż wszystkie efekty (32)';
      btn.setAttribute('aria-expanded', expanded);
    });
  }

  /* ============================================================
     INICJALIZACJA
  ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initSmoothScroll();
    initNavBehavior();
    initHamburger();
    initHeroAnimation();
    initRevealObserver();
    initFormValidation();
    initAccordion();
    initActiveNavLinks();
    initEffectsToggle();
  });

})();
