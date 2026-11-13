/* Schornstein Planer – Gesamtsicherung
 *
 * Sichert ALLE Daten der App in einer einzigen Datei und liest sie wieder ein:
 * Termine und Einstellungen, Leistung/Übersicht, Kundenverwaltung,
 * Luftverbund-Projekte, Zeiten je Tätigkeit, Ersteller/Betrieb usw.
 *
 * Gesichert wird alles, was die App im Speicher des Geräts ablegt
 * (Einträge, die mit „schornstein“ beginnen) – auch spätere neue Funktionen.
 */
(function () {
  "use strict";

  if (window.SPSicherung) return;

  var SCHEMA = "schornstein-planer-gesamtsicherung";
  var PREFIX = "schornstein";
  var LAST_KEY = "sp-letzte-sicherung";      // Zeitpunkt der letzten Sicherung (nicht Teil der Sicherung)
  var UNDO_KEY = "sp-vor-wiederherstellung"; // Stand vor dem letzten Einlesen (nicht Teil der Sicherung)

  function E(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmt(iso) {
    var d = new Date(iso);

    if (isNaN(d)) return "";

    return (
      pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() +
      ", " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + " Uhr"
    );
  }

  /* ---------- Daten sammeln / schreiben ---------- */

  function collect() {
    var data = {};

    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);

      if (k && k.indexOf(PREFIX) === 0) data[k] = localStorage.getItem(k);
    }

    return data;
  }

  function parse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* Überblick: was ist enthalten? */
  function summary(data) {
    var plan = parse(data["schornstein-planer-v8"]) || {};
    var kd = parse(data["schornstein-planer-kunden-v1"]) || {};
    var lv = parse(data["schornsteinplaner_luftverbund_v2"]) || {};
    var projects = Array.isArray(lv) ? lv : Array.isArray(lv.projects) ? lv.projects : [];

    return {
      termine: Array.isArray(plan.appointments) ? plan.appointments.length : 0,
      kunden: Array.isArray(kd.kunden) ? kd.kunden.length : 0,
      projekte: projects.length,
      eintraege: Object.keys(data).length
    };
  }

  function writeAll(data) {
    var del = [];

    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);

      if (k && k.indexOf(PREFIX) === 0) del.push(k);
    }

    del.forEach(function (k) {
      localStorage.removeItem(k);
    });

    Object.keys(data).forEach(function (k) {
      if (k.indexOf(PREFIX) === 0 && typeof data[k] === "string") localStorage.setItem(k, data[k]);
    });
  }

  /* ---------- Datei teilen / speichern ---------- */

  async function shareOrDownload(blob, name) {
    var isIOS =
      /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIOS || navigator.standalone === true) {
      try {
        var file = new File([blob], name, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
          return true;
        }
      } catch (err) {
        if (err && err.name === "AbortError") return false;
      }
    }

    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");

    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 60000);

    return true;
  }

  /* ---------- Sichern ---------- */

  async function backupAll() {
    var data = collect();
    var d = new Date();
    var stamp = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    var now = d.toISOString();

    var payload = {
      schema: SCHEMA,
      version: 1,
      app: "Schornstein Planer",
      exportedAt: now,
      summary: summary(data),
      data: data
    };

    var ok = await shareOrDownload(
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
      "Schornstein-Planer-Sicherung-" + stamp + ".json"
    );

    if (ok) {
      try {
        localStorage.setItem(LAST_KEY, now);
      } catch (e) {}

      render();
    }
  }

  /* ---------- Einlesen ---------- */

  function restore(payload, label) {
    var sum = summary(payload.data);

    var msg =
      "Alle aktuellen Daten dieser App werden durch " + label + " ersetzt:\n\n" +
      "• " + sum.termine + " Termine\n" +
      "• " + sum.kunden + " Kunden\n" +
      "• " + sum.projekte + " Luftverbund-Projekte\n\n" +
      "Der bisherige Stand wird vorher automatisch zwischengespeichert (Rückgängig möglich). Fortfahren?";

    if (!confirm(msg)) return;

    try {
      localStorage.setItem(
        UNDO_KEY,
        JSON.stringify({ savedAt: new Date().toISOString(), data: collect() })
      );
    } catch (e) {
      if (!confirm("Der bisherige Stand konnte nicht zwischengespeichert werden. Trotzdem ersetzen?")) return;
    }

    writeAll(payload.data);

    /* Stand entspricht jetzt der eingelesenen Sicherung */
    try {
      if (payload.exportedAt) localStorage.setItem(LAST_KEY, payload.exportedAt);
    } catch (e) {}

    location.reload();
  }

  function readFile(file) {
    var reader = new FileReader();

    reader.onload = function () {
      var obj = parse(reader.result);

      if (!obj || obj.schema !== SCHEMA || !obj.data || typeof obj.data !== "object") {
        alert(
          "Das ist keine Gesamtsicherung des Schornstein Planers.\n\n" +
          "Bitte eine Datei „Schornstein-Planer-Sicherung-….json“ wählen."
        );
        return;
      }

      restore(obj, "die Sicherung vom " + (fmt(obj.exportedAt) || "unbekanntem Datum"));
    };

    reader.readAsText(file);
  }

  function undoRestore() {
    var u = parse(localStorage.getItem(UNDO_KEY));

    if (!u || !u.data) return;

    if (!confirm("Den Stand von " + fmt(u.savedAt) + " (vor dem letzten Einlesen) wiederherstellen?")) return;

    writeAll(u.data);
    localStorage.removeItem(UNDO_KEY);
    location.reload();
  }

  /* ---------- Menü oben (neben „Rechtliches“) ---------- */

  var css = document.createElement("style");

  css.textContent =
    ".sg-menu{position:relative;margin-left:auto;z-index:99999}" +
    ".sg-menu + .legal-menu{margin-left:0}" +
    ".sg-dot{display:none;width:8px;height:8px;border-radius:50%;background:#f0a63a;margin-left:2px}" +
    ".sg-menu.warn .sg-dot{display:inline-block}" +
    ".sg-dropdown{position:absolute;top:calc(100% + 4px);right:0;width:320px;padding:12px;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 15px 35px rgba(0,0,0,.22);z-index:999999;color:var(--text)}" +
    ".sg-dropdown[hidden]{display:none!important}" +
    ".sg-status{margin:0 0 10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#fbfbfc;font-size:.84rem;line-height:1.45}" +
    ".sg-status.warn{border-color:#e9c78d;background:#fff4e0;color:#7a4600}" +
    ".sg-status strong{display:block}" +
    ".sg-dropdown .sg-act{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;margin:0 0 8px;border-radius:10px;font-size:.92rem;font-weight:700;cursor:pointer;text-align:center}" +
    ".sg-dropdown .sg-act.sg-undo{min-height:0;padding:8px 10px;font-size:.78rem;font-weight:600}" +
    ".sg-note{margin:2px 0 0;color:var(--muted);font-size:.76rem;line-height:1.45}" +
    "@media (max-width:760px){.sg-menu{position:static;margin-left:0}.sg-dropdown{left:12px;right:12px;width:auto;top:100%;margin-top:5px}}";

  document.head.appendChild(css);

  var menu = document.createElement("div");

  menu.className = "sg-menu";
  menu.id = "sgMenu";

  menu.innerHTML =
    '<button class="legal-button" id="sgButton" type="button" aria-expanded="false" aria-haspopup="true">' +
    "\u{1F4BE} Datensicherung" +
    '<span class="sg-dot" aria-hidden="true"></span>' +
    '<span class="legal-arrow" aria-hidden="true">\u25BC</span>' +
    "</button>" +
    '<div class="sg-dropdown" id="sgDropdown" hidden></div>';

  var button = menu.querySelector("#sgButton");
  var panel = menu.querySelector("#sgDropdown");

  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      var lm = document.getElementById("legalDropdown");
      var lb = document.getElementById("legalButton");

      if (lm) lm.hidden = true;
      if (lb) lb.setAttribute("aria-expanded", "false");

      render();
    }
  }

  function render() {
    var sum = summary(collect());
    var last = localStorage.getItem(LAST_KEY);
    var age = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
    var hasData = sum.termine + sum.kunden + sum.projekte > 0;
    var warn = hasData && age > 7;
    var undo = parse(localStorage.getItem(UNDO_KEY));

    menu.classList.toggle("warn", warn);

    panel.innerHTML =
      '<div class="sg-status' + (warn ? " warn" : "") + '"><strong>' +
      (last ? "Letzte Sicherung: " + E(fmt(last)) : "Noch nie gesichert") +
      "</strong>" +
      (warn ? (last ? "Älter als 7 Tage – bitte jetzt sichern.<br>" : "Bitte jetzt einmal sichern.<br>") : "") +
      "Gespeichert: " + sum.termine + " Termine, " + sum.kunden + " Kunden, " + sum.projekte + " Luftverbund-Projekte.</div>" +
      '<button type="button" class="btn btn-primary sg-act" id="sgBackup">\u{1F4BE} Alles sichern</button>' +
      '<label class="btn btn-gold sg-act" for="sgImport">\u{1F4C2} Alles einlesen</label>' +
      '<input id="sgImport" type="file" accept="application/json,.json" hidden>' +
      (undo && undo.data
        ? '<button type="button" class="btn btn-light sg-act sg-undo" id="sgUndo">\u21A9 Stand vor dem letzten Einlesen wiederherstellen (' + E(fmt(undo.savedAt)) + ")</button>"
        : "") +
      '<p class="sg-note">Sichert alles in einer Datei: Termine, Kunden, Luftverbund-Projekte, Einstellungen und Quittungsnummern. ' +
      "Beim Einlesen werden die aktuellen Daten ersetzt (vorher wird automatisch der alte Stand zwischengespeichert). " +
      "Auf dem iPhone öffnet „Alles sichern“ das Teilen-Menü (In Dateien sichern).</p>";

    panel.querySelector("#sgBackup").addEventListener("click", backupAll);
    panel.querySelector("#sgImport").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];

      e.target.value = "";

      if (file) {
        setOpen(false);
        readFile(file);
      }
    });

    var u = panel.querySelector("#sgUndo");

    if (u) u.addEventListener("click", undoRestore);
  }

  button.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(panel.hidden);
  });

  document.addEventListener("click", function (e) {
    if (!panel.hidden && !menu.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });

  /* Wenn „Rechtliches“ geöffnet wird, schließt sich dieses Menü */
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#legalButton")) setOpen(false);
  });

  /* Menü einsetzen: nach dem Start-Hub (der die Navigation neu aufbaut), links neben „Rechtliches“ */
  function mount() {
    var legal = document.getElementById("legalMenu");
    var nav = document.querySelector(".main-nav");

    if (!nav || menu.parentNode) return;

    if (legal && legal.parentNode === nav) nav.insertBefore(menu, legal);
    else nav.appendChild(menu);

    menu.classList.toggle("warn", (function () {
      var sum = summary(collect());
      var last = localStorage.getItem(LAST_KEY);
      var age = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;

      return sum.termine + sum.kunden + sum.projekte > 0 && age > 7;
    })());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.SPSicherung = { backup: backupAll, collect: collect, summary: summary, open: function () { setOpen(true); } };
})();
