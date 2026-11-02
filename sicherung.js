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

  /* ---------- Ansicht ---------- */

  var css = document.createElement("style");

  css.textContent =
    ".sg-card{padding:22px}" +
    ".sg-card h2{margin:0 0 6px;font-size:1.3rem}" +
    ".sg-lead{margin:0 0 16px;color:var(--muted);font-size:.92rem}" +
    ".sg-status{margin:0 0 16px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fbfbfc;font-size:.92rem}" +
    ".sg-status.warn{border-color:#e9c78d;background:#fff4e0;color:#7a4600}" +
    ".sg-status strong{display:block;margin-bottom:2px}" +
    ".sg-actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}" +
    ".sg-actions .btn{min-height:48px;flex:1 1 220px}" +
    ".sg-list{margin:0;padding-left:1.1em;color:#4f5962;font-size:.88rem;line-height:1.6}" +
    ".sg-note{margin-top:14px;color:var(--muted);font-size:.82rem}" +
    "@media (max-width:600px){.sg-card{padding:14px}}";

  document.head.appendChild(css);

  var home = document.getElementById("homePage") || document.body;
  var view = document.getElementById("sicherungView");

  if (!view) {
    view = document.createElement("section");
    view.id = "sicherungView";
    home.appendChild(view);
  }

  function render() {
    var sum = summary(collect());
    var last = localStorage.getItem(LAST_KEY);
    var age = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
    var hasData = sum.termine + sum.kunden + sum.projekte > 0;
    var warn = hasData && age > 7;
    var undo = parse(localStorage.getItem(UNDO_KEY));

    view.innerHTML =
      '<div class="card sg-card">' +
      "<h2>Datensicherung</h2>" +
      '<p class="sg-lead">Alles in einer Datei sichern und wieder einlesen – Termine, Kunden, Luftverbund-Projekte, Einstellungen und alle Eingaben. ' +
      "Praktisch bei Gerätewechsel, nach einem Update der App oder als Sicherheitskopie.</p>" +
      '<div class="sg-status' + (warn ? " warn" : "") + '"><strong>' +
      (last ? "Letzte Sicherung: " + E(fmt(last)) : "Noch nie gesichert") +
      "</strong>" +
      (warn ? "Die letzte Sicherung ist älter als 7 Tage – bitte jetzt sichern. " : "") +
      "Aktuell gespeichert: " + sum.termine + " Termine, " + sum.kunden + " Kunden, " + sum.projekte + " Luftverbund-Projekte.</div>" +
      '<div class="sg-actions">' +
      '<button type="button" class="btn btn-primary" id="sgBackup">💾 Alles sichern</button>' +
      '<label class="btn btn-gold" for="sgImport" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center">📂 Alles einlesen</label>' +
      '<input id="sgImport" type="file" accept="application/json,.json" hidden>' +
      "</div>" +
      (undo && undo.data
        ? '<div class="sg-actions"><button type="button" class="btn btn-light" id="sgUndo">↩ Stand vor dem letzten Einlesen wiederherstellen (' +
          E(fmt(undo.savedAt)) + ")</button></div>"
        : "") +
      '<ul class="sg-list">' +
      "<li>Enthalten: Terminplaner (Termine, Einstellungen, Zeiten je Tätigkeit), Leistung &amp; Übersicht, Kundenverwaltung, Luftverbund-Projekte, Ersteller/Betrieb.</li>" +
      "<li>Beim Einlesen werden die aktuellen Daten ersetzt. Der bisherige Stand wird vorher zwischengespeichert.</li>" +
      "</ul>" +
      '<p class="sg-note">Tipp: Die Datei auf einem anderen Gerät oder in der Cloud ablegen. Auf dem iPhone öffnet „Alles sichern“ das Teilen-Menü (In Dateien sichern).</p>' +
      "</div>";

    view.querySelector("#sgBackup").addEventListener("click", backupAll);
    view.querySelector("#sgImport").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];

      e.target.value = "";

      if (file) readFile(file);
    });

    var u = view.querySelector("#sgUndo");

    if (u) u.addEventListener("click", undoRestore);
  }

  render();

  /* Ansicht aktualisieren, wenn sie geöffnet wird (Zahlen können sich geändert haben) */
  window.addEventListener("hashchange", function () {
    if (location.hash === "#sicherung") render();
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest('[data-hub="sicherung"]');

    if (t) setTimeout(render, 0);
  });

  window.SPSicherung = { backup: backupAll, collect: collect, summary: summary };
})();
