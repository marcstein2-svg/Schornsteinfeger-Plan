/* Luftverbund-Rechner nach TRGI 2018 
Schornstein Planer 
Mehrere Luftverbund-Projekte 
*/ 
(function () { 
"use strict"; 
/* ========================================================= 
BERECHNUNG 
========================================================= */ 
const K = [ 
null, 
[0.8,1.4,2.2,2.7,3.4,3.7,4.2,4.5,5,5.3,5.6,5.8,6.1,6.2,6.6,6.7,6.9,7,7,7.2,7.4,7.5,7.5,7.7,7
.7,7.8,7.8,8,8,8.2,8.2,8.2,8.2,8.3,8.3,8.3,8.5,8.5,8.5,8.5,8.5,8.6,8.6,8.6,8.6,8.6,8.6,8.8,8
.8,8.8,8.8,8.8,8.8,8.8,8.8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9
,9,9,9,9,9,9,9,9,9,9,9,9,9], 
[0.8,1.4,2.2,3,3.8,4.5,5.1,5.9,6.6,7.4,8,8.6,9.3,9.9,10.6,11.2,11.7,12.3,13,13.6,14.1,14.
6,15,15.7,16.2,16.6,17.1,17.6,18.1,18.6,19,19.4,19.8,20.3,20.6,21.1,21.4,21.8,22.2,22.
6,22.9,23.2,23.5,23.8,24.2,24.5,24.8,25.1,25.4,25.8,25.9,26.2,26.6,26.9,27,27.4,27.5,2
7.8,28,28.3,28.5,28.6,29,29.1,29.3,29.6,29.8,29.9,30.1,30.2,30.4,30.6,30.7,30.9,31,31.
2,31.4,31.5,31.7,31.8,32,32.2,32.3,32.5,32.6,32.8,33,33.1,33.3,33.4,33.6,33.8,33.9,34.
1,34.2,34.4,34.6,34.7,34.9,35], 
[0.8,1.4,2.2,3,3.8,4.6,5.3,6.1,6.9,7.5,8.3,9.1,9.8,10.6,11.4,12,12.6,13.4,14.1,14.9,15.5,
16.2,17,17.6,18.2,18.9,19.5,20,20.8,21.4,22.1,22.7,23.4,23.8,24.5,25.1,25.6,26.2,26.7,
27.4,27.8,28.3,29,29.4,29.9,30.4,31,31.5,32,32.5,33,33.3,33.8,34.2,34.7,35.2,35.5,36,3
6.3,36.8,37.1,37.6,37.9,38.4,38.7,39,39.5,39.8,40.2,40.5,40.8,41.1,41.4,41.8,42.1,42.4,
42.7,43,43.4,43.7,44,44.3,44.6,45,45.3,45.6,45.9,46.2,46.6,46.9,47.2,47.5,47.8,48.2,48
.5,48.8,49.1,49.4,49.8,50.1] 
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
            "Ventilatorgestützte Lüftung in Gebäuden vor 2002: bitte gemessenen n50-Wert 
eingeben."; 
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
 
  const IC = { 
    save: "       ", 
    open: "    ", 
    fire: "    ", 
    print: "           ", 
    warn: "   ", 
    folder: "    ", 
    copy: "    ", 
    trash: "       " 
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
                          ${IC.copy} 
                        </button> 
 
                        ${ 
                          projects.length > 1 
                            ? ` 
                              <button 
                                class="btn btn-danger" 
                                data-a="deleteproject" 
                                data-id="${E(p.id)}" 
                                title="Projekt löschen" 
                              > 
                                ${IC.trash} 
                              </button> 
                            ` 
                            : "" 
                        } 
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
        "    ", 
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
        "    ", 
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
      "      ", 
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
                  "Wesentliche Änderung der Luftdurchlässigkeit (> ⅓ Fenster getauscht, EFH: 
oder > ⅓ Dach abgedichtet)", 
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
 
  function result() { 
    const R = run(D); 
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
 
  function duplicateProject(id) { 
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
 
    activeProjectId = x.id; 
    D = p; 
    tab = 0; 
 
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
      activeProjectId = 
        projects[0].id; 
 
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
 
  function doPrint() { 
    const old = 
      document.getElementById( 
        "lvPrintRoot" 
      ); 
 
    if (old) old.remove(); 
 
    const style = 
      document.createElement( 
        "style" 
      ); 
 
    style.id = 
      "lvPrintStyle"; 
 
    style.textContent = ` 
      @page { 
        size: A4; 
        margin: 12mm; 
      } 
 
      @media print { 
        body > *:not(#lvPrintRoot) { 
          display: none !important; 
        } 
 
        #lvPrintRoot { 
          display: block !important; 
          position: static !important; 
          width: auto !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          background: #fff !important; 
        } 
 
        #lvPrintRoot .card { 
          box-shadow: none !important; 
          break-inside: avoid; 
          page-break-inside: avoid; 
          border: 1px solid #999; 
        } 
 
        #lvPrintRoot .form-actions, 
        #lvPrintRoot .lv-project-bar, 
        #lvPrintRoot .lv-tabs { 
          display: none !important; 
        } 
 
        #lvPrintRoot * { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        } 
      } 
    `; 
 
    const r = 
      document.createElement( 
        "div" 
      ); 
 
    r.id = 
      "lvPrintRoot"; 
 
    r.innerHTML = 
      projectBar() + 
      result(); 
 
    document.head.appendChild( 
      style 
    ); 
 
    document.body.appendChild( 
      r 
    ); 
 
    window.print(); 
 
    setTimeout(() => { 
      r.remove(); 
      style.remove(); 
    }, 1000); 
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
          activeProjectId 
        ); 
        return; 
      } 
 
      if ( 
        a === "deleteproject" 
      ) { 
        deleteProject(id); 
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