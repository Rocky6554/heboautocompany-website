/* ============================================================
   HEBO AUTO — AUTH JAVASCRIPT
   Uses localStorage to store user accounts
   ============================================================ */
(function () {
  "use strict";

  const USERS_KEY   = "heboauto_users";
  const SESSION_KEY = "heboauto_session";

  /* ── STORAGE HELPERS ── */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch(e) { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch(e) { return null; }
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
  function findUser(email) {
    return getUsers().find(function(u){ return u.email.toLowerCase() === email.toLowerCase(); });
  }
  function hashPass(str) {
    // Simple deterministic hash (not cryptographic — for demo purposes)
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h.toString(36);
  }

  /* ── UI HELPERS ── */
  function show(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }
  function hide(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = "none";
  }
  function setBtn(id, text, disabled) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = text;
    btn.disabled = !!disabled;
  }
  function markFieldErr(input, msg) {
    input.classList.add("err");
    var existing = input.parentElement.querySelector(".field-err");
    if (!existing) {
      var span = document.createElement("span");
      span.className = "field-err";
      span.textContent = msg;
      input.parentElement.appendChild(span);
    }
  }
  function clearFieldErrs(form) {
    form.querySelectorAll(".err").forEach(function(el){ el.classList.remove("err"); });
    form.querySelectorAll(".field-err").forEach(function(el){ el.remove(); });
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ── PASSWORD TOGGLE ── */
  document.querySelectorAll(".pw-toggle").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var target = document.getElementById(btn.getAttribute("data-target"));
      if (!target) return;
      target.type = target.type === "password" ? "text" : "password";
      btn.textContent = target.type === "password" ? "👁" : "🙈";
    });
  });

  /* ── PASSWORD STRENGTH ── */
  var pwInput = document.getElementById("spassword");
  if (pwInput) {
    pwInput.addEventListener("input", function() {
      var val = pwInput.value;
      var score = 0;
      if (val.length >= 8)  score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      var fill  = document.getElementById("pwsFill");
      var label = document.getElementById("pwsLabel");
      if (!fill || !label) return;

      var pct   = (score / 4) * 100;
      var color = ["#f87171","#fb923c","#facc15","#4ade80"][score - 1] || "transparent";
      var text  = ["","Weak","Fair","Good","Strong"][score] || "";

      fill.style.width = pct + "%";
      fill.style.background = color;
      label.textContent = text;
      label.style.color = color;
    });
  }

  /* ============================================================
     SIGNUP PAGE
     ============================================================ */
  var signupForm = document.getElementById("signupForm");
  if (signupForm) {

    signupForm.addEventListener("submit", function(e) {
      e.preventDefault();
      clearFieldErrs(signupForm);
      hide("signupErr"); hide("signupOk");

      var fname    = document.getElementById("sfname").value.trim();
      var lname    = document.getElementById("slname").value.trim();
      var email    = document.getElementById("semail").value.trim();
      var phone    = document.getElementById("sphone").value.trim();
      var vehicle  = document.getElementById("svehicle").value.trim();
      var password = document.getElementById("spassword").value;
      var confirm  = document.getElementById("sconfirm").value;
      var agreed   = document.getElementById("sagree").checked;

      var valid = true;

      if (!fname)   { markFieldErr(document.getElementById("sfname"), "First name required."); valid = false; }
      if (!lname)   { markFieldErr(document.getElementById("slname"), "Last name required.");  valid = false; }
      if (!email)   { markFieldErr(document.getElementById("semail"), "Email required.");      valid = false; }
      else if (!isEmail(email)) { markFieldErr(document.getElementById("semail"), "Enter a valid email."); valid = false; }
      if (!phone)   { markFieldErr(document.getElementById("sphone"), "Phone number required."); valid = false; }
      if (!password || password.length < 8) {
        markFieldErr(document.getElementById("spassword"), "Password must be at least 8 characters."); valid = false;
      }
      if (password !== confirm) {
        markFieldErr(document.getElementById("sconfirm"), "Passwords do not match."); valid = false;
      }
      if (!agreed)  { show("signupErr", "Please agree to the Terms of Service to continue."); valid = false; }
      if (!valid) return;

      // Check duplicate email
      if (findUser(email)) {
        markFieldErr(document.getElementById("semail"), "An account with this email already exists.");
        return;
      }

      // Create account
      setBtn("signupBtn", "Creating account…", true);

      setTimeout(function() {
        var users = getUsers();
        var newUser = {
          id:       Date.now().toString(36),
          fname:    fname,
          lname:    lname,
          email:    email,
          phone:    phone,
          vehicle:  vehicle,
          passHash: hashPass(password),
          joinDate: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
          createdAt: Date.now()
        };
        users.push(newUser);
        saveUsers(users);

        // Auto-login
        var sessionUser = Object.assign({}, newUser);
        delete sessionUser.passHash;
        setSession(sessionUser);

        show("signupOk", "✅ Account created! Redirecting to your dashboard…");
        setBtn("signupBtn", "Create Account →", false);

        setTimeout(function() {
          window.location.href = "dashboard.html";
        }, 1500);
      }, 1000);
    });
  }

  /* ============================================================
     LOGIN PAGE
     ============================================================ */
  var loginForm = document.getElementById("loginForm");
  if (loginForm) {

    // Redirect if already logged in
    if (getSession()) {
      window.location.href = "dashboard.html";
      return;
    }

    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      clearFieldErrs(loginForm);
      hide("loginErr"); hide("loginOk");

      var email    = document.getElementById("lemail").value.trim();
      var password = document.getElementById("lpassword").value;
      var remember = document.getElementById("lremember").checked;

      var valid = true;
      if (!email)   { markFieldErr(document.getElementById("lemail"),    "Email required."); valid = false; }
      else if (!isEmail(email)) { markFieldErr(document.getElementById("lemail"), "Enter a valid email."); valid = false; }
      if (!password){ markFieldErr(document.getElementById("lpassword"), "Password required."); valid = false; }
      if (!valid) return;

      setBtn("loginBtn", "Signing in…", true);

      setTimeout(function() {
        var user = findUser(email);
        if (!user || user.passHash !== hashPass(password)) {
          setBtn("loginBtn", "Sign In →", false);
          show("loginErr", "❌ Incorrect email or password. Please try again.");
          return;
        }

        var sessionUser = Object.assign({}, user);
        delete sessionUser.passHash;
        setSession(sessionUser);

        show("loginOk", "✅ Welcome back, " + user.fname + "! Redirecting…");
        setBtn("loginBtn", "Sign In →", false);

        setTimeout(function() {
          window.location.href = "dashboard.html";
        }, 1200);
      }, 900);
    });

    /* Forgot password modal */
    var forgotBtn   = document.getElementById("forgotBtn");
    var forgotModal = document.getElementById("forgotModal");
    var modalClose  = document.getElementById("modalClose");
    var resetBtn    = document.getElementById("resetBtn");

    if (forgotBtn) {
      forgotBtn.addEventListener("click", function(e) {
        e.preventDefault();
        forgotModal.classList.add("open");
      });
    }
    if (modalClose) {
      modalClose.addEventListener("click", function() { forgotModal.classList.remove("open"); });
    }
    if (forgotModal) {
      forgotModal.addEventListener("click", function(e) {
        if (e.target === forgotModal) forgotModal.classList.remove("open");
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function() {
        var email = document.getElementById("resetEmail").value.trim();
        hide("resetOk");
        if (!email || !isEmail(email)) {
          show("resetOk", "Please enter a valid email address.");
          document.getElementById("resetOk").className = "af-msg af-err";
          document.getElementById("resetOk").style.display = "block";
          return;
        }
        // In a real app this would send an email — here we just confirm
        resetBtn.textContent = "Sending…";
        resetBtn.disabled = true;
        setTimeout(function() {
          var el = document.getElementById("resetOk");
          el.className = "af-msg af-ok";
          el.style.display = "block";
          el.textContent = "✅ If an account exists for " + email + ", a reset link has been sent.";
          resetBtn.textContent = "Send Reset Link →";
          resetBtn.disabled = false;
        }, 1000);
      });
    }
  }

  /* ============================================================
     DASHBOARD PAGE
     ============================================================ */
  var dashWelcome = document.getElementById("dashWelcome");
  if (dashWelcome) {

    var session = getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    // Populate dashboard
    function renderDash(user) {
      document.getElementById("dashWelcome").textContent = "Welcome, " + user.fname + " 👋";
      document.getElementById("dpName").textContent    = user.fname + " " + user.lname;
      document.getElementById("dpEmail").textContent   = user.email;
      document.getElementById("dpPhone").textContent   = user.phone;
      document.getElementById("dpVehicle").textContent = user.vehicle ? "🚗 " + user.vehicle : "No vehicle added";
      document.getElementById("dpAvatar").textContent  = user.fname.charAt(0).toUpperCase();
      document.getElementById("statDate").textContent  = user.joinDate || "—";
    }
    renderDash(session);

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", function() {
      clearSession();
      window.location.href = "login.html";
    });

    // Edit profile modal
    var editModal      = document.getElementById("editModal");
    var editModalClose = document.getElementById("editModalClose");

    function openEditModal() {
      document.getElementById("efname").value   = session.fname;
      document.getElementById("elname").value   = session.lname;
      document.getElementById("ephone").value   = session.phone;
      document.getElementById("evehicle").value = session.vehicle || "";
      hide("editOk");
      editModal.classList.add("open");
    }

    document.getElementById("editProfileBtn").addEventListener("click", openEditModal);
    document.getElementById("editProfileBtn2").addEventListener("click", openEditModal);
    editModalClose.addEventListener("click", function() { editModal.classList.remove("open"); });
    editModal.addEventListener("click", function(e) {
      if (e.target === editModal) editModal.classList.remove("open");
    });

    // Save profile edits
    document.getElementById("editForm").addEventListener("submit", function(e) {
      e.preventDefault();
      hide("editOk");

      var fname   = document.getElementById("efname").value.trim();
      var lname   = document.getElementById("elname").value.trim();
      var phone   = document.getElementById("ephone").value.trim();
      var vehicle = document.getElementById("evehicle").value.trim();

      if (!fname || !lname) {
        show("editOk", "First and last name are required.");
        document.getElementById("editOk").className = "af-msg af-err";
        document.getElementById("editOk").style.display = "block";
        return;
      }

      // Update in users array
      var users = getUsers();
      var idx   = users.findIndex(function(u){ return u.id === session.id; });
      if (idx > -1) {
        users[idx].fname   = fname;
        users[idx].lname   = lname;
        users[idx].phone   = phone;
        users[idx].vehicle = vehicle;
        saveUsers(users);
      }

      // Update session
      session.fname   = fname;
      session.lname   = lname;
      session.phone   = phone;
      session.vehicle = vehicle;
      setSession(session);

      renderDash(session);

      var ok = document.getElementById("editOk");
      ok.className = "af-msg af-ok";
      ok.style.display = "block";
      ok.textContent = "✅ Profile updated successfully!";

      setTimeout(function() { editModal.classList.remove("open"); }, 1400);
    });
  }

})();