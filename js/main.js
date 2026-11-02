/* K-Explore Connect — shared behaviour for all pages */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var EVENTS = (window.KE_EVENTS || []).slice().sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });
  var STORE_KEY = "keRegistrations";

  document.documentElement.classList.remove("no-js");

  /* ---------- helpers ---------- */
  function esc(str) {
    var d = document.createElement("div");
    d.textContent = String(str);
    return d.innerHTML;
  }
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  }
  function isUpcoming(ev) { return new Date(ev.date).getTime() > Date.now(); }
  function findEvent(id) { return EVENTS.filter(function (e) { return e.id === id; })[0]; }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- mobile menu ---------- */
  var btn = $(".menu-btn"), nav = $("#site-nav");
  if (btn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    };
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 768) setMenu(false); });
  }

  /* ---------- scroll reveal ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- event card ---------- */
  function cardHTML(ev) {
    return '<article class="card reveal">' +
      '<a class="card__img" href="event.html?id=' + encodeURIComponent(ev.id) + '" tabindex="-1" aria-hidden="true">' +
      '<img src="' + esc(ev.image) + '" alt="" width="800" height="600" loading="lazy"></a>' +
      '<span class="label">' + esc(ev.category) + '</span>' +
      '<h3>' + esc(ev.name) + '</h3>' +
      '<p class="card__meta">' + esc(fmtDate(ev.date)) + ' &middot; ' + esc(ev.venue) + '</p>' +
      '<p class="card__desc">' + esc(ev.short) + '</p>' +
      '<a class="link" href="event.html?id=' + encodeURIComponent(ev.id) + '">View details</a>' +
      '</article>';
  }
  function observeNew(root) {
    $$(".reveal:not(.in)", root).forEach(function (el) {
      if ("IntersectionObserver" in window) { io.observe(el); } else { el.classList.add("in"); }
    });
  }

  /* ---------- countdown ---------- */
  function countdown(box, iso) {
    if (!box) return;
    function tick() {
      var diff = new Date(iso).getTime() - Date.now();
      if (diff <= 0) {
        box.innerHTML = '<p class="countdown-note">This event has begun.</p>';
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var parts = [["Days", Math.floor(s / 86400)], ["Hours", Math.floor(s % 86400 / 3600)], ["Minutes", Math.floor(s % 3600 / 60)], ["Seconds", s % 60]];
      box.innerHTML = parts.map(function (p) {
        return "<div><b>" + String(p[1]).padStart(2, "0") + "</b><span>" + p[0] + "</span></div>";
      }).join("");
    }
    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ---------- local storage ---------- */
  function getRegs() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveRegs(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  var page = document.body.getAttribute("data-page");

  /* ================= HOME ================= */
  if (page === "home") {
    var upcoming = EVENTS.filter(isUpcoming);
    var featured = upcoming.filter(function (e) { return e.featured; }).slice(0, 3);
    if (!featured.length) featured = upcoming.slice(0, 3);
    var fg = $("#featured-grid");
    if (fg) {
      fg.innerHTML = featured.length ? featured.map(cardHTML).join("") :
        '<p class="empty text">New events will be announced soon.</p>';
      observeNew(fg);
    }
    var next = upcoming[0];
    var nb = $("#next-event");
    if (nb && next) {
      $("#next-name", nb).textContent = next.name;
      $("#next-info", nb).textContent = fmtDate(next.date) + " · " + next.venue;
      $("#next-link", nb).href = "event.html?id=" + encodeURIComponent(next.id);
      countdown($("#next-countdown", nb), next.date);
    } else if (nb) {
      nb.hidden = true;
    }
  }

  /* ================= EVENTS LIST ================= */
  if (page === "events") {
    var grid = $("#events-grid"), search = $("#search"), count = $("#result-count");
    var filtersEl = $("#filters");
    var list = EVENTS.filter(isUpcoming);
    var cats = ["All"];
    list.forEach(function (e) { if (cats.indexOf(e.category) === -1) cats.push(e.category); });
    var active = "All";

    filtersEl.innerHTML = cats.map(function (c) {
      return '<button type="button" class="filter" aria-pressed="' + (c === "All") + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join("");

    var render = function () {
      var q = search.value.trim().toLowerCase();
      var out = list.filter(function (e) {
        var inCat = active === "All" || e.category === active;
        var hay = (e.name + " " + e.venue + " " + e.category + " " + e.short).toLowerCase();
        return inCat && (!q || hay.indexOf(q) !== -1);
      });
      count.textContent = out.length + (out.length === 1 ? " event" : " events");
      grid.innerHTML = out.length ? out.map(cardHTML).join("") :
        '<div class="empty"><p class="subtitle">No events found</p><p class="text">Try a different search or choose another category.</p></div>';
      observeNew(grid);
    };

    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest(".filter");
      if (!b) return;
      active = b.getAttribute("data-cat");
      $$(".filter", filtersEl).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      render();
    });
    search.addEventListener("input", render);
    render();
  }

  /* ================= EVENT DETAIL ================= */
  if (page === "event") {
    var id = new URLSearchParams(location.search).get("id");
    var ev = id && findEvent(id);
    var box = $("#event-detail");
    if (!ev) {
      document.title = "Event not found — K-Explore Connect";
      box.innerHTML = '<div class="stack" style="text-align:center">' +
        '<h1 class="title">Event not <em>found</em></h1>' +
        '<p class="text">The event you are looking for does not exist or has been removed.</p>' +
        '<a class="btn" href="events.html">Browse events</a></div>';
    } else {
      document.title = ev.name + " — K-Explore Connect";
      var md = $('meta[name="description"]');
      if (md) md.setAttribute("content", ev.short + " " + fmtDate(ev.date) + ", " + ev.venue + ".");
      var open = isUpcoming(ev);
      box.innerHTML =
        '<div class="detail">' +
          '<div class="detail__img"><img src="' + esc(ev.image) + '" alt="Artwork for ' + esc(ev.name) + '" width="800" height="600"></div>' +
          '<div>' +
            '<span class="label">' + esc(ev.category) + '</span>' +
            '<h1 class="title" style="margin:1rem 0 1.5rem">' + esc(ev.name) + '</h1>' +
            '<p class="text">' + esc(ev.description) + '</p>' +
            '<dl class="facts">' +
              '<div><dt>Date</dt><dd>' + esc(fmtDate(ev.date)) + '</dd></div>' +
              '<div><dt>Time</dt><dd>' + esc(fmtTime(ev.date)) + ' IST</dd></div>' +
              '<div><dt>Venue</dt><dd>' + esc(ev.venue) + '</dd></div>' +
              '<div><dt>Seats</dt><dd>' + esc(ev.seats) + '</dd></div>' +
              '<div><dt>Entry</dt><dd>' + esc(ev.price) + '</dd></div>' +
            '</dl>' +
            '<div class="countdown" id="detail-countdown" aria-live="off"></div>' +
            '<p style="margin-top:2.5rem">' +
              (open ? '<a class="btn" href="register.html?event=' + encodeURIComponent(ev.id) + '">Register</a>'
                    : '<span class="btn is-disabled" aria-disabled="true">Registration closed</span>') +
            '</p>' +
          '</div>' +
        '</div>';
      if (open) countdown($("#detail-countdown"), ev.date);
    }
  }

  /* ================= REGISTER ================= */
  if (page === "register") {
    var form = $("#reg-form"), sel = $("#event"), okBox = $("#reg-success"), errBox = $("#reg-error"), listBox = $("#reg-list");
    var fields = { name: $("#name"), email: $("#email"), phone: $("#phone"), event: sel };

    EVENTS.filter(isUpcoming).forEach(function (e) {
      var o = document.createElement("option");
      o.value = e.id;
      o.textContent = e.name + " — " + fmtDate(e.date);
      sel.appendChild(o);
    });
    var pre = new URLSearchParams(location.search).get("event");
    if (pre && findEvent(pre)) sel.value = pre;

    var rules = {
      name: function (v) {
        if (!v) return "Please enter your full name.";
        if (v.length < 2) return "Your name must have at least 2 characters.";
        if (!/^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F .'\-]*$/.test(v)) return "Your name can only contain letters, spaces, dots, hyphens and apostrophes.";
        return "";
      },
      email: function (v) {
        if (!v) return "Please enter your email address.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email address, for example name@example.com.";
        return "";
      },
      phone: function (v) {
        if (!v) return "Please enter your phone number.";
        var digits = v.replace(/[\s\-()]/g, "");
        if (!/^\+?\d{10,13}$/.test(digits)) return "Please enter a valid phone number with 10 to 13 digits.";
        return "";
      },
      event: function (v) { return v ? "" : "Please select an event."; }
    };

    var showError = function (key, msg) {
      var f = fields[key], wrap = f.closest(".field");
      wrap.classList.toggle("invalid", !!msg);
      f.setAttribute("aria-invalid", msg ? "true" : "false");
      $(".error", wrap).textContent = msg;
    };
    var check = function (key) {
      var msg = rules[key](fields[key].value.trim());
      showError(key, msg);
      return !msg;
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener("blur", function () { check(k); });
      fields[k].addEventListener("input", function () {
        if (fields[k].closest(".field").classList.contains("invalid")) check(k);
      });
    });

    var renderRegs = function () {
      var regs = getRegs();
      if (!regs.length) { listBox.hidden = true; return; }
      listBox.hidden = false;
      $("#reg-items").innerHTML = regs.map(function (r, i) {
        return '<li class="reg"><div><strong>' + esc(r.eventName) + '</strong><span>' + esc(r.name) + ' &middot; Ref ' + esc(r.ref) + '</span></div>' +
          '<button type="button" data-i="' + i + '" aria-label="Cancel registration for ' + esc(r.eventName) + '">Cancel</button></li>';
      }).join("");
    };
    $("#reg-items").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]");
      if (!b) return;
      var regs = getRegs();
      regs.splice(Number(b.getAttribute("data-i")), 1);
      if (saveRegs(regs)) {
        errBox.hidden = true;
        okBox.hidden = false;
        okBox.firstChild.textContent = "Your registration has been cancelled.";
        $("small", okBox).textContent = "Cancelled";
      }
      renderRegs();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      okBox.hidden = true; errBox.hidden = true;
      var valid = true, firstBad = null;
      Object.keys(fields).forEach(function (k) {
        if (!check(k)) { valid = false; if (!firstBad) firstBad = fields[k]; }
      });
      if (!valid) {
        errBox.hidden = false;
        $("span", errBox).textContent = "Please correct the highlighted fields and try again.";
        firstBad.focus();
        return;
      }
      var ev = findEvent(sel.value);
      var email = fields.email.value.trim().toLowerCase();
      var regs = getRegs();
      var dup = regs.some(function (r) { return r.email === email && r.eventId === ev.id; });
      if (dup) {
        errBox.hidden = false;
        $("span", errBox).textContent = "This email address is already registered for " + ev.name + ".";
        return;
      }
      var ref = "KE-" + Date.now().toString(36).toUpperCase().slice(-6);
      regs.push({
        ref: ref, eventId: ev.id, eventName: ev.name,
        name: fields.name.value.trim(), email: email,
        phone: fields.phone.value.trim(), date: new Date().toISOString()
      });
      if (!saveRegs(regs)) {
        errBox.hidden = false;
        $("span", errBox).textContent = "We could not save your registration. Please check that your browser allows local storage and try again.";
        return;
      }
      okBox.hidden = false;
      okBox.firstChild.textContent = "Thank you, " + fields.name.value.trim().split(" ")[0] + ". You are registered for " + ev.name + ".";
      $("small", okBox).textContent = "Reference " + ref;
      okBox.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
      Object.keys(fields).forEach(function (k) { showError(k, ""); });
      renderRegs();
    });

    renderRegs();
  }
})();
