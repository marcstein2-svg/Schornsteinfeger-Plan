/* Terminplaner für den Schornstein Planer.
   Einbinden in index.html vor </body>:  <script src="termine.js" defer></script>
   Nutzt die vorhandenen Funktionen/Variablen der index.html:
   plan (Bundesland = plan.state), getHolidays, formatDate, formatDateInput, parseDate, addDays, escapeHtml, stateEl, renderAll */
(function () {
"use strict";
const KEY = "schornstein-planer-termine-v1", DN = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const $ = id => document.getElementById(id), p2 = n => String(n).padStart(2, "0"), hr = t => +t.slice(0, 2);
const esc = s => escapeHtml(s);
const st = { items: [], sender: "", view: "day", cur: new Date(), edit: null, hol: {} };
st.cur.setHours(0, 0, 0, 0);
const fmt = d => DN[d.getDay()] + ", " + formatDate(formatDateInput(d));
const dayList = s => st.items.filter(t => t.d === s).sort((a, b) => a.t.localeCompare(b.t));

function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); st.items = Array.isArray(s.items) ? s.items : []; st.sender = s.sender || ""; } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ items: st.items, sender: st.sender })); } catch (e) {} }
function holiday(d) {
  const y = d.getFullYear(), k = y + plan.state;
  if (!st.hol[k]) { st.hol[k] = {}; getHolidays(y, plan.state).forEach(h => st.hol[k][h.date] = h.name); }
  return st.hol[k][formatDateInput(d)] || "";
}

/* ---------- Darstellung ---------- */
function card(t) {
  const i = `data-id="${esc(t.id)}"`;
  return `<div class="tp-ap"><strong>${t.t} Uhr</strong> ${esc(t.s)} ${esc(t.n)}${t.k ? ` <span class="tp-mu">– ${esc(t.k)}</span>` : ""}${t.b ? `<p>${esc(t.b)}</p>` : ""}
  <div class="tp-actions"><button class="btn btn-light btn-small" type="button" data-tp="edit" ${i}>Ändern</button><button class="btn btn-light btn-small" type="button" data-tp="print" ${i}>Drucken</button><button class="btn btn-light btn-small" type="button" data-tp="ics" ${i}>Kalender</button><button class="btn btn-danger btn-small" type="button" data-tp="del" ${i}>Löschen</button></div></div>`;
}
function dayHTML() {
  const s = formatDateInput(st.cur), h = holiday(st.cur), list = dayList(s);
  let o = `<h3 class="tp-title">${fmt(st.cur)}</h3>`;
  if (h) o += `<div class="tp-holiday">Feiertag: ${esc(h)}</div>`;
  if (!list.length) o += `<p class="tp-mu">Noch keine Termine an diesem Tag.</p>`;
  for (let x = 6; x <= 19; x++) {
    const a = list.filter(t => hr(t.t) === x);
    o += `<div class="tp-row${h ? " tp-off" : ""}"><div class="tp-hour">${p2(x)}:00<span class="${a.length >= 4 ? "tp-full" : "tp-mu"}">${a.length}/4</span></div><div>${a.map(card).join("")}</div></div>`;
  }
  return o;
}
function weekHTML() {
  const mon = addDays(st.cur, -((st.cur.getDay() + 6) % 7)), today = formatDateInput(new Date());
  let o = `<h3 class="tp-title">${formatDate(formatDateInput(mon))} bis ${fmt(addDays(mon, 6))}</h3><div class="tp-wk">`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(mon, i), s = formatDateInput(d), h = holiday(d);
    o += `<div class="tp-col${h ? " tp-off" : ""}${s === today ? " tp-today" : ""}"><button type="button" class="tp-dh" data-tp="go" data-d="${s}">${DN[d.getDay()]} ${p2(d.getDate())}.${p2(d.getMonth() + 1)}.</button>${h ? `<div class="tp-holiday">${esc(h)}</div>` : ""}${dayList(s).map(t => `<button type="button" class="tp-mini" data-tp="go" data-d="${s}"><strong>${t.t}</strong> ${esc(t.s)} ${esc(t.n)}</button>`).join("")}</div>`;
  }
  return o + "</div>";
}
function render() {
  if (!$("tpCal")) return;
  $("tpCal").innerHTML = st.view === "day" ? dayHTML() : weekHTML();
  $("tpDay").classList.toggle("active", st.view === "day");
  $("tpWeek").classList.toggle("active", st.view === "week");
  const o = [...stateEl.options].find(x => x.value === plan.state);
  $("tpState").textContent = `Feiertage für ${o ? o.text : plan.state} aus der Jahresplanung. Pro Stunde sind höchstens 4 Termine möglich.`;
}
function move(d) { st.cur = d; if (!st.edit) $("tpDate").value = formatDateInput(d); render(); }

/* ---------- Formular ---------- */
function resetForm() {
  st.edit = null; $("tpForm").reset(); $("tpDate").value = formatDateInput(st.cur); $("tpTime").value = "08:00";
  $("tpFormTitle").textContent = "Neuer Termin"; $("tpSave").textContent = "Termin speichern"; $("tpCancel").classList.add("hidden"); $("tpError").textContent = "";
}
function submit(e) {
  e.preventDefault();
  const t = { id: st.edit || String(Date.now()) + Math.random().toString(16).slice(2), d: $("tpDate").value, t: $("tpTime").value, s: $("tpStreet").value.trim(), n: $("tpNumber").value.trim(), k: $("tpCustomer").value.trim(), b: $("tpNote").value.trim() };
  const fail = m => { $("tpError").textContent = m; };
  if (!t.d || !t.t || !t.s || !t.n) return fail("Bitte Datum, Uhrzeit, Straße und Hausnummer ausfüllen.");
  if (hr(t.t) < 6 || hr(t.t) > 19) return fail("Termine sind zwischen 06:00 und 19:59 Uhr möglich.");
  const h = holiday(parseDate(t.d));
  if (h) return fail(`Am ${h} ist Feiertag. Bitte einen anderen Tag wählen.`);
  if (st.items.filter(x => x.d === t.d && hr(x.t) === hr(t.t) && x.id !== t.id).length >= 4) return fail("In dieser Stunde sind schon 4 Termine eingetragen.");
  st.items = st.items.filter(x => x.id !== t.id); st.items.push(t); save();
  st.cur = parseDate(t.d); resetForm(); render();
}

/* ---------- Drucken und Export ---------- */
function range() {
  const a = $("tpFrom").value, b = $("tpTo").value, err = $("tpToolError");
  if (!a || !b || a > b) { err.textContent = "Bitte einen gültigen Zeitraum wählen."; return null; }
  const l = st.items.filter(t => t.d >= a && t.d <= b).sort((x, y) => (x.d + x.t).localeCompare(y.d + y.t));
  if (!l.length) { err.textContent = "Im gewählten Zeitraum gibt es keine Termine."; return null; }
  err.textContent = ""; return l;
}
function printList(list) {
  const sender = esc(st.sender);
  $("tpPrint").innerHTML = list.map(t => `<div class="tp-sheet"><h1>Terminvorschlag</h1><p>${t.k ? "Guten Tag " + esc(t.k) + "," : "Sehr geehrte Kundin, sehr geehrter Kunde,"}<br>wir schlagen Ihnen folgenden Termin vor:</p><table><tr><td>Datum</td><td>${fmt(parseDate(t.d))}</td></tr><tr><td>Uhrzeit</td><td>${t.t} Uhr</td></tr><tr><td>Adresse</td><td>${esc(t.s)} ${esc(t.n)}</td></tr>${t.b ? `<tr><td>Hinweise</td><td style="white-space:pre-wrap">${esc(t.b)}</td></tr>` : ""}</table><p>Bitte sorgen Sie dafür, dass wir zum Termin Zugang erhalten. Passt der Termin nicht, geben Sie uns bitte rechtzeitig Bescheid.</p><p style="white-space:pre-wrap;margin-top:32px">${sender}</p></div>`).join("");
  document.body.classList.add("tp-printing");
  window.print();
}
addEventListener("afterprint", () => document.body.classList.remove("tp-printing"));
function ics(list) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const q = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const r = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Schornstein-Planer//Terminplaner//DE", "CALSCALE:GREGORIAN"];
  list.forEach(t => {
    const [h, m] = t.t.split(":").map(Number), D = t.d.replace(/-/g, "");
    r.push("BEGIN:VEVENT", "UID:" + t.id + "@schornstein-planer.de", "DTSTAMP:" + stamp, "DTSTART:" + D + "T" + p2(h) + p2(m) + "00", "DTEND:" + D + "T" + p2(h + 1) + p2(m) + "00",
      "SUMMARY:" + q("Schornsteinfeger: " + t.s + " " + t.n), "LOCATION:" + q(t.s + " " + t.n), "DESCRIPTION:" + q((t.k ? t.k + "\n" : "") + t.b),
      "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Termin", "END:VALARM", "END:VEVENT");
  });
  r.push("END:VCALENDAR"); return r.join("\r\n");
}
function download(list, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics(list)], { type: "text/calendar;charset=utf-8" }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

/* ---------- Klicks ---------- */
function onClick(e) {
  const b = e.target.closest("[data-tp]"); if (!b) return;
  const a = b.dataset.tp, t = st.items.find(x => x.id === b.dataset.id);
  if (a === "prev" || a === "next") return move(addDays(st.cur, (a === "next" ? 1 : -1) * (st.view === "day" ? 1 : 7)));
  if (a === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return move(d); }
  if (a === "day" || a === "week") { st.view = a; return render(); }
  if (a === "go") { st.view = "day"; return move(parseDate(b.dataset.d)); }
  if (a === "printRange") { const l = range(); if (l) printList(l); return; }
  if (a === "icsRange") { const l = range(); if (l) download(l, `termine-${$("tpFrom").value}_${$("tpTo").value}.ics`); return; }
  if (!t) return;
  if (a === "print") return printList([t]);
  if (a === "ics") return download([t], `termin-${t.d}.ics`);
  if (a === "del") { if (confirm(`Termin am ${formatDate(t.d)} um ${t.t} Uhr (${t.s} ${t.n}) wirklich löschen?`)) { st.items = st.items.filter(x => x.id !== t.id); save(); render(); } return; }
  if (a === "edit") {
    st.edit = t.id; $("tpDate").value = t.d; $("tpTime").value = t.t; $("tpStreet").value = t.s; $("tpNumber").value = t.n; $("tpCustomer").value = t.k; $("tpNote").value = t.b;
    $("tpFormTitle").textContent = "Termin ändern"; $("tpSave").textContent = "Änderung speichern"; $("tpCancel").classList.remove("hidden");
    $("tpForm").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ---------- Einbau in die Seite ---------- */
const css = `
.tp-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px}.tp-grow{flex:1}
.tp-tog.active{background:var(--dark);color:#fff}.tp-wrap{overflow-x:auto}
.tp-title{margin:0 0 12px;font-size:1.05rem}.tp-mu{color:var(--muted)}.tp-mt{margin-top:15px}
.tp-holiday{background:var(--red-light);color:#a73737;border:1px solid #f3c9c9;border-radius:9px;padding:6px 10px;font-size:.8rem;font-weight:700;margin-bottom:10px}
.tp-row{display:grid;grid-template-columns:78px 1fr;gap:10px;border-top:1px solid var(--border);padding:9px 0;min-height:50px}.tp-row.tp-off{opacity:.55}
.tp-hour{font-weight:750;font-variant-numeric:tabular-nums}.tp-hour span{display:block;font-size:.72rem;font-weight:500}.tp-full{color:var(--red);font-weight:800}
.tp-ap{border-left:4px solid var(--gold);background:#fbf5e6;border-radius:10px;padding:9px 12px;margin-bottom:7px}
.tp-ap p{margin:4px 0 0;white-space:pre-wrap;font-size:.86rem;color:#5b5140}.tp-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tp-wk{display:grid;grid-template-columns:repeat(7,minmax(130px,1fr));gap:7px;min-width:940px}
.tp-col{border:1px solid var(--border);border-radius:11px;padding:7px;min-height:150px;background:#fafbfc}.tp-col.tp-off{background:var(--red-light)}.tp-col.tp-today{border:2px solid var(--gold)}
.tp-dh,.tp-mini{display:block;width:100%;text-align:left;border:0;border-radius:8px;padding:6px 8px;color:var(--text)}
.tp-dh{background:#edf0f2;font-weight:750;margin-bottom:7px}.tp-mini{background:#fbf5e6;border-left:4px solid var(--gold);font-size:.78rem;margin-bottom:5px}
.tp-error{min-height:20px;color:#a73737;font-size:.84rem;font-weight:650;margin-top:10px}.tp-hint{margin:12px 0 0;color:var(--muted);font-size:.82rem}
#tpPrint{display:none}
@media(max-width:720px){.tp-wk{grid-template-columns:1fr;min-width:0}.tp-col{min-height:0}}
@media print{body.tp-printing>*:not(#tpPrint){display:none!important}body.tp-printing #tpPrint{display:block}body.tp-printing{background:#fff}
.tp-sheet{page-break-after:always;padding:24px;font:16px/1.55 Georgia,serif;color:#000}.tp-sheet:last-child{page-break-after:auto}
.tp-sheet h1{font-size:26px;border-bottom:3px solid #000;padding-bottom:8px;margin:0 0 16px}.tp-sheet table{border-collapse:collapse;width:100%;margin:18px 0}
.tp-sheet td{border:1px solid #999;padding:8px 10px;vertical-align:top}.tp-sheet td:first-child{width:32%;font-weight:bold}}`;

const html = `
<section class="card" id="termine">
 <div class="card-header"><div><h2>Terminplaner</h2><p id="tpState"></p></div><div class="section-icon">🗓️</div></div>
 <div class="tp-bar"><button class="btn btn-light" type="button" data-tp="prev" aria-label="Zurück">‹</button><button class="btn btn-light" type="button" data-tp="today">Heute</button><button class="btn btn-light" type="button" data-tp="next" aria-label="Weiter">›</button><span class="tp-grow"></span><button class="btn btn-light tp-tog" id="tpDay" type="button" data-tp="day">Tag</button><button class="btn btn-light tp-tog" id="tpWeek" type="button" data-tp="week">Woche</button></div>
 <div class="tp-wrap" id="tpCal"></div>
</section>
<div class="two-column">
 <section class="card"><div class="card-header"><div><h2 id="tpFormTitle">Neuer Termin</h2><p>Straße, Hausnummer und Besonderheiten erfassen.</p></div><div class="section-icon">📍</div></div>
  <form id="tpForm" autocomplete="off">
   <div class="form-grid two"><div class="field"><label for="tpDate">Datum</label><input id="tpDate" type="date" required></div><div class="field"><label for="tpTime">Uhrzeit</label><input id="tpTime" type="time" min="06:00" max="19:59" step="900" required></div></div>
   <div class="form-grid two tp-mt"><div class="field"><label for="tpStreet">Straße</label><input id="tpStreet" required></div><div class="field"><label for="tpNumber">Hausnummer</label><input id="tpNumber" required></div></div>
   <div class="field tp-mt"><label for="tpCustomer">Kunde (optional)</label><input id="tpCustomer"></div>
   <div class="field tp-mt"><label for="tpNote">Besonderheiten</label><textarea id="tpNote" placeholder="z. B. Schlüssel beim Nachbarn, Hund im Haus"></textarea></div>
   <div class="tp-error" id="tpError"></div>
   <div class="form-actions"><button class="btn btn-light hidden" id="tpCancel" type="button">Abbrechen</button><button class="btn btn-primary" id="tpSave" type="submit">Termin speichern</button></div>
  </form></section>
 <section class="card"><div class="card-header"><div><h2>Drucken und Exportieren</h2><p>Zeitraum wählen, dann alle Termine darin ausgeben.</p></div><div class="section-icon">🖨️</div></div>
  <div class="form-grid two"><div class="field"><label for="tpFrom">Von</label><input id="tpFrom" type="date"></div><div class="field"><label for="tpTo">Bis</label><input id="tpTo" type="date"></div></div>
  <div class="field tp-mt"><label for="tpSender">Absender auf dem Ausdruck</label><textarea id="tpSender" style="min-height:60px" placeholder="Firma, Telefon"></textarea></div>
  <div class="form-actions"><button class="btn btn-primary" type="button" data-tp="printRange">Terminvorschläge drucken</button><button class="btn btn-gold" type="button" data-tp="icsRange">Kalenderdatei (.ics)</button></div>
  <div class="tp-error" id="tpToolError"></div>
  <p class="tp-hint">Jeder Termin kommt auf eine eigene Seite, sodass jeder Kunde genau einen Vorschlag bekommt. Einzelne Termine drucken oder exportieren Sie über die Knöpfe am Termin.</p></section>
</div>`;

function init() {
  load();
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
  const box = document.createElement("div"); box.innerHTML = html;
  const anchor = $("historie");
  if (anchor) anchor.before(...box.childNodes); else document.getElementById("homePage").append(...box.childNodes);
  const pr = document.createElement("div"); pr.id = "tpPrint"; document.body.appendChild(pr);
  const link = document.querySelector('.main-nav a[href="#historie"]');
  if (link) { const a = document.createElement("a"); a.className = "nav-link"; a.href = "#termine"; a.textContent = "Termine"; link.before(a); }
  $("tpFrom").value = formatDateInput(st.cur); $("tpTo").value = formatDateInput(addDays(st.cur, 6));
  $("tpSender").value = st.sender; $("tpSender").addEventListener("input", e => { st.sender = e.target.value; save(); });
  $("tpForm").addEventListener("submit", submit); $("tpCancel").addEventListener("click", resetForm);
  document.addEventListener("click", onClick);
  const orig = window.renderAll;
  window.renderAll = function () { orig.apply(this, arguments); render(); };
  resetForm(); render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();