/* Luftverbund-Rechner nach TRGI 2018
Schornstein Planer
Mehrere Luftverbund-Projekte
*/
(function () {
"use strict";
/* =========================================================
BERECHNUNG
========================================================= */
const K = [null,[0.8,1.4,2.2,2.7,3.4,3.7,4.2,4.5,5,5.3,5.6,5.8,6.1,6.2,6.6,6.7,6.9,7,7,7.2,7.4,7.5,7.5,7.7,7.7,7.8,7.8,8,8,8.2,8.2,8.2,8.2,8.3,8.3,8.3,8.5,8.5,8.5,8.5,8.5,8.6,8.6,8.6,8.6,8.6,8.6,8.8,8.8,8.8,8.8,8.8,8.8,8.8,8.8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[0.8,1.4,2.2,3,3.8,4.5,5.1,5.9,6.6,7.4,8,8.6,9.3,9.9,10.6,11.2,11.7,12.3,13,13.6,14.1,14.6,15,15.7,16.2,16.6,17.1,17.6,18.1,18.6,19,19.4,19.8,20.3,20.6,21.1,21.4,21.8,22.2,22.6,22.9,23.2,23.5,23.8,24.2,24.5,24.8,25.1,25.4,25.8,25.9,26.2,26.6,26.9,27,27.4,27.5,27.8,28,28.3,28.5,28.6,29,29.1,29.3,29.6,29.8,29.9,30.1,30.2,30.4,30.6,30.7,30.9,31,31.2,31.4,31.5,31.7,31.8,32,32.2,32.3,32.5,32.6,32.8,33,33.1,33.3,33.4,33.6,33.8,33.9,34.1,34.2,34.4,34.6,34.7,34.9,35],[0.8,1.4,2.2,3,3.8,4.6,5.3,6.1,6.9,7.5,8.3,9.1,9.8,10.6,11.4,12,12.6,13.4,14.1,14.9,15.5,16.2,17,17.6,18.2,18.9,19.5,20,20.8,21.4,22.1,22.7,23.4,23.8,24.5,25.1,25.6,26.2,26.7,27.4,27.8,28.3,29,29.4,29.9,30.4,31,31.5,32,32.5,33,33.3,33.8,34.2,34.7,35.2,35.5,36,36.3,36.8,37.1,37.6,37.9,38.4,38.7,39,39.5,39.8,40.2,40.5,40.8,41.1,41.4,41.8,42.1,42.4,42.7,43,43.4,43.7,44,44.3,44.6,45,45.3,45.6,45.9,46.2,46.6,46.9,47.2,47.5,47.8,48.2,48.5,48.8,49.1,49.4,49.8,50.1]
];
const num = x =>
parseFloat(String(x ?? "").replace(",", ".")) || 0;
const n2 = x => Math.round(x * 100 + 1e-9) / 100;
const r1 = x => Math.round(x * 10 + 1e-9) / 10;
const ART = {
b1: [
"Gasgerät Art B1/B4 (mit Strömungssicherung)",
"kW", 1, "gas"
],
b2: [
"Gasgerät Art B ohne Strömungssicherung (z. B. B22, B23)",
"kW", 1, "gas"
],
oe: [
"Ölfeuerstätte, raumluftabhängig",
"kW", 1, "gas"
],
fs: [
"Feststofffeuerstätte, handbeschickt (Brennstoffdurchsatz bekannt)",
"kg/h", 8, "gas"
],
ko: [
"Kaminofen (nur Nennleistung bekannt)",
"kW", 2.4, "gas"
],
so: [
"Speicher-/Kachelgrundofen (nur Nennleistung bekannt)",
"kW", 9.6, "gas"
],
ok: [
"Offener Kamin / offen betreibbare Feuerstätte",
"m² Feuerraumöffnung", 340, "gas"
],
df: [
"Dekoratives Gasfeuer im offenen Kamin",
"m² Feuerraumöffnung", 225, "gas"
],
dh: [
"Abluft-Dunstabzugshaube",
"m³/h", 1, "abl"
],
wt: [
"Abluft-Wäschetrockner",
"m³/h", 1, "abl"
],
lu: [
"Lüftungs-/Entlüftungsanlage (Abluft)",
"m³/h", 1, "abl"
]
};
function kenn(D) {
const g = D.g;
const m = num(g.n50);
const ein = g.ge === "ein";
const f = ein ? 0.7 : 0.8;

    let n50 = m;
    let ht = 0;
    let err = "";

    if (!m) {
      if (g.luft === "vent") {
        if (g.ab === "1") {
          n50 = 1;
        } else {
          err =
            "Ventilatorgestützte Lüftung in Gebäuden vor 2002: bitte gemessenen n50-Wert eingeben.";
        }
      } else if (g.ab === "1") {
        n50 = 1.5;
      } else if (g.aend === "1") {
        n50 = g.efh === "1" ? 2 : 1.5;
      } else {
        n50 = 3;
      }

      if (n50) {
        ht = {
          1: 1,
          1.5: 3,
          2: 5,
          3: 7
        }[n50] + (n50 < 3 && !ein ? 1 : 0);
      }
    }

    const n =
      n50 === 3 && !m
        ? 0.4
        : n2(
            (n50 === 3 && !m ? 0.7 : f) *
            n50 *
            0.1857
          );

    return {
      n50,
      ht,
      n,
      f: n50 === 3 && !m ? 0.7 : f,
      err,
      tab: ht && g.mod !== "fo"
    };
  }

  const qinf = (kn, v) => {
    if (kn.tab) {
      let k = 0;

      for (let i = 1; i <= 100; i++) {
        if (Math.round(0.8 * i / kn.n) <= v) {
          k = i;
        } else {
          break;
        }
      }

      return r1(0.8 * k);
    }

    return r1(v * kn.n);
  };

  function anr(D, q, c) {
    if (c === 4) return q;

    const a = K[c];
    const x = q / 0.8 + 1e-9;

    if (x >= 100) return a[99];

    const k = Math.floor(x);

    if (D.ip === "1") {
      const lo = k ? a[k - 1] : 0;
      return lo + (a[k] - lo) * (x - k);
    }

    return k ? a[k - 1] : 0;
  }

  function curve(l) {
    if (l.t === "o" || num(l.o) > 0) return 4;

    if (l.d === "3") {
      return l.k === "0" ? 1 : l.k === "1" ? 2 : 3;
    }

    return l.k === "0" ? 2 : 3;
  }

  function bestC(D, R, A) {
    let b = 0;

    const dfs = (cur, vis, first) => {
      for (const l of D.l) {
        if (l.a !== cur && l.b !== cur) continue;

        const nx = l.a === cur ? l.b : l.a;

        if (vis.includes(nx)) continue;

        const c = curve(l);
        if (first && c !== 4) continue;

        const fc = first || c;

        if (nx === A) {
          b = Math.max(b, fc);
        } else {
          dfs(nx, vis.concat(nx), fc);
        }
      }
    };

    dfs(R, [R], 0);
    return b;
  }

  function info(D, r, f, other) {
    const a = ART[f.a];
    if (!a) return null;

    const v = num(f.v);
    let fik = 0;
    let bed = 0;

    if (a[3] === "gas") {
      fik = v * (f.a === "df" && other ? 340 : a[2]);
      bed = fik * 1.6;
    } else {
      bed = v;
    }

    return {
      r,
      f,
      abl: a[3] === "abl",
      fik,
      bed,
      art: f.a
    };
  }

  function run(D) {
    const kn = kenn(D);
    const dv = [];

    D.r.forEach(r => {
      (r.f || []).forEach(f => {
        const i = info(D, r, f, 0);
        if (i) dv.push(i);
      });
    });

    const oth = dv.some(d => !d.abl && d.art !== "df");

    dv.forEach(d => {
      if (d.art === "df" && oth) {
        d.fik = num(d.f.v) * 340;
        d.bed = d.fik * 1.6;
      }
    });

    const abl = dv.filter(d => d.abl && !d.f.s);
    const ablS = abl.reduce((s, d) => s + d.bed, 0);

    const res = [];
    const used = {};

    D.r.forEach(A => {
      const m = dv.filter(d => d.r === A && !d.abl);
      if (!m.length) return;

      const w = [];
      const Bcb = m.reduce((s, d) => s + d.bed, 0);
      const Bed = r1(Bcb + ablS);

      const rows = [];
      let ist = 0;

      D.r.forEach(R => {
        const out =
          num(R.fen) + num(R.tuer) > 0;

        const al =
          num(R.ald) * num(R.qa);

        if (!out && al <= 0) return;

        const qi =
          out
            ? qinf(kn, num(R.v))
            : 0;

        const qs = r1(qi + al);

        const c =
          R === A
            ? 4
            : bestC(D, R.id, A.id);

        const an =
          c
            ? r1(anr(D, qs, c))
            : 0;

        if (c) {
          ist += an;

          if (R !== A) {
            (used[R.id] = used[R.id] || [])
              .push(A.n || "Raum");
          }
        } else {
          w.push(
            (R.n || "Raum") +
            ": keine gültige Verbindung zum Aufstellraum " +
            "(mittelbar nur mit Öffnungen ≥ 150 cm² zwischen " +
            "Verbundräumen und Aufstellraum) – nicht angerechnet."
          );
        }

        rows.push({
          id: R.id,
          n: R.n || "Raum",
          c,
          qi,
          al,
          qs,
          an
        });
      });

      ist = r1(ist);

      if (
        m.some(
          d => d.art === "ok" || d.art === "df"
        )
      ) {
        w.push(
          "Offene Kamine/dekorative Gasfeuer benötigen grundsätzlich " +
          "eine eigene Verbrennungsluftöffnung bzw. -leitung ins Freie " +
          "(TRGI 9.2.2) – über Infiltration/ALD nicht nachweisbar."
        );
      }

      const lim = Bed > 80;

      if (lim) {
        w.push(
          "Bedarf inkl. Abluft über 80 m³/h (≙ 50 kW): " +
          "Nachweis über Infiltration/ALD nicht zulässig, nur Öffnungen " +
          "ins Freie (TRGI 8.3.2.3.2–4, 9.2.3.3)."
        );
      }

      if (ablS > 0) {
        w.push(
          "Abluft-Einrichtungen (" +
          r1(ablS) +
          " m³/h) wurden zum Bedarf addiert " +
          "(TRGI 8.3.2.3.3)."
        );
      }

      const sz2 =
        !(lim ||
          m.some(
            d => d.art === "ok" || d.art === "df"
          )) &&
        ist >= Bed - 1e-9;

      const b1 =
        m.filter(d => d.art === "b1");

      const kw =
        b1.reduce((s, d) => s + d.fik, 0);

      let s1 = null;

      if (kw > 0) {
        let V = num(A.v);
        const nb = [];

        const rlv0 = V / kw;

        if (rlv0 < 1) {
          D.l.forEach(l => {
            if (l.a !== A.id && l.b !== A.id) return;

            if (!(l.t === "o" || num(l.o) >= 2)) return;

            const o =
              D.r.find(
                x =>
                  x.id ===
                  (l.a === A.id ? l.b : l.a)
              );

            if (o && !nb.includes(o)) {
              nb.push(o);
              V += num(o.v);
            }
          });
        }

        s1 = {
          kw,
          V0: num(A.v),
          V,
          rlv0,
          rlv: V / kw,
          nb: nb.map(x => x.n || "Raum"),
          ok: V / kw >= 1 - 1e-9
        };
      }

      res.push({
        A,
        rows,
        Bcb,
        Bed,
        ablS,
        ist,
        sz2,
        s1,
        lim,
        ofen: m.some(
          d => d.art === "ok" || d.art === "df"
        ),
        w
      });
    });

    Object.keys(used).forEach(id => {
      if (used[id].length > 1) {
        res.forEach(x =>
          x.w.push(
            'Raum "' +
            (
              D.r.find(r => r.id == id)?.n ||
              "Raum"
            ) +
            '" wird für mehrere Aufstellräume angerechnet – ' +
            "gemeinsame Betrachtung der Nutzungseinheit prüfen."
          )
        );
      }
    });

    return {
      kn,
      res,
      dv
    };
  }


  /* =========================================================
     LÖSUNGSVORSCHLÄGE
     ========================================================= */

  /* Maßnahmen an einer Tür (Reihenfolge = steigender Aufwand) */
  const MASS = [
    {
      id: "dichtung",
      cost: 1,
      t: "umlaufende Dichtung entfernen",
      ap: l => {
        if (l.d === "0") return false;
        l.d = "0";
        return true;
      }
    },
    {
      id: "k1",
      cost: 2,
      t: "Türblatt um 1,0 cm kürzen",
      ap: l => {
        if (num(l.k) >= 1) return false;
        l.k = "1";
        return true;
      }
    },
    {
      id: "k15",
      cost: 3,
      t: "Türblatt um 1,5 cm kürzen",
      ap: l => {
        if (num(l.k) >= 1.5) return false;
        l.k = "1.5";
        return true;
      }
    },
    {
      id: "o1",
      cost: 4,
      t: "Öffnung 1 × 150 cm² in Tür/Wand",
      ap: l => {
        if (num(l.o) >= 1) return false;
        l.o = "1";
        return true;
      }
    },
    {
      id: "o2",
      cost: 5,
      t: "Öffnung 2 × 150 cm² in Tür/Wand",
      ap: l => {
        if (num(l.o) >= 2) return false;
        l.o = "2";
        return true;
      }
    }
  ];

  const roomName = (D0, id) =>
    D0.r.find(r => r.id === id)?.n || "Raum";

  /* Änderungen (ops) auf ein Projekt anwenden */
  function applyOps(D0, ops) {
    ops.forEach(o => {
      if (o.t === "l") {
        const l = D0.l[o.j];
        if (l) Object.assign(l, o.f);
      } else if (o.t === "a") {
        const r = D0.r.find(x => x.id === o.id);
        if (r) {
          r.ald = String(o.ald);
          r.qa = String(o.qa);
        }
      }
    });
  }

  function suggest(D0, base) {
    const out = {};

    if (base.kn.err) return out;

    const sq = num(D0.sq) || 15;

    const doors = D0.l
      .map((l, j) => [l, j])
      .filter(([l]) => l.t === "t");

    base.res.forEach(x => {
      const blocked = x.lim || x.ofen;
      const need2 = !x.sz2 && !blocked;
      const need1 = !!(x.s1 && !x.s1.ok);

      const S = {
        list: [],
        need1,
        need2,
        blocked: !x.sz2 && blocked
      };

      out[x.A.id] = S;

      if (!need1 && !need2) return;

      const goalOk = y =>
        y &&
        (!need2 || y.sz2) &&
        (!need1 || (y.s1 && y.s1.ok));

      const evaluate = ops => {
        const C = clone(D0);
        applyOps(C, ops);
        const rr = run(C);
        return rr.res.find(z => z.A.id === x.A.id);
      };

      const doorName = ([l]) =>
        roomName(D0, l.a) + " ↔ " + roomName(D0, l.b);

      const doorOp = (dj, m) => {
        const [l, j] = dj;
        const c = Object.assign({}, l);
        if (!m.ap(c)) return null;
        return {
          t: "l",
          j,
          f: { d: c.d, k: c.k, o: c.o },
          txt:
            "Tür " + doorName(dj) + ": " + m.t,
          cost: m.cost
        };
      };

      const aldOps = n => {
        const al = num(x.A.ald);
        const qa = num(x.A.qa) > 0 ? num(x.A.qa) : sq;
        return {
          t: "a",
          id: x.A.id,
          ald: al + n,
          qa,
          txt:
            n +
            " × ALD zusätzlich im Raum „" +
            (x.A.n || "Raum") +
            "“ (je " +
            f1(qa) +
            " m³/h bei 4 Pa)",
          cost: 6 + n
        };
      };

      const cands = [];
      const seen = new Set();

      const add = (title, ops) => {
        const sig = JSON.stringify(
          ops.map(o => [o.t, o.j, o.f, o.id, o.ald])
        );
        if (seen.has(sig)) return;
        const y = evaluate(ops);
        if (!goalOk(y)) return false;
        seen.add(sig);
        cands.push({
          title,
          ops,
          y,
          score: ops.reduce((s, o) => s + o.cost, 0)
        });
        return true;
      };

      /* 1) Eine einzelne Tür */
      doors.forEach(dj => {
        MASS.forEach(m => {
          const op = doorOp(dj, m);
          if (op) add(op.txt, [op]);
        });
      });

      /* 2) Nur ALD im Aufstellraum */
      let aldN = 0;

      for (let n = 1; n <= 10; n++) {
        if (add(aldOps(n).txt, [aldOps(n)])) {
          aldN = n;
          break;
        }
      }

      /* Kombinationen mit ALD nur, wenn sie weniger ALD brauchen */
      const maxN = aldN ? aldN - 1 : 8;

      /* 3) Alle Türen gleichzeitig (ggf. plus ALD) */
      if (doors.length >= 2) {
        MASS.forEach(m => {
          const ops = doors
            .map(dj => doorOp(dj, m))
            .filter(Boolean);

          if (ops.length < 2) return;

          const t =
            "Alle " +
            ops.length +
            " Türen: " +
            m.t;

          if (add(t, ops)) return;

          for (let n = 1; n <= maxN; n++) {
            const all = ops.concat([aldOps(n)]);
            if (add(t + " + " + n + " × ALD", all)) break;
          }
        });
      }

      /* 4) Eine Tür anpassen + ALD (wenn die Tür allein nicht reicht) */
      doors.forEach(dj => {
        const solved = cands.some(
          c =>
            c.ops.length === 1 &&
            c.ops[0].t === "l" &&
            c.ops[0].j === dj[1]
        );

        if (solved) return;

        let best = null;

        MASS.forEach(m => {
          const op = doorOp(dj, m);
          if (!op) return;

          for (let n = 1; n <= maxN; n++) {
            const ops = [op, aldOps(n)];

            if (goalOk(evaluate(ops))) {
              if (
                !best ||
                n < best.n ||
                (n === best.n && m.cost < best.cost)
              ) {
                best = { n, cost: m.cost, ops };
              }
              break;
            }
          }
        });

        if (best) {
          add(
            "Tür " +
              doorName(dj) +
              " anpassen + " +
              best.n +
              " × ALD",
            best.ops
          );
        }
      });

      cands.sort((a, b) => a.score - b.score);
      S.list = cands.slice(0, 5);
    });

    return out;
  }

  /* =========================================================
     UI
     ========================================================= */

  const root =
    document.getElementById("luftverbundView");

  if (!root) return;

  const E = s =>
    String(s ?? "").replace(
      /[&<>"]/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      }[c])
    );

  const svg = d =>
    '<svg class="lv-ic" viewBox="0 0 24 24" width="18" height="18" ' +
    'fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    d +
    "</svg>";

  const IC = {
    save: svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
    open: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>'),
    fire: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    print: svg('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
    warn: svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
    folder: svg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>'),
    building: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>'),
    sliders: svg('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>')
  };

  const KEY =
    "schornsteinplaner_luftverbund_v2";

  const dflt = () => ({
    p: {
      n: "",
      nr: "",
      dt: "",
      ers: "",
      en: "",
      ea: "",
      et: "",
      ga: "",
      gl: ""
    },
    g: {
      ge: "ein",
      efh: "0",
      ab: "1",
      luft: "frei",
      aend: "0",
      n50: "",
      mod: "ht"
    },
    ip: "0",
    sq: "15",
    r: [],
    l: [],
    id: 1
  });

  function newProjectObject(name) {
    const d = dflt();

    d.p.n = name || "";

    return d;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /* =========================================================
     PROJEKTE LADEN
     ========================================================= */

  let projects = [];
  let activeProjectId = null;
  let D = dflt();
  let tab = 0;

  function makeProject(id, project) {
    return {
      id,
      name:
        project?.p?.n ||
        "Neues Luftverbund-Projekt",
      updated:
        Date.now(),
      project
    };
  }

  function loadProjects() {
    try {
      if (
        typeof plan !== "undefined" &&
        plan
      ) {
        if (
          Array.isArray(
            plan.luftverbundProjekte
          )
        ) {
          projects =
            plan.luftverbundProjekte.map(x => ({
              id: x.id,
              name:
                x.name ||
                x.project?.p?.n ||
                "Projekt",
              updated:
                x.updated || Date.now(),
              project:
                Object.assign(
                  dflt(),
                  x.project || {}
                )
            }));
        }

        if (
          plan.luftverbundAktiv != null
        ) {
          activeProjectId =
            plan.luftverbundAktiv;
        }

        /* Alte Einzelprojekt-Version übernehmen */
        if (
          !projects.length &&
          plan.luftverbund
        ) {
          const p =
            Object.assign(
              dflt(),
              plan.luftverbund
            );

          const x =
            makeProject(
              "lv-" + Date.now(),
              p
            );

          projects = [x];
          activeProjectId = x.id;
        }
      }

      if (!projects.length) {
        const raw =
          localStorage.getItem(KEY);

        if (raw) {
          const o = JSON.parse(raw);

          if (
            Array.isArray(o.projects)
          ) {
            projects = o.projects;
            activeProjectId =
              o.activeProjectId || null;
          }
        }
      }
    } catch (e) {
      console.warn(
        "Luftverbund-Projekte konnten nicht geladen werden:",
        e
      );
    }

    if (!projects.length) {
      const p =
        newProjectObject(
          "Neues Projekt"
        );

      const x =
        makeProject(
          "lv-" + Date.now(),
          p
        );

      projects = [x];
      activeProjectId = x.id;
    }

    if (
      !projects.some(
        x => x.id === activeProjectId
      )
    ) {
      activeProjectId =
        projects[0].id;
    }

    const active =
      projects.find(
        x => x.id === activeProjectId
      );

    D =
      active
        ? Object.assign(
            dflt(),
            active.project || {}
          )
        : dflt();
  }

  loadProjects();

  /* =========================================================
     SPEICHERN
     ========================================================= */

  function save() {
    try {
      const active =
        projects.find(
          x => x.id === activeProjectId
        );

      if (active) {
        active.project = D;
        active.name =
          D.p.n ||
          "Neues Projekt";
        active.updated =
          Date.now();
      }

      if (
        typeof plan !== "undefined" &&
        plan
      ) {
        plan.luftverbundProjekte =
          projects;

        plan.luftverbundAktiv =
          activeProjectId;

        /*
         * Rückwärtskompatibilität:
         * Das aktuell geöffnete Projekt
         * weiterhin unter luftverbund speichern.
         */
        plan.luftverbund = D;

        if (
          typeof saveData === "function"
        ) {
          saveData();
        }
      }

      localStorage.setItem(
        KEY,
        JSON.stringify({
          projects,
          activeProjectId
        })
      );
    } catch (e) {
      console.warn(
        "Luftverbund konnte nicht gespeichert werden:",
        e
      );
    }
  }

  /* =========================================================
     HILFSFUNKTIONEN
     ========================================================= */

  const get = k =>
    k
      .split(".")
      .reduce(
        (o, p) => o?.[p],
        D
      ) ?? "";

  const set = (k, v) => {
    const a = k.split(".");
    const l = a.pop();

    a.reduce(
      (o, p) => o[p],
      D
    )[l] = v;
  };

  const inp = (k, l, o = {}) =>
    `<div class="field">
      <label>${l}</label>
      <input
        data-k="${k}"
        value="${E(get(k))}"
        ${o.t ? `type="${o.t}"` : ""}
        ${o.m ? 'inputmode="decimal"' : ""}
      >
    </div>`;

  const sel = (
    k,
    l,
    op,
    re = 1
  ) =>
    `<div class="field">
      <label>${l}</label>
      <select
        data-k="${k}"
        ${re ? "data-re=1" : ""}
      >
        ${op
          .map(
            ([v, t]) =>
              `<option
                value="${v}"
                ${get(k) == v ? "selected" : ""}
              >${t}</option>`
          )
          .join("")}
      </select>
    </div>`;

  const f1 = x =>
    (+x)
      .toFixed(1)
      .replace(".", ",");

  const f2 = x =>
    (+x)
      .toFixed(2)
      .replace(".", ",");

  const KT = {
    1: "Kurve 1",
    2: "Kurve 2",
    3: "Kurve 3",
    4: "Kurve 4"
  };

  function card(
    ic,
    t,
    p,
    body
  ) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <h2>${t}</h2>
            ${p ? `<p>${p}</p>` : ""}
          </div>
          <div class="section-icon">
            ${ic}
          </div>
        </div>
        ${body}
      </div>
    `;
  }

  function infoTxt() {
    const k = kenn(D);

    if (k.err) {
      return `<span class="lv-wn">${k.err}</span>`;
    }

    return `
      n50 = ${f1(k.n50)} h⁻¹
      ${
        num(D.g.n50)
          ? "(gemessen)"
          : "(Auslegungswert, Tab. 9-2" +
            (k.ht
              ? ", Haustyp " + k.ht
              : "") +
            ")"
      }
      · f<sub>wirk.komp.</sub> =
      ${String(k.f).replace(".", ",")}
      · n = ${f2(k.n)} h⁻¹
    `;
  }

  /* =========================================================
     PROJEKTÜBERSICHT
     ========================================================= */

  function projectOverview() {
    return `
      <div class="lv-project-head">
        <div>
          <div class="lv-project-kicker">
            ${IC.folder} LUFTVERBUND
          </div>
          <h1>Projektübersicht</h1>
          <p>
            Mehrere Luftverbund-Berechnungen unabhängig
            voneinander verwalten.
          </p>
        </div>

        <button
          class="btn btn-gold"
          data-a="newproject"
        >
          + Neues Projekt
        </button>
      </div>

      <div class="lv-project-grid">
        ${
          projects.length
            ? projects
                .map(
                  p => `
                    <div
                      class="lv-project-card
                        ${
                          p.id === activeProjectId
                            ? "is-active"
                            : ""
                        }"
                    >
                      <div
                        class="lv-project-icon"
                      >
                        ${IC.folder}
                      </div>

                      <div
                        class="lv-project-main"
                      >
                        <h2>
                          ${E(
                            p.name ||
                              "Unbenanntes Projekt"
                          )}
                        </h2>

                        <p>
                          ${
                            p.project?.p?.nr
                              ? "Nr. " +
                                E(
                                  p.project.p.nr
                                )
                              : "Keine Projektnummer"
                          }
                        </p>

                        <small>
                          ${
                            p.project?.r?.length ||
                            0
                          } Räume ·
                          ${
                            p.project?.r?.reduce(
                              (s, r) =>
                                s +
                                (r.f?.length ||
                                  0),
                              0
                            ) || 0
                          } Feuerstätten /
                          Abluft
                        </small>
                      </div>

                      <div
                        class="lv-project-actions"
                      >
                        <button
                          class="btn btn-primary"
                          data-a="openproject"
                          data-id="${E(p.id)}"
                        >
                          Öffnen
                        </button>

                        <button
                          class="btn btn-light"
                          data-a="duplicateproject"
                          data-id="${E(p.id)}"
                          title="Projekt duplizieren"
                        >
                          ${IC.copy} Duplizieren
                        </button>

                        <button
                                class="btn btn-danger"
                                data-a="deleteproject"
                                data-id="${E(p.id)}"
                                title="Projekt löschen"
                              >
                                ${IC.trash} Löschen
                              </button>
                      </div>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="card">
                <div class="empty">
                  Noch keine Projekte vorhanden.
                </div>
              </div>
            `
        }
      </div>
    `;
  }

  /* =========================================================
     PROJEKTANSICHT
     ========================================================= */

  function projectBar() {
    const p = D.p || {};

    return `
      <div class="lv-project-bar">
        <button
          class="btn btn-light"
          data-a="overview"
        >
          ← Projektübersicht
        </button>

        <div class="lv-current-project">
          <span>Projekt</span>
          <strong>
            ${E(
              p.n ||
                "Neues Projekt"
            )}
          </strong>
          ${
            p.nr
              ? `<small>Nr. ${E(p.nr)}</small>`
              : ""
          }
        </div>

        <button
          class="btn btn-light"
          data-a="duplicate-current"
        >
          ${IC.copy} Duplizieren
        </button>
      </div>
    `;
  }

  function v0() {
    return (
      card(
        IC.folder,
        "Projekt",
        "Name und Nummer des Auftrags",
        `
          <div class="form-grid">
            ${inp("p.n", "Projektname")}
            ${inp("p.nr", "Projektnummer")}
            ${inp("p.dt", "Datum", {
              t: "date"
            })}
            ${inp(
              "p.ers",
              "Ersteller / Betrieb"
            )}
          </div>
        `
      ) +
      card(
        IC.building,
        "Eigentümer und Gebäude",
        "",
        `
          <div class="form-grid">
            ${inp(
              "p.en",
              "Name des Eigentümers"
            )}
            ${inp(
              "p.ea",
              "Anschrift des Eigentümers"
            )}
            ${inp(
              "p.et",
              "Telefon / E-Mail"
            )}
            ${inp(
              "p.ga",
              "Anschrift des Gebäudes"
            )}
            ${inp(
              "p.gl",
              "Lage der Nutzungseinheit (z. B. 2. OG links)"
            )}
          </div>
        `
      ) +
      card(
        IC.save,
        "Datensicherung",
        "„Projekt“ sichert nur dieses Luftverbund-Projekt als Datei.",
        `
          <div
            class="form-actions"
            style="justify-content:flex-start"
          >
            <button
              class="btn btn-light"
              data-a="pe"
            >
              ${IC.save} Projekt als Datei sichern
            </button>

            <label
              class="btn btn-light"
              for="lvImport"
            >
              ${IC.open} Projekt aus Datei laden
            </label>

            <input
              id="lvImport"
              type="file"
              accept=".json,application/json"
              hidden
            >
          </div>
        `
      )
    );
  }

  function v1() {
    const g = D.g;

    return card(
      IC.sliders,
      "Kennwerte der Nutzungseinheit",
      "",
      `
        <div class="form-grid">
          ${sel(
            "g.ge",
            "Geschosse der Nutzungseinheit",
            [
              ["ein", "eingeschossig"],
              ["mehr", "mehrgeschossig"]
            ]
          )}

          ${sel(
            "g.efh",
            "Gebäudeart",
            [
              ["0", "Mehrfamilienhaus"],
              ["1", "Einfamilienhaus"]
            ]
          )}

          ${sel(
            "g.ab",
            "Errichtet",
            [
              ["1", "ab 2002"],
              ["0", "vor 2002"]
            ]
          )}

          ${sel(
            "g.luft",
            "Lüftung",
            [
              [
                "frei",
                "freie Lüftung (Fugen)"
              ],
              [
                "vent",
                "ventilatorgestützt"
              ]
            ]
          )}

          ${
            g.ab === "0" &&
            g.luft === "frei"
              ? sel(
                  "g.aend",
                  "Wesentliche Änderung der Luftdurchlässigkeit (> ⅓ Fenster getauscht, EFH: oder > ⅓ Dach abgedichtet)",
                  [
                    ["0", "nein"],
                    ["1", "ja"]
                  ]
                )
              : ""
          }

          ${inp(
            "g.n50",
            "Gemessener n50-Wert (optional, h⁻¹)",
            { m: 1 }
          )}

          ${sel(
            "g.mod",
            "Berechnung ohne Messwert",
            [
              [
                "ht",
                "Tabelle 9-3 (Haustyp)"
              ],
              [
                "fo",
                "Formel 9-3 bis 9-5"
              ]
            ]
          )}

          ${sel(
            "ip",
            "Tabellenwert",
            [
              [
                "0",
                "nächstkleinerer Wert (Formblatt)"
              ],
              [
                "1",
                "interpoliert"
              ]
            ]
          )}
        </div>

        <p
          class="lv-mu"
          id="lvInfo"
        >
          ${infoTxt()}
        </p>
      `
    );
  }

  function v2() {
    return `
      <div
        class="form-actions"
        style="justify-content:flex-start;margin:0 0 14px"
      >
        <button
          class="btn btn-gold"
          data-a="ar"
        >
          + Raum hinzufügen
        </button>
      </div>

      ${
        D.r.length
          ? D.r
              .map((r, i) => {
                const lk =
                  D.l
                    .map((l, j) => [
                      l,
                      j
                    ])
                    .filter(
                      ([l]) =>
                        l.a === r.id ||
                        l.b === r.id
                    );

                return `
                  <details
                    class="lv-room"
                    data-ri="${i}"
                    ${r.o ? "open" : ""}
                  >
                    <summary>
                      ${E(
                        r.n ||
                          "Raum " +
                            (i + 1)
                      )}
                      ·
                      ${E(
                        r.v || "?"
                      )}
                      m³
                      ${
                        (r.f || [])
                          .some(
                            f =>
                              ART[f.a] &&
                              ART[f.a][3] ===
                                "gas"
                          )
                          ? " · Aufstellraum"
                          : ""
                      }
                    </summary>

                    <div class="lv-body">
                      <div class="form-grid">
                        ${inp(
                          `r.${i}.n`,
                          "Bezeichnung / Nutzung"
                        )}
                        ${inp(
                          `r.${i}.v`,
                          "Raumvolumen (m³)",
                          { m: 1 }
                        )}
                        ${inp(
                          `r.${i}.fen`,
                          "Öffenbare Fenster (Anzahl)",
                          { m: 1 }
                        )}
                        ${inp(
                          `r.${i}.tuer`,
                          "Türen ins Freie (Anzahl)",
                          { m: 1 }
                        )}
                        ${inp(
                          `r.${i}.ald`,
                          "ALD (Anzahl)",
                          { m: 1 }
                        )}
                        ${inp(
                          `r.${i}.qa`,
                          "Luftstrom je ALD bei 4 Pa (m³/h)",
                          { m: 1 }
                        )}
                      </div>

                      <div class="lv-h4">
                        Feuerstätten / Abluft
                      </div>

                      ${
                        (r.f || [])
                          .map(
                            (f, j) => {
                              const a =
                                ART[f.a] ||
                                ART.b1;

                              return `
                                <div class="lv-it">
                                  <div class="form-grid">
                                    ${sel(
                                      `r.${i}.f.${j}.a`,
                                      "Art",
                                      Object.keys(
                                        ART
                                      ).map(
                                        k => [
                                          k,
                                          ART[k][0]
                                        ]
                                      )
                                    )}

                                    ${inp(
                                      `r.${i}.f.${j}.n`,
                                      "Name / Typ"
                                    )}

                                    ${inp(
                                      `r.${i}.f.${j}.v`,
                                      "Wert in " +
                                        a[1],
                                      { m: 1 }
                                    )}
                                  </div>

                                  ${
                                    a[3] ===
                                    "abl"
                                      ? `
                                        <label class="lv-ck">
                                          <input
                                            type="checkbox"
                                            data-k="r.${i}.f.${j}.s"
                                            ${
                                              f.s
                                                ? "checked"
                                                : ""
                                            }
                                          >
                                          gleichzeitiger Betrieb ausgeschlossen
                                          (Sicherheitseinrichtung mit Zulassung)
                                        </label>
                                      `
                                      : ""
                                  }

                                  <button
                                    class="btn btn-danger btn-small"
                                    data-a="df"
                                    data-i="${i}"
                                    data-j="${j}"
                                  >
                                    Entfernen
                                  </button>
                                </div>
                              `;
                            }
                          )
                          .join("")
                      }

                      <button
                        class="btn btn-light"
                        data-a="af"
                        data-i="${i}"
                      >
                        + Feuerstätte / Abluft
                      </button>

                      <div class="lv-h4">
                        Verbindungen zu anderen Räumen
                      </div>

                      ${
                        lk
                          .map(
                            ([l, j]) => {
                              const o =
                                l.a === r.id
                                  ? l.b
                                  : l.a;

                              return `
                                <div class="lv-it">
                                  <div class="form-grid">
                                    <div class="field">
                                      <label>
                                        Verbunden mit
                                      </label>

                                      <select
                                        data-lp="${j}:${r.id}"
                                      >
                                        ${D.r
                                          .filter(
                                            x =>
                                              x.id !==
                                              r.id
                                          )
                                          .map(
                                            x =>
                                              `<option
                                                value="${x.id}"
                                                ${
                                                  x.id ===
                                                  o
                                                    ? "selected"
                                                    : ""
                                                }
                                              >
                                                ${E(
                                                  x.n ||
                                                    "Raum"
                                                )}
                                              </option>`
                                          )
                                          .join("")}
                                      </select>
                                    </div>

                                    ${sel(
                                      `l.${j}.t`,
                                      "Art",
                                      [
                                        [
                                          "t",
                                          "Tür"
                                        ],
                                        [
                                          "o",
                                          "Offener Durchgang (ohne Tür)"
                                        ]
                                      ]
                                    )}

                                    ${
                                      l.t === "t"
                                        ? sel(
                                            `l.${j}.d`,
                                            "Dichtung",
                                            [
                                              [
                                                "3",
                                                "dreiseitig umlaufend"
                                              ],
                                              [
                                                "0",
                                                "ohne umlaufende Dichtung / Überströmdichtung"
                                              ]
                                            ],
                                            0
                                          ) +
                                          sel(
                                            `l.${j}.k`,
                                            "Türblatt",
                                            [
                                              [
                                                "0",
                                                "ungekürzt"
                                              ],
                                              [
                                                "1",
                                                "um 1,0 cm gekürzt"
                                              ],
                                              [
                                                "1.5",
                                                "um 1,5 cm gekürzt"
                                              ]
                                            ],
                                            0
                                          ) +
                                          sel(
                                            `l.${j}.o`,
                                            "Verbrennungsluftöffnung in Tür/Wand",
                                            [
                                              [
                                                "0",
                                                "keine"
                                              ],
                                              [
                                                "1",
                                                "1 × 150 cm²"
                                              ],
                                              [
                                                "2",
                                                "2 × 150 cm² (auch Schutzziel 1)"
                                              ]
                                            ],
                                            0
                                          )
                                        : ""
                                    }
                                  </div>

                                  <button
                                    class="btn btn-danger btn-small"
                                    data-a="dl"
                                    data-i="${j}"
                                  >
                                    Verbindung löschen
                                  </button>
                                </div>
                              `;
                            }
                          )
                          .join("")
                      }

                      ${
                        D.r.length > 1
                          ? `
                            <button
                              class="btn btn-light"
                              data-a="al"
                              data-i="${i}"
                            >
                              + Verbindung
                            </button>
                          `
                          : ""
                      }

                      <div>
                        <button
                          class="btn btn-danger"
                          data-a="dr"
                          data-i="${i}"
                          style="margin-top:12px"
                        >
                          Raum löschen
                        </button>
                      </div>
                    </div>
                  </details>
                `;
              })
              .join("")
          : `
            <div class="card">
              <div class="empty">
                Noch keine Räume vorhanden.
                Klicke auf „+ Raum hinzufügen“.
              </div>
            </div>
          `
      }
    `;
  }

  let undoSnap = null;

  const KS = c => (c ? "K" + c : "–");

  function sugBlock(x, S, print) {
    if (!S || (!S.need1 && !S.need2 && !S.blocked)) {
      return "";
    }

    const goals =
      [S.need2 ? "Schutzziel 2" : "", S.need1 ? "Schutzziel 1" : ""]
        .filter(Boolean)
        .join(" und ");

    let h = `<div class="lv-sgbox">
      <div class="lv-h4">Lösungsvorschläge</div>`;

    if (S.blocked) {
      h += `<div class="lv-wn">${IC.warn}
        Schutzziel 2 lässt sich hier nicht über Türen oder ALD lösen
        (siehe Hinweis oben) – Verbrennungsluftöffnung bzw. -leitung
        ins Freie erforderlich.</div>`;
    }

    if (!S.need1 && !S.need2) return h + "</div>";

    if (!print) {
      h += sel(
        "sq",
        "Luftstrom je ALD für die Vorschläge (m³/h bei 4 Pa), falls im Raum noch keiner hinterlegt ist",
        [10, 15, 20, 25, 30, 40, 60].map(v => [String(v), String(v)])
      );
    } else {
      h += `<p class="lv-mu">ALD-Annahme: ${f1(num(D.sq) || 15)} m³/h je ALD bei 4 Pa</p>`;
    }

    if (!S.list.length) {
      h += `<div class="lv-wn">${IC.warn}
        Mit den geprüften Maßnahmen (Dichtung, Türblatt kürzen,
        Öffnungen in Tür/Wand, bis zu 10 ALD im Aufstellraum) wird
        ${goals} nicht erreicht – Verbrennungsluftöffnung bzw.
        -leitung ins Freie erforderlich.</div>`;
      return h + "</div>";
    }

    h += `<p class="lv-mu">So wird ${goals} erreicht
      (sortiert nach geschätztem Aufwand):</p>`;

    const before = new Map(x.rows.map(r => [r.id, r]));

    S.list.forEach((c, idx) => {
      const y = c.y;
      const diff = y.ist - y.Bed;

      h += `<div class="lv-sg">
        <h3>Variante ${idx + 1}: ${E(c.title)}</h3>
        ${c.ops.length > 1 && c.ops.length < 7
          ? `<ul class="lv-sgl">${c.ops
              .map(o => `<li>${E(o.txt)}</li>`)
              .join("")}</ul>`
          : ""}
        <div class="lv-tw"><table class="lv-t">
          <tr><th>Raum</th><th>Kurve</th><th>anrechenbar (m³/h)</th></tr>
          ${y.rows
            .map(r => {
              const b = before.get(r.id);
              return `<tr>
                <td>${E(r.n)}</td>
                <td>${b ? KS(b.c) : "–"} → ${KS(r.c)}</td>
                <td>${b ? f1(b.an) : "–"} → ${f1(r.an)}</td>
              </tr>`;
            })
            .join("")}
          <tr><th>Σ IST</th><td></td>
            <th>${f1(x.ist)} → ${f1(y.ist)}</th></tr>
        </table></div>
        <p class="lv-sgres">
          Bedarf ${f1(y.Bed)} m³/h ·
          ${diff >= 0 ? "Überschuss" : "Fehlbetrag"}
          ${f1(Math.abs(diff))} m³/h ·
          <b class="ok">Schutzziel 2 ${y.sz2 ? "✓ erfüllt" : "✗"}</b>
          ${y.s1
            ? ` · <b class="ok">Schutzziel 1 ${
                y.s1.ok ? "✓ erfüllt" : "✗"
              }</b> (RLV ${f2(y.s1.rlv)})`
            : ""}
        </p>
        ${print
          ? ""
          : `<button class="btn btn-gold btn-small"
               data-a="sg" data-i="${x.A.id}" data-j="${idx}">
               Übernehmen
             </button>`}
      </div>`;
    });

    return h + "</div>";
  }

  /* =========================================================
     ÜBERNOMMENE LÖSUNGSVORSCHLÄGE
     ========================================================= */

  /* Liste der übernommenen Maßnahmen (alte Speicherform: Objekt je Raum) */
  function appliedList() {
    const a = D.sgApplied;

    if (!a) return [];

    return (Array.isArray(a) ? a : Object.values(a))
      .filter(x => x && (x.title || (x.ops && x.ops.length)))
      .map(x => ({
        room: x.room || "",
        title: x.title || "Übernommene Variante",
        ops: (x.ops || [])
          .map(o => (o && typeof o === "object" ? o.txt : o))
          .filter(Boolean)
      }));
  }

  /* Einzelmaßnahmen nur zeigen, wenn sie die Überschrift ergänzen
     (wie bei den Lösungsvorschlägen) */
  const appliedOps = a =>
    a.ops.length > 1 && a.ops.length < 7 ? a.ops : [];

  function appliedNoteHtml(print) {
    const list = appliedList();

    if (!list.length) return "";

    return `
      <div class="card lv-applied">
        <div class="card-header">
          <div>
            <h2>Erforderliche Maßnahmen</h2>
            <p>
              Das Ergebnis dieser Berechnung wurde mit Lösungsvorschlägen
              erreicht. Die Schutzziele gelten nur, wenn die folgenden
              Maßnahmen umgesetzt werden:
            </p>
          </div>
          <div class="section-icon">${IC.warn}</div>
        </div>

        ${list
          .map(
            (a, i) => `
              <div class="lv-applied-item">
                <div>
                  ${a.room
                    ? `<small>Aufstellraum: ${E(a.room)}</small>`
                    : ""}
                  <strong>${E(a.title)}</strong>
                  ${appliedOps(a).length
                    ? `<ul>${appliedOps(a)
                        .map(o => `<li>${E(o)}</li>`)
                        .join("")}</ul>`
                    : ""}
                </div>
                ${print
                  ? ""
                  : `<button class="btn btn-light btn-small"
                       data-a="sgnote" data-i="${i}"
                       title="Hinweis aus dem Ausdruck entfernen">
                       Entfernen
                     </button>`}
              </div>
            `
          )
          .join("")}

        <p class="lv-mu">
          Planungshilfe – die Maßnahmen sind vor der Ausführung
          fachlich zu prüfen.
        </p>
      </div>
    `;
  }

  function result(print) {
    const R = run(D);
    const SG = suggest(D, R);
    const k = R.kn;
    const P = D.p;

    let h = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2>
              Berechnung der Verbrennungsluftversorgung
            </h2>

            <p>
              ${E(P.n)}
              ${
                P.nr
                  ? " · Nr. " +
                    E(P.nr)
                  : ""
              }
              ${
                P.dt
                  ? " · " +
                    E(P.dt)
                  : ""
              }

              <br>
              Eigentümer:
              ${E(P.en)}
              ${E(P.ea)}

              <br>
              Gebäude:
              ${E(P.ga)}
              ${E(P.gl)}

              <br>
              ${infoTxt()}
            </p>
          </div>

          <div class="section-icon">
            ${IC.fire}
          </div>
        </div>
      </div>
    `;
    /* Hinweis auf übernommene Lösungsvorschläge (Bildschirm, Druck, PDF) */
    h += appliedNoteHtml(print);

    if (!R.res.length) {
      return (
        h +
        `
          <div class="card">
            <div class="empty">
              Noch keine Feuerstätte
              (Gas-/Feststoff-/Ölgerät)
              in einem Raum erfasst.
            </div>
          </div>
        `
      );
    }

    R.res.forEach(x => {
      const s = x.s1;

      h += `
        <div class="card">
          <div class="card-header">
            <div>
              <h2>
                Aufstellraum:
                ${E(x.A.n || "Raum")}
                (${E(x.A.v)} m³)
              </h2>
            </div>
          </div>

          <div class="lv-bd">

            <div
              class="lv-b ${
                s
                  ? s.ok
                    ? "lv-ok"
                    : "lv-no"
                  : "lv-na"
              }"
            >
              Schutzziel 1
              ${
                s
                  ? s.ok
                    ? "✓ erfüllt"
                    : "✗ nicht erfüllt"
                  : "– nicht erforderlich"
              }

              <small>
                ${
                  s
                    ? `
                      RLV ${f2(s.rlv0)}
                      (${E(s.V0)} m³ /
                      ${f1(s.kw)} kW)

                      ${
                        s.nb.length
                          ? `<br>
                             mit 2×150 cm² zu
                             ${E(
                               s.nb.join(", ")
                             )}:
                             ${f2(s.rlv)}
                             (${f1(s.V)} m³)`
                          : ""
                      }

                      <br>
                      gefordert ≥ 1,0 m³/kW
                    `
                    : "nur bei Gasgeräten Art B1/B4"
                }
              </small>
            </div>

            <div
              class="lv-b ${
                k.err
                  ? "lv-na"
                  : x.sz2
                    ? "lv-ok"
                    : "lv-no"
              }"
            >
              Schutzziel 2
              ${
                k.err
                  ? "–"
                  : x.sz2
                    ? "✓ erfüllt"
                    : "✗ nicht erfüllt"
              }

              <small>
                Bedarf
                ${f1(x.Bed)} m³/h
                <br>
                IST (anrechenbar)
                ${f1(x.ist)} m³/h
                <br>
                ${
                  x.ist >= x.Bed
                    ? "Überschuss"
                    : "Fehlbetrag"
                }
                ${f1(
                  Math.abs(
                    x.ist - x.Bed
                  )
                )} m³/h
              </small>
            </div>

          </div>

          <div class="lv-tw">
            <table class="lv-t">
              <tr>
                <th>Raum</th>
                <th>Kurve</th>
                <th>Infiltr.</th>
                <th>ALD</th>
                <th>q<sub>s</sub></th>
                <th>anrechenbar</th>
              </tr>

              ${x.rows
                .map(
                  r => `
                    <tr>
                      <td>${E(r.n)}</td>
                      <td>
                        ${
                          r.c
                            ? KT[r.c]
                            : "–"
                        }
                      </td>
                      <td>${f1(r.qi)}</td>
                      <td>${f1(r.al)}</td>
                      <td>${f1(r.qs)}</td>
                      <td>${f1(r.an)}</td>
                    </tr>
                  `
                )
                .join("")}

              <tr>
                <th>Σ (m³/h)</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <th>${f1(x.ist)}</th>
              </tr>
            </table>
          </div>

          <p class="lv-mu">
            Bedarf =
            Σ Nennleistung × 1,6 m³/(h·kW)
            = ${f1(x.Bcb)} m³/h
            ${
              x.ablS
                ? " + Abluft " +
                  f1(x.ablS) +
                  " m³/h"
                : ""
            }
            =
            ${f1(x.Bed)} m³/h
            (Formel 9-2)
          </p>

          ${x.w
            .map(
              t =>
                `<div class="lv-wn">
                  ${IC.warn} ${E(t)}
                </div>`
            )
            .join("")}

          ${sugBlock(x, SG[x.A.id], print)}
        </div>
      `;
    });

    return (
      h +
      `
        <p class="lv-mu">
          Berechnung nach DVGW-TRGI 2018
          (G 600) Abschnitt 9.2 und Anhang D
          sowie 8.3.2.4.2.1.
          Planungshilfe – ersetzt keine Prüfung
          durch den Fachbetrieb bzw. den
          bevollmächtigten Bezirksschornsteinfeger.
        </p>
      `
    );
  }

  function v3() {
    return (
      result() +
      `
        <div
          class="form-actions"
          style="justify-content:flex-start"
        >
          <button
            class="btn btn-gold"
            data-a="pr"
          >
            ${IC.print} Drucken
          </button>
          ${undoSnap && undoSnap.pid === activeProjectId
            ? `<button class="btn btn-light" data-a="sgundo">
                 ↩ Letzte Übernahme rückgängig
               </button>`
            : ""}
        </div>
      `
    );
  }

  const TABS = [
    "Projekt",
    "Gebäude",
    "Räume",
    "Ergebnis"
  ];

  function render() {
    if (!activeProjectId) {
      root.innerHTML =
        projectOverview();
      return;
    }

    root.innerHTML =
      projectBar() +
      `
        <div class="lv-tabs">
          ${TABS
            .map(
              (t, i) =>
                `<button
                  class="btn ${
                    tab === i
                      ? "btn-primary"
                      : "btn-light"
                  }"
                  data-t="${i}"
                >
                  ${t}
                </button>`
            )
            .join("")}
        </div>
      ` +
      [v0, v1, v2, v3][tab]();
  }

  /* =========================================================
     PROJEKT-AKTIONEN
     ========================================================= */

  function openProject(id) {
    const p =
      projects.find(
        x => x.id === id
      );

    if (!p) return;

    activeProjectId = id;

    D = Object.assign(
      dflt(),
      clone(p.project || {})
    );

    tab = 0;

    save();
    render();
    root.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function newProject() {
    const name =
      prompt(
        "Name des neuen Projekts:",
        "Neues Projekt"
      );

    if (name === null) return;

    const p =
      newProjectObject(
        name.trim() ||
          "Neues Projekt"
      );

    const x =
      makeProject(
        "lv-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2, 7),
        p
      );

    projects.push(x);

    activeProjectId = x.id;
    D = p;
    tab = 0;

    save();
    render();
  }

  function duplicateProject(id, openCopy) {
    const original =
      projects.find(
        x => x.id === id
      );

    if (!original) return;

    const p =
      clone(original.project);

    p.p = p.p || {};

    p.p.n =
      (p.p.n ||
        "Projekt") +
      " – Kopie";

    if (p.p.nr) {
      p.p.nr =
        p.p.nr +
        "-K";
    }

    const x =
      makeProject(
        "lv-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2, 7),
        p
      );

    projects.push(x);

    /* Aus der Projektübersicht heraus bleibt man dort;
       aus einem geöffneten Projekt heraus wird die Kopie geöffnet. */
    if (openCopy) {
      activeProjectId = x.id;
      D = p;
      tab = 0;
    }

    save();
    render();
  }

  function deleteProject(id) {
    const p =
      projects.find(
        x => x.id === id
      );

    if (!p) return;

    if (
      !confirm(
        'Projekt "' +
          (p.name || "Unbenannt") +
          '" wirklich löschen?'
      )
    ) {
      return;
    }

    projects =
      projects.filter(
        x => x.id !== id
      );

    if (!projects.length) {
      const x =
        makeProject(
          "lv-" + Date.now(),
          newProjectObject(
            "Neues Projekt"
          )
        );

      projects = [x];
    }

    if (
      activeProjectId === id
    ) {
      /* zurück zur Projektübersicht */
      activeProjectId = null;

      D =
        Object.assign(
          dflt(),
          clone(
            projects[0].project
          )
        );

      tab = 0;
    }

    save();
    render();
  }

  /* =========================================================
     DATEI
     ========================================================= */

  async function saveFile(
    text,
    name
  ) {
    const f =
      new File(
        [text],
        name,
        {
          type:
            "application/json"
        }
      );

    try {
      if (
        navigator.maxTouchPoints > 0 &&
        navigator.canShare &&
        navigator.canShare({
          files: [f]
        })
      ) {
        await navigator.share({
          files: [f],
          title: name
        });

        return;
      }
    } catch (err) {
      if (
        err &&
        err.name === "AbortError"
      ) {
        return;
      }
    }

    const a =
      document.createElement("a");

    a.href =
      URL.createObjectURL(f);

    a.download = name;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          a.href
        ),
      60000
    );
  }

  function exportProject() {
    const name =
      (
        D.p.nr ||
        D.p.n ||
        "projekt"
      ).replace(
        /[^\w.-]+/g,
        "_"
      );

    saveFile(
      JSON.stringify(
        {
          schema:
            "schornstein-planer-luftverbund",
          version: 2,
          project: D
        },
        null,
        2
      ),
      "luftverbund-" +
        name +
        ".json"
    );
  }

  /* =========================================================
     DRUCKEN
     ========================================================= */

  /* ---------- Hilfsfunktionen für die Ausgabe ---------- */

  function plainDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    return m ? m[3] + "." + m[2] + "." + m[1] : String(s || "");
  }

  function plainInfo() {
    const k = kenn(D);

    if (k.err) return k.err;

    return (
      "n50 = " + f1(k.n50) + " 1/h " +
      (num(D.g.n50)
        ? "(gemessen)"
        : "(Auslegungswert, Tab. 9-2" +
          (k.ht ? ", Haustyp " + k.ht : "") + ")") +
      " · f(wirk.komp.) = " + String(k.f).replace(".", ",") +
      " · n = " + f2(k.n) + " 1/h"
    );
  }

  function fileSafe(s) {
    return String(s || "Projekt")
      .trim()
      .replace(/[^\w.-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Projekt";
  }

  /* ---------- PDF-Ausgabe (Home-Bildschirm-App auf iPhone/iPad) ----------
     In einer Home-Bildschirm-App ist window.print() gesperrt.
     Daher wird ein PDF erzeugt und über das Teilen-Menü geöffnet
     (dort: „Drucken“, „In Dateien sichern“ usw.) – wie beim Terminvorschlag. */

  function buildResultPdf() {
    const W = 595.28,
      H = 841.89,
      ML = 42,
      MT = 46,
      MB = 52,
      CW = W - 2 * ML;

    const cpMap = {
      "€": 0x80, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92,
      "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97
    };

    const tr = {
      "≥": ">=", "≤": "<=", "→": "->", "←": "<-", "✓": "", "✗": "",
      "Σ": "Summe", "≙": "=", "≈": "~", "Δ": "Delta", "−": "-",
      "↔": "<->", "⅓": "1/3", "⁻": "-", "↩": "",
      "\u2009": " ", "\u202f": " ", "\u2007": " ", "\u200b": ""
    };

    /* Text in WinAnsi-taugliche Zeichen umsetzen */
    const nz = str => {
      let o = "";
      for (const ch of String(str ?? "").replace(/⁻¹/g, "^-1")) {
        const c = ch.codePointAt(0);
        if (c < 32) o += " ";
        else if (c < 128 || (c >= 160 && c <= 255)) o += ch;
        else if (cpMap[ch]) o += ch;
        else if (tr[ch] !== undefined) o += tr[ch];
        else {
          const d = ch.normalize("NFKD").replace(/[^\x20-\x7e]/g, "");
          o += d || "?";
        }
      }
      return o;
    };

    const enc = str => {
      let o = "";
      for (const ch of str) {
        o += cpMap[ch] ? String.fromCharCode(cpMap[ch]) : ch;
      }
      return o.replace(/([\\()])/g, "\\$1");
    };

    const cv = document.createElement("canvas").getContext("2d");

    /* Hochzahlen (², ³) werden selbst klein und hochgestellt gezeichnet,
       damit sie in jeder PDF-Anzeige sicher erscheinen. */
    const SUP = { "²": "2", "³": "3", "¹": "1" };
    const SUPK = 0.62;

    const segs = s2 =>
      s2.split(/([²³¹])/).filter(p => p !== "").map(p => (
        SUP[p] ? { t: SUP[p], sup: true } : { t: p, sup: false }
      ));

    const wid = (str, bold, size) => {
      cv.font = (bold ? "bold " : "") + "100px Helvetica, Arial, sans-serif";
      let w = 0;
      segs(nz(str)).forEach(sg => {
        w += cv.measureText(sg.t).width * size / 100 * (sg.sup ? SUPK : 1);
      });
      return w * 1.02;
    };

    const col = hex => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        .map(v => (v / 255).toFixed(3))
        .join(" ");
    };

    const f = v => Number(v).toFixed(2);

    const pages = [];
    let ops = [];
    let y = MT;

    /* Text-Operator (y = Grundlinie von oben gemessen) */
    const tx = (x, yy, str, o = {}) => {
      const size = o.size || 9.5;
      const bold = !!o.bold;
      let px = x;
      if (o.align === "right") px = x - wid(str, bold, size);
      if (o.align === "center") px = x - wid(str, bold, size) / 2;

      const out = [];
      const font = "/" + (bold ? "F2" : "F1");
      const color = col(o.color || "#22272d") + " rg";

      cv.font = (bold ? "bold " : "") + "100px Helvetica, Arial, sans-serif";

      segs(nz(str)).forEach(sg => {
        const sz = sg.sup ? size * SUPK : size;
        const rise = sg.sup ? size * 0.36 : 0;
        out.push(
          "BT " + font + " " + f(sz) + " Tf " + color + " " +
          f(px) + " " + f(H - yy + rise) + " Td (" + enc(sg.t) + ") Tj ET"
        );
        px += cv.measureText(sg.t).width * sz / 100 * 1.02;
      });

      return out.join("\n");
    };

    const txt = (x, yy, str, o) => ops.push(tx(x, yy, str, o));

    const rect = (x, yy, w, h, o = {}) => {
      const fill = o.fill ? col(o.fill) + " rg " : "";
      const stroke = o.stroke
        ? col(o.stroke) + " RG " + (o.lw || 0.8) + " w "
        : "";
      ops.push(
        fill + stroke + f(x) + " " + f(H - yy - h) + " " + f(w) + " " +
        f(h) + " re " +
        (o.fill && o.stroke ? "B" : o.fill ? "f" : "S")
      );
    };

    const line = (x1, y1, x2, y2, color, lw) =>
      ops.push(
        col(color) + " RG " + lw + " w " +
        f(x1) + " " + f(H - y1) + " m " + f(x2) + " " + f(H - y2) + " l S"
      );

    const newPage = () => {
      if (ops.length) pages.push(ops.join("\n"));
      ops = [];
      y = MT;
    };

    const ensure = h => {
      if (y + h > H - MB) newPage();
    };

    const wrap = (str, size, bold, maxW) => {
      const out = [];
      String(str ?? "").split(/\r?\n/).forEach(par => {
        let ln = "";
        par.split(/\s+/).filter(Boolean).forEach(w => {
          const test = ln ? ln + " " + w : w;
          if (!ln || wid(test, bold, size) <= maxW) ln = test;
          else {
            out.push(ln);
            ln = w;
          }
        });
        out.push(ln);
      });
      return out;
    };

    const para = (str, o = {}) => {
      const size = o.size || 9.5;
      const lead = o.lead || size * 1.4;
      const x = o.x ?? ML;
      const w = o.w || CW;
      wrap(str, size, !!o.bold, w).forEach(ln => {
        ensure(lead);
        txt(x, y + size, ln, { size, bold: o.bold, color: o.color });
        y += lead;
      });
      y += o.after ?? 0;
    };

    /* Hinweis-/Warnkasten */
    const callout = (str, o = {}) => {
      const size = 8.8,
        lead = 12,
        pad = 6;
      const lines = wrap(str, size, false, CW - 2 * pad - 4);
      const h = lines.length * lead + 2 * pad - 2;
      ensure(h + 6);
      rect(ML, y, CW, h, {
        fill: o.fill || "#fbf5e7",
        stroke: o.stroke || "#e7d19d",
        lw: 0.7
      });
      lines.forEach((ln, i) =>
        txt(ML + pad + 2, y + pad + size - 1 + i * lead, ln, {
          size,
          color: o.color || "#3a3226"
        })
      );
      y += h + 6;
    };

    /* Tabelle: cols = [{w: Anteil, a: "l"|"r", h: Kopf}] */
    const table = (cols, rows) => {
      const size = 8.6,
        lead = 11.4,
        padX = 5,
        padY = 4;
      const widths = cols.map(c => c.w * CW);

      const drawHead = () => {
        const hh = lead + 2 * padY - 1;
        ensure(hh);
        rect(ML, y, CW, hh, { fill: "#eef0f2" });
        let cx = ML;
        cols.forEach((c, i) => {
          if (c.a === "r") {
            txt(cx + widths[i] - padX, y + padY + size - 1, c.h, {
              size, bold: true, align: "right"
            });
          } else {
            txt(cx + padX, y + padY + size - 1, c.h, { size, bold: true });
          }
          cx += widths[i];
        });
        y += hh;
      };

      drawHead();

      rows.forEach(r => {
        const cells = r.cells.map((c, i) =>
          wrap(c, size, !!r.bold, widths[i] - 2 * padX)
        );
        const n = Math.max(1, ...cells.map(c => c.length));
        const rh = n * lead + 2 * padY - 1;

        if (y + rh > H - MB) {
          newPage();
          drawHead();
        }

        if (r.fill) rect(ML, y, CW, rh, { fill: r.fill });

        let cx = ML;
        cells.forEach((lines, i) => {
          lines.forEach((ln, k2) => {
            const yy = y + padY + size - 1 + k2 * lead;
            if (cols[i].a === "r") {
              txt(cx + widths[i] - padX, yy, ln, {
                size, bold: r.bold, align: "right"
              });
            } else {
              txt(cx + padX, yy, ln, { size, bold: r.bold });
            }
          });
          cx += widths[i];
        });

        y += rh;
        line(ML, y, ML + CW, y, "#d5d9dd", 0.5);
      });

      y += 6;
    };

    const tone = st =>
      st === "ok"
        ? { fill: "#e7f4ec", stroke: "#3f8f5b", text: "#2e6f45" }
        : st === "no"
          ? { fill: "#fdecec", stroke: "#c84d4d", text: "#a73737" }
          : { fill: "#f4f5f6", stroke: "#c9ced2", text: "#6c757d" };

    /* Zwei Schutzziel-Kästen nebeneinander */
    const goalBoxes = (a, b) => {
      const gap = 10,
        w = (CW - gap) / 2,
        pad = 8,
        size = 8.6,
        lead = 11.6;

      const prep = g => {
        const lines = [];
        g.lines.forEach(l => wrap(l, size, false, w - 2 * pad - 4).forEach(x => lines.push(x)));
        const tl = wrap(g.title, 10.5, true, w - 2 * pad - 4);
        return { g, lines, tl, h: pad * 2 + tl.length * 13 + 3 + lines.length * lead };
      };

      const A = prep(a),
        B = prep(b);
      const h = Math.max(A.h, B.h);

      ensure(h + 8);

      [A, B].forEach((p, i) => {
        const x = ML + i * (w + gap);
        const t = tone(p.g.st);
        rect(x, y, w, h, { fill: t.fill, stroke: t.stroke, lw: 0.8 });
        rect(x, y, 4, h, { fill: t.stroke });
        let yy = y + pad + 9;
        p.tl.forEach(l => {
          txt(x + pad + 3, yy, l, { size: 10.5, bold: true, color: t.text });
          yy += 13;
        });
        yy += 1;
        p.lines.forEach(l => {
          txt(x + pad + 3, yy, l, { size, color: "#333333" });
          yy += lead;
        });
      });

      y += h + 8;
    };

    /* ================= Inhalt ================= */

    const RES = run(D);
    const SG = suggest(D, RES);
    const k = RES.kn;
    const P = D.p;

    txt(ML, y + 15, "Luftverbund – Verbrennungsluftversorgung", {
      size: 15,
      bold: true
    });
    y += 21;
    txt(ML, y + 9, "Berechnung der Verbrennungsluftversorgung nach DVGW-TRGI 2018 (G 600)", {
      size: 8.6,
      color: "#6c757d"
    });
    y += 15;
    line(ML, y, ML + CW, y, "#c79a42", 1.4);
    y += 10;

    const kv = (label, value) => {
      if (!value) return;
      const lw = 78;
      const lines = wrap(value, 9.2, false, CW - lw);
      ensure(lines.length * 13);
      txt(ML, y + 9.2, label, { size: 9.2, bold: true, color: "#6c757d" });
      lines.forEach((ln, i) => {
        txt(ML + lw, y + 9.2 + i * 13, ln, { size: 9.2 });
      });
      y += lines.length * 13;
    };

    kv(
      "Projekt",
      [P.n, P.nr ? "Nr. " + P.nr : "", P.dt ? plainDate(P.dt) : ""]
        .filter(Boolean)
        .join(" · ") || "Neues Projekt"
    );
    kv("Ersteller", P.ers);
    kv("Eigentümer", [P.en, P.ea].filter(Boolean).join(", "));
    kv("Gebäude", [P.ga, P.gl].filter(Boolean).join(", "));
    kv("Kennwerte", plainInfo());
    y += 8;

    /* Hinweis auf übernommene Lösungsvorschläge */
    const appliedPdf = appliedList();

    if (appliedPdf.length) {
      const bar = (str, o = {}) => {
        const size = o.size || 9,
          lead = o.lead || size * 1.45;
        wrap(str, size, !!o.bold, CW - 20 - (o.ind || 0)).forEach(ln => {
          ensure(lead);
          rect(ML, y, CW, lead, { fill: "#fbf5e7" });
          rect(ML, y, 4, lead, { fill: "#c79a42" });
          txt(ML + 12 + (o.ind || 0), y + size + (lead - size) / 2 - 1.5, ln, {
            size,
            bold: o.bold,
            color: o.color || "#3a3226"
          });
          y += lead;
        });
      };

      ensure(80);
      bar("ERFORDERLICHE MASSNAHMEN", {
        size: 10.5,
        bold: true,
        lead: 20,
        color: "#7d5b20"
      });
      bar(
        "Das Ergebnis dieser Berechnung wurde mit Lösungsvorschlägen erreicht. Die Schutzziele gelten nur, wenn die folgenden Maßnahmen umgesetzt werden:",
        { size: 8.8 }
      );
      bar(" ", { size: 4, lead: 5 });

      appliedPdf.forEach((a, i) => {
        if (a.room) bar("Aufstellraum: " + a.room, { size: 8.2, color: "#6c757d" });
        bar((i + 1) + ".  " + a.title, { size: 9.4, bold: true });
        appliedOps(a).forEach(o => bar("•  " + o, { size: 8.8, ind: 12 }));
        bar(" ", { size: 4, lead: 6 });
      });

      bar("Planungshilfe – die Maßnahmen sind vor der Ausführung fachlich zu prüfen.", {
        size: 8,
        color: "#7d5b20"
      });
      y += 12;
    }

    if (!RES.res.length) {
      callout(
        "Noch keine Feuerstätte (Gas-/Feststoff-/Ölgerät) in einem Raum erfasst."
      );
    }

    RES.res.forEach(x => {
      const s = x.s1;

      ensure(120);

      rect(ML, y, CW, 21, { fill: "#22272d" });
      txt(
        ML + 10,
        y + 14.5,
        "Aufstellraum: " + (x.A.n || "Raum") + " (" + x.A.v + " m³)",
        { size: 10.5, bold: true, color: "#ffffff" }
      );
      y += 21 + 8;

      const g1 = {
        st: s ? (s.ok ? "ok" : "no") : "na",
        title:
          "Schutzziel 1 " +
          (s ? (s.ok ? "– erfüllt" : "– nicht erfüllt") : "– nicht erforderlich"),
        lines: s
          ? [
              "RLV " + f2(s.rlv0) + " (" + s.V0 + " m³ / " + f1(s.kw) + " kW)"
            ]
              .concat(
                s.nb.length
                  ? [
                      "mit 2×150 cm² zu " + s.nb.join(", ") + ": " +
                        f2(s.rlv) + " (" + f1(s.V) + " m³)"
                    ]
                  : []
              )
              .concat(["gefordert ≥ 1,0 m³/kW"])
          : ["nur bei Gasgeräten Art B1/B4"]
      };

      const g2 = {
        st: k.err ? "na" : x.sz2 ? "ok" : "no",
        title:
          "Schutzziel 2 " +
          (k.err ? "–" : x.sz2 ? "– erfüllt" : "– nicht erfüllt"),
        lines: [
          "Bedarf " + f1(x.Bed) + " m³/h",
          "IST (anrechenbar) " + f1(x.ist) + " m³/h",
          (x.ist >= x.Bed ? "Überschuss " : "Fehlbetrag ") +
            f1(Math.abs(x.ist - x.Bed)) + " m³/h"
        ]
      };

      goalBoxes(g1, g2);

      table(
        [
          { w: 0.31, a: "l", h: "Raum" },
          { w: 0.13, a: "l", h: "Kurve" },
          { w: 0.14, a: "r", h: "Infiltr." },
          { w: 0.12, a: "r", h: "ALD" },
          { w: 0.12, a: "r", h: "qs" },
          { w: 0.18, a: "r", h: "anrechenbar" }
        ],
        x.rows
          .map(r => ({
            cells: [
              r.n,
              r.c ? KT[r.c] : "–",
              f1(r.qi),
              f1(r.al),
              f1(r.qs),
              f1(r.an)
            ]
          }))
          .concat([
            {
              bold: true,
              fill: "#f4f5f6",
              cells: ["Summe (m³/h)", "", "", "", "", f1(x.ist)]
            }
          ])
      );

      para(
        "Bedarf = Summe Nennleistung × 1,6 m³/(h·kW) = " + f1(x.Bcb) +
          " m³/h" +
          (x.ablS ? " + Abluft " + f1(x.ablS) + " m³/h" : "") +
          " = " + f1(x.Bed) + " m³/h (Formel 9-2)",
        { size: 8.4, color: "#6c757d", after: 4 }
      );

      x.w.forEach(t => callout("Hinweis: " + t));

      /* Lösungsvorschläge */
      const S = SG[x.A.id];

      if (S && (S.need1 || S.need2 || S.blocked)) {
        const goals = [
          S.need2 ? "Schutzziel 2" : "",
          S.need1 ? "Schutzziel 1" : ""
        ]
          .filter(Boolean)
          .join(" und ");

        ensure(60);
        y += 4;
        para("LÖSUNGSVORSCHLÄGE", {
          size: 8.4,
          bold: true,
          color: "#6c757d",
          after: 3
        });

        if (S.blocked) {
          callout(
            "Schutzziel 2 lässt sich hier nicht über Türen oder ALD lösen (siehe Hinweis oben) – Verbrennungsluftöffnung bzw. -leitung ins Freie erforderlich."
          );
        }

        if (S.need1 || S.need2) {
          para("ALD-Annahme: " + f1(num(D.sq) || 15) + " m³/h je ALD bei 4 Pa", {
            size: 8.4,
            color: "#6c757d",
            after: 3
          });

          if (!S.list.length) {
            callout(
              "Mit den geprüften Maßnahmen (Dichtung, Türblatt kürzen, Öffnungen in Tür/Wand, bis zu 10 ALD im Aufstellraum) wird " +
                goals +
                " nicht erreicht – Verbrennungsluftöffnung bzw. -leitung ins Freie erforderlich."
            );
          } else {
            para(
              "So wird " + goals + " erreicht (sortiert nach geschätztem Aufwand):",
              { size: 8.8, color: "#555555", after: 4 }
            );

            const before = new Map(x.rows.map(r => [r.id, r]));

            S.list.forEach((c, idx) => {
              const yv = c.y;
              const diff = yv.ist - yv.Bed;

              ensure(70);

              para("Variante " + (idx + 1) + ": " + c.title, {
                size: 10,
                bold: true,
                after: 2
              });

              if (c.ops.length > 1 && c.ops.length < 7) {
                c.ops.forEach(o =>
                  para("•  " + o.txt, { size: 8.8, x: ML + 6, w: CW - 6 })
                );
                y += 2;
              }

              table(
                [
                  { w: 0.44, a: "l", h: "Raum" },
                  { w: 0.24, a: "r", h: "Kurve" },
                  { w: 0.32, a: "r", h: "anrechenbar (m³/h)" }
                ],
                yv.rows
                  .map(r => {
                    const b = before.get(r.id);
                    return {
                      cells: [
                        r.n,
                        (b ? KS(b.c) : "–") + " → " + KS(r.c),
                        (b ? f1(b.an) : "–") + " → " + f1(r.an)
                      ]
                    };
                  })
                  .concat([
                    {
                      bold: true,
                      fill: "#f4f5f6",
                      cells: ["Summe IST", "", f1(x.ist) + " → " + f1(yv.ist)]
                    }
                  ])
              );

              para(
                "Bedarf " + f1(yv.Bed) + " m³/h · " +
                  (diff >= 0 ? "Überschuss " : "Fehlbetrag ") +
                  f1(Math.abs(diff)) + " m³/h · Schutzziel 2 " +
                  (yv.sz2 ? "erfüllt" : "nicht erfüllt") +
                  (yv.s1
                    ? " · Schutzziel 1 " +
                      (yv.s1.ok ? "erfüllt" : "nicht erfüllt") +
                      " (RLV " + f2(yv.s1.rlv) + ")"
                    : ""),
                { size: 8.8, bold: true, color: yv.sz2 ? "#2e6f45" : "#a73737", after: 8 }
              );
            });
          }
        }
      }

      y += 12;
    });

    para(
      "Berechnung nach DVGW-TRGI 2018 (G 600) Abschnitt 9.2 und Anhang D sowie 8.3.2.4.2.1. Planungshilfe – ersetzt keine Prüfung durch den Fachbetrieb bzw. den bevollmächtigten Bezirksschornsteinfeger.",
      { size: 8.2, color: "#6c757d" }
    );

    if (ops.length) pages.push(ops.join("\n"));

    /* Fußzeile mit Seitenzahl */
    const total = pages.length;
    const foot = P.n || "Neues Projekt";

    const streams = pages.map((p, i) =>
      p + "\n" +
      [
        col("#c9ced2") + " RG 0.5 w " +
          f(ML) + " " + f(H - (H - 38)) + " m " + f(ML + CW) + " " + f(H - (H - 38)) + " l S",
        tx(ML, H - 26, "Luftverbund-Berechnung · " + foot, {
          size: 7.8,
          color: "#6c757d"
        }),
        tx(ML + CW, H - 26, "Seite " + (i + 1) + " / " + total, {
          size: 7.8,
          color: "#6c757d",
          align: "right"
        })
      ].join("\n")
    );

    const objs = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [" +
        streams.map((_, i) => 5 + 2 * i + " 0 R").join(" ") +
        "] /Count " + streams.length + " >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    ];

    streams.forEach((st, i) => {
      objs.push(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H +
          "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " +
          (6 + 2 * i) + " 0 R >>"
      );
      objs.push("<< /Length " + st.length + " >>\nstream\n" + st + "\nendstream");
    });

    let pdf = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
    const offs = [];

    objs.forEach((o, i) => {
      offs.push(pdf.length);
      pdf += i + 1 + " 0 obj\n" + o + "\nendobj\n";
    });

    const xr = pdf.length;

    pdf +=
      "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" +
      offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") +
      "trailer\n<< /Size " + (objs.length + 1) +
      " /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF";

    const bytes = new Uint8Array(pdf.length);

    for (let i = 0; i < pdf.length; i++) {
      bytes[i] = pdf.charCodeAt(i) & 255;
    }

    return new Blob([bytes], { type: "application/pdf" });
  }

  async function sharePdf(blob, name) {
    try {
      const file = new File([blob], name, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- Druck im Browser ---------- */

  let lvPrintGuard = null;

  function lvCleanupPrint() {
    if (lvPrintGuard) {
      document.removeEventListener("pointerdown", lvPrintGuard, true);
      document.removeEventListener("keydown", lvPrintGuard, true);
      lvPrintGuard = null;
    }

    document.body.classList.remove("lv-printing");

    const r = document.getElementById("lvPrintRoot");
    if (r) r.remove();

    const s = document.getElementById("lvPrintStyle");
    if (s) s.remove();
  }

  function doPrint() {
    save();

    /* Home-Bildschirm-App (iPhone/iPad): window.print() ist gesperrt
       -> PDF erzeugen und über das Teilen-Menü drucken/sichern */
    if (window.navigator.standalone === true) {
      try {
        sharePdf(
          buildResultPdf(),
          "Luftverbund_" + fileSafe(D.p && D.p.n) + ".pdf"
        );
      } catch (err) {
        console.error("PDF konnte nicht erstellt werden:", err);
        alert("Das PDF konnte nicht erstellt werden.");
      }
      return;
    }

    lvCleanupPrint();

    const style = document.createElement("style");
    style.id = "lvPrintStyle";

    style.textContent = `
      @page { size: A4 portrait; margin: 12mm; }
      #lvPrintRoot { display: none; }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        body.lv-printing > *:not(#lvPrintRoot) { display: none !important; }
        #lvPrintRoot {
          display: block !important;
          position: static !important;
          width: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
        }
        #lvPrintRoot, #lvPrintRoot * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        #lvPrintRoot .form-actions,
        #lvPrintRoot .lv-project-bar,
        #lvPrintRoot .lv-tabs { display: none !important; }
        #lvPrintRoot .card {
          box-shadow: none !important;
          border: 1px solid #999 !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        #lvPrintRoot .lv-tw { overflow: visible !important; }
        #lvPrintRoot tr { break-inside: avoid; page-break-inside: avoid; }
        #lvPrintRoot h1, #lvPrintRoot h2, #lvPrintRoot h3,
        #lvPrintRoot h4, #lvPrintRoot p { break-after: avoid; }
      }
    `;

    const r = document.createElement("div");
    r.id = "lvPrintRoot";
    r.innerHTML = result(true);

    document.head.appendChild(style);
    document.body.appendChild(r);
    document.body.classList.add("lv-printing");

    /* Die Druckansicht bleibt bestehen, bis die Seite wieder bedient wird
       (manche Browser melden „afterprint“ schon bei geöffnetem Dialog). */
    setTimeout(() => {
      if (!document.getElementById("lvPrintRoot")) return;
      lvPrintGuard = () => lvCleanupPrint();
      document.addEventListener("pointerdown", lvPrintGuard, true);
      document.addEventListener("keydown", lvPrintGuard, true);
    }, 1500);

    setTimeout(() => window.print(), 120);
  }

  /* =========================================================
     INPUTS
     ========================================================= */

  root.addEventListener(
    "input",
    e => {
      const el = e.target;

      if (el.dataset.lp) {
        const [
          j,
          id
        ] =
          el.dataset.lp.split(
            ":"
          );

        const l = D.l[j];

        if (!l) return;

        if (l.a == id) {
          l.b = +el.value;
        } else {
          l.a = +el.value;
        }

        save();
        return;
      }

      if (!el.dataset.k) return;

      set(
        el.dataset.k,
        el.type === "checkbox"
          ? el.checked
          : el.value
      );

      save();

      /*
       * Nur Berechnungsinfo aktualisieren,
       * wenn kein kompletter Neuaufbau nötig ist.
       */
      if (
        el.dataset.re
      ) {
        render();
      } else {
        const i =
          document.getElementById(
            "lvInfo"
          );

        if (i) {
          i.innerHTML =
            infoTxt();
        }
      }
    }
  );

  root.addEventListener(
    "toggle",
    e => {
      const i =
        e.target.dataset &&
        e.target.dataset.ri;

      if (
        i != null &&
        D.r[i]
      ) {
        D.r[i].o =
          e.target.open;

        save();
      }
    },
    true
  );

  root.addEventListener(
    "change",
    e => {
      if (
        e.target.id !==
        "lvImport"
      ) {
        return;
      }

      const f =
        e.target.files &&
        e.target.files[0];

      if (!f) return;

      const rd =
        new FileReader();

      rd.onload = () => {
        try {
          const o =
            JSON.parse(
              rd.result
            );

          if (
            o.schema !==
              "schornstein-planer-luftverbund" ||
            !o.project
          ) {
            throw new Error(
              "Ungültige Datei"
            );
          }

          if (
            !confirm(
              "Das aktuelle Luftverbund-Projekt " +
              "wird durch die Datei ersetzt. " +
              "Fortfahren?"
            )
          ) {
            return;
          }

          D =
            Object.assign(
              dflt(),
              o.project
            );

          const active =
            projects.find(
              x =>
                x.id ===
                activeProjectId
            );

          if (active) {
            active.project = D;
            active.name =
              D.p.n ||
              "Neues Projekt";
          }

          save();
          tab = 0;
          render();
        } catch (x) {
          alert(
            "Die Projektdatei konnte nicht gelesen werden."
          );
        } finally {
          e.target.value = "";
        }
      };

      rd.readAsText(f);
    }
  );

  /* =========================================================
     CLICK
     ========================================================= */

  root.addEventListener(
    "click",
    e => {
      const t =
        e.target.closest(
          "[data-t],[data-a]"
        );

      if (!t) return;

      if (
        t.dataset.t != null
      ) {
        tab =
          +t.dataset.t;

        render();

        root.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        return;
      }

      const a =
        t.dataset.a;

      const i =
        +t.dataset.i;

      const j =
        +t.dataset.j;

      const id =
        t.dataset.id;

      if (
        a === "overview"
      ) {
        save();

        activeProjectId =
          null;

        render();

        return;
      }

      if (
        a === "newproject"
      ) {
        newProject();
        return;
      }

      if (
        a === "openproject"
      ) {
        openProject(id);
        return;
      }

      if (
        a === "duplicateproject"
      ) {
        duplicateProject(id);
        return;
      }

      if (
        a ===
        "duplicate-current"
      ) {
        duplicateProject(
          activeProjectId,
          true
        );
        return;
      }

      if (
        a === "deleteproject"
      ) {
        deleteProject(id);
        return;
      }

      if (a === "sg") {
        const roomId = +t.dataset.i;

        const S = suggest(D, run(D))[roomId];
        const c = S && S.list[j];

        if (!c) return;

        undoSnap = {
          pid: activeProjectId,
          snap: clone(D)
        };

        /* Übernommene Maßnahme merken – erscheint im Ausdruck/PDF,
           damit der Kunde sieht, was umzusetzen ist. */
        const list = appliedList();
        const room =
          (D.r.find(r => r.id == roomId) || {}).n || "";

        list.push({
          room,
          title: c.title,
          ops: c.ops.map(o => o.txt)
        });

        D.sgApplied = list;

        applyOps(D, c.ops);

        save();
        render();
        return;
      }

      if (a === "sgnote") {
        const list = appliedList();

        list.splice(i, 1);
        D.sgApplied = list;

        save();
        render();
        return;
      }

      if (a === "sgundo") {
        if (!undoSnap || undoSnap.pid !== activeProjectId) return;

        D = Object.assign(dflt(), undoSnap.snap);
        undoSnap = null;
        save();
        render();
        return;
      }

      if (a === "pe") {
        exportProject();
        return;
      }

      if (a === "pr") {
        doPrint();
        return;
      }

      if (a === "gb") {
        const b =
          document.getElementById(
            "spBackupData"
          );

        if (b) {
          b.click();
        } else {
          alert(
            "Die Gesamtsicherung steht im Bereich „Planung & Termine“."
          );
        }

        return;
      }

      if (a === "ar") {
        D.r.forEach(
          r => {
            r.o = false;
          }
        );

        D.r.push({
          id: D.id++,
          n: "",
          v: "",
          fen: "",
          tuer: "",
          ald: "",
          qa: "",
          f: [],
          o: true
        });

        save();
        render();
        return;
      }

      if (a === "dr") {
        if (!D.r[i]) return;

        const id =
          D.r[i].id;

        D.r.splice(i, 1);

        D.l =
          D.l.filter(
            l =>
              l.a !== id &&
              l.b !== id
          );

        save();
        render();
        return;
      }

      if (a === "af") {
        if (!D.r[i]) return;

        D.r[i].f.push({
          a: "b1",
          n: "",
          v: ""
        });

        save();
        render();
        return;
      }

      if (a === "df") {
        if (!D.r[i]) return;

        D.r[i].f.splice(
          j,
          1
        );

        save();
        render();
        return;
      }

      if (a === "al") {
        const me =
          D.r[i]?.id;

        if (me == null) return;

        const o =
          D.r.find(
            x =>
              x.id !== me &&
              !D.l.some(
                l =>
                  (l.a === me &&
                    l.b === x.id) ||
                  (l.b === me &&
                    l.a === x.id)
              )
          ) ||
          D.r.find(
            x => x.id !== me
          );

        if (!o) return;

        D.l.push({
          a: me,
          b: o.id,
          t: "t",
          d: "3",
          k: "0",
          o: "0"
        });

        save();
        render();
        return;
      }

      if (a === "dl") {
        D.l.splice(
          i,
          1
        );

        save();
        render();
}
}
);
/* =========================================================
CSS
========================================================= */
const css =
document.createElement(
"style"
);
css.textContent = `
#luftverbundView {
scroll-margin-top: 140px;
}
.lv-project-head {
display: flex;
align-items: center;
justify-content: space-between;
gap: 20px;
margin-bottom: 20px;
padding: 20px;
border-radius: 16px;
background: var(--card);
border: 1px solid var(--border);
}

    .lv-project-head h1 {
      margin: 2px 0 4px;
      font-size: 1.55rem;
    }

    .lv-project-head p {
      margin: 0;
      color: var(--muted);
    }

    .lv-project-kicker {
      color: var(--gold);
      font-size: .75rem;
      font-weight: 800;
      letter-spacing: .08em;
    }

    .lv-project-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(290px, 1fr));
      gap: 14px;
    }

    .lv-project-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      align-items: start;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--card);
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
    }

    .lv-project-card.is-active {
      border-color: var(--gold);
      box-shadow:
        0 0 0 2px rgba(199,154,66,.14);
    }

    .lv-project-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: var(--gold-light);
      font-size: 1.35rem;
    }

    .lv-project-main h2 {
      margin: 0 0 4px;
      font-size: 1.05rem;
    }

.lv-project-main p {
margin: 0 0 5px;
color: var(--muted);
font-size: .86rem;
}
.lv-project-main small {
color: var(--muted);
font-size: .78rem;
}
.lv-project-actions {
grid-column: 1 / -1;
display: flex;
flex-wrap: wrap;
gap: 7px;
padding-top: 8px;
border-top: 1px solid var(--border);
}
.lv-project-bar {
display: flex;
align-items: center;
gap: 12px;
flex-wrap: wrap;
margin-bottom: 14px;
}
.lv-current-project {
flex: 1;
min-width: 180px;
padding: 8px 12px;
border-left: 3px solid var(--gold);
}
.lv-current-project span {
display: block;
color: var(--muted);
font-size: .72rem;
text-transform: uppercase;
letter-spacing: .05em;
}
.lv-current-project strong {
display: inline-block;
font-size: 1rem;
}
.lv-current-project small {
color: var(--muted);
margin-left: 8px;
}
.lv-tabs {
display: flex;
gap: 6px;
flex-wrap: wrap;
margin-bottom: 16px;
    }

    .lv-bd {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(230px, 1fr));
      gap: 12px;
      margin: 0 0 14px;
    }

    .lv-b {
      padding: 15px;
      border-radius: 13px;
      border: 1px solid;
      border-left-width: 6px;
      font-weight: 800;
      font-size: 1.05rem;
    }

    .lv-b small {
      display: block;
      margin-top: 6px;
      font-weight: 500;
      font-size: .84rem;
      color: var(--text);
    }

    .lv-ok {
      background: var(--green-light);
border-color: var(--green);
color: var(--green);
}
.lv-no {
background: var(--red-light);
border-color: var(--red);
color: var(--red);
}
.lv-na {
background: #f7f8f9;
border-color: var(--border);
color: var(--muted);
}
.lv-room {
background: var(--card);
border: 1px solid var(--border);
border-radius: 13px;
margin-bottom: 12px;
overflow: hidden;
}
.lv-room > summary {
padding: 13px 16px;
background: #f7f8f9;
font-weight: 800;
cursor: pointer;
}
.lv-body {
padding: 16px;
}
.lv-it {
border-top: 1px dashed var(--border);
padding-top: 12px;
margin-top: 12px;
}
.lv-h4 {
margin: 16px 0 4px;
font-size: .78rem;
font-weight: 800;
color: var(--muted);
text-transform: uppercase;
letter-spacing: .05em;
}
.lv-ck {
display: flex;
gap: 8px;
align-items: center;
font-size: .86rem;
margin: 8px 0;
}
.lv-tw {
overflow-x: auto;
}
.lv-t {
border-collapse: collapse;
width: 100%;
font-size: .86rem;
}
.lv-t th,
.lv-t td {
border-bottom: 1px solid var(--border);
padding: 7px 8px;
text-align: right;
}
.lv-t th {
background: #f7f8f9;
}
.lv-t th:first-child,
.lv-t td:first-child {
text-align: left;
}
.lv-wn {
margin: 8px 0;
padding: 9px 12px;
      border-radius: 10px;
      background: var(--gold-light);
      border: 1px solid #e7d19d;
      font-size: .85rem;
    }

    .lv-mu {
      color: var(--muted);
      font-size: .85rem;
      margin: 8px 0;
    }

    .lv-sgbox {
      margin-top: 16px;
      border-top: 2px solid var(--border);
      padding-top: 6px;
    }

    .lv-sg {
      border: 1px solid var(--border);
      border-left: 6px solid var(--green);
      border-radius: 12px;
      padding: 12px 14px;
      margin: 10px 0;
      background: var(--card);
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .lv-sg h3 {
      margin: 0 0 6px;
      font-size: .98rem;
    }

    .lv-sgl {
      margin: 4px 0 6px 18px;
      padding: 0;
      font-size: .85rem;
    }

    .lv-sgres {
      font-size: .86rem;
      margin: 8px 0 10px;
    }

    .lv-sgres b.ok {
      color: var(--green);
    }

    .lv-applied {
      border-left: 6px solid var(--gold) !important;
      background: #fffaf0;
    }

    .lv-applied-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px dashed var(--border);
    }

    .lv-applied-item small {
      display: block;
      color: var(--muted);
      font-size: .78rem;
      margin-bottom: 2px;
    }

    .lv-applied-item ul {
      margin: 6px 0 0 18px;
      padding: 0;
      font-size: .88rem;
    }

    .lv-ic {
      flex: 0 0 auto;
      vertical-align: -3px;
    }

    .section-icon .lv-ic {
      width: 20px;
      height: 20px;
    }

    .lv-project-icon .lv-ic {
      width: 24px;
      height: 24px;
    }

    .lv-project-kicker .lv-ic {
      width: 15px;
      height: 15px;
      vertical-align: -2px;
    }

    .lv-project-actions .btn,
    .lv-project-bar .btn,
    .form-actions .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }

    .lv-project-actions {
      gap: 8px;
    }

    .lv-project-actions .btn {
      min-height: 42px;
    }

    .lv-project-actions .btn-light {
      border: 1px solid #c3c9ce;
      color: var(--dark);
    }

    .lv-project-actions .btn-danger {
      background: #fdecec;
      border: 1px solid #d99a9a;
      color: #a02f2f;
    }

    @media (max-width: 650px) {
      .lv-project-head {
        align-items: stretch;
        flex-direction: column;
      }

      .lv-project-actions .btn {
        flex: 1;
      }

      .lv-project-bar {
        align-items: stretch;
      }

      .lv-project-bar .btn {
        width: 100%;
      }
.lv-current-project {
order: -1;
}
}
`;
document.head.appendChild(css);
/* =========================================================
START
========================================================= */
/*
* Start zunächst mit der Projektübersicht.
* Dadurch sieht man sofort alle vorhandenen Projekte.
*/
activeProjectId = null;
render();
})();
