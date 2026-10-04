/* Luftverbund-Rechner nach TRGI 2018 – läuft innerhalb des Schornstein Planers (Bereich #luftverbundView) */
(function(){"use strict";
//CALC-START
const K=[null,[0.8,1.4,2.2,2.7,3.4,3.7,4.2,4.5,5,5.3,5.6,5.8,6.1,6.2,6.6,6.7,6.9,7,7,7.2,7.4,7.5,7.5,7.7,7.7,7.8,7.8,8,8,8.2,8.2,8.2,8.2,8.3,8.3,8.3,8.5,8.5,8.5,8.5,8.5,8.6,8.6,8.6,8.6,8.6,8.6,8.6,8.8,8.8,8.8,8.8,8.8,8.8,8.8,8.8,8.8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[0.8,1.4,2.2,3,3.8,4.5,5.1,5.9,6.6,7.4,8,8.6,9.3,9.9,10.6,11.2,11.7,12.3,13,13.6,14.1,14.6,15,15.7,16.2,16.6,17.1,17.6,18.1,18.6,19,19.4,19.8,20.3,20.6,21.1,21.4,21.8,22.2,22.6,22.9,23.2,23.5,23.8,24.2,24.5,24.8,25.1,25.4,25.8,25.9,26.2,26.6,26.9,27,27.4,27.5,27.8,28,28.3,28.5,28.6,29,29.1,29.3,29.6,29.8,29.9,30.1,30.2,30.4,30.6,30.7,30.9,31,31.2,31.4,31.5,31.7,31.8,32,32.2,32.3,32.5,32.6,32.8,33,33.1,33.3,33.4,33.6,33.8,33.9,34.1,34.2,34.4,34.6,34.7,34.9,35],[0.8,1.4,2.2,3,3.8,4.6,5.3,6.1,6.9,7.5,8.3,9.1,9.8,10.6,11.4,12,12.6,13.4,14.1,14.9,15.5,16.2,17,17.6,18.2,18.9,19.5,20,20.8,21.4,22.1,22.7,23.4,23.8,24.5,25.1,25.6,26.2,26.7,27.4,27.8,28.3,29,29.4,29.9,30.4,31,31.5,32,32.5,33,33.3,33.8,34.2,34.7,35.2,35.5,36,36.3,36.8,37.1,37.6,37.9,38.4,38.7,39,39.5,39.8,40.2,40.5,40.8,41.1,41.4,41.8,42.1,42.4,42.7,43,43.4,43.7,44,44.3,44.6,45,45.3,45.6,45.9,46.2,46.6,46.9,47.2,47.5,47.8,48.2,48.5,48.8,49.1,49.4,49.8,50.1]];
const num=x=>parseFloat(String(x??'').replace(',','.'))||0,n2=x=>Math.round(x*100+1e-9)/100,r1=x=>Math.round(x*10+1e-9)/10;
const ART={
b1:['Gasgerät Art B1/B4 (mit Strömungssicherung)','kW',1,'gas'],
b2:['Gasgerät Art B ohne Strömungssicherung (z. B. B22, B23)','kW',1,'gas'],
oe:['Ölfeuerstätte, raumluftabhängig','kW',1,'gas'],
fs:['Feststofffeuerstätte, handbeschickt (Brennstoffdurchsatz bekannt)','kg/h',8,'gas'],
ko:['Kaminofen (nur Nennleistung bekannt)','kW',2.4,'gas'],
so:['Speicher-/Kachelgrundofen (nur Nennleistung bekannt)','kW',9.6,'gas'],
ok:['Offener Kamin / offen betreibbare Feuerstätte','m² Feuerraumöffnung',340,'gas'],
df:['Dekoratives Gasfeuer im offenen Kamin','m² Feuerraumöffnung',225,'gas'],
dh:['Abluft-Dunstabzugshaube','m³/h',1,'abl'],
wt:['Abluft-Wäschetrockner','m³/h',1,'abl'],
lu:['Lüftungs-/Entlüftungsanlage (Abluft)','m³/h',1,'abl']};
function kenn(D){const g=D.g,m=num(g.n50),ein=g.ge=='ein',f=ein?.7:.8;let n50=m,ht=0,err='';
if(!m){if(g.luft=='vent'){if(g.ab=='1')n50=1;else err='Ventilatorgestützte Lüftung in Gebäuden vor 2002: bitte gemessenen n50-Wert eingeben.'}
else if(g.ab=='1')n50=1.5;else if(g.aend=='1')n50=g.efh=='1'?2:1.5;else n50=3;
if(n50){ht={1:1,1.5:3,2:5,3:7}[n50]+(n50<3&&!ein?1:0)}}
let n=n50==3&&!m?.4:n2((n50==3&&!m?.7:f)*n50*.1857);
return{n50,ht,n,f:n50==3&&!m?.7:f,err,tab:ht&&g.mod!='fo'}}
const qinf=(kn,v)=>{if(kn.tab){let k=0;for(let i=1;i<=100;i++){if(Math.round(.8*i/kn.n)<=v)k=i;else break}return r1(.8*k)}return r1(v*kn.n)};
function anr(D,q,c){if(c==4)return q;const a=K[c],x=q/.8+1e-9;if(x>=100)return a[99];const k=Math.floor(x);
if(D.ip=='1'){const lo=k?a[k-1]:0;return lo+(a[k]-lo)*(x-k)}return k?a[k-1]:0}
function curve(l){if(l.t=='o'||num(l.o)>0)return 4;if(l.d=='3')return l.k=='0'?1:l.k=='1'?2:3;return l.k=='0'?2:3}
function bestC(D,R,A){let b=0;const dfs=(cur,vis,first)=>{for(const l of D.l){if(l.a!=cur&&l.b!=cur)continue;const nx=l.a==cur?l.b:l.a;if(vis.includes(nx))continue;
const c=curve(l);if(first&&c!=4)continue;const fc=first||c;if(nx==A)b=Math.max(b,fc);else dfs(nx,vis.concat(nx),fc)}};dfs(R,[R],0);return b}
function info(D,r,f,other){const a=ART[f.a];if(!a)return null;const v=num(f.v);let fik=0,bed=0;
if(a[3]=='gas'){fik=v*(f.a=='df'&&other?340:a[2]);bed=fik*1.6}else bed=v;return{r,f,abl:a[3]=='abl',fik,bed,art:f.a}}
function run(D){const kn=kenn(D),dv=[];D.r.forEach(r=>(r.f||[]).forEach(f=>{const i=info(D,r,f,0);if(i)dv.push(i)}));
const oth=dv.some(d=>!d.abl&&d.art!='df');dv.forEach(d=>{if(d.art=='df'&&oth){d.fik=num(d.f.v)*340;d.bed=d.fik*1.6}});
const abl=dv.filter(d=>d.abl&&!d.f.s),ablS=abl.reduce((s,d)=>s+d.bed,0),res=[],used={};
D.r.forEach(A=>{const m=dv.filter(d=>d.r==A&&!d.abl);if(!m.length)return;const w=[],Bcb=m.reduce((s,d)=>s+d.bed,0),Bed=r1(Bcb+ablS);
const rows=[];let ist=0;
D.r.forEach(R=>{const out=num(R.fen)+num(R.tuer)>0,al=num(R.ald)*num(R.qa);if(!out&&al<=0)return;
const qi=out?qinf(kn,num(R.v)):0,qs=r1(qi+al),c=R==A?4:bestC(D,R.id,A.id),an=c?r1(anr(D,qs,c)):0;
if(c){ist+=an;if(R!=A)(used[R.id]=used[R.id]||[]).push(A.n||'Raum')}else w.push((R.n||'Raum')+': keine gültige Verbindung zum Aufstellraum (mittelbar nur mit Öffnungen ≥ 150 cm² zwischen Verbundräumen und Aufstellraum) – nicht angerechnet.');
rows.push({n:R.n||'Raum',c,qi,al,qs,an})});
ist=r1(ist);if(m.some(d=>d.art=='ok'||d.art=='df'))w.push('Offene Kamine/dekorative Gasfeuer benötigen grundsätzlich eine eigene Verbrennungsluftöffnung bzw. -leitung ins Freie (TRGI 9.2.2) – über Infiltration/ALD nicht nachweisbar.');
const lim=Bed>80;if(lim)w.push('Bedarf inkl. Abluft über 80 m³/h (≙ 50 kW): Nachweis über Infiltration/ALD nicht zulässig, nur Öffnungen ins Freie (TRGI 8.3.2.3.2–4, 9.2.3.3).');
if(ablS>0)w.push('Abluft-Einrichtungen ('+r1(ablS)+' m³/h) wurden zum Bedarf addiert (TRGI 8.3.2.3.3).');
const sz2=!(lim||m.some(d=>d.art=='ok'||d.art=='df'))&&ist>=Bed-1e-9;
const b1=m.filter(d=>d.art=='b1'),kw=b1.reduce((s,d)=>s+d.fik,0);let s1=null;
if(kw>0){let V=num(A.v);const nb=[];const rlv0=V/kw;if(rlv0<1)D.l.forEach(l=>{if(l.a!=A.id&&l.b!=A.id)return;if(!(l.t=='o'||num(l.o)>=2))return;const o=D.r.find(x=>x.id==(l.a==A.id?l.b:l.a));if(o&&!nb.includes(o)){nb.push(o);V+=num(o.v)}});
s1={kw,V0:num(A.v),V,rlv0,rlv:V/kw,nb:nb.map(x=>x.n||'Raum'),ok:V/kw>=1-1e-9}}
res.push({A,rows,Bcb,Bed,ablS,ist,sz2,s1,w})});
Object.keys(used).forEach(id=>{if(used[id].length>1)res.forEach(x=>x.w.push('Raum "'+(D.r.find(r=>r.id==id).n||'Raum')+'" wird für mehrere Aufstellräume angerechnet – gemeinsame Betrachtung der Nutzungseinheit prüfen.'))});
return{kn,res,dv}}
//CALC-END

const root=document.getElementById('luftverbundView');if(!root)return;
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IC={save:'\u{1F4BE}',open:'\u{1F4C2}',fire:'\u{1F525}',print:'\u{1F5A8}',warn:'\u26A0\uFE0F'};
const KEY='schornsteinplaner_luftverbund_v1';
const dflt=()=>({p:{},g:{ge:'ein',efh:'0',ab:'1',luft:'frei',aend:'0',n50:'',mod:'ht'},ip:'0',r:[],l:[],id:1});
let D=dflt(),tab=0;
try{const s=(typeof plan!=='undefined'&&plan&&plan.luftverbund)||JSON.parse(localStorage.getItem(KEY)||'null');if(s)D=Object.assign(dflt(),s)}catch(e){}
const save=()=>{try{if(typeof plan!=='undefined'&&typeof saveData==='function'){plan.luftverbund=D;saveData()}else localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};
const get=k=>k.split('.').reduce((o,p)=>o?.[p],D)??'',set=(k,v)=>{const a=k.split('.'),l=a.pop();a.reduce((o,p)=>o[p],D)[l]=v};
const inp=(k,l,o={})=>`<div class="field"><label>${l}</label><input data-k="${k}" value="${E(get(k))}" ${o.t?`type="${o.t}"`:''} ${o.m?'inputmode="decimal"':''}></div>`;
const sel=(k,l,op,re=1)=>`<div class="field"><label>${l}</label><select data-k="${k}" ${re?'data-re=1':''}>${op.map(([v,t])=>`<option value="${v}" ${get(k)==v?'selected':''}>${t}</option>`).join('')}</select></div>`;
const f1=x=>(+x).toFixed(1).replace('.',','),f2=x=>(+x).toFixed(2).replace('.',',');
const KT={1:'Kurve 1',2:'Kurve 2',3:'Kurve 3',4:'Kurve 4'};
const card=(ic,t,p,body)=>`<div class="card"><div class="card-header"><div><h2>${t}</h2>${p?`<p>${p}</p>`:''}</div><div class="section-icon">${ic}</div></div>${body}</div>`;
function infoTxt(){const k=kenn(D);if(k.err)return `<span class="lv-wn">${k.err}</span>`;return `n50 = ${f1(k.n50)} h⁻¹ ${num(D.g.n50)?'(gemessen)':'(Auslegungswert, Tab. 9-2'+(k.ht?', Haustyp '+k.ht:'')+')'} · f<sub>wirk.komp.</sub> = ${String(k.f).replace('.',',')} · n = ${f2(k.n)} h⁻¹`}
function v0(){return card('\u{1F4C1}','Projekt','Name und Nummer des Auftrags',`<div class="form-grid">${inp('p.n','Projektname')}${inp('p.nr','Projektnummer')}${inp('p.dt','Datum',{t:'date'})}${inp('p.ers','Ersteller / Betrieb')}</div>`)
+card('\u{1F464}','Eigentümer und Gebäude','',`<div class="form-grid">${inp('p.en','Name des Eigentümers')}${inp('p.ea','Anschrift des Eigentümers')}${inp('p.et','Telefon / E-Mail')}${inp('p.ga','Anschrift des Gebäudes')}${inp('p.gl','Lage der Nutzungseinheit (z. B. 2. OG links)')}</div>`)
+card(IC.save,'Datensicherung','„Alle Daten“ sichert die komplette Planer-Sicherung inklusive aller Luftverbund-Projekte. „Projekt“ sichert nur diese Berechnung als Datei.',`<div class="form-actions" style="justify-content:flex-start"><button class="btn btn-gold" data-a="gb">${IC.save} Alle Daten sichern</button><label class="btn btn-light" for="spRestoreData">${IC.open} Alle Daten wiederherstellen</label><button class="btn btn-light" data-a="pe">Projekt als Datei sichern</button><label class="btn btn-light" for="lvImport">Projekt aus Datei laden</label><input id="lvImport" type="file" accept=".json,application/json" hidden><button class="btn btn-danger" data-a="np">Neues Projekt</button></div>`)}
function v1(){const g=D.g;return card('\u{1F3E0}','Kennwerte der Nutzungseinheit','',`<div class="form-grid">
${sel('g.ge','Geschosse der Nutzungseinheit',[['ein','eingeschossig'],['mehr','mehrgeschossig']])}
${sel('g.efh','Gebäudeart',[['0','Mehrfamilienhaus'],['1','Einfamilienhaus']])}
${sel('g.ab','Errichtet',[['1','ab 2002'],['0','vor 2002']])}
${sel('g.luft','Lüftung',[['frei','freie Lüftung (Fugen)'],['vent','ventilatorgestützt']])}
${g.ab=='0'&&g.luft=='frei'?sel('g.aend','Wesentliche Änderung der Luftdurchlässigkeit (> ⅓ Fenster getauscht, EFH: oder > ⅓ Dach abgedichtet)',[['0','nein'],['1','ja']]):''}
${inp('g.n50','Gemessener n50-Wert (optional, h⁻¹)',{m:1})}
${sel('g.mod','Berechnung ohne Messwert',[['ht','Tabelle 9-3 (Haustyp)'],['fo','Formel 9-3 bis 9-5']])}
${sel('ip','Tabellenwert',[['0','nächstkleinerer Wert (Formblatt)'],['1','interpoliert']])}</div><p class="lv-mu" id="lvInfo">${infoTxt()}</p>`)}
function v2(){return `<div class="form-actions" style="justify-content:flex-start;margin:0 0 14px"><button class="btn btn-gold" data-a="ar">+ Raum hinzufügen</button></div>`+D.r.map((r,i)=>{const lk=D.l.map((l,j)=>[l,j]).filter(([l])=>l.a==r.id||l.b==r.id);
return `<details class="lv-room" data-ri="${i}" ${r.o?'open':''}><summary>${E(r.n||'Raum '+(i+1))} · ${E(r.v||'?')} m³${(r.f||[]).some(f=>ART[f.a]&&ART[f.a][3]=='gas')?' · Aufstellraum':''}</summary><div class="lv-body">
<div class="form-grid">${inp(`r.${i}.n`,'Bezeichnung / Nutzung')}${inp(`r.${i}.v`,'Raumvolumen (m³)',{m:1})}${inp(`r.${i}.fen`,'Öffenbare Fenster (Anzahl)',{m:1})}${inp(`r.${i}.tuer`,'Türen ins Freie (Anzahl)',{m:1})}${inp(`r.${i}.ald`,'ALD (Anzahl)',{m:1})}${inp(`r.${i}.qa`,'Luftstrom je ALD bei 4 Pa (m³/h)',{m:1})}</div>
<div class="lv-h4">Feuerstätten / Abluft</div>`+(r.f||[]).map((f,j)=>{const a=ART[f.a]||ART.b1;return `<div class="lv-it"><div class="form-grid">${sel(`r.${i}.f.${j}.a`,'Art',Object.keys(ART).map(k=>[k,ART[k][0]]))}${inp(`r.${i}.f.${j}.n`,'Name / Typ')}${inp(`r.${i}.f.${j}.v`,'Wert in '+a[1],{m:1})}</div>
${a[3]=='abl'?`<label class="lv-ck"><input type="checkbox" data-k="r.${i}.f.${j}.s" ${f.s?'checked':''}> gleichzeitiger Betrieb ausgeschlossen (Sicherheitseinrichtung mit Zulassung)</label>`:''}
<button class="btn btn-danger btn-small" data-a="df" data-i="${i}" data-j="${j}">Entfernen</button></div>`}).join('')+`<button class="btn btn-light" data-a="af" data-i="${i}">+ Feuerstätte / Abluft</button>
<div class="lv-h4">Verbindungen zu anderen Räumen</div>`+lk.map(([l,j])=>{const o=l.a==r.id?l.b:l.a;return `<div class="lv-it"><div class="form-grid">
<div class="field"><label>Verbunden mit</label><select data-lp="${j}:${r.id}">${D.r.filter(x=>x.id!=r.id).map(x=>`<option value="${x.id}" ${x.id==o?'selected':''}>${E(x.n||'Raum')}</option>`).join('')}</select></div>
${sel(`l.${j}.t`,'Art',[['t','Tür'],['o','Offener Durchgang (ohne Tür)']])}
${l.t=='t'?sel(`l.${j}.d`,'Dichtung',[['3','dreiseitig umlaufend'],['0','ohne umlaufende Dichtung / Überströmdichtung']],0)+sel(`l.${j}.k`,'Türblatt',[['0','ungekürzt'],['1','um 1,0 cm gekürzt'],['1.5','um 1,5 cm gekürzt']],0)+sel(`l.${j}.o`,'Verbrennungsluftöffnung in Tür/Wand',[['0','keine'],['1','1 × 150 cm²'],['2','2 × 150 cm² (auch Schutzziel 1)']],0):''}</div>
<button class="btn btn-danger btn-small" data-a="dl" data-i="${j}">Verbindung löschen</button></div>`}).join('')+(D.r.length>1?`<button class="btn btn-light" data-a="al" data-i="${i}">+ Verbindung</button>`:'')+`<div><button class="btn btn-danger" data-a="dr" data-i="${i}" style="margin-top:12px">Raum löschen</button></div></div></details>`}).join('')}
function result(){const R=run(D),k=R.kn,P=D.p;let h=`<div class="card"><div class="card-header"><div><h2>Berechnung der Verbrennungsluftversorgung</h2><p>${E(P.n)} ${P.nr?'· Nr. '+E(P.nr):''} ${P.dt?'· '+E(P.dt):''}<br>Eigentümer: ${E(P.en)} ${E(P.ea)}<br>Gebäude: ${E(P.ga)} ${E(P.gl)}<br>${infoTxt()}</p></div><div class="section-icon">${IC.fire}</div></div></div>`;
if(!R.res.length)return h+'<div class="card"><div class="empty">Noch keine Feuerstätte (Gas-/Feststoff-/Ölgerät) in einem Raum erfasst.</div></div>';
R.res.forEach(x=>{const s=x.s1;h+=`<div class="card"><div class="card-header"><div><h2>Aufstellraum: ${E(x.A.n||'Raum')} (${E(x.A.v)} m³)</h2></div></div><div class="lv-bd">
<div class="lv-b ${s?(s.ok?'lv-ok':'lv-no'):'lv-na'}">Schutzziel 1 ${s?(s.ok?'✓ erfüllt':'✗ nicht erfüllt'):'– nicht erforderlich'}<small>${s?`RLV ${f2(s.rlv0)} (${E(s.V0)} m³ / ${f1(s.kw)} kW)${s.nb.length?`<br>mit 2×150 cm² zu ${E(s.nb.join(', '))}: ${f2(s.rlv)} (${f1(s.V)} m³)`:''}<br>gefordert ≥ 1,0 m³/kW`:'nur bei Gasgeräten Art B1/B4'}</small></div>
<div class="lv-b ${k.err?'lv-na':x.sz2?'lv-ok':'lv-no'}">Schutzziel 2 ${k.err?'–':x.sz2?'✓ erfüllt':'✗ nicht erfüllt'}<small>Bedarf ${f1(x.Bed)} m³/h<br>IST (anrechenbar) ${f1(x.ist)} m³/h<br>${x.ist>=x.Bed?'Überschuss':'Fehlbetrag'} ${f1(Math.abs(x.ist-x.Bed))} m³/h</small></div></div>
<div class="lv-tw"><table class="lv-t"><tr><th>Raum</th><th>Kurve</th><th>Infiltr.</th><th>ALD</th><th>q<sub>s</sub></th><th>anrechenbar</th></tr>${x.rows.map(r=>`<tr><td>${E(r.n)}</td><td>${r.c?KT[r.c]:'–'}</td><td>${f1(r.qi)}</td><td>${f1(r.al)}</td><td>${f1(r.qs)}</td><td>${f1(r.an)}</td></tr>`).join('')}<tr><th>Σ (m³/h)</th><td></td><td></td><td></td><td></td><th>${f1(x.ist)}</th></tr></table></div>
<p class="lv-mu">Bedarf = Σ Nennleistung × 1,6 m³/(h·kW) = ${f1(x.Bcb)} m³/h${x.ablS?` + Abluft ${f1(x.ablS)} m³/h`:''} = ${f1(x.Bed)} m³/h (Formel 9-2)</p>${x.w.map(t=>`<div class="lv-wn">${IC.warn} ${E(t)}</div>`).join('')}</div>`});
return h+`<p class="lv-mu">Berechnung nach DVGW-TRGI 2018 (G 600) Abschnitt 9.2 und Anhang D sowie 8.3.2.4.2.1. Planungshilfe – ersetzt keine Prüfung durch den Fachbetrieb bzw. den bevollmächtigten Bezirksschornsteinfeger.</p>`}
function v3(){return result()+`<div class="form-actions" style="justify-content:flex-start"><button class="btn btn-gold" data-a="pr">${IC.print} Drucken</button></div>`}
const TABS=['Projekt','Gebäude','Räume','Ergebnis'];
function render(){root.innerHTML=`<div class="lv-tabs">${TABS.map((t,i)=>`<button class="btn ${tab==i?'btn-primary':'btn-light'}" data-t="${i}">${t}</button>`).join('')}</div>`+[v0,v1,v2,v3][tab]()}
root.addEventListener('input',e=>{const el=e.target;if(el.dataset.lp){const[j,id]=el.dataset.lp.split(':'),l=D.l[j];if(l.a==id)l.b=+el.value;else l.a=+el.value;save();return}
if(!el.dataset.k)return;set(el.dataset.k,el.type=='checkbox'?el.checked:el.value);save();if(el.dataset.re)render();else{const i=document.getElementById('lvInfo');if(i)i.innerHTML=infoTxt()}});
root.addEventListener('toggle',e=>{const i=e.target.dataset&&e.target.dataset.ri;if(i!=null&&D.r[i]){D.r[i].o=e.target.open;save()}},true);
async function saveFile(text,name){const f=new File([text],name,{type:'application/json'});try{if(navigator.maxTouchPoints>0&&navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return}}catch(err){if(err&&err.name==='AbortError')return}const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),6e4)}
root.addEventListener('change',e=>{if(e.target.id!=='lvImport')return;const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
rd.onload=()=>{try{const o=JSON.parse(rd.result);if(o.schema!=='schornstein-planer-luftverbund'||!o.project)throw 0;if(!confirm('Das aktuelle Luftverbund-Projekt wird durch die Datei ersetzt. Fortfahren?'))return;D=Object.assign(dflt(),o.project);save();tab=0;render()}catch(x){alert('Die Projektdatei konnte nicht gelesen werden.')}finally{e.target.value=''}};rd.readAsText(f)});
function unprint(){

  const r=document.getElementById('lvPrintRoot');
  if(r)r.remove();

  const s=document.getElementById('lvPrintStyle');
  if(s)s.remove();

  document.body.classList.remove('lv-printing');

}


/* =========================================================
   PDF-HILFSFUNKTIONEN
   ========================================================= */

/*
 * PDF-Text für WinAnsi/Helvetica vorbereiten.
 *
 * jsPDF brauchen wir hier bewusst NICHT.
 * Die PDF wird direkt als PDF 1.4 erzeugt.
 */
function lvPdfEncode(str){

  const cpMap={
    '€':0x80,
    '‚':0x82,
    'ƒ':0x83,
    '„':0x84,
    '…':0x85,
    '†':0x86,
    '‡':0x87,
    'ˆ':0x88,
    '‰':0x89,
    'Š':0x8A,
    '‹':0x8B,
    'Œ':0x8C,
    'Ž':0x8E,
    '‘':0x91,
    '’':0x92,
    '“':0x93,
    '”':0x94,
    '•':0x95,
    '–':0x96,
    '—':0x97,
    '˜':0x98,
    '™':0x99,
    'š':0x9A,
    '›':0x9B,
    'œ':0x9C,
    'ž':0x9E,
    'Ÿ':0x9F
  };

  let out='';

  for(const ch of String(str??'')){

    const c=ch.charCodeAt(0);

    if(c<32){

      out+=' ';

    }else if(c<128){

      out+=ch;

    }else if(c>=160 && c<=255){

      out+=ch;

    }else if(cpMap[ch]){

      out+=String.fromCharCode(cpMap[ch]);

    }else{

      /*
       * Nicht darstellbare Sonderzeichen.
       * Beispielsweise ✓ / ✗ werden als Text ersetzt.
       */
      out+='?';

    }

  }

  /*
   * PDF-Klammern und Backslash escapen.
   */
  return out.replace(/([\\()])/g,'\\$1');

}


/*
 * Farbe #rrggbb -> PDF-Farbwert.
 */
function lvPdfColor(hex){

  const n=parseInt(
    String(hex).replace('#',''),
    16
  );

  return [
    ((n>>16)&255)/255,
    ((n>>8)&255)/255,
    (n&255)/255
  ]
  .map(v=>v.toFixed(3))
  .join(' ');

}


/*
 * Textbreite ungefähr bestimmen.
 */
function lvPdfWidth(str,bold,size){

  const canvas=document.createElement('canvas');

  const ctx=canvas.getContext('2d');

  if(!ctx){

    return String(str).length*size*0.5;

  }

  ctx.font=
    (bold?'bold ':'')+
    size+
    'px Helvetica, Arial, sans-serif';

  return ctx.measureText(String(str)).width;

}


/*
 * Wörter umbrechen.
 */
function lvPdfWrap(str,size,bold,maxWidth){

  const result=[];

  String(str??'')
    .split(/\r?\n/)
    .forEach(paragraph=>{

      let line='';

      paragraph
        .split(/\s+/)
        .filter(Boolean)
        .forEach(word=>{

          const test=
            line
              ? line+' '+word
              : word;

          if(
            !line ||
            lvPdfWidth(
              test,
              bold,
              size
            )<=maxWidth
          ){

            line=test;

          }else{

            result.push(line);

            line=word;

          }

        });

      if(line)result.push(line);

    });

  return result;

}


/* =========================================================
   LUFTVERBUND-PDF
   ========================================================= */

function buildLuftverbundPdf(){

  const R=run(D);

  const pageW=595.28;
  const pageH=841.89;

  const margin=42;

  const contentW=
    pageW-
    margin*2;

  const pages=[];

  let ops=[];

  let y=margin;


  /*
   * Neue PDF-Seite
   */
  function newPage(){

    if(ops.length){

      pages.push(
        ops.join('\n')
      );

    }

    ops=[];

    y=margin;

  }


  /*
   * Seitenumbruch prüfen.
   */
  function need(h){

    if(y+h>pageH-margin){

      newPage();

    }

  }


  /*
   * Text
   */
  function text(
    x,
    yy,
    value,
    options={}
  ){

    const size=
      options.size||
      10;

    const bold=
      !!options.bold;

    const color=
      options.color||
      '#22272d';

    const font=
      bold
        ? 'F2'
        : 'F1';

    const tx=
      options.align==='center'
        ? x-lvPdfWidth(value,bold,size)/2
        : x;

    ops.push(
      `BT /${font} ${size} Tf `+
      `${lvPdfColor(color)} rg `+
      `${tx.toFixed(2)} `+
      `${(pageH-yy).toFixed(2)} Td `+
      (${lvPdfEncode(value)}) Tj ET
    );

  }


  /*
   * Mehrzeiliger Text
   */
  function paragraph(
    value,
    options={}
  ){

    const size=
      options.size||
      9.5;

    const bold=
      !!options.bold;

    const leading=
      options.leading||
      size*1.45;

    const lines=
      lvPdfWrap(
        value,
        size,
        bold,
        options.width||
        contentW
      );

    lines.forEach(line=>{

      need(leading);

      text(
        options.x||
        margin,
        y,
        line,
        {
          size,
          bold,
          color:
            options.color
        }
      );

      y+=leading;

    });

  }


  /*
   * Rechteck
   */
  function rect(
    x,
    yy,
    w,
    h,
    options={}
  ){

    const fill=
      options.fill
        ? `${lvPdfColor(options.fill)} rg `
        : '';

    const stroke=
      options.stroke
        ? `${lvPdfColor(options.stroke)} RG `
        : '';

    const lw=
      options.lw||
      1;

    ops.push(
      `${fill}${stroke}${lw} w `+
      `${x.toFixed(2)} `+
      `${(pageH-yy-h).toFixed(2)} `+
      `${w.toFixed(2)} `+
      `${h.toFixed(2)} re `+
      (
        options.fill&&options.stroke
          ? 'B'
          : options.fill
            ? 'f'
            : 'S'
      )
    );

  }


  /*
   * Linie
   */
  function line(
    x1,
    y1,
    x2,
    y2,
    color='#999999',
    lw=1
  ){

    ops.push(
      `${lvPdfColor(color)} RG `+
      `${lw} w `+
      `${x1.toFixed(2)} `+
      `${(pageH-y1).toFixed(2)} m `+
      `${x2.toFixed(2)} `+
      ${(pageH-y2).toFixed(2)} l S
    );

  }


  /*
   * Überschrift
   */
  function heading(
    title,
    subtitle=''
  ){

    need(65);

    text(
      margin,
      y,
      title,
      {
        size:17,
        bold:true,
        color:'#22272d'
      }
    );

    y+=22;

    if(subtitle){

      paragraph(
        subtitle,
        {
          size:9,
          width:contentW,
          color:'#6c757d',
          leading:13
        }
      );

    }

    y+=6;

    line(
      margin,
      y,
      margin+contentW,
      y,
      '#c79a42',
      1.4
    );

    y+=18;

  }


  /*
   * Kleine Statusbox
   */
  function statusBox(
    x,
    yy,
    w,
    h,
    title,
    value,
    ok,
    small=''
  ){

    const fill=
      ok
        ? '#eef7f0'
        : '#fbeeee';

    const stroke=
      ok
        ? '#3d8b50'
        : '#bd4b4b';

    rect(
      x,
      yy,
      w,
      h,
      {
        fill,
        stroke,
        lw:1
      }
    );

    text(
      x+10,
      yy+18,
      title,
      {
        size:9,
        bold:true,
        color:stroke
      }
    );

    text(
      x+10,
      yy+36,
      value,
      {
        size:11,
        bold:true,
        color:stroke
      }
    );

    if(small){

      const lines=
        lvPdfWrap(
          small,
          7.5,
          false,
          w-20
        );

      let sy=yy+49;

      lines.slice(0,3).forEach(t=>{

        text(
          x+10,
          sy,
          t,
          {
            size:7.5,
            color:'#555555'
          }
        );

        sy+=10;

      });

    }

  }


  /*
   * Tabellenzeile
   */
  function tableRow(
    values,
    widths,
    options={}
  ){

    const size=
      options.size||
      7.8;

    const bold=
      !!options.bold;

    const rowH=
      options.rowH||
      22;

    need(rowH);

    let x=margin;

    values.forEach((value,i)=>{

      const w=widths[i];

      rect(
        x,
        y,
        w,
        rowH,
        {
          fill:
            options.header
              ? '#f2f3f4'
              : '#ffffff',
          stroke:'#d4d7da',
          lw:.5
        }
      );

      const lines=
        lvPdfWrap(
          String(value??''),
          size,
          bold,
          w-8
        );

      let ty=
        y+11;

      lines.slice(0,2).forEach(t=>{

        text(
          x+4,
          ty,
          t,
          {
            size,
            bold,
            color:
              options.header
                ? '#22272d'
                : '#333333'
          }
        );

        ty+=9;

      });

      x+=w;

    });

    y+=rowH;

  }


  /*
   * Kopf
   */
  const P=D.p||{};

  heading(
    'Berechnung der Verbrennungsluftversorgung',
    [
      P.n||'',
      P.nr
        ? 'Nr. '+P.nr
        : '',
      P.dt
        ? P.dt
        : ''
    ]
    .filter(Boolean)
    .join(' · ')
  );


  /*
   * Projektinformationen
   */
  need(100);

  rect(
    margin,
    y,
    contentW,
    84,
    {
      fill:'#f7f8f9',
      stroke:'#d4d7da',
      lw:.7
    }
  );

  text(
    margin+12,
    y+18,
    'Projekt / Gebäude',
    {
      size:11,
      bold:true
    }
  );

  let iy=y+34;

  const projectLines=[
    ['Eigentümer',P.en],
    ['Anschrift',P.ea],
    ['Gebäude',P.ga],
    ['Lage',P.gl],
    ['Ersteller',P.ers]
  ];

  projectLines.forEach(([label,value])=>{

    if(!value)return;

    text(
      margin+12,
      iy,
      label+':',
      {
        size:8,
        bold:true,
        color:'#6c757d'
      }
    );

    text(
      margin+90,
      iy,
      String(value),
      {
        size:8.5
      }
    );

    iy+=11;

  });

  y+=98;


  /*
   * Gebäudekennwerte
   */
  need(65);

  text(
    margin,
    y,
    'Kennwerte der Nutzungseinheit',
    {
      size:11,
      bold:true
    }
  );

  y+=17;

  const kn=R.kn;

  paragraph(
    n50 = ${f1(kn.n50)} h⁻¹ · f_wirk.komp. = ${String(kn.f).replace('.',',')} · n = ${f2(kn.n)} h⁻¹,
    {
      size:9,
      width:contentW
    }
  );

  if(kn.err){

    need(35);

    paragraph(
      kn.err,
      {
        size:8.5,
        color:'#9a5f00',
        width:contentW
      }
    );

  }

  y+=6;


  /*
   * Keine Feuerstätten
   */
  if(!R.res.length){

    need(80);

    rect(
      margin,
      y,
      contentW,
      55,
      {
        fill:'#f7f8f9',
        stroke:'#d4d7da'
      }
    );

    paragraph(
      'Noch keine Feuerstätte (Gas-/Feststoff-/Ölgerät) in einem Raum erfasst.',
      {
        x:margin+12,
        width:contentW-24,
        size:10
      }
    );

    newPage();

  }else{


    /*
     * Jeden Aufstellraum ausgeben.
     */
    R.res.forEach((x,index)=>{

      /*
       * Aufstellraum-Überschrift
       */
      need(75);

      heading(
        Aufstellraum: ${x.A.n||'Raum'} (${x.A.v||'?'} m³),
        Berechnungsnachweis ${index+1} von ${R.res.length}
      );


      /*
       * Statusboxen
       */
      const gap=10;

      const boxW=
        (contentW-gap)/2;

      const s=x.s1;

      const sz1=
        s
          ? (
            s.ok
              ? '✓ erfüllt'
              : '✗ nicht erfüllt'
          )
          : '– nicht erforderlich';

      const sz2=
        kn.err
          ? '–'
          : (
            x.sz2
              ? '✓ erfüllt'
              : '✗ nicht erfüllt'
          );

      const sz1small=
        s
          ? RLV ${f2(s.rlv0)} (${s.V0} m³ / ${f1(s.kw)} kW), gefordert ≥ 1,0 m³/kW
          : 'nur bei Gasgeräten Art B1/B4';

      const sz2small=
        Bedarf ${f1(x.Bed)} m³/h · IST ${f1(x.ist)} m³/h;

      statusBox(
        margin,
        y,
        boxW,
        70,
        'Schutzziel 1',
        sz1,
        !!(s&&s.ok),
        sz1small
      );

      statusBox(
        margin+boxW+gap,
        y,
        boxW,
        70,
        'Schutzziel 2',
        sz2,
        !!x.sz2,
        sz2small
      );

      y+=82;


      /*
       * Tabelle
       */
      text(
        margin,
        y,
        'Anrechenbare Luftmengen',
        {
          size:10,
          bold:true
        }
      );

      y+=12;

      const widths=[
        125,
        65,
        72,
        65,
        72,
        contentW-
          (125+65+72+65+72)
      ];

      tableRow(
        [
          'Raum',
          'Kurve',
          'Infiltration',
          'ALD',
          'q_s',
          'anrechenbar'
        ],
        widths,
        {
          header:true,
          bold:true,
          rowH:24
        }
      );


      x.rows.forEach(r=>{

        tableRow(
          [
            r.n,
            r.c
              ? KT[r.c]
              : '–',
            f1(r.qi),
            f1(r.al),
            f1(r.qs),
            f1(r.an)
          ],
          widths,
          {
            rowH:23
          }
        );

      });


      tableRow(
        [
          'Σ (m³/h)',
          '',
          '',
          '',
          '',
          f1(x.ist)
        ],
        widths,
        {
          bold:true,
          rowH:24
        }
      );


      y+=12;


      /*
       * Bedarf
       */
      need(48);

      paragraph(
        Bedarf = Σ Nennleistung × 1,6 m³/(h·kW) = ${f1(x.Bcb)} m³/h+
        (
          x.ablS
            ? ` + Abluft ${f1(x.ablS)} m³/h`
            : ''
        )+
        ` = ${f1(x.Bed)} m³/h (Formel 9-2).`,
        {
          size:9,
          bold:true,
          width:contentW
        }
      );


      /*
       * Überschuss / Fehlbetrag
       */
      const diff=
        Math.abs(x.ist-x.Bed);

      paragraph(
        x.ist>=x.Bed
          ? Überschuss: ${f1(diff)} m³/h
          : Fehlbetrag: ${f1(diff)} m³/h,
        {
          size:9,
          bold:true,
          color:
            x.ist>=x.Bed
              ? '#3d8b50'
              : '#bd4b4b',
          width:contentW
        }
      );


      /*
       * Schutzziel 1 Zusatzinformation
       */
      if(s){

        if(s.nb&&s.nb.length){

          paragraph(
            Zusätzlich angerechnet über 2 × 150 cm² zu: ${s.nb.join(', ')}. Gesamtvolumen ${f1(s.V)} m³; RLV ${f2(s.rlv)}.,
            {
              size:8.5,
              width:contentW
            }
          );

        }

      }


      /*
       * Warnungen
       */
      if(x.w&&x.w.length){

        x.w.forEach(w=>{

          need(45);

          const lines=
            lvPdfWrap(
              'Hinweis: '+w,
              8,
              false,
              contentW-24
            );

          const h=
            Math.max(
              30,
              lines.length*11+18
            );

          rect(
            margin,
            y,
            contentW,
            h,
            {
              fill:'#fbf5e7',
              stroke:'#e7d19d',
              lw:.7
            }
          );

          let wy=y+14;

          lines.forEach(t=>{

            text(
              margin+10,
              wy,
              t,
              {
                size:8,
                color:'#6b531c'
              }
            );

            wy+=11;

          });

          y+=h+8;

        });

      }

      y+=12;

    });

  }


  /*
   * Fußtext
   */
  need(60);

  line(
    margin,
    y,
    margin+contentW,
    y,
    '#c79a42',
    1
  );

  y+=17;

  paragraph(
    'Berechnung nach DVGW-TRGI 2018 (G 600) Abschnitt 9.2 und Anhang D sowie 8.3.2.4.2.1. Planungshilfe – ersetzt keine Prüfung durch den Fachbetrieb bzw. den bevollmächtigten Bezirksschornsteinfeger.',
    {
      size:7.5,
      color:'#6c757d',
      width:contentW,
      leading:10
    }
  );


  /*
   * Letzte Seite speichern.
   */
  if(ops.length){

    pages.push(
      ops.join('\n')
    );

  }


  /*
   * PDF-Objekte.
   */
  const objects=[

    '<< /Type /Catalog /Pages 2 0 R >>',

    << /Type /Pages /Kids [+
      pages
        .map(
          (_,i)=>
            ${5+i*2} 0 R
        )
        .join(' ')+
      ] /Count ${pages.length} >>,

    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',

    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  ];


  /*
   * Seitenobjekte.
   */
  pages.forEach((stream,i)=>{

    objects.push(
      `<< /Type /Page `+
      `/Parent 2 0 R `+
      `/MediaBox [0 0 ${pageW} ${pageH}] `+
      `/Resources << /Font << `+
      `/F1 3 0 R /F2 4 0 R `+
      `>> >> `+
      /Contents ${6+i*2} 0 R >>
    );

    objects.push(
      << /Length ${stream.length} >>\n+
      stream\n+
      ${stream}\n+
      endstream
    );

  });


  /*
   * PDF zusammenbauen.
   */
  let pdf=
    '%PDF-1.4\n'+
    '%\u00e2\u00e3\u00cf\u00d3\n';

  const offsets=[];


  objects.forEach((obj,i)=>{

    offsets.push(pdf.length);

    pdf+=
      ${i+1} 0 obj\n+
      ${obj}\n+
      endobj\n;

  });


  const xref=
    pdf.length;

  pdf+=
    xref\n+
    0 ${objects.length+1}\n+
    0000000000 65535 f \n+
    offsets
      .map(
        o=>
          String(o)
            .padStart(10,'0')+
          ' 00000 n \n'
      )
      .join('')+
    trailer\n+
    << /Size ${objects.length+1} /Root 1 0 R >>\n+
    startxref\n+
    ${xref}\n+
    %%EOF;


  /*
   * String -> ByteArray
   */
  const bytes=
    new Uint8Array(
      pdf.length
    );

  for(
    let i=0;
    i<pdf.length;
    i++
  ){

    bytes[i]=
      pdf.charCodeAt(i)&255;

  }


  return new Blob(
    [bytes],
    {
      type:'application/pdf'
    }
  );

}


/* =========================================================
   PDF TEILEN / SPEICHERN
   ========================================================= */

async function shareLuftverbundPdf(
  blob,
  name
){

  try{

    const file=
      new File(
        [blob],
        name,
        {
          type:'application/pdf'
        }
      );


    /*
     * Smartphone kann PDF-Dateien teilen.
     */
    if(
      navigator.canShare &&
      navigator.canShare({
        files:[file]
      })
    ){

      await navigator.share({

        files:[file],

        title:name,

        text:
          'Berechnungsnachweis Luftverbund nach TRGI 2018'

      });

      return;

    }

  }catch(err){

    /*
     * Benutzer hat Teilen abgebrochen.
     */
    if(
      err &&
      err.name==='AbortError'
    ){

      return;

    }

  }


  /*
   * Fallback:
   * PDF herunterladen.
   */
  const url=
    URL.createObjectURL(blob);

  const a=
    document.createElement('a');

  a.href=url;

  a.download=name;

  a.style.display='none';

  document.body.appendChild(a);

  a.click();

  a.remove();


  setTimeout(
    ()=>{
      URL.revokeObjectURL(url);
    },
    60000
  );

}


/* =========================================================
   DRUCKFUNKTION
   ========================================================= */

async function doPrint(){

  unprint();


  /*
   * ---------------------------------------------------------
   * iOS HOME-BILDSCHIRM / PWA
   * ---------------------------------------------------------
   *
   * window.navigator.standalone ist die klassische
   * iOS-Erkennung.
   */
  const iosStandalone=
    window.navigator.standalone===true;


  /*
   * ---------------------------------------------------------
   * Android / andere installierte PWA
   * ---------------------------------------------------------
   */
  const standalone=
    window.matchMedia &&
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches;


  /*
   * ---------------------------------------------------------
   * PDF auf PWA erzeugen
   * ---------------------------------------------------------
   */
  if(
    iosStandalone||
    standalone
  ){

    try{

      const blob=
        buildLuftverbundPdf();


      const projekt=
        (
          D.p.nr||
          D.p.n||
          'projekt'
        )
        .replace(
          /[^\w.-]+/g,
          '_'
        );


      const datum=
        new Date()
          .toISOString()
          .slice(0,10);


      const filename=
        'Luftverbund-Berechnungsnachweis-'+
        projekt+
        '-'+
        datum+
        '.pdf';


      await shareLuftverbundPdf(
        blob,
        filename
      );


    }catch(err){

      console.error(
        'Luftverbund-PDF:',
        err
      );

      alert(
        'Die PDF konnte nicht erstellt werden.\n\n'+
        (
          err&&err.message
            ? err.message
            : 'Unbekannter Fehler'
        )
      );

    }

    return;

  }


  /*
   * ---------------------------------------------------------
   * NORMALER BROWSER / PC
   * ---------------------------------------------------------
   */

  const s=
    document.createElement('style');

  s.id='lvPrintStyle';

  s.textContent=`

    @page{
      size:A4;
      margin:12mm;
    }

    #lvPrintRoot{
      display:none;
    }

    @media print{

      body.lv-printing>
      *:not(#lvPrintRoot){
        display:none!important;
      }

      #lvPrintRoot{
        display:block!important;
        position:static!important;
        width:auto!important;
        margin:0!important;
        padding:0!important;
        background:#fff!important;
      }

      body{
        background:#fff!important;
      }

      #lvPrintRoot .card{
        box-shadow:none!important;
        break-inside:avoid;
        page-break-inside:avoid;
        border:1px solid #999;
      }

      #lvPrintRoot *{
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }

      #lvPrintRoot .form-actions{
        display:none!important;
      }

    }

  `;


  /*
   * Druckinhalt
   */
  const r=
    document.createElement('div');

  r.id='lvPrintRoot';

  r.innerHTML=
    result();


  document.head.appendChild(s);

  document.body.appendChild(r);

  document.body.classList.add(
    'lv-printing'
  );


  /*
   * Direkter Druckdialog.
   *
   * Kein zusätzlicher PDF-Aufruf.
   */
  try{

    window.print();

  }catch(err){

    console.error(
      'window.print():',
      err
    );

    alert(
      'Der Druckdialog konnte nicht geöffnet werden.'
    );

  }

}
root.addEventListener('click',e=>{const t=e.target.closest('[data-t],[data-a]');if(!t)return;
if(t.dataset.t!=null){tab=+t.dataset.t;render();root.scrollIntoView();return}
const a=t.dataset.a,i=+t.dataset.i,j=+t.dataset.j;
if(a=='gb'){const b=document.getElementById('spBackupData');if(b)b.click();else alert('Die Sicherung steht im Bereich „Planung & Termine“.');return}
if(a=='pe'){saveFile(JSON.stringify({schema:'schornstein-planer-luftverbund',version:1,project:D},null,2),'luftverbund-'+((D.p.nr||D.p.n||'projekt').replace(/[^\w.-]+/g,'_'))+'.json');return}
if(a=='np'){if(!confirm('Neues Projekt anlegen? Das aktuelle Projekt wird gelöscht – vorher ggf. als Datei sichern.'))return;D=dflt();tab=0}
if(a=='pr'){doPrint();return}
if(a=='ar'){D.r.forEach(r=>r.o=false);D.r.push({id:D.id++,n:'',v:'',fen:'',tuer:'',ald:'',qa:'',f:[],o:true})}
if(a=='dr'){const id=D.r[i].id;D.r.splice(i,1);D.l=D.l.filter(l=>l.a!=id&&l.b!=id)}
if(a=='af')D.r[i].f.push({a:'b1',n:'',v:''});if(a=='df')D.r[i].f.splice(j,1);
if(a=='al'){const me=D.r[i].id,o=D.r.find(x=>x.id!=me&&!D.l.some(l=>(l.a==me&&l.b==x.id)||(l.b==me&&l.a==x.id)))||D.r.find(x=>x.id!=me);D.l.push({a:me,b:o.id,t:'t',d:'3',k:'0',o:'0'})}
if(a=='dl')D.l.splice(i,1);
save();render()});
const css=document.createElement('style');css.textContent=`#luftverbundView{scroll-margin-top:140px}.lv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}.lv-bd{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:0 0 14px}.lv-b{padding:15px;border-radius:13px;border:1px solid;border-left-width:6px;font-weight:800;font-size:1.05rem}.lv-b small{display:block;margin-top:6px;font-weight:500;font-size:.84rem;color:var(--text)}.lv-ok{background:var(--green-light);border-color:var(--green);color:var(--green)}.lv-no{background:var(--red-light);border-color:var(--red);color:var(--red)}.lv-na{background:#f7f8f9;border-color:var(--border);color:var(--muted)}.lv-room{background:var(--card);border:1px solid var(--border);border-radius:13px;margin-bottom:12px;overflow:hidden}.lv-room>summary{padding:13px 16px;background:#f7f8f9;font-weight:800;cursor:pointer}.lv-body{padding:16px}.lv-it{border-top:1px dashed var(--border);padding-top:12px;margin-top:12px}.lv-h4{margin:16px 0 4px;font-size:.78rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.lv-ck{display:flex;gap:8px;align-items:center;font-size:.86rem;margin:8px 0}.lv-tw{overflow-x:auto}.lv-t{border-collapse:collapse;width:100%;font-size:.86rem}.lv-t th,.lv-t td{border-bottom:1px solid var(--border);padding:7px 8px;text-align:right}.lv-t th{background:#f7f8f9}.lv-t th:first-child,.lv-t td:first-child{text-align:left}.lv-wn{margin:8px 0;padding:9px 12px;border-radius:10px;background:var(--gold-light);border:1px solid #e7d19d;font-size:.85rem}.lv-mu{color:var(--muted);font-size:.85rem;margin:8px 0}`;
document.head.appendChild(css);
render();
})();
