/* Schornstein Planer – Kundenverwaltung
 *
 * Gemeinsame Kundenliste für Terminplaner und Luftverbund-Rechner.
 *
 * Kundennummern:  HHHH.ZZZ   (0001.000 bis 9999.999)
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
  function parseNr(s) {
    var t = String(s == null ? "" : s).trim().replace(",", ".").replace(/\s+/g, "");
    var m = /^(\d{1,4})(?:\.(\d{3}))?$/.exec(t);

    if (!m) return null;

    var haus = parseInt(m[1], 10);
    var zus = m[2] ? parseInt(m[2], 10) : 0;

    if (haus < 1 || haus > MAX_HAUS) return null;

    return { haus: haus, zus: zus };
  }

  function fmtNr(p) {
    return p.haus + "." + pad3(p.zus);
  }

  function nrSort(k) {
    var p = parseNr(k.nr);

    return p ? p.haus * 1000 + p.zus : Infinity;
  }

  /* ============================================================
     SPEICHER
     ============================================================ */

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
      ownerAddr: String(k.ownerAddr || ""),
      notes: String(k.notes || ""),
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

      if (!p) return;

      used[p.haus] = true;

      if (p.haus > max) max = p.haus;
    });

    if (max < MAX_HAUS) return fmtNr({ haus: max + 1, zus: 0 });

    for (var h = 1; h <= MAX_HAUS; h++) {
      if (!used[h]) return fmtNr({ haus: h, zus: 0 });
    }

    return null;
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

  function checkNr(input, ownId) {
    var p = parseNr(input);

    if (!p) {
      return {
        error:
          "Bitte eine Kundennummer von 1.000 bis 9999.999 eingeben (drei Stellen nach dem Punkt, z. B. 2.001)."
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

    var hay = [k.name, k.street, k.house, k.city, k.zip, k.phone, k.nr]
      .join(" ")
      .toLowerCase();

    if (hay.indexOf(s.replace(",", ".")) >= 0) return true;

    /* Nummernsuche: "2001" findet 2.001, "20" findet 20.000 */
    var digits = s.replace(/[^\d]/g, "");

    if (digits && /^[\d.,\s]+$/.test(s)) {
      var p = parseNr(k.nr);

      if (p && (p.haus + pad3(p.zus)).indexOf(digits) === 0) return true;
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
    ".kv-search{flex:1;min-width:180px;padding:12px;border:1px solid #d5dbe0;border-radius:10px;font-size:16px;background:#fff;color:var(--text);outline:none}" +
    ".kv-search:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(199,154,66,.13)}" +
    ".kv-crumbs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px}" +
    ".kv-crumb{border:0;background:#edf0f2;border-radius:999px;padding:8px 13px;font-weight:750;font-size:.86rem;color:var(--dark);cursor:pointer}" +
    ".kv-crumb.on{background:var(--dark);color:#fff}" +
    ".kv-sep{color:var(--muted)}" +
    ".kv-list{display:flex;flex-direction:column;gap:8px}" +
    ".kv-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;padding:12px 14px;min-height:54px;border:1px solid var(--border);border-left:4px solid var(--gold);border-radius:12px;background:#fff;color:var(--text);cursor:pointer;font:inherit}" +
    ".kv-row:hover,.kv-row:focus-visible{background:#fffaf0;outline:none}" +
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
    ".kv-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}" +
    ".kv-pickbtn{display:inline-flex;align-items:center;gap:8px}" +
    "@media (max-width:600px){.kv-card{padding:14px}.kv-form{grid-template-columns:1fr}.kv-overlay{padding:0;align-items:stretch}.kv-sheet{max-height:100vh;height:100%;border-radius:0}.kv-actions .btn{flex:1}}";

  document.head.appendChild(css);

  /* ============================================================
     LISTE (Ort -> Straße -> Hausnummer + Name) MIT SUCHE
     ============================================================ */

  var browsers = [];

  /* mode: "manage" (Kundenverwaltung) oder "pick" (Auswahl) */
  function mountBrowser(host, mode, onPick) {
    var st = { q: "", ort: null, str: null };

    host.innerHTML =
      '<div class="kv-bar">' +
      '<input class="kv-search" type="search" placeholder="Suchen: Name oder Kundennummer" ' +
      'autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Kunden suchen">' +
      '<button type="button" class="btn btn-gold" data-kv="new">+ Neuer Kunde</button>' +
      "</div>" +
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
      var order = [];

      list.forEach(function (k) {
        var key = keyFn(k);

        if (!map[key]) {
          map[key] = 0;
          order.push(key);
        }

        map[key]++;
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
            map[key] +
            (map[key] === 1 ? " Kunde" : " Kunden") +
            "</span></button>"
          );
        })
        .join("");
    }

    function houseRow(k) {
      return (
        '<button type="button" class="kv-row" data-kv="cust" data-id="' +
        E(k.id) +
        '"><span class="kv-main"><strong><span class="kv-hn">' +
        E(k.house || "–") +
        "</span>" +
        E(k.name || "(ohne Namen)") +
        "</strong>" +
        (cityLine(k) ? '<span class="kv-sub">' + E(cityLine(k)) + "</span>" : "") +
        '</span><span class="kv-nr">Kd-Nr ' +
        E(k.nr) +
        "</span></button>"
      );
    }

    function searchRow(k) {
      return (
        '<button type="button" class="kv-row" data-kv="cust" data-id="' +
        E(k.id) +
        '"><span class="kv-main"><strong>' +
        E(streetLine(k) || "(ohne Straße)") +
        "</strong> · " +
        E(k.name || "(ohne Namen)") +
        '<span class="kv-sub">' +
        E(cityLine(k) || NO_CITY) +
        '</span></span><span class="kv-nr">Kd-Nr ' +
        E(k.nr) +
        "</span></button>"
      );
    }

    function update() {
      var all = kunden.slice().sort(custCmp);
      var html = "";
      var q = st.q.trim();

      if (!all.length) {
        body.innerHTML =
          '<div class="kv-empty">Noch keine Kunden angelegt.<br>Mit „+ Neuer Kunde“ den ersten Kunden anlegen.</div>';
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
            : '<div class="kv-empty">Kein Kunde gefunden.</div>') +
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

      html += '<div class="kv-foot">' + all.length + (all.length === 1 ? " Kunde" : " Kunden") + " insgesamt</div>";

      body.innerHTML = html;
    }

    input.addEventListener("input", function () {
      st.q = input.value;
      update();
    });

    host.addEventListener("click", function (e) {
      var t = e.target.closest("[data-kv]");

      if (!t || !host.contains(t)) return;

      var a = t.getAttribute("data-kv");

      if (a === "new") {
        openEditor(null, {
          onSaved: function (k) {
            if (mode === "pick" && onPick) onPick(k);
          }
        });
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

        if (mode === "pick") {
          if (onPick) onPick(k);
        } else {
          openEditor(k, {});
        }
      }
    });

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
  }

  /* ============================================================
     KUNDE ANLEGEN / BEARBEITEN
     ============================================================ */

  function openEditor(k, opts) {
    var isNew = !k;
    var ov = document.createElement("div");

    ov.className = "kv-overlay top";

    var insertOptions = kunden
      .slice()
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
      '<input id="kvNr" type="text" inputmode="decimal" autocomplete="off">' +
      '<p class="kv-hint">Format 1.000 bis 9999.999</p></div>' +
      (isNew
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
      '<div class="field wide"><label for="kvOwner">Abweichende Anschrift des Eigentümers (optional)</label>' +
      '<input id="kvOwner" type="text" placeholder="Straße, PLZ Ort" autocomplete="off">' +
      '<p class="kv-hint">Leer lassen, wenn der Eigentümer im Haus wohnt.</p></div>' +
      '<div class="field wide"><label for="kvNotes">Besonderheiten</label>' +
      '<textarea id="kvNotes" rows="3" placeholder="Zugang, Hinweise …"></textarea></div>' +
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

    f("kvNr").value = k ? k.nr : nextMainNr() || "";
    f("kvName").value = k ? k.name : "";
    f("kvStreet").value = k ? k.street : "";
    f("kvHouse").value = k ? k.house : "";
    f("kvZip").value = k ? k.zip : "";
    f("kvCity").value = k ? k.city : "";
    f("kvPhone").value = k ? k.phone : "";
    f("kvOwner").value = k ? k.ownerAddr : "";
    f("kvNotes").value = k ? k.notes : "";

    function close() {
      document.removeEventListener("keydown", onKey, true);
      ov.remove();
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    }

    document.addEventListener("keydown", onKey, true);

    if (isNew) {
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
      var t = e.target.closest("[data-x]");

      if (!t) return;

      var a = t.getAttribute("data-x");

      if (a === "close") {
        close();
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

        var chk = checkNr(f("kvNr").value, k && k.id);

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
          ownerAddr: f("kvOwner").value.trim(),
          notes: f("kvNotes").value.trim(),
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
    '<button type="button" class="btn btn-light" id="kvExport">Kunden sichern</button>' +
    '<label class="btn btn-light" for="kvImport" style="cursor:pointer">Kunden laden</label>' +
    '<input id="kvImport" type="file" accept="application/json,.json" hidden>' +
    "</div></div>" +
    '<div id="kvManage"></div></div>';

  mountBrowser(view.querySelector("#kvManage"), "manage", null);

  view.querySelector("#kvExport").addEventListener("click", function () {
    var d = new Date();
    var stamp =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    shareOrDownload(
      new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" }),
      "kunden-" + stamp + ".json"
    );
  });

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
    pick: pick,
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
    nextInsertNumber: nextInsertNr,
    parseNr: parseNr
  };
})();
