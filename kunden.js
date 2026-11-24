/* Schornstein Planer – Kundenverwaltung
 *
 * Gemeinsame Kundenliste für Terminplaner und Luftverbund-Rechner.
 *
 * Programme (Auswahl oben in der Kundenverwaltung):
 *   Hottgenroth:  HHHH.ZZZ   (0001.000 bis 9999.999)
 *   Dexheimer:    OO-SSS-HHHH (Ortschaft – Straße – Hausnummer, z. B. 02-001-0001)
 *
 * Kundennummern Hottgenroth:  HHHH.ZZZ   (0001.000 bis 9999.999)
 *   HHHH = laufende Nummer des Hauses (1 bis 9999)
 *   ZZZ  = Zusatz für Einschübe (000 bis 999)
 *   Anzeige ohne führende Nullen: 1.000 · 2.000 · 10.000 · 1000.000
 *   Einschub nach 2.000 -> 2.001, nach 10.000 -> 10.001 usw.
 *
 * Schnittstelle für andere Module:
 *   window.SPKunden.pick(function (kunde) { ... })
 *   window.SPKunden.addressLine(kunde)   -> "Straße 12a, 12345 Ort"
 *   window.SPKunden.exportData() / importData(obj)
 */
(function () {
  "use strict";

  if (window.SPKunden) return;

  var KEY = "schornstein-planer-kunden-v1";
  var MAX_HAUS = 9999;

  var coll = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

  function E(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function uid() {
    return "k-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  /* ============================================================
     KUNDENNUMMERN
     ============================================================ */

  /* "2.001" / "2001" / "0002.001" -> { haus: 2, zus: 1 } oder null */
  var PROG_KEY = "schornstein-planer-kunden-programm";
  var PROGS = {
    hottgenroth: { name: "Hottgenroth", ex: "2.001" },
    dexheimer: { name: "Dexheimer", ex: "02-001-0001" }
  };

  function getProg() {
    try {
      var v = localStorage.getItem(PROG_KEY);

      return PROGS[v] ? v : "hottgenroth";
    } catch (e) {
      return "hottgenroth";
    }
  }

  function setProg(v) {
    if (!PROGS[v]) return;

    try {
      localStorage.setItem(PROG_KEY, v);
    } catch (e) {}
  }

  /* "02-001-0001" / "2-1-1" / "020010001" -> { dex:true, ort, str, haus } */
  function parseDex(t) {
    var m = /^(\d{1,2})-(\d{1,3})-(\d{1,4})$/.exec(t);

    if (!m && /^\d{9}$/.test(t)) m = [0, t.slice(0, 2), t.slice(2, 5), t.slice(5)];

    if (!m) return null;

    var o = parseInt(m[1], 10);
    var sr = parseInt(m[2], 10);
    var h = parseInt(m[3], 10);

    if (o < 1 || sr < 1 || h < 1) return null;

    return { dex: true, ort: o, str: sr, haus: h };
  }

  function progOfNr(nr) {
    var p = parseNr(nr);

    return p && p.dex ? "dexheimer" : "hottgenroth";
  }

  function parseNr(s) {
    var t0 = String(s == null ? "" : s).trim().replace(/\s+/g, "");
    var dx = parseDex(t0);

    if (dx) return dx;

    var t = t0.replace(",", ".");
    var m = /^(\d{1,4})(?:\.(\d{3}))?$/.exec(t);

    if (!m) return null;

    var haus = parseInt(m[1], 10);
    var zus = m[2] ? parseInt(m[2], 10) : 0;

    if (haus < 1 || haus > MAX_HAUS) return null;

    return { haus: haus, zus: zus };
  }

  function fmtNr(p) {
    if (p.dex) return String(p.ort).padStart(2, "0") + "-" + pad3(p.str) + "-" + String(p.haus).padStart(4, "0");

    return p.haus + "." + pad3(p.zus);
  }

  function nrSort(k) {
    var p = parseNr(k.nr);

    if (p && p.dex) return 1e10 + p.ort * 1e7 + p.str * 1e4 + p.haus;

    return p ? p.haus * 1000 + p.zus : Infinity;
  }

  /* ============================================================
     SPEICHER
     ============================================================ */

  /* Koordinate (Zahl innerhalb der Grenzen) oder null */
  function coord(v, max) {
    var n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;

    return typeof n === "number" && isFinite(n) && Math.abs(n) <= max ? n : null;
  }

  /* Wunschzeiten: [{ days:[0-6], from:"HH:MM", to:"HH:MM" }] – 0 = Sonntag … 6 = Samstag */
  function cleanWishes(w) {
    if (!Array.isArray(w)) return [];

    return w
      .map(function (r) {
        var days = (Array.isArray(r && r.days) ? r.days : [])
          .map(Number)
          .filter(function (d, i, a) {
            return d >= 0 && d <= 6 && a.indexOf(d) === i;
          });

        return {
          days: days,
          from: r && /^\d{2}:\d{2}$/.test(r.from) ? r.from : "00:00",
          to: r && /^\d{2}:\d{2}$/.test(r.to) ? r.to : "23:59"
        };
      })
      .filter(function (r) {
        return r.days.length;
      });
  }

  var WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
  var WD_NAME = { 1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 0: "So" };

  function toMinutes(t) {
    var p = String(t || "0:0").split(":");

    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  /* Wunschzeiten als Text, z. B. "Fr ab 14:00 Uhr; Mo–Mi 08:00–12:00 Uhr" */
  function wishText(c) {
    return cleanWishes(c && c.wishes)
      .map(function (r) {
        var idx = WD_ORDER.filter(function (d) {
          return r.days.indexOf(d) >= 0;
        });
        var parts = [];
        var i = 0;

        while (i < idx.length) {
          var j = i;

          while (j + 1 < idx.length && WD_ORDER.indexOf(idx[j + 1]) === WD_ORDER.indexOf(idx[j]) + 1) j++;

          parts.push(j - i >= 2 ? WD_NAME[idx[i]] + "–" + WD_NAME[idx[j]] : idx.slice(i, j + 1).map(function (d) { return WD_NAME[d]; }).join(", "));
          i = j + 1;
        }

        var open = r.from === "00:00";
        var end = r.to === "23:59";
        var t = open && end ? "ganztags" : open ? "bis " + r.to + " Uhr" : end ? "ab " + r.from + " Uhr" : r.from + "–" + r.to + " Uhr";

        return parts.join(", ") + " " + t;
      })
      .join("; ");
  }

  /* Zeitfenster des Kunden an einem Wochentag (Minuten) – null = keine Wünsche, jederzeit möglich */
  function wishWindows(c, weekday) {
    var w = cleanWishes(c && c.wishes);

    if (!w.length) return null;

    return w
      .filter(function (r) {
        return r.days.indexOf(weekday) >= 0;
      })
      .map(function (r) {
        return [toMinutes(r.from), toMinutes(r.to)];
      });
  }

  function clean(k) {
    if (!k || typeof k !== "object") return null;

    var p = parseNr(k.nr);

    if (!p) return null;

    return {
      id: String(k.id || uid()),
      nr: fmtNr(p),
      name: String(k.name || ""),
      street: String(k.street || ""),
      house: String(k.house || ""),
      zip: String(k.zip || ""),
      city: String(k.city || ""),
      phone: String(k.phone || ""),
      waReg: k.waReg === true || k.waReg === "true",
      group: String(k.group || "").trim().slice(0, 60),
      ownerAddr: String(k.ownerAddr || ""),
      notes: String(k.notes || ""),
      hint: String(k.hint || ""),
      bossNote: String(k.bossNote || ""),
      wishes: cleanWishes(k.wishes),
      lat: coord(k.lat, 90),
      lon: coord(k.lon, 180),
      travelBefore: Math.max(0, Math.min(240, Math.round(Number(k.travelBefore) || 0))),
      travelAfter: Math.max(0, Math.min(240, Math.round(Number(k.travelAfter) || 0))),
      created: k.created || new Date().toISOString(),
      updated: k.updated || new Date().toISOString()
    };
  }

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "null");

      if (o && Array.isArray(o.kunden)) {
        return o.kunden.map(clean).filter(Boolean);
      }
    } catch (e) {}

    return [];
  }

  var kunden = load();

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, kunden: kunden }));
    } catch (e) {
      alert("Die Kundenliste konnte nicht gespeichert werden (Speicher voll oder gesperrt).");
    }

    try {
      window.dispatchEvent(new CustomEvent("sp-kunden-changed"));
    } catch (e) {}
  }

  window.addEventListener("storage", function (e) {
    if (e.key === KEY) {
      kunden = load();
      refreshAll();
    }
  });

  /* ============================================================
     NUMMERN VERGEBEN
     ============================================================ */

  function nextMainNr() {
    var used = {};
    var max = 0;

    kunden.forEach(function (k) {
      var p = parseNr(k.nr);

      if (!p || p.dex) return;

      used[p.haus] = true;

      if (p.haus > max) max = p.haus;
    });

    if (max < MAX_HAUS) return fmtNr({ haus: max + 1, zus: 0 });

    for (var h = 1; h <= MAX_HAUS; h++) {
      if (!used[h]) return fmtNr({ haus: h, zus: 0 });
    }

    return null;
  }

  /* Dexheimer: nächste Nummer OO-SSS-HHHH – Ort und Straße von vorhandenen Kunden übernehmen, sonst die nächste freie */
  function nextDexNr(ctx) {
    ctx = ctx || {};

    var city = String(ctx.city || "").trim().toLowerCase();
    var street = String(ctx.street || "").trim().toLowerCase();
    var list = [];

    kunden.forEach(function (k) {
      var p = parseNr(k.nr);

      if (p && p.dex) list.push({ k: k, p: p });
    });

    var ort = 0;
    var maxOrt = 0;

    list.forEach(function (x) {
      if (x.p.ort > maxOrt) maxOrt = x.p.ort;

      if (!ort && city && String(x.k.city || "").trim().toLowerCase() === city) ort = x.p.ort;
    });

    if (!ort) ort = maxOrt ? (city ? maxOrt + 1 : maxOrt) : 1;

    var inOrt = list.filter(function (x) {
      return x.p.ort === ort;
    });
    var str = 0;
    var maxStr = 0;

    inOrt.forEach(function (x) {
      if (x.p.str > maxStr) maxStr = x.p.str;

      if (!str && street && String(x.k.street || "").trim().toLowerCase() === street) str = x.p.str;
    });

    if (!str) str = maxStr ? (street ? maxStr + 1 : maxStr) : 1;

    var used = {};
    var maxH = 0;

    inOrt.forEach(function (x) {
      if (x.p.str !== str) return;

      used[x.p.haus] = true;

      if (x.p.haus > maxH) maxH = x.p.haus;
    });

    var hn = parseInt(String(ctx.house || "").replace(/^\D+/, ""), 10);
    var haus = hn >= 1 && hn <= 9999 && !used[hn] ? hn : maxH + 1;

    if (ort > 99 || str > 999 || haus > 9999) return null;

    return fmtNr({ dex: true, ort: ort, str: str, haus: haus });
  }

  /* Einschub nach einem vorhandenen Kunden: gleiche Hausnummer, nächster freier Zusatz */
  function nextInsertNr(afterNr) {
    var base = parseNr(afterNr);

    if (!base) return null;

    var maxZus = base.zus;

    kunden.forEach(function (k) {
      var p = parseNr(k.nr);

      if (p && p.haus === base.haus && p.zus > maxZus) maxZus = p.zus;
    });

    if (maxZus >= 999) return null;

    return fmtNr({ haus: base.haus, zus: maxZus + 1 });
  }

  function checkNr(input, ownId, prog) {
    var p = parseNr(input);
    var want = prog || getProg();

    if (!p || (p.dex ? "dexheimer" : "hottgenroth") !== want) {
      return {
        error:
          want === "dexheimer"
            ? "Bitte eine Kundennummer im Dexheimer-Format eingeben: Ortschaft-Straße-Hausnummer, z. B. 02-001-0001."
            : "Bitte eine Kundennummer von 1.000 bis 9999.999 eingeben (drei Stellen nach dem Punkt, z. B. 2.001)."
      };
    }

    var nr = fmtNr(p);
    var dup = kunden.filter(function (k) {
      return k.nr === nr && k.id !== ownId;
    })[0];

    if (dup) {
      return {
        error: "Die Kundennummer " + nr + " ist schon vergeben (" + (dup.name || "ohne Namen") + ")."
      };
    }

    return { nr: nr };
  }

  /* ============================================================
     HILFSFUNKTIONEN
     ============================================================ */

  function streetLine(k) {
    return [k.street, k.house].filter(Boolean).join(" ");
  }

  function cityLine(k) {
    return [k.zip, k.city].filter(Boolean).join(" ");
  }

  function addressLine(k) {
    return [streetLine(k), cityLine(k)].filter(Boolean).join(", ");
  }

  /* Hausnummer natürlich sortieren: 2, 2a, 10, 10b */
  function houseCmp(a, b) {
    var ma = /^(\d+)\s*(.*)$/.exec(String(a || "").trim());
    var mb = /^(\d+)\s*(.*)$/.exec(String(b || "").trim());

    if (ma && mb) {
      var d = parseInt(ma[1], 10) - parseInt(mb[1], 10);

      return d || coll.compare(ma[2], mb[2]);
    }

    if (ma) return -1;
    if (mb) return 1;

    return coll.compare(a || "", b || "");
  }

  function emptyLast(a, b) {
    if (!a && b) return 1;
    if (a && !b) return -1;

    return coll.compare(a, b);
  }

  function custCmp(a, b) {
    return (
      emptyLast(a.city, b.city) ||
      emptyLast(a.street, b.street) ||
      houseCmp(a.house, b.house) ||
      coll.compare(a.name, b.name) ||
      nrSort(a) - nrSort(b)
    );
  }

  var NO_CITY = "(ohne Ort)";
  var NO_STREET = "(ohne Straße)";

  function cityOf(k) {
    return k.city || NO_CITY;
  }

  function streetOf(k) {
    return k.street || NO_STREET;
  }

  function matches(k, q) {
    var s = q.trim().toLowerCase();

    if (!s) return true;

    var hay = [k.name, k.street, k.house, k.city, k.zip, k.phone, k.nr, k.hint]
      .join(" ")
      .toLowerCase();

    if (hay.indexOf(s.replace(",", ".")) >= 0) return true;

    /* Nummernsuche: "2001" findet 2.001, "20" findet 20.000 */
    var digits = s.replace(/[^\d]/g, "");

    if (digits && /^[\d.,\s]+$/.test(s)) {
      var p = parseNr(k.nr);

      if (p && p.dex && (pad2(p.ort) + pad3(p.str) + String(p.haus).padStart(4, "0")).indexOf(digits) === 0) return true;

      if (p && !p.dex && (p.haus + pad3(p.zus)).indexOf(digits) === 0) return true;
    }

    return false;
  }

  function byId(id) {
    return (
      kunden.filter(function (k) {
        return k.id === id;
      })[0] || null
    );
  }

  /* ============================================================
     STYLES
     ============================================================ */

  var css = document.createElement("style");

  css.id = "kvStyle";
  css.textContent =
    ".kv-card{padding:22px}" +
    ".kv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px}" +
    ".kv-head h2{margin:0 0 4px;font-size:1.3rem}" +
    ".kv-head p{margin:0;color:var(--muted);font-size:.9rem}" +
    ".kv-tools{display:flex;gap:8px;flex-wrap:wrap}" +
    ".kv-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}" +
    ".kv-search{flex:1 1 230px;min-width:0;padding:12px;border:1px solid #d5dbe0;border-radius:10px;font-size:16px;background:#fff;color:var(--text);outline:none}" +
    ".kv-search:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(199,154,66,.13)}" +
    ".kv-crumbs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px}" +
    ".kv-crumb{border:0;background:#edf0f2;border-radius:999px;padding:8px 13px;font-weight:750;font-size:.86rem;color:var(--dark);cursor:pointer}" +
    ".kv-crumb.on{background:var(--dark);color:#fff}" +
    ".kv-sep{color:var(--muted)}" +
    ".kv-list{display:flex;flex-direction:column;gap:8px}" +
    ".kv-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;padding:12px 14px;min-height:54px;border:1px solid var(--border);border-left:4px solid var(--gold);border-radius:12px;background:#fff;color:var(--text);cursor:pointer;font:inherit}" +
    ".kv-row:hover,.kv-row:focus-visible{background:#fffaf0;outline:none}" +
    ".kv-prog{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 14px}" +
    ".kv-prog-l{font-size:.78rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-right:2px}" +
    ".kv-progb{display:flex;align-items:center;justify-content:center;width:170px;border:1px solid #d5d9dd;background:#fff;border-radius:12px;padding:8px 14px;min-height:44px;font:inherit;color:var(--text);cursor:pointer;text-align:center}" +
    ".kv-progb strong{font-size:.95rem}" +
    ".kv-progb:hover{border-color:var(--gold)}" +
    "@media (max-width:600px){.kv-prog-l{flex:0 0 100%}.kv-progb{flex:1 1 0;width:auto;min-width:0}}" +
    ".kv-progb.on{background:var(--dark);border-color:var(--dark);color:#fff}" +
    ".kv-apt{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#f1f3f5;color:#7a6a45;font-size:.72rem;font-weight:700;line-height:1.5;vertical-align:1px;cursor:pointer;white-space:nowrap}" +
    ".kv-apt:hover,.kv-apt:focus-visible{background:#f7ecd2;color:#4d3d17;outline:none}" +
    ".kv-popbg{position:fixed;inset:0;z-index:10000;background:rgba(20,25,30,.4);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".kv-pop{background:#fff;border-radius:16px;padding:14px 16px 16px;width:100%;max-width:350px;max-height:80vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.28)}" +
    ".kv-pop-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}" +
    ".kv-pop-head strong{font-size:.95rem;color:var(--text)}" +
    ".kv-pop-x{border:0;background:#f1f3f5;border-radius:50%;width:30px;height:30px;font:inherit;font-size:.95rem;line-height:1;color:#5c6670;cursor:pointer}" +
    ".kv-pop-it{padding:10px 0;border-top:1px solid #eceff1}" +
    ".kv-pop-it:first-of-type{border-top:0}" +
    ".kv-pop-when{font-weight:800;font-size:1.05rem}" +
    ".kv-pop-line{margin-top:3px;font-size:.88rem;color:var(--text)}" +
    ".kv-pop-line.m{color:var(--muted);font-size:.8rem}" +
    ".kv-main{min-width:0;display:block}" +
    ".kv-main strong{font-size:1rem}" +
    ".kv-hn{display:inline-block;min-width:3.2ch;margin-right:8px;font-weight:850}" +
    ".kv-sub{display:block;margin-top:2px;color:var(--muted);font-size:.8rem}" +
    ".kv-count{flex:0 0 auto;background:#f0f2f4;border-radius:999px;padding:4px 11px;font-weight:800;font-size:.8rem;color:var(--dark)}" +
    ".kv-nr{flex:0 0 auto;font-weight:800;font-size:.86rem;color:#7d5b20;white-space:nowrap}" +
    ".kv-empty{padding:20px;text-align:center;color:var(--muted);border:1px dashed var(--border);border-radius:12px}" +
    ".kv-foot{margin-top:12px;color:var(--muted);font-size:.8rem}" +
    ".kv-overlay{position:fixed;inset:0;z-index:10000;background:rgba(20,25,30,.55);display:flex;align-items:center;justify-content:center;padding:14px}" +
    ".kv-overlay.top{z-index:10001}" +
    ".kv-sheet{width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:17px;box-shadow:0 20px 60px rgba(0,0,0,.28);padding:18px;overflow:hidden}" +
    ".kv-sheet-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}" +
    ".kv-sheet-head h3{margin:0;font-size:1.15rem}" +
    ".kv-sheet-body{overflow:auto;min-height:0;-webkit-overflow-scrolling:touch}" +
    ".kv-form{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}" +
    ".kv-form .wide{grid-column:1 / -1}" +
    ".kv-form input,.kv-form select,.kv-form textarea{font-size:16px}" +
    ".kv-hint{margin:4px 0 0;color:var(--muted);font-size:.78rem}" +
    ".kv-wa{display:flex;align-items:center;gap:10px;font-weight:800;cursor:pointer}" +
    ".kv-wa input{width:22px;height:22px;flex:0 0 22px}" +
    ".kv-grpinfo{font-size:.86rem;font-weight:700;color:#7a5200;line-height:1.5}" +
    ".kv-grpinfo .btn{min-height:38px;padding:6px 12px;margin-top:6px}" +
    ".kv-grppick{margin:8px 0 4px;min-height:44px}" +
    ".kv-grpm{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0}" +
    ".kv-grpm .btn{min-height:30px;padding:2px 10px;margin:0}" +
    ".kv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}" +
    ".kv-chips .btn{min-height:38px;padding:6px 11px;font-size:.84rem}" +
    ".kv-hintbox{padding:10px 12px;border:1px solid #ecd9a8;border-radius:12px;background:#fffaf0}" +
    ".kv-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}" +
    ".kv-pickbtn{display:inline-flex;align-items:center;gap:8px}" +
    ".kv-chk{flex:0 0 24px;width:24px;height:24px;margin-right:12px;border:2px solid #b7bec5;border-radius:7px;background:#fff;position:relative}" +
    ".kv-chk.on{background:var(--gold);border-color:var(--gold)}" +
    ".kv-chk.on::after{content:'';position:absolute;left:7px;top:2px;width:6px;height:12px;border:solid #22272d;border-width:0 3px 3px 0;transform:rotate(45deg)}" +
    ".kv-row.sel{background:#fffaf0;border-color:var(--gold)}" +
    ".kv-multi-tools{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}" +
    ".kv-multi-tools .btn{min-height:40px}" +
    ".kv-item{display:flex;flex-direction:column;gap:4px}" +
    ".kv-works{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 4px;padding:8px 10px;border:1px dashed var(--gold);border-radius:10px;background:#fffdf7}" +
    ".kv-works[hidden]{display:none}" +
    ".kv-chip{min-height:38px;padding:4px 12px;border:1px solid #c9ced2;border-radius:999px;background:#fff;font:inherit;font-size:.82rem;font-weight:700;color:var(--text);cursor:pointer}" +
    ".kv-chip.on{border-color:var(--gold);background:#fbf5e7}" +
    ".kv-chip.on::before{content:'✓ '}" +
    ".kv-wtext{flex:1 1 180px;min-width:0;padding:7px 10px;border:1px solid #c9ced2;border-radius:10px;font-size:16px}" +
    ".kv-wtext[hidden]{display:none}" +
    ".kv-quick{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px}" +
    ".kv-quick strong{font-size:.82rem;margin-right:2px}" +
    ".kv-travel{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;font-size:.8rem;font-weight:700;color:#4f5962}" +
    ".kv-travel input{width:58px;padding:6px;border:1px solid #c9ced2;border-radius:8px;font-size:16px;text-align:center}" +
    ".kv-wish{border:1px solid var(--border);border-radius:10px;padding:8px;margin-bottom:8px;background:#fbfbfc}" +
    ".kv-wd{display:flex;gap:4px;flex-wrap:wrap}" +
    ".kv-wdb{min-width:42px;min-height:40px;border:1px solid #c9ced2;border-radius:8px;background:#fff;font:inherit;font-weight:800;cursor:pointer}" +
    ".kv-wdb.on{background:var(--gold);border-color:var(--gold);color:#22272d}" +
    ".kv-wt{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}" +
    ".kv-wt label{display:flex;align-items:center;gap:6px;font-size:.85rem;font-weight:700}" +
    ".kv-wt input{padding:6px 8px;border:1px solid #c9ced2;border-radius:8px;font-size:16px}" +
    ".kv-wrm{margin-left:auto;min-width:40px;min-height:38px;border:0;border-radius:8px;background:#fdecec;color:#a02f2f;font-weight:800;cursor:pointer}" +
    ".kv-sheet-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}" +
    ".kv-sheet-foot strong{font-size:.95rem}" +
    "@media (max-width:600px){.kv-card{padding:14px}.kv-form{grid-template-columns:1fr}.kv-overlay{padding:0;align-items:stretch}.kv-sheet{max-height:100vh;height:100%;border-radius:0}.kv-actions .btn{flex:1}}";

  document.head.appendChild(css);

  /* ============================================================
     LISTE (Ort -> Straße -> Hausnummer + Name) MIT SUCHE
     ============================================================ */

  var browsers = [];

  /* Offene Termine (vom Terminplaner geliefert): Kunden mit Termin bekommen einen dezenten „Termin“-Button */
  var aptFn = null, aptCache = null, aptDirty = false;
  function aptIndex() {
    if (aptCache) return aptCache;
    var byId = {}, byNr = {}, list = [];
    try { list = aptFn ? aptFn() || [] : []; } catch (e) { list = []; }
    list.forEach(function (a) {
      if (a.kid) (byId[a.kid] = byId[a.kid] || []).push(a);
      else if (a.knr) (byNr[a.knr] = byNr[a.knr] || []).push(a);
    });
    aptCache = { byId: byId, byNr: byNr };
    return aptCache;
  }
  function aptsOf(k) {
    var ix = aptIndex();
    return (ix.byId[k.id] || []).concat(k.nr && ix.byNr[k.nr] ? ix.byNr[k.nr] : []);
  }
  function aptsChanged() {
    aptCache = null;
    aptDirty = true;
    flushApts();
  }
  function flushApts() {
    var v = document.getElementById("kundenView");
    if (aptDirty && v && v.offsetParent !== null) {
      aptDirty = false;
      refreshAll();
    }
  }

  /* mode: "manage" (Kundenverwaltung) oder "pick" (Auswahl) */
  function mountBrowser(host, mode, onPick, opts) {
    var st = { q: "", ort: null, str: null };
    var multi = mode === "multi";
    var sel = (opts && opts.sel) || new Set();

    function changed() {
      if (opts && opts.onChange) opts.onChange();
    }

    /* Tätigkeit direkt bei der Auswahl (nur Mehrfachauswahl mit opts.work) */
    var wk = multi && opts && opts.work ? opts.work : null;

    function chipsHtml(id) {
      var w = wk.getWork(id);

      return (
        wk.types
          .map(function (t) {
            return '<button type="button" class="kv-chip' + (w[t.k] ? " on" : "") + '" data-kvw="' + t.k + '">' + E(t.l) + "</button>";
          })
          .join("") +
        '<input class="kv-wtext" type="text" maxlength="40" placeholder="Eigener Text, z. B. Feuerstättenschau" aria-label="Sonstige Arbeit" value="' +
        E(w.text || "") +
        '"' +
        (w.other ? "" : " hidden") +
        ">" +
        (wk.travel
          ? '<span class="kv-travel">🚗 Fahrt <input class="kv-tb" type="number" min="0" max="240" step="5" inputmode="numeric" placeholder="0" value="' +
            (w.tb || "") +
            '" aria-label="Fahrtzeit vorher in Minuten"> vor · <input class="kv-ta" type="number" min="0" max="240" step="5" inputmode="numeric" placeholder="0" value="' +
            (w.ta || "") +
            '" aria-label="Fahrtzeit nachher in Minuten"> nach (Min.)</span>'
          : "")
      );
    }

    function item(k, rowHtml) {
      if (!wk) return rowHtml;

      var on = sel.has(k.id);

      return (
        '<div class="kv-item" data-id="' + E(k.id) + '">' + rowHtml +
        '<div class="kv-works"' + (on ? "" : " hidden") + ">" + (on ? chipsHtml(k.id) : "") + "</div></div>"
      );
    }

    host.innerHTML =
      '<div class="kv-bar">' +
      '<input class="kv-search" type="search" placeholder="Suchen: Name oder Kundennummer" ' +
      'autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Kunden suchen">' +
      '<button type="button" class="btn btn-gold" data-kv="new">+ Neuer Kunde</button>' +
      "</div>" +
      (multi
        ? '<div class="kv-multi-tools">' +
          '<button type="button" class="btn btn-light" data-kv="selall">Alle angezeigten auswählen</button>' +
          '<button type="button" class="btn btn-light" data-kv="selnone">Auswahl leeren</button>' +
          "</div>"
        : "") +
      (wk
        ? '<div class="kv-quick"><strong>Tätigkeit für alle Ausgewählten:</strong>' +
          wk.types
            .filter(function (t) {
              return t.k !== "other";
            })
            .map(function (t) {
              return '<button type="button" class="kv-chip" data-kvq="' + t.k + '">' + E(t.l) + "</button>";
            })
            .join("") +
          '<button type="button" class="kv-chip" data-kvq="none">Zurücksetzen</button></div>'
        : "") +
      '<div class="kv-body"></div>';

    var input = host.querySelector(".kv-search");
    var body = host.querySelector(".kv-body");

    function crumbs() {
      var h = '<div class="kv-crumbs">';

      h +=
        '<button type="button" class="kv-crumb' +
        (st.ort == null ? " on" : "") +
        '" data-kv="up0">Alle Orte</button>';

      if (st.ort != null) {
        h +=
          '<span class="kv-sep">›</span><button type="button" class="kv-crumb' +
          (st.str == null ? " on" : "") +
          '" data-kv="up1">' +
          E(st.ort) +
          "</button>";
      }

      if (st.str != null) {
        h +=
          '<span class="kv-sep">›</span><button type="button" class="kv-crumb on" data-kv="up2">' +
          E(st.str) +
          "</button>";
      }

      return h + "</div>";
    }

    function groupRows(list, keyFn, attr) {
      var map = {};
      var chosen = {};
      var order = [];

      list.forEach(function (k) {
        var key = keyFn(k);

        if (!map[key]) {
          map[key] = 0;
          chosen[key] = 0;
          order.push(key);
        }

        map[key]++;

        if (multi && sel.has(k.id)) chosen[key]++;
      });

      return order
        .map(function (key) {
          return (
            '<button type="button" class="kv-row" data-kv="' +
            attr +
            '" data-v="' +
            E(key) +
            '"><span class="kv-main"><strong>' +
            E(key) +
            '</strong></span><span class="kv-count">' +
            (multi && chosen[key] ? chosen[key] + " von " + map[key] + " gewählt" : map[key] + (map[key] === 1 ? " Kunde" : " Kunden")) +
            "</span></button>"
          );
        })
        .join("");
    }

    function chk(k) {
      return multi ? '<span class="kv-chk' + (sel.has(k.id) ? " on" : "") + '"></span>' : "";
    }

    function aptTag(k) {
      if (mode !== "manage") return "";

      var l = aptsOf(k);

      if (!l.length) return "";

      return (
        ' <span class="kv-apt" role="button" tabindex="0" data-kv="apt" data-id="' + E(k.id) + '" title="Angemeldet – Termin ansehen">📅 ' +
        E(l[0].dateShort || l[0].date) + (l.length > 1 ? " +" + (l.length - 1) : "") + "</span>"
      );
    }

    function houseRow(k) {
      return item(k, houseButton(k));
    }

    function searchRow(k) {
      return item(k, searchButton(k));
    }

    function houseButton(k) {
      return (
        '<button type="button" class="kv-row' + (multi && sel.has(k.id) ? " sel" : "") + '" data-kv="cust" data-id="' +
        E(k.id) +
        '">' + chk(k) + '<span class="kv-main"><strong><span class="kv-hn">' +
        E(k.house || "–") +
        "</span>" +
        E(k.name || "(ohne Namen)") +
        (k.waReg ? " 💬" : "") +
        (k.group ? " 🏘" : "") +
        aptTag(k) +
        "</strong>" +
        (cityLine(k) ? '<span class="kv-sub">' + E(cityLine(k)) + "</span>" : "") +
        '</span><span class="kv-nr">Kd-Nr ' +
        E(k.nr) +
        "</span></button>"
      );
    }

    function searchButton(k) {
      return (
        '<button type="button" class="kv-row' + (multi && sel.has(k.id) ? " sel" : "") + '" data-kv="cust" data-id="' +
        E(k.id) +
        '">' + chk(k) + '<span class="kv-main"><strong>' +
        E(streetLine(k) || "(ohne Straße)") +
        "</strong> · " +
        E(k.name || "(ohne Namen)") +
        (k.waReg ? " 💬" : "") +
        (k.group ? " 🏘" : "") +
        aptTag(k) +
        '<span class="kv-sub">' +
        E(cityLine(k) || NO_CITY) +
        '</span></span><span class="kv-nr">Kd-Nr ' +
        E(k.nr) +
        "</span></button>"
      );
    }

    function shown() {
      var a = kunden.slice().sort(custCmp);

      if (mode !== "manage") return a;

      var pr = getProg();

      return a.filter(function (k) {
        return progOfNr(k.nr) === pr;
      });
    }

    function update() {
      var all = shown();
      var html = "";
      var q = st.q.trim();

      if (!all.length) {
        body.innerHTML =
          '<div class="kv-empty">' +
          (mode === "manage" ? "Noch keine Kunden im Programm " + PROGS[getProg()].name + " angelegt." : "Noch keine Kunden angelegt.") +
          "<br>Mit „+ Neuer Kunde“ den ersten Kunden anlegen.</div>";
        return;
      }

      if (q) {
        var found = all.filter(function (k) {
          return matches(k, q);
        });

        html =
          '<div class="kv-list">' +
          (found.length
            ? found.map(searchRow).join("")
            : '<div class="kv-empty">Kein Kunde gefunden.' + otherHit(q) + "</div>") +
          "</div>" +
          '<div class="kv-foot">' +
          found.length +
          " von " +
          all.length +
          " Kunden</div>";

        body.innerHTML = html;
        return;
      }

      /* Ebenen, die inzwischen leer sind, verlassen */
      if (
        st.ort != null &&
        !all.some(function (k) {
          return cityOf(k) === st.ort;
        })
      ) {
        st.ort = null;
        st.str = null;
      }

      if (
        st.str != null &&
        !all.some(function (k) {
          return cityOf(k) === st.ort && streetOf(k) === st.str;
        })
      ) {
        st.str = null;
      }

      if (st.ort == null) {
        html = crumbs() + '<div class="kv-list">' + groupRows(all, cityOf, "ort") + "</div>";
      } else if (st.str == null) {
        var inCity = all.filter(function (k) {
          return cityOf(k) === st.ort;
        });

        html =
          crumbs() + '<div class="kv-list">' + groupRows(inCity, streetOf, "str") + "</div>";
      } else {
        var inStreet = all.filter(function (k) {
          return cityOf(k) === st.ort && streetOf(k) === st.str;
        });

        html = crumbs() + '<div class="kv-list">' + inStreet.map(houseRow).join("") + "</div>";
      }

      html +=
        '<div class="kv-foot">' + all.length + (all.length === 1 ? " Kunde" : " Kunden") +
        (mode === "manage" ? " im Programm " + E(PROGS[getProg()].name) : " insgesamt") + "</div>";

      body.innerHTML = html;
    }

    /* Treffer im anderen Programm anzeigen (nur Verwaltung) */
    function otherHit(q) {
      if (mode !== "manage") return "";

      var pr = getProg();
      var other = pr === "dexheimer" ? "hottgenroth" : "dexheimer";
      var n = kunden.filter(function (k) {
        return progOfNr(k.nr) === other && matches(k, q);
      }).length;

      return n
        ? '<br><button type="button" class="btn btn-light" style="margin-top:8px" data-kv="swprog" data-v="' + other + '">' +
            n + (n === 1 ? " Treffer" : " Treffer") + " im Programm " + E(PROGS[other].name) + " ansehen</button>"
        : "";
    }

    /* Kunden der aktuellen Ansicht (Suchergebnis, Straße, Ort oder alle) */
    function visibleList() {
      var all = shown();
      var q = st.q.trim();

      if (q) {
        return all.filter(function (k) {
          return matches(k, q);
        });
      }

      return all.filter(function (k) {
        return (
          (st.ort == null || cityOf(k) === st.ort) &&
          (st.str == null || streetOf(k) === st.str)
        );
      });
    }

    input.addEventListener("input", function () {
      st.q = input.value;
      update();
    });

    host.addEventListener("click", function (e) {
      var t = e.target.closest("[data-kv]");

      if (!t || !host.contains(t)) return;

      var a = t.getAttribute("data-kv");

      if (a === "swprog") {
        setProg(t.getAttribute("data-v"));
        refreshAll();
        return;
      }

      if (a === "new") {
        openEditor(null, {
          onSaved: function (k) {
            if (mode === "pick" && onPick) onPick(k);

            if (multi) {
              sel.add(k.id);
              update();
              changed();
            }
          }
        });
      } else if (a === "apt") {
        showApts(byId(t.getAttribute("data-id")));
      } else if (a === "selall") {
        visibleList().forEach(function (k) {
          sel.add(k.id);
        });
        update();
        changed();
      } else if (a === "selnone") {
        sel.clear();
        update();
        changed();
      } else if (a === "up0") {
        st.ort = null;
        st.str = null;
        update();
      } else if (a === "up1") {
        st.str = null;
        update();
      } else if (a === "ort") {
        st.ort = t.getAttribute("data-v");
        st.str = null;
        update();
      } else if (a === "str") {
        st.str = t.getAttribute("data-v");
        update();
      } else if (a === "cust") {
        var k = byId(t.getAttribute("data-id"));

        if (!k) return;

        if (multi) {
          if (sel.has(k.id)) sel.delete(k.id);
          else sel.add(k.id);

          t.classList.toggle("sel", sel.has(k.id));

          var box = t.querySelector(".kv-chk");

          if (box) box.classList.toggle("on", sel.has(k.id));

          if (wk) {
            var itemEl = t.closest(".kv-item");
            var wEl = itemEl && itemEl.querySelector(".kv-works");

            if (wEl) {
              if (sel.has(k.id)) {
                wEl.innerHTML = chipsHtml(k.id);
                wEl.hidden = false;
              } else {
                wEl.hidden = true;
                wEl.innerHTML = "";
              }
            }
          }

          changed();
        } else if (mode === "pick") {
          if (onPick) onPick(k);
        } else {
          openEditor(k, {});
        }
      }
    });

    host.addEventListener("keydown", function (e) {
      var ap = e.target.closest && e.target.closest('[data-kv="apt"]');

      if (ap && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        showApts(byId(ap.getAttribute("data-id")));
      }
    });

    if (wk) {
      host.addEventListener("click", function (e) {
        var c = e.target.closest("[data-kvw]");

        if (c) {
          var itemEl = c.closest(".kv-item");
          var w = wk.getWork(itemEl.getAttribute("data-id"));
          var key = c.getAttribute("data-kvw");

          w[key] = !w[key];
          c.classList.toggle("on", !!w[key]);

          if (key === "other") {
            var inp = itemEl.querySelector(".kv-wtext");

            inp.hidden = !w.other;

            if (w.other) inp.focus();
          }

          changed();
          return;
        }

        var q = e.target.closest("[data-kvq]");

        if (q) {
          var kind = q.getAttribute("data-kvq");
          var scroller = host.closest(".kv-sheet-body");
          var top = scroller ? scroller.scrollTop : 0;

          sel.forEach(function (id) {
            var w2 = wk.getWork(id);

            if (kind === "none") {
              wk.types.forEach(function (t) {
                w2[t.k] = false;
              });
              w2.text = "";
            } else {
              w2[kind] = true;
            }
          });

          update();

          if (scroller) scroller.scrollTop = top;

          changed();
        }
      });

      host.addEventListener("input", function (e) {
        var inp = e.target.closest(".kv-wtext");

        if (!inp) return;

        wk.getWork(inp.closest(".kv-item").getAttribute("data-id")).text = inp.value;
      });

      host.addEventListener("input", function (e) {
        var tin = e.target.closest(".kv-tb, .kv-ta");

        if (!tin) return;

        var w3 = wk.getWork(tin.closest(".kv-item").getAttribute("data-id"));

        w3[tin.classList.contains("kv-tb") ? "tb" : "ta"] = Math.max(0, Math.min(240, Math.round(Number(tin.value) || 0)));
      });
    }

    var api = { update: update, host: host };

    browsers.push(api);
    update();

    return api;
  }

  function refreshAll() {
    browsers = browsers.filter(function (b) {
      return document.body.contains(b.host);
    });

    browsers.forEach(function (b) {
      b.update();
    });

    if (typeof renderProg === "function") renderProg();
  }

  /* ============================================================
     KUNDE ANLEGEN / BEARBEITEN
     ============================================================ */

  function openEditor(k, opts) {
    var isNew = !k;
    var ov = document.createElement("div");

    ov.className = "kv-overlay top";

    var formProg = k ? progOfNr(k.nr) : getProg();
    var dexForm = formProg === "dexheimer";

    var insertOptions = kunden
      .filter(function (c) {
        return progOfNr(c.nr) === "hottgenroth";
      })
      .sort(function (a, b) {
        return nrSort(a) - nrSort(b);
      })
      .map(function (c) {
        return (
          '<option value="' +
          E(c.nr) +
          '">' +
          E(c.nr + " · " + (c.name || "ohne Namen") + (c.street ? " (" + streetLine(c) + ")" : "")) +
          "</option>"
        );
      })
      .join("");

    ov.innerHTML =
      '<div class="kv-sheet" role="dialog" aria-modal="true">' +
      '<div class="kv-sheet-head"><h3>' +
      (isNew ? "Neuer Kunde" : "Kunde bearbeiten") +
      '</h3><button type="button" class="btn btn-light" data-x="close">Schließen</button></div>' +
      '<div class="kv-sheet-body"><div class="kv-form">' +
      '<div class="field"><label for="kvNr">Kundennummer</label>' +
      '<input id="kvNr" type="text" inputmode="' + (dexForm ? "text" : "decimal") + '" autocomplete="off">' +
      '<p class="kv-hint">' +
      (dexForm
        ? "Dexheimer: Ortschaft-Straße-Hausnummer, z. B. 02-001-0001"
        : "Format 1.000 bis 9999.999") +
      "</p></div>" +
      (isNew && !dexForm
        ? '<div class="field"><label for="kvIns">Einschub nach Kunde</label>' +
          '<select id="kvIns"><option value="">– nein, neuer Kunde am Ende –</option>' +
          insertOptions +
          '</select><p class="kv-hint">Z. B. nach 2.000 wird 2.001 vergeben.</p></div>'
        : "<div></div>") +
      '<div class="field wide"><label for="kvName">Name (Eigentümer)</label>' +
      '<input id="kvName" type="text" placeholder="Vor- und Nachname" autocomplete="off"></div>' +
      '<div class="field"><label for="kvStreet">Straße</label><input id="kvStreet" type="text" autocomplete="off"></div>' +
      '<div class="field"><label for="kvHouse">Hausnummer</label><input id="kvHouse" type="text" autocomplete="off"></div>' +
      '<div class="field"><label for="kvZip">PLZ</label><input id="kvZip" type="text" inputmode="numeric" autocomplete="off"></div>' +
      '<div class="field"><label for="kvCity">Ort</label><input id="kvCity" type="text" autocomplete="off"></div>' +
      '<div class="field wide"><label for="kvPhone">Telefon / E-Mail</label><input id="kvPhone" type="text" autocomplete="off"></div>' +
      '<div class="field wide kv-hintbox"><label class="kv-wa"><input type="checkbox" id="kvWa"><span>💬 Anmeldung immer per WhatsApp (statt Zettel)</span></label>' +
      '<p class="kv-hint">Termine dieses Kunden kommen nicht in den Druckpool, sondern in den WhatsApp-Pool. Dafür oben die Handynummer eintragen.</p></div>' +
      '<div class="field wide kv-hintbox"><label for="kvGroup">🏘 Gruppe – mehrere Häuser desselben Kunden</label>' +
      '<input id="kvGroup" type="text" list="kvGroupList" maxlength="60" autocomplete="off" placeholder="z. B. Müller Hof (bei allen Häusern gleich eintragen)">' +
      '<datalist id="kvGroupList"></datalist>' +
      '<p class="kv-hint">Häuser mit gleichem Gruppennamen werden am selben Tag direkt hintereinander eingeplant und zusammen angemeldet (ein Zettel / eine Nachricht).</p>' +
      '<button type="button" class="btn btn-gold kv-grppick" data-x="grppick">👥 Kunden für die Gruppe auswählen</button>' +
      '<div id="kvGroupInfo" class="kv-grpinfo"></div></div>' +
      '<div class="field wide"><label for="kvOwner">Abweichende Anschrift des Eigentümers (optional)</label>' +
      '<input id="kvOwner" type="text" placeholder="Straße, PLZ Ort" autocomplete="off">' +
      '<p class="kv-hint">Leer lassen, wenn der Eigentümer im Haus wohnt.</p></div>' +
      '<div class="field wide kv-hintbox"><label for="kvHint">💡 Hinweise für unterwegs <span class="kv-hint" style="font-weight:600">(nur für dich – erscheinen im Kalender und in der Tagesübersicht, nie auf dem Zettel)</span></label>' +
      '<div class="kv-chips" id="kvHintChips">' +
      '<button type="button" class="btn btn-light" data-chip="🔑 Schlüssel: ">🔑 Schlüssel</button>' +
      '<button type="button" class="btn btn-light" data-chip="🐕 Hund vorhanden">🐕 Hund</button>' +
      '<button type="button" class="btn btn-light" data-chip="📞 Vorher anrufen">📞 Vorher anrufen</button>' +
      '<button type="button" class="btn btn-light" data-chip="🪜 Dachausstieg schwierig">🪜 Dachausstieg</button>' +
      '<button type="button" class="btn btn-light" data-chip="🔔 Klingel defekt – bitte anrufen">🔔 Klingel defekt</button></div>' +
      '<textarea id="kvHint" rows="3" placeholder="z. B. Schlüssel beim Nachbarn Nr. 12, Hund im Garten, Zugang über Hof …"></textarea></div>' +
      '<div class="field wide"><label for="kvNotes">Besonderheiten <span class="kv-hint" style="font-weight:600">(erscheinen als „Hinweis“ auf dem Anmeldezettel für den Kunden)</span></label>' +
      '<textarea id="kvNotes" rows="2" placeholder="Nur Dinge, die der Kunde auf dem Zettel lesen soll"></textarea></div>' +
      '<div class="field wide"><label>Wunschzeiten (wann ist der Kunde am besten erreichbar?)</label>' +
      '<div id="kvWishes"></div>' +
      '<button type="button" class="btn btn-light" data-x="wish" style="margin-top:6px">＋ Wunschzeit hinzufügen</button>' +
      '<p class="kv-hint">z. B. Freitag ab 14:00 Uhr. Bei der automatischen Terminvergabe wird der Kunde nur dann eingeplant.</p></div>' +
      '<div class="field wide"><label>Standort (für die Routenplanung)</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<input id="kvLat" type="text" inputmode="decimal" placeholder="Breite, z. B. 50.5870" autocomplete="off" style="flex:1 1 140px">' +
      '<input id="kvLon" type="text" inputmode="decimal" placeholder="Länge, z. B. 8.6781" autocomplete="off" style="flex:1 1 140px"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="btn btn-light" data-x="gps">📍 Aktuellen Standort übernehmen</button>' +
      '<button type="button" class="btn btn-light" data-x="geo">🔎 Adresse online suchen</button></div>' +
      '<p class="kv-hint" id="kvLocInfo">Aktuellen Standort übernehmen, wenn du vor dem Haus stehst – oder die Adresse über OpenStreetMap suchen (Internet nötig, die Adresse wird dabei an OpenStreetMap gesendet).</p></div>' +
      '<div class="field"><label for="kvTb">Standard-Fahrtzeit vorher (Min.)</label><input id="kvTb" type="number" min="0" max="240" step="5" inputmode="numeric" placeholder="0"></div>' +
      '<div class="field"><label for="kvTa">Standard-Fahrtzeit nachher (Min.)</label><input id="kvTa" type="number" min="0" max="240" step="5" inputmode="numeric" placeholder="0"></div>' +
      '<div class="field wide"><label for="kvBoss">Bemerkung für den Chef (nur im Chef-Ausdruck)</label>' +
      '<textarea id="kvBoss" rows="2" placeholder="z. B. zahlt immer bar, Rechnung immer per Post …"></textarea></div>' +
      "</div>" +
      '<div class="kv-actions">' +
      '<button type="button" class="btn btn-light" data-x="close">Abbrechen</button>' +
      (isNew ? "" : '<button type="button" class="btn btn-danger" data-x="del">Löschen</button>') +
      '<button type="button" class="btn btn-primary" data-x="save">Speichern</button>' +
      "</div></div></div>";

    document.body.appendChild(ov);

    function f(id) {
      return ov.querySelector("#" + id);
    }

    f("kvNr").value = k ? k.nr : (dexForm ? nextDexNr({}) : nextMainNr()) || "";

    /* Dexheimer: Nummer-Vorschlag folgt Ort / Straße / Hausnummer, solange die Nummer nicht von Hand geändert wurde */
    if (isNew && dexForm) {
      var nrTouched = false;

      f("kvNr").addEventListener("input", function () {
        nrTouched = true;
      });

      ["kvCity", "kvStreet", "kvHouse"].forEach(function (id) {
        f(id).addEventListener("input", function () {
          if (nrTouched) return;

          var sug = nextDexNr({ city: f("kvCity").value, street: f("kvStreet").value, house: f("kvHouse").value });

          if (sug) f("kvNr").value = sug;
        });
      });
    }
    f("kvName").value = k ? k.name : "";
    f("kvStreet").value = k ? k.street : "";
    f("kvHouse").value = k ? k.house : "";
    f("kvZip").value = k ? k.zip : "";
    f("kvCity").value = k ? k.city : "";
    f("kvPhone").value = k ? k.phone : "";
    f("kvWa").checked = !!(k && k.waReg);
    f("kvGroup").value = k ? k.group || "" : "";

    /* groupSel = die ANDEREN Häuser dieser Gruppe (ids); groupManual = per Hand gewählt (dann nicht mehr automatisch aus dem Namen gefüllt) */
    var me = k ? k.id : "",
      groupSel = [],
      groupSug = [],
      groupManual = false;

    f("kvGroupList").innerHTML = groupNames()
      .map(function (g) {
        return '<option value="' + E(g) + '"></option>';
      })
      .join("");

    function addrText(x) {
      return E(
        x.name + ", " + ([[x.street, x.house].filter(Boolean).join(" "), x.city].filter(Boolean).join(", ") || "ohne Adresse")
      );
    }

    function loadGroup() {
      groupSel = groupMembers(f("kvGroup").value.trim())
        .filter(function (x) {
          return x.id !== me;
        })
        .map(function (x) {
          return x.id;
        });
    }

    function byId(id) {
      return kunden.filter(function (x) {
        return x.id === id;
      })[0];
    }

    function groupInfo() {
      var g = f("kvGroup").value.trim(),
        nm = f("kvName").value.trim().toLowerCase(),
        html = "";

      if (g || groupSel.length) {
        html += groupSel.length
          ? "🏘 Häuser in dieser Gruppe (zusammen auf einem Zettel):<br>" +
            groupSel
              .map(function (id) {
                var x = byId(id);

                return x
                  ? '• <span class="kv-grpm">' +
                      addrText(x) +
                      ' <button type="button" class="btn btn-light" data-x="grpdel" data-id="' +
                      E(id) +
                      '" aria-label="Aus Gruppe entfernen">✕</button></span>'
                  : "";
              })
              .join("<br>")
          : "Noch kein weiteres Haus in dieser Gruppe.";
      }

      groupSug = nm
        ? kunden.filter(function (x) {
            return x.id !== me && x.name.trim().toLowerCase() === nm && groupSel.indexOf(x.id) < 0;
          })
        : [];

      if (groupSug.length) {
        html +=
          (html ? "<br>" : "") +
          "Gleicher Name gefunden: " +
          groupSug.map(addrText).join(" · ") +
          '<br><button type="button" class="btn btn-light" data-x="grpsug">🏘 Zur Gruppe hinzufügen</button>';
      }

      f("kvGroupInfo").innerHTML = html;
    }

    loadGroup();

    ov.addEventListener("input", function (e) {
      if (e.target.id === "kvGroup" && !groupManual) loadGroup();
      if (e.target.id === "kvGroup" || e.target.id === "kvName") groupInfo();
    });
    groupInfo();
    f("kvOwner").value = k ? k.ownerAddr : "";
    f("kvNotes").value = k ? k.notes : "";
    f("kvHint").value = k ? k.hint || "" : "";
    f("kvBoss").value = k ? k.bossNote || "" : "";
    /* Wunschzeiten: im Editor "" statt 00:00 / 23:59 anzeigen (offen) */
    var wishes = cleanWishes(k && k.wishes).map(function (r) {
      return { days: r.days.slice(), from: r.from === "00:00" ? "" : r.from, to: r.to === "23:59" ? "" : r.to };
    });

    function renderWishes() {
      f("kvWishes").innerHTML = wishes
        .map(function (r, i) {
          return (
            '<div class="kv-wish" data-i="' + i + '"><div class="kv-wd">' +
            WD_ORDER.map(function (d) {
              return '<button type="button" class="kv-wdb' + (r.days.indexOf(d) >= 0 ? " on" : "") + '" data-wd="' + d + '">' + WD_NAME[d] + "</button>";
            }).join("") +
            '</div><div class="kv-wt"><label>ab <input type="time" class="kv-wf" value="' + E(r.from) + '"></label>' +
            '<label>bis <input type="time" class="kv-wto" value="' + E(r.to) + '"></label>' +
            '<button type="button" class="kv-wrm" data-wrm="1" aria-label="Wunschzeit entfernen">✕</button></div></div>'
          );
        })
        .join("");
    }

    renderWishes();

    f("kvWishes").addEventListener("click", function (e) {
      var row = e.target.closest(".kv-wish");

      if (!row) return;

      var r = wishes[+row.getAttribute("data-i")];
      var wd = e.target.closest("[data-wd]");

      if (wd) {
        var d = +wd.getAttribute("data-wd");
        var at = r.days.indexOf(d);

        if (at >= 0) r.days.splice(at, 1);
        else r.days.push(d);

        wd.classList.toggle("on", at < 0);
      } else if (e.target.closest("[data-wrm]")) {
        wishes.splice(+row.getAttribute("data-i"), 1);
        renderWishes();
      }
    });

    f("kvWishes").addEventListener("input", function (e) {
      var row = e.target.closest(".kv-wish");

      if (!row) return;

      var r = wishes[+row.getAttribute("data-i")];

      if (e.target.classList.contains("kv-wf")) r.from = e.target.value;
      if (e.target.classList.contains("kv-wto")) r.to = e.target.value;
    });

    f("kvLat").value = k && k.lat !== null && k.lat !== undefined ? k.lat : "";
    f("kvLon").value = k && k.lon !== null && k.lon !== undefined ? k.lon : "";
    f("kvTb").value = k && k.travelBefore ? k.travelBefore : "";
    f("kvTa").value = k && k.travelAfter ? k.travelAfter : "";

    function close() {
      document.removeEventListener("keydown", onKey, true);
      ov.remove();
    }

    function onKey(e) {
      var tops = document.querySelectorAll(".kv-overlay.top");

      if (tops.length && tops[tops.length - 1] !== ov) return;   // darüber liegt die Kundenauswahl: dort schließen

      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    }

    document.addEventListener("keydown", onKey, true);

    if (isNew && f("kvIns")) {
      f("kvIns").addEventListener("change", function () {
        var v = f("kvIns").value;
        var nr = v ? nextInsertNr(v) : nextMainNr();

        if (!nr) {
          alert(
            v
              ? "Für diese Kundennummer sind keine Zwischennummern mehr frei."
              : "Es ist keine freie Kundennummer mehr vorhanden."
          );
          return;
        }

        f("kvNr").value = nr;
      });
    }

    ov.addEventListener("click", function (e) {
      if (e.target.closest('[data-x="grpsug"]')) {
        if (!f("kvGroup").value.trim()) f("kvGroup").value = f("kvName").value.trim();
        groupManual = true;
        groupSel = groupSel.concat(
          groupSug.map(function (x) {
            return x.id;
          })
        );
        groupInfo();
        return;
      }

      var gdel = e.target.closest('[data-x="grpdel"]');

      if (gdel) {
        groupManual = true;
        groupSel = groupSel.filter(function (id) {
          return id !== gdel.getAttribute("data-id");
        });
        groupInfo();
        return;
      }

      if (e.target.closest('[data-x="grppick"]')) {
        if (!f("kvGroup").value.trim()) f("kvGroup").value = f("kvName").value.trim() || "Gruppe";
        pickMany(
          function (chosen) {
            groupManual = true;
            groupSel = chosen
              .map(function (x) {
                return x.id;
              })
              .filter(function (id) {
                return id !== me;
              });
            groupInfo();
          },
          groupSel,
          null,
          true
        );
        return;
      }

      var chip = e.target.closest("[data-chip]");

      if (chip) {
        var hf = f("kvHint"),
          add = chip.getAttribute("data-chip"),
          cur = hf.value.replace(/\s+$/, "");

        hf.value = cur ? cur + "\n" + add : add;
        hf.focus();
        hf.setSelectionRange(hf.value.length, hf.value.length);
        return;
      }

      var t = e.target.closest("[data-x]");

      if (!t) return;

      var a = t.getAttribute("data-x");

      if (a === "close") {
        close();
      } else if (a === "wish") {
        wishes.push({ days: [], from: "", to: "" });
        renderWishes();
      } else if (a === "gps") {
        var info = f("kvLocInfo");

        getGps().then(
          function (p) {
            f("kvLat").value = p.lat.toFixed(6);
            f("kvLon").value = p.lon.toFixed(6);
            info.textContent = "Standort übernommen (Genauigkeit ca. " + Math.round(p.acc) + " m). Mit „Speichern“ sichern.";
          },
          function (err) {
            info.textContent = "Standort nicht verfügbar: " + err;
          }
        );
      } else if (a === "geo") {
        var info2 = f("kvLocInfo");

        info2.textContent = "Suche läuft …";
        geocodeAddress({
          street: f("kvStreet").value.trim(),
          house: f("kvHouse").value.trim(),
          zip: f("kvZip").value.trim(),
          city: f("kvCity").value.trim()
        }).then(
          function (p) {
            if (!p) {
              info2.textContent = "Adresse nicht gefunden. Bitte Angaben prüfen oder den Standort per GPS übernehmen.";
              return;
            }

            f("kvLat").value = p.lat.toFixed(6);
            f("kvLon").value = p.lon.toFixed(6);
            info2.textContent = "Standort gefunden. Mit „Speichern“ sichern.";
          },
          function () {
            info2.textContent = "Suche nicht möglich (keine Internetverbindung?).";
          }
        );
      } else if (a === "del") {
        if (
          !confirm(
            'Kunde "' +
              (k.name || k.nr) +
              '" (Kd-Nr ' +
              k.nr +
              ") wirklich löschen?\n\nBereits angelegte Termine und Rechner-Projekte bleiben unverändert erhalten."
          )
        ) {
          return;
        }

        kunden = kunden.filter(function (x) {
          return x.id !== k.id;
        });

        persist();
        refreshAll();
        close();
      } else if (a === "save") {
        var name = f("kvName").value.trim();

        if (!name) {
          alert("Bitte den Namen des Kunden eingeben.");
          f("kvName").focus();
          return;
        }

        var chk = checkNr(f("kvNr").value, k && k.id, formProg);

        if (chk.error) {
          alert(chk.error);
          f("kvNr").focus();
          return;
        }

        var rec = {
          id: k ? k.id : uid(),
          nr: chk.nr,
          name: name,
          street: f("kvStreet").value.trim(),
          house: f("kvHouse").value.trim(),
          zip: f("kvZip").value.trim(),
          city: f("kvCity").value.trim(),
          phone: f("kvPhone").value.trim(),
          waReg: f("kvWa").checked,
          group: f("kvGroup").value.trim(),
          ownerAddr: f("kvOwner").value.trim(),
          notes: f("kvNotes").value.trim(),
          hint: f("kvHint").value.trim(),
          bossNote: f("kvBoss").value.trim(),
          wishes: cleanWishes(
            wishes.map(function (r) {
              return { days: r.days, from: r.from || "00:00", to: r.to || "23:59" };
            })
          ),
          lat: coord(f("kvLat").value, 90),
          lon: coord(f("kvLon").value, 180),
          travelBefore: Math.max(0, Math.min(240, Math.round(Number(f("kvTb").value) || 0))),
          travelAfter: Math.max(0, Math.min(240, Math.round(Number(f("kvTa").value) || 0))),
          created: k ? k.created : new Date().toISOString(),
          updated: new Date().toISOString()
        };

        if (isNew) {
          var same = kunden.filter(function (x) {
            return (
              x.name.toLowerCase() === rec.name.toLowerCase() &&
              x.street.toLowerCase() === rec.street.toLowerCase() &&
              x.house.toLowerCase() === rec.house.toLowerCase() &&
              x.city.toLowerCase() === rec.city.toLowerCase()
            );
          })[0];

          if (
            same &&
            !confirm(
              "Ein Kunde mit gleichem Namen und gleicher Adresse existiert schon (Kd-Nr " +
                same.nr +
                "). Trotzdem neu anlegen?"
            )
          ) {
            return;
          }

          kunden.push(rec);
        } else {
          kunden = kunden.map(function (x) {
            return x.id === rec.id ? rec : x;
          });
        }

        if (rec.group) {
          var gl2 = rec.group.toLowerCase();

          kunden = kunden.map(function (x) {
            if (x.id === rec.id) return x;
            if (groupSel.indexOf(x.id) >= 0 && (x.group || "").trim().toLowerCase() !== gl2)
              return Object.assign({}, x, { group: rec.group, updated: new Date().toISOString() });
            if (groupSel.indexOf(x.id) < 0 && (x.group || "").trim().toLowerCase() === gl2)
              return Object.assign({}, x, { group: "", updated: new Date().toISOString() });   // aus der Gruppe entfernt
            return x;
          });
        }

        persist();
        refreshAll();
        close();

        if (opts && opts.onSaved) opts.onSaved(rec);
      }
    });

    setTimeout(function () {
      f(isNew ? "kvName" : "kvNr").focus();
    }, 50);
  }

  /* ============================================================
     AUSWAHL-DIALOG (für Terminplaner und Rechner)
     ============================================================ */

  function showApts(k) {
    if (!k) return;

    var list = aptsOf(k);
    var ov = document.createElement("div");

    ov.className = "kv-popbg";

    ov.innerHTML =
      '<div class="kv-pop" role="dialog" aria-modal="true">' +
      '<div class="kv-pop-head"><strong>' + E(k.name || "Kunde") + '</strong>' +
      '<button type="button" class="kv-pop-x" data-x="close" aria-label="Schließen">✕</button></div>' +
      (list.length
        ? list
            .map(function (a) {
              return (
                '<div class="kv-pop-it"><div class="kv-pop-when">' + E(a.dateText || a.date) + (a.time ? " · " + E(a.time) + " Uhr" : "") + "</div>" +
                '<div class="kv-pop-line">' + E(a.works && a.works.length ? a.works.join(" · ") : "–") + (a.label ? " · " + E(a.label) : "") + "</div>" +
                (a.notes ? '<div class="kv-pop-line m">' + E(a.notes) + "</div>" : "") +
                (a.hint ? '<div class="kv-pop-line m">' + E(a.hint) + "</div>" : "") +
                (a.status ? '<div class="kv-pop-line m">' + E(a.status) + "</div>" : "") +
                "</div>"
              );
            })
            .join("")
        : '<div class="kv-pop-line m">Kein offener Termin.</div>') +
      "</div>";

    document.body.appendChild(ov);

    function close() {
      document.removeEventListener("keydown", onKey);
      ov.remove();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("keydown", onKey);

    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest('[data-x="close"]')) close();
    });
  }

  function pick(cb) {
    var ov = document.createElement("div");

    ov.className = "kv-overlay";

    ov.innerHTML =
      '<div class="kv-sheet" role="dialog" aria-modal="true">' +
      '<div class="kv-sheet-head"><h3>Kunde auswählen</h3>' +
      '<button type="button" class="btn btn-light" data-x="close">Abbrechen</button></div>' +
      '<div class="kv-sheet-body"><div class="kv-pick-host"></div></div></div>';

    document.body.appendChild(ov);

    function close() {
      document.removeEventListener("keydown", onKey);
      ov.remove();
      refreshAll();
    }

    function onKey(e) {
      if (e.key === "Escape" && !document.querySelector(".kv-overlay.top")) close();
    }

    document.addEventListener("keydown", onKey);

    ov.addEventListener("click", function (e) {
      if (e.target.closest('[data-x="close"]')) close();
    });

    mountBrowser(ov.querySelector(".kv-pick-host"), "pick", function (k) {
      close();

      if (typeof cb === "function") cb(k);
    });
  }

  /* Mehrfachauswahl: cb(arrayVonKunden) – sortiert nach Ort, Straße, Hausnummer */
  function pickMany(cb, preselected, work, top) {
    var sel = new Set(preselected || []);
    var ov = document.createElement("div");

    ov.className = "kv-overlay" + (top ? " top" : "");

    ov.innerHTML =
      '<div class="kv-sheet" role="dialog" aria-modal="true">' +
      '<div class="kv-sheet-head"><h3>Kunden auswählen</h3>' +
      '<button type="button" class="btn btn-light" data-x="close">Abbrechen</button></div>' +
      '<div class="kv-sheet-body"><div class="kv-pick-host"></div></div>' +
      '<div class="kv-sheet-foot"><strong class="kv-selcount"></strong>' +
      '<button type="button" class="btn btn-primary" data-x="ok">Auswahl übernehmen</button></div></div>';

    document.body.appendChild(ov);

    var cnt = ov.querySelector(".kv-selcount");
    var okBtn = ov.querySelector('[data-x="ok"]');

    function count() {
      var txt = sel.size + (sel.size === 1 ? " Kunde" : " Kunden") + " ausgewählt";

      if (work) {
        var without = 0;

        sel.forEach(function (id) {
          var w = work.getWork(id);

          if (
            !work.types.some(function (t) {
              return w[t.k];
            })
          )
            without++;
        });

        if (without) txt += " · " + without + " ohne Tätigkeit";
      }

      cnt.textContent = txt;
      okBtn.disabled = !sel.size;
    }

    function close() {
      document.removeEventListener("keydown", onKey);
      ov.remove();
      refreshAll();
    }

    function onKey(e) {
      if (e.key === "Escape" && (top || !document.querySelector(".kv-overlay.top"))) close();
    }

    document.addEventListener("keydown", onKey);

    ov.addEventListener("click", function (e) {
      var t = e.target.closest("[data-x]");

      if (!t) return;

      if (t.getAttribute("data-x") === "close") {
        close();
      } else if (t.getAttribute("data-x") === "ok") {
        var chosen = kunden
          .slice()
          .sort(custCmp)
          .filter(function (k) {
            return sel.has(k.id);
          });

        close();

        if (typeof cb === "function") cb(chosen);
      }
    });

    mountBrowser(ov.querySelector(".kv-pick-host"), "multi", null, {
      sel: sel,
      onChange: count,
      work: work || null
    });

    count();
  }

  /* ============================================================
     STANDORT (GPS / OpenStreetMap)
     ============================================================ */

  function getGps() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject("Dieses Gerät unterstützt keine Standortbestimmung.");

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy || 0 });
        },
        function (err) {
          reject(err && err.code === 1 ? "Standortzugriff wurde nicht erlaubt." : "Standort konnte nicht bestimmt werden.");
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    });
  }

  /* Adresse -> { lat, lon } über OpenStreetMap (Nominatim); null = nicht gefunden */
  async function nominatim(params) {
    params.set("format", "json");
    params.set("limit", "1");
    params.set("countrycodes", "de,at,ch,lu");

    var r = await fetch("https://nominatim.openstreetmap.org/search?" + params.toString(), {
      headers: { "Accept-Language": "de" }
    });

    if (!r.ok) throw new Error("HTTP " + r.status);

    var j = await r.json();

    return j && j[0] ? { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) } : null;
  }

  async function geocodeAddress(a) {
    var p = new URLSearchParams();

    if (a.street) p.set("street", [a.house, a.street].filter(Boolean).join(" "));
    if (a.zip) p.set("postalcode", a.zip);
    if (a.city) p.set("city", a.city);

    var hit = a.street || a.city || a.zip ? await nominatim(p) : null;

    if (hit) return hit;

    /* Fallback: Freitextsuche */
    var q = [streetLine(a), cityLine(a)].filter(Boolean).join(", ");

    return q ? nominatim(new URLSearchParams({ q: q })) : null;
  }

  async function geocodeText(q) {
    return q ? nominatim(new URLSearchParams({ q: q })) : null;
  }

  function setLocation(id, lat, lon) {
    var c = byId(id);

    if (!c) return;

    kunden = kunden.map(function (x) {
      return x.id === id ? Object.assign({}, x, { lat: lat, lon: lon, updated: new Date().toISOString() }) : x;
    });
    persist();
    refreshAll();
  }

  /* Gruppen: mehrere Häuser desselben Kunden (gleicher Gruppenname) */
  function groupMembers(name) {
    var g = String(name || "").trim().toLowerCase();

    if (!g) return [];

    return kunden.filter(function (x) {
      return (x.group || "").trim().toLowerCase() === g;
    });
  }

  function groupNames() {
    var seen = {},
      out = [];

    kunden.forEach(function (x) {
      var g = (x.group || "").trim();

      if (g && !seen[g.toLowerCase()]) {
        seen[g.toLowerCase()] = 1;
        out.push(g);
      }
    });
    return out.sort(function (a, b) {
      return a.localeCompare(b, "de");
    });
  }

  /* Telefonnummer eines Kunden ergänzen/ändern (z. B. aus der Terminansage) */
  function setPhone(id, phone) {
    var c = byId(id);

    if (!c) return false;

    kunden = kunden.map(function (x) {
      return x.id === id ? Object.assign({}, x, { phone: String(phone || "").trim(), updated: new Date().toISOString() }) : x;
    });
    persist();
    refreshAll();
    return true;
  }

  /* Fehlende Standorte nacheinander suchen (höchstens eine Anfrage pro Sekunde, wie von OpenStreetMap verlangt) */
  async function geocodeMissing(list, onProgress) {
    var todo = list.filter(function (c) {
      return c.lat === null || c.lat === undefined || c.lon === null || c.lon === undefined;
    });
    var found = 0;
    var failed = 0;

    for (var i = 0; i < todo.length; i++) {
      if (onProgress) onProgress(i, todo.length);

      try {
        var p = await geocodeAddress(todo[i]);

        if (p) {
          setLocation(todo[i].id, p.lat, p.lon);
          found++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }

      if (i < todo.length - 1) await new Promise(function (r) { setTimeout(r, 1100); });
    }

    if (onProgress) onProgress(todo.length, todo.length);

    return { total: todo.length, found: found, failed: failed };
  }

  /* ============================================================
     SICHERUNG DER KUNDENLISTE
     ============================================================ */

  function exportData() {
    return {
      schema: "schornstein-planer-kunden",
      version: 1,
      exportedAt: new Date().toISOString(),
      kunden: JSON.parse(JSON.stringify(kunden))
    };
  }

  function importData(obj) {
    if (!obj || !Array.isArray(obj.kunden)) return false;

    kunden = obj.kunden.map(clean).filter(Boolean);
    persist();
    refreshAll();

    return true;
  }

  async function shareOrDownload(blob, name) {
    try {
      var file = new File([blob], name, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
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
  }

  /* ============================================================
     ANSICHT „KUNDENVERWALTUNG“ (Start-Hub)
     ============================================================ */

  var home = document.getElementById("homePage") || document.body;
  var view = document.getElementById("kundenView");

  if (!view) {
    view = document.createElement("section");
    view.id = "kundenView";
    home.appendChild(view);
  }

  view.innerHTML =
    '<div class="card kv-card">' +
    '<div class="kv-head"><div><h2>Kundenverwaltung</h2>' +
    "<p>Kunden anlegen und suchen – Auswahl nach Ort, Straße und Hausnummer. " +
    "Im Terminplaner und im Luftverbund-Rechner werden Name und Adresse direkt übernommen.</p></div>" +
    '<div class="kv-tools">' +
    '<label class="btn btn-light" for="kvImport" style="cursor:pointer" title="Kundenliste aus einer Datei übernehmen (die Gesamtsicherung findest du oben im Menü „Datensicherung“)">Kundenliste importieren</label>' +
    '<input id="kvImport" type="file" accept="application/json,.json" hidden>' +
    "</div></div>" +
    '<div class="kv-prog" id="kvProg" role="group" aria-label="Programm"></div>' +
    '<div id="kvManage"></div></div>';

  function renderProg() {
    if (typeof view === "undefined" || !view) return;

    var box = view.querySelector("#kvProg");

    if (!box) return;

    var cur = getProg();
    box.innerHTML =
      '<span class="kv-prog-l">Programm</span>' +
      Object.keys(PROGS)
        .map(function (key) {
          return (
            '<button type="button" class="kv-progb' + (key === cur ? " on" : "") + '" data-prog="' + key + '" aria-pressed="' + (key === cur) + '">' +
            "<strong>" + E(PROGS[key].name) + "</strong></button>"
          );
        })
        .join("");
  }

  view.querySelector("#kvProg").addEventListener("click", function (e) {
    var b = e.target.closest("[data-prog]");

    if (!b) return;

    setProg(b.getAttribute("data-prog"));
    refreshAll();
  });

  mountBrowser(view.querySelector("#kvManage"), "manage", null);
  renderProg();

  try {
    new MutationObserver(flushApts).observe(view, { attributes: true, attributeFilter: ["style", "hidden", "class"] });
    new MutationObserver(flushApts).observe(home, { attributes: true, subtree: true, attributeFilter: ["style", "hidden", "class"] });
  } catch (e) {}

  view.querySelector("#kvImport").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];

    if (!file) return;

    var reader = new FileReader();

    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);

        if (obj.schema !== "schornstein-planer-kunden" || !Array.isArray(obj.kunden)) {
          throw new Error("Ungültig");
        }

        if (
          !confirm(
            "Die aktuelle Kundenliste (" +
              kunden.length +
              " Kunden) wird durch die Datei (" +
              obj.kunden.length +
              " Kunden) ersetzt. Fortfahren?"
          )
        ) {
          return;
        }

        importData(obj);
      } catch (err) {
        alert("Die Kundendatei konnte nicht eingelesen werden.");
      } finally {
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  });

  /* ============================================================
     SCHNITTSTELLE
     ============================================================ */

  window.SPKunden = {
    setAptProvider: function (fn) { aptFn = typeof fn === "function" ? fn : null; },
    aptsChanged: aptsChanged,
    pick: pick,
    pickMany: pickMany,
    list: function () {
      return kunden.slice().sort(custCmp);
    },
    get: byId,
    addressLine: addressLine,
    streetLine: streetLine,
    cityLine: cityLine,
    exportData: exportData,
    importData: importData,
    nextNumber: nextMainNr,
    nextDexNumber: nextDexNr,
    getProgram: getProg,
    setProgram: function (v) { setProg(v); refreshAll(); },
    nextInsertNumber: nextInsertNr,
    parseNr: parseNr,
    wishText: wishText,
    wishWindows: wishWindows,
    getGps: getGps,
    geocodeAddress: geocodeAddress,
    geocodeText: geocodeText,
    geocodeMissing: geocodeMissing,
    setLocation: setLocation,
    setPhone: setPhone,
    groupMembers: groupMembers,
    groupNames: groupNames,
    hasWa: function () {
      return kunden.some(function (k) {
        return k.waReg;
      });
    }
  };
})();
