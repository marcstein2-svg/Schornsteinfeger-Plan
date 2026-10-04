/* Schornstein Planer – Startübersicht (Hub)
   Einbinden in index.html direkt vor </body>:  <script src="start-hub.js"></script>
   NEUE FUNKTION ERGÄNZEN: unten in FUNCTIONS einen Eintrag kopieren.
   - Funktion auf der Startseite:  show: ["#id-oder-.klasse", ...]  (Bereiche, die angezeigt werden)
   - Funktion in eigenem Fenster:   popup: "datei.html"
*/
(function () {
  "use strict";
  var FUNCTIONS = [
    { id: "termine", icon: "\u{1F4CB}", title: "Planung & Termine",
      text: "Kalender, Terminvorschläge drucken und Kalender-Export.",
      show: ["#planung-termine"] },
    { id: "leistung", icon: "\u{1F9F9}", title: "Leistung & Übersicht",
      text: "Jahresplanung, erledigte Leistung, Soll/Ist-Vergleich, freie Tage, Feiertage und Historie.",
      show: ["#planung", "#leistung", "#uebersicht", ".stats-grid", ".two-column", "#historie"] },
    { id: "luftverbund", icon: "\u{1F525}", title: "Luftverbund",
      text: "Verbrennungsluftversorgung nach TRGI 2018 berechnen – Schutzziel 1 und 2.",
      show: ["#luftverbundView"], script: "luftverbund.js" }
  ];
  /* alte Anker aus bisherigen Links bleiben gültig */
  var ALIAS = { "planung-termine": "termine", terminplanung: "termine", planung: "leistung",
    uebersicht: "leistung", feiertage: "leistung", historie: "leistung" };
  var home = document.getElementById("homePage");
  var hero = document.getElementById("start");
  var nav = document.querySelector(".main-nav");
  var legal = document.getElementById("legalMenu");
  if (!home || !hero || !nav) return;
  /* Jahresplanung gehört zu "Leistung & Übersicht" */
  var pl = document.getElementById("planung"), le = document.getElementById("leistung");
  if (pl && le) le.before(pl);
  /* Ansichten, die ein eigenes Skript brauchen (z. B. Luftverbund) */
 FUNCTIONS.forEach(function (f) {
  if (!f.script) return;

  var v = document.createElement("section");
  v.id = f.show[0].replace("#", "");
  home.appendChild(v);
    var sc = document.createElement("script");
sc.src = f.script;
document.body.appendChild(sc);
});
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
  /* Kacheln */
  var hub = document.createElement("section");
  hub.id = "hubView";
  hub.innerHTML = '<h2 class="hub-h">Was möchtest du tun?</h2><div class="hub-grid">' +
    FUNCTIONS.map(function (f) {
      return '<button type="button" class="hub-tile" data-hub="' + f.id + '">' +
        '<span class="hub-icon" aria-hidden="true">' + f.icon + '</span>' +
        '<strong>' + f.title + '</strong><span class="hub-txt">' + f.text + '</span>' +
        '</button>';
    }).join("") + '</div>';
  hero.after(hub);
  /* Zurück-Leiste */
  var back = document.createElement("div");
  back.className = "hub-back hub-hide";
  back.innerHTML = '<button type="button" class="btn btn-light" data-hub="start">← Startübersicht</button><strong id="hubTitle"></strong>';
  home.insertBefore(back, home.firstChild);
  /* Bereiche den Funktionen zuordnen */
  FUNCTIONS.forEach(function (f) {
    f.els = (f.show || []).map(function (s) { return home.querySelector(s); }).filter(Boolean);
  });
  /* Navigation neu aufbauen: Start + alle Funktionen */
  nav.querySelectorAll(".nav-link").forEach(function (a) { a.remove(); });
  function addLink(label, id) {
    var a = document.createElement("a");
    a.className = "nav-link"; a.href = "#" + id; a.setAttribute("data-hub", id); a.textContent = label;
    nav.insertBefore(a, legal);
  }
  addLink("\u{1F3E0} Start", "start");
  FUNCTIONS.forEach(function (f) { addLink(f.icon + " " + f.title, f.id); });
  function find(id) { return FUNCTIONS.filter(function (f) { return f.id === id; })[0]; }
  function showView(id) {
    var f = find(id);
    if (!f || !f.show) { f = null; id = "start"; }
    hero.classList.toggle("hub-hide", !!f);
    hub.classList.toggle("hub-hide", !!f);
    back.classList.toggle("hub-hide", !f);
    FUNCTIONS.forEach(function (g) {
      g.els.forEach(function (el) { el.classList.toggle("hub-hide", g !== f); });
    });
    if (f) {
      document.getElementById("hubTitle").textContent = f.icon + " " + f.title;
      if (f.id === "termine") { var d = document.getElementById("planung-termine"); if (d) d.open = true; }
    }
    nav.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-hub") === id);
    });
    window.scrollTo(0, 0);
  }
  function openPopup(url) {
    var w = window.open(url, "sp_" + url, "width=1100,height=860,resizable=yes,scrollbars=yes");
    if (!w) { location.href = url; return; }
    if (w.focus) w.focus();
  }
  function go(id) {
    var f = find(id);
    if (f && f.popup) { openPopup(f.popup); return; }
    if (typeof showHome === "function") showHome(false);   /* falls gerade eine Rechtsseite offen ist */
    showView(id);
    try { history.pushState(null, "", "#" + id); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-hub]");
    if (!el) return;
    e.preventDefault();
    go(el.getAttribute("data-hub"));
  });
  function fromHash() {
    var h = location.hash.replace("#", "");
    h = ALIAS[h] || h;
    var f = find(h);
    if (f && f.show) showView(h);
    else if (h === "" || h === "start") showView("start");
  }
  window.addEventListener("hashchange", fromHash);
  showView("start");
  fromHash();
})();
