/* ============================================================
   HEBO AUTO — JAVASCRIPT
   ============================================================ */
(function () {
  "use strict";

  /* ── 1. PAGE LOADER ── */
  const loader = document.getElementById("loader");
  window.addEventListener("load", function () {
    setTimeout(function () {
      loader.classList.add("out");
    }, 1800);
  });

  /* ── 2. TOPBAR HEIGHT → header top offset ── */
  const topbar = document.getElementById("topbar");
  const header = document.getElementById("header");

  function setHeaderTop() {
    if (topbar && window.innerWidth > 768) {
      header.style.top = topbar.offsetHeight + "px";
    } else {
      header.style.top = "0";
    }
  }
  setHeaderTop();
  window.addEventListener("resize", setHeaderTop);

  /* ── 3. STICKY HEADER ── */
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });

  /* ── 4. MOBILE DRAWER ── */
  const menuBtn  = document.getElementById("menuBtn");
  const drawer   = document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");

  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("show");
    menuBtn.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
    menuBtn.classList.remove("open");
    document.body.style.overflow = "";
  }

  menuBtn.addEventListener("click", function () {
    drawer.classList.contains("open") ? closeDrawer() : openDrawer();
  });
  backdrop.addEventListener("click", closeDrawer);
  drawer.querySelectorAll(".dn-link").forEach(function (a) {
    a.addEventListener("click", closeDrawer);
  });

  /* ── 5. ACTIVE NAV LINK ── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nm-link");

  function setActive() {
    let current = "";
    sections.forEach(function (sec) {
      if (window.scrollY >= sec.offsetTop - 130) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  /* ── 6. SMOOTH SCROLL (offset for fixed header) ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 12;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: "smooth"
      });
    });
  });

  /* ── 7. SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll(".anim-up, .anim-left, .anim-right");
  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Stagger siblings in grids
      const pd = el.style.getPropertyValue("--pd");
      if (pd) {
        el.style.transitionDelay = pd;
      } else {
        const siblings = Array.from(el.parentElement.children).filter(
          function (c) { return c.classList.contains(el.classList[0]); }
        );
        const idx = siblings.indexOf(el);
        if (idx > 0) el.style.transitionDelay = (idx * 80) + "ms";
      }
      el.classList.add("visible");
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12 });

  revealEls.forEach(function (el) { revealObs.observe(el); });

  /* ── 8. COUNTER ANIMATION ── */
  function animCount(el, target, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(function () {
      start += step;
      if (start >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start);
      }
    }, 16);
  }

  const counterObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const to = parseInt(el.getAttribute("data-to"), 10);
      if (!isNaN(to)) animCount(el, to, 1400);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll("[data-to]").forEach(function (el) {
    counterObs.observe(el);
  });

  /* ── 9. CONTACT FORM ── */
  const form    = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();

      const fname   = document.getElementById("fname").value.trim();
      const lname   = document.getElementById("lname").value.trim();
      const email   = document.getElementById("cemail").value.trim();
      const message = document.getElementById("cmessage").value.trim();

      let valid = true;
      if (!fname)              { markErr("fname",   "Please enter your first name."); valid = false; }
      if (!lname)              { markErr("lname",   "Please enter your last name.");  valid = false; }
      if (!email)              { markErr("cemail",  "Please enter your email.");      valid = false; }
      else if (!isEmail(email)){ markErr("cemail",  "Please enter a valid email.");   valid = false; }
      if (!message)            { markErr("cmessage","Please enter a message.");       valid = false; }
      if (!valid) return;

      const btn = form.querySelector("[type=submit]");
      btn.textContent = "Sending…";
      btn.disabled = true;

      setTimeout(function () {
        form.reset();
        success.style.display = "block";
        btn.textContent = "Send Message →";
        btn.disabled = false;
        setTimeout(function () { success.style.display = "none"; }, 7000);
      }, 1400);
    });
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function markErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = "#f87171";
    const span = document.createElement("span");
    span.className = "field-err";
    span.textContent = msg;
    el.parentElement.appendChild(span);
  }

  function clearErrors() {
    document.querySelectorAll(".field-err").forEach(function (e) { e.remove(); });
    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      el.style.borderColor = "";
    });
  }

})();