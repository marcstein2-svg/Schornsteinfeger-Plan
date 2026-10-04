/* Schornstein Planer – Startübersicht (Hub)
 *
 * Wichtig:
 * Der Luftverbund-Rechner wird erst geladen,
 * nachdem #luftverbundView erzeugt wurde.
 */
(function () {
  "use strict";

  var FUNCTIONS = [
    {
      id: "termine",
      icon: "\u{1F4CB}",
      title: "Planung & Termine",
      text: "Kalender, Terminvorschläge drucken und Kalender-Export.",
      show: ["#planung-termine"]
    },
    {
      id: "leistung",
      icon: "\u{1F9F9}",
      title: "Leistung & Übersicht",
      text: "Jahresplanung, erledigte Leistung, Soll/Ist-Vergleich, freie Tage, Feiertage und Historie.",
      show: [
        "#planung",
        "#leistung",
        "#uebersicht",
        ".stats-grid",
        ".two-column",
        "#historie"
      ]
    },
    {
      id: "luftverbund",
      icon: "\u{1F525}",
      title: "Luftverbund",
      text: "Verbrennungsluftversorgung nach TRGI 2018 berechnen – Schutzziel 1 und 2.",
      show: ["#luftverbundView"],
      script: "luftverbund.js"
    }
  ];

  var ALIAS = {
    "planung-termine": "termine",
    terminplanung: "termine",
    planung: "leistung",
    uebersicht: "leistung",
    feiertage: "leistung",
    historie: "leistung"
  };

  var home = document.getElementById("homePage");
  var hero = document.getElementById("start");
  var nav = document.querySelector(".main-nav");
  var legal = document.getElementById("legalMenu");

  if (!home || !hero || !nav) {
    console.error("Schornstein Planer: Start-Hub konnte nicht initialisiert werden.");
    return;
  }

  /* Jahresplanung vor Leistung einordnen */
  var pl = document.getElementById("planung");
  var le = document.getElementById("leistung");

  if (pl && le) {
    le.before(pl);
  }

  /*
   * ============================================================
   * LUFTVERBUND-CONTAINER ERZEUGEN
   * ============================================================
   *
   * Wichtig:
   * Hier wird NUR der Container erzeugt.
   * Danach wird luftverbund.js geladen.
   */
  FUNCTIONS.forEach(function (f) {
    if (!f.script) return;

    var existing = document.getElementById(
      f.show[0].replace("#", "")
    );

    if (existing) return;

    var v = document.createElement("section");
    v.id = f.show[0].replace("#", "");
    home.appendChild(v);
  });

  /*
   * ============================================================
   * LUFTVERBUND.JS LADEN
   * ============================================================
   */
  FUNCTIONS.forEach(function (f) {
    if (!f.script) return;

    if (
      document.querySelector(
        'script[data-sp-module="' + f.id + '"]'
      )
    ) {
      return;
    }

    var script = document.createElement("script");

    script.src = f.script;
    script.async = false;
    script.setAttribute("data-sp-module", f.id);

    script.onload = function () {
      console.log(
        "Schornstein Planer: Modul geladen:",
        f.script
      );

      /*
       * Falls der Nutzer bereits #luftverbund geöffnet hat,
       * nach dem Laden direkt dorthin wechseln.
       */
      if (location.hash === "#luftverbund") {
        setTimeout(function () {
          fromHash();
        }, 0);
      }
    };

    script.onerror = function () {
      console.error(
        "Schornstein Planer: Modul konnte nicht geladen werden:",
        f.script
      );

      var target = document.getElementById(
        f.show[0].replace("#", "")
      );

      if (target) {
        target.innerHTML =
          '<div class="card">' +
          "<h2>Luftverbund-Rechner konnte nicht geladen werden.</h2>" +
          "<p>Bitte Seite neu laden.</p>" +
          "</div>";
      }
    };

    document.body.appendChild(script);
  });

  /*
   * ============================================================
   * CSS FÜR HUB
   * ============================================================
   */
  var css = document.createElement("style");

  css.textContent =
    ".hub-hide{display:none!important}" +
    ".sp-planning-appointments{grid-template-columns:1fr!important}" +
    ".hub-h{margin:0 0 14px;font-size:1.15rem;letter-spacing:-.02em}" +
    ".hub-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:21px}" +
    ".hub-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;padding:22px;background:var(--card);border:1px solid var(--border);border-top:4px solid var(--gold);border-radius:var(--radius);box-shadow:var(--shadow);color:var(--text);cursor:pointer;transition:transform .16s ease}" +
    ".hub-tile:hover{transform:translateY(-2px)}" +
    ".hub-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:#f0f2f4;font-size:1.45rem;margin-bottom:4px}" +
    ".hub-tile strong{font-size:1.1rem}" +
    ".hub-txt{color:var(--muted);font-size:.88rem}" +
    ".hub-tag{font-size:.74rem;font-weight:800;color:#7d5b20}" +
    ".hub-back{display:flex;align-items:center;gap:12px;margin-bottom:16px}" +
    ".hub-back strong{font-size:1.1rem}" +
    ".main-nav .nav-link.on{background:rgba(255,255,255,.12);color:#fff}";

  document.head.appendChild(css);

  /*
   * ============================================================
   * START-KACHELN
   * ============================================================
   */
  var hub = document.createElement("section");

  hub.id = "hubView";

  hub.innerHTML =
    '<h2 class="hub-h">Was möchtest du tun?</h2>' +
    '<div class="hub-grid">' +
    FUNCTIONS.map(function (f) {
      return (
        '<button type="button" class="hub-tile" data-hub="' +
        f.id +
        '">' +
        '<span class="hub-icon" aria-hidden="true">' +
        f.icon +
        "</span>" +
        "<strong>" +
        f.title +
        "</strong>" +
        '<span class="hub-txt">' +
        f.text +
        "</span>" +
        "</button>"
      );
    }).join("") +
    "</div>";

  hero.after(hub);

  /*
   * ============================================================
   * ZURÜCK-LEISTE
   * ============================================================
   */
  var back = document.createElement("div");

  back.className = "hub-back hub-hide";

  back.innerHTML =
    '<button type="button" class="btn btn-light" data-hub="start">' +
    "← Startübersicht" +
    "</button>" +
    '<strong id="hubTitle"></strong>';

  home.insertBefore(back, home.firstChild);

  /*
   * ============================================================
   * ELEMENTE DEN FUNKTIONEN ZUORDNEN
   * ============================================================
   */
  FUNCTIONS.forEach(function (f) {
    f.els = (f.show || [])
      .map(function (selector) {
        return home.querySelector(selector);
      })
      .filter(Boolean);
  });

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */
  nav.querySelectorAll(".nav-link").forEach(function (a) {
    a.remove();
  });

  function addLink(label, id) {
    var a = document.createElement("a");

    a.className = "nav-link";
    a.href = "#" + id;
    a.setAttribute("data-hub", id);
    a.textContent = label;

    nav.insertBefore(a, legal);
  }

  addLink("\u{1F3E0} Start", "start");

  FUNCTIONS.forEach(function (f) {
    addLink(f.icon + " " + f.title, f.id);
  });

  function find(id) {
    return (
      FUNCTIONS.filter(function (f) {
        return f.id === id;
      })[0] || null
    );
  }

  /*
   * ============================================================
   * ANSICHT WECHSELN
   * ============================================================
   */
  function showView(id) {
    var f = find(id);

    if (!f || !f.show) {
      f = null;
      id = "start";
    }

    hero.classList.toggle("hub-hide", !!f);
    hub.classList.toggle("hub-hide", !!f);
    back.classList.toggle("hub-hide", !f);

    FUNCTIONS.forEach(function (g) {
      g.els.forEach(function (el) {
        el.classList.toggle("hub-hide", g !== f);
      });
    });

    if (f) {
      var title = document.getElementById("hubTitle");

      if (title) {
        title.textContent = f.icon + " " + f.title;
      }

      if (f.id === "termine") {
        var d = document.getElementById("planung-termine");

        if (d) {
          d.open = true;
        }
      }
    }

    nav.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle(
        "on",
        a.getAttribute("data-hub") === id
      );
    });

    window.scrollTo(0, 0);
  }

  function openPopup(url) {
    var w = window.open(
      url,
      "sp_" + url,
      "width=1100,height=860,resizable=yes,scrollbars=yes"
    );

    if (!w) {
      location.href = url;
      return;
    }

    if (w.focus) {
      w.focus();
    }
  }

  function go(id) {
    var f = find(id);

    if (f && f.popup) {
      openPopup(f.popup);
      return;
    }

    if (typeof showHome === "function") {
      showHome(false);
    }

    showView(id);

    try {
      history.pushState(
        null,
        "",
        "#" + id
      );
    } catch (e) {}
  }

  /*
   * ============================================================
   * KLICK-HANDLER
   * ============================================================
   */
  document.addEventListener("click", function (e) {
    var el =
      e.target.closest &&
      e.target.closest("[data-hub]");

    if (!el) return;

    e.preventDefault();

    go(el.getAttribute("data-hub"));
  });

  /*
   * ============================================================
   * HASH
   * ============================================================
   */
  function fromHash() {
    var h = location.hash.replace("#", "");

    h = ALIAS[h] || h;

    var f = find(h);

    if (f && f.show) {
      showView(h);
    } else if (h === "" || h === "start") {
      showView("start");
    }
  }

  window.addEventListener(
    "hashchange",
    fromHash
  );

  /*
   * ============================================================
   * START
   * ============================================================
   */
  showView("start");
  fromHash();

})();