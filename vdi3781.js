/* Schornsteinhöhe nach VDI 3781 Blatt 4 – Rezirkulationszone, Dachformen, vorgelagerte Gebäude
 * Schornstein Planer
 *
 * Die Rechenschritte entsprechen dem Programm „VDI3781-4“ (Version 1.23)
 * von Andreas Schoßland und wurden gegen dessen Rechenmethoden geprüft.
 */
(function () {
  "use strict";
  const root = typeof window !== "undefined" ? window : globalThis;
  /* =========================================================
     BERECHNUNG  (VDI 3781 Blatt 4 – Ableitbedingungen)
     Die Rechenschritte entsprechen dem Programm
     „VDI3781-4“ (Version 1.23 / 23.11.27, Andreas Schoßland).
     Winkel werden – wie dort – mit der gerundeten Konstante
     0,01745329252 in Bogenmaß umgerechnet.
     ========================================================= */
  const BM = 0.01745329252;

  /* .NET-Math.Round(x, d): x * 10^d, auf gerade Zahl runden, zurückteilen */
  function rint(v) {
    const fl = Math.floor(v);
    const d = v - fl;
    if (d < 0.5) return fl;
    if (d > 0.5) return fl + 1;
    return fl % 2 === 0 ? fl : fl + 1;
  }
  const rnd = (x, d) => {
    const p = Math.pow(10, d);
    return rint(x * p) / p;
  };
  const r2 = x => rnd(x, 2);
  const r1c = x => rnd(x, 1);
  const T = deg => Math.tan(deg * BM);

  const ROOFS = [
    { id: 0, name: "Flachdach" },
    { id: 1, name: "Sheddach" },
    { id: 2, name: "Satteldach" },
    { id: 3, name: "asymmetrisches Dach" },
    { id: 4, name: "Pultdach" },
    { id: 5, name: "Walmdach" },
    { id: 6, name: "Mansardendach" }
  ];

  /* Zuschlag H_Ü je Nennwärmeleistung (kW): bis 400 kW 0,4 m, bis unter 1 MW 1,0 m, darüber 3,0 m */
  function huebernn(nn) {
    if (nn <= 400) return 0.4;
    if (nn < 1000) return 1.0;
    return 3.0;
  }

  /* DatenBerechnen: Winkel γ und Faktor f je Dachneigung */
  function gammaF(S, al) {
    if (al < 21) { S.gamma = 0; S.f = 0.85; }
    if (al > 20 && al < 31) { S.gamma = 0; S.f = 0.85 - 0.015 * (al - 20); }
    if (al >= 31 && al < 46) { S.gamma = 0.667 * (al - 30); S.f = 0.7 - 0.01333 * (al - 30); }
    if (al > 45 && al < 60) { S.gamma = 10 + 0.667 * (al - 45); S.f = 0.5 - 0.00333 * (al - 45); }
    if (al >= 60) { S.gamma = 20; S.f = 0.45; }
  }

  function roofFlat(S) {
    S.HFirst = S.ht + S.att;
    S.HDach20 = r2(S.b / 2 * 0.36397);
    S.HDach = S.HDach20;
    S.HA1 = r2(S.HDach20 + S.HUe);
    S.HA1 = S.HA1 + S.att;
    S.HA1F = r2(Math.pow(S.HFirst * S.HFirst, 0.33333333) * 1.3 + S.HUe);
    S.HA1 = Math.min(S.HA1, S.HA1F);
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    S.l12 = S.HDach20 + S.att;
    S.l13 = S.HUe;
    S.l14 = S.HA1;
    /* Original: HA1 + HFirst (Attika würde doppelt gezählt) */
    S.l15 = S.ht + S.HA1;
  }

  function roofShed(S) {
    S.HDach20 = r2(S.b / 2 * T(20));
    S.HA1 = S.HDach20 + S.HUe;
    S.HFirst = S.ht;
    S.HA1F = r2(Math.pow(S.HFirst * S.HFirst, 0.33333) * 1.3 + S.HUe);
    S.HA1 = Math.min(S.HA1, S.HA1F);
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    S.l12 = S.HDach20;
    S.l13 = S.HUe;
    S.l14 = S.HA1;
    S.l15 = S.HA1 + S.ht;
  }

  function roofSattelBis20(S) {
    S.HDach = r2(S.b / 2 * T(S.al));
    S.HDach20 = S.b / 2 * 0.364;
    S.H1 = (S.a + S.b / 2) * T(20) - S.HDach;
    S.f = S.al / 20 * 0.85;
    S.H2 = (1 + S.f) * S.b / 2 * T(20) - S.HDach;
    S.Hs1 = Math.min(S.H1, S.H2);
    S.HA1 = r2(S.Hs1) + S.HUe;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofSattelOver20(S) {
    S.HDach = r2(T(S.al) * S.b / 2);
    S.H1 = S.a * T(S.al - S.gamma);
    S.H2 = S.f * S.HDach;
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function asymLoop(S) {
    S.winkel2 = 0; S.winkel = 0;
    S.annahmea = S.b - 0.5;
    S.annahmeb = 0.5;
    S.hoehea = r2(S.annahmea * T(S.al));
    S.hoeheb = r2(S.annahmeb * T(S.al2));
    let guard = 0;
    while (S.hoehea > S.hoeheb && guard++ < 100000) {
      S.annahmea = S.annahmea - 0.01;
      S.annahmeb = S.annahmeb + 0.01;
      S.hoehea = r2(S.annahmea * T(S.al));
      S.hoeheb = r2(S.annahmeb * T(S.al2));
    }
    S.asyna = r2(S.annahmea);
    S.asynb = r2(S.annahmeb);
  }

  function roofAsymBis20(S) {
    if (S.al2 > 75) {
      S.hausTyp = 5;
      if (S.a < 0) S.a = S.a * -1;
      roofPultBis20(S);
      return;
    }
    asymLoop(S);
    S.HDach = r2(S.annahmea * 0.364);
    if (S.a < 0) {
      gammaF(S, S.al2);
      S.winkel = S.al; S.winkel2 = S.al2;
      S.H1 = S.a * -1 * T(S.winkel2 - S.gamma);
      S.H2 = S.f * S.HDach;
    } else {
      S.f = S.al / 20 * 0.85;
      S.gamma = 0;
      S.winkel = S.al2; S.winkel2 = S.al;
      S.H1 = (S.a + S.annahmea) * T(20) - S.HDach;
      S.H2 = (1 + S.f) * S.annahmea * T(20) - S.HDach;
    }
    S.HA1 = r2(Math.min(S.H1, S.H2)) + S.HUe;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    if (S.a < 0) {
      S.l14 = S.annahmea + S.a > 0
        ? r2(S.HA1 + S.HDach - (S.annahmea + S.a) * T(S.winkel))
        : r2(S.HA1 + S.HDach);
    } else {
      S.l14 = r2(S.a * T(S.winkel) + S.HA1);
    }
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofAsymOver20(S) {
    if (S.al2 > 75) {
      S.hausTyp = 5;
      if (S.a < 0) S.a = S.a * -1;
      roofPultOver20(S);
      return;
    }
    asymLoop(S);
    S.HDach = S.hoehea;
    if (S.a < 0) {
      gammaF(S, S.al2);
      S.winkel = S.al; S.winkel2 = S.al2;
      S.H1 = S.a * -1 * T(S.winkel2 - S.gamma);
    } else {
      gammaF(S, S.al);
      S.winkel = S.al2; S.winkel2 = S.al;
      S.H1 = S.a * T(S.winkel2 - S.gamma);
    }
    S.H2 = S.f * S.HDach;
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    if (S.a >= 0) S.l14 = r2(S.a * T(S.winkel) + S.HA1);
    else S.l14 = r2(S.a * -1 * T(S.winkel) + S.HA1);
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofPultBis20(S) {
    const loc0 = (S.b / 2 - S.a) * (1 - S.al / 20);
    S.hoehePult = r2(S.b * T(S.al));
    S.HDach20 = S.b * T(20);
    S.H1 = (S.a + loc0) * T(20);
    S.H2 = S.b / 2 * T(20);
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    /* Original zeigt hier Pulthöhe + HA1 als „Höhe bis First“ */
    S.l12 = S.hoehePult;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.hoehePult + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofPultOver20(S) {
    S.hoehePult = r2(S.b * T(S.al));
    S.HDach20 = S.b * T(20);
    S.H1 = S.a * T(20);
    S.H2 = S.b / 2 * T(20);
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = 0;
    S.l12 = S.hoehePult;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.hoehePult + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofWalmBis20(S) {
    S.HDach20 = S.b / 2 * T(20);
    S.HDach = r2(S.b / 2 * T(S.al));
    S.H1 = (S.a + S.b / 2) * T(20) - S.HDach;
    S.f = S.al / 20 * 0.85;
    S.H2 = (1 + S.f) * S.b / 2 * T(20) - S.HDach;
    S.Hs1 = Math.min(S.H1, S.H2);
    S.walmFaktor = S.len / S.b < 1.21;
    if (S.walmFaktor) S.Hs1 = S.Hs1 * 0.6;
    S.HA1 = S.Hs1 + S.HUe;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofWalmOver20(S) {
    S.HDach = r2(T(S.al) * S.b / 2);
    S.H1 = S.a * T(S.al - S.gamma);
    S.H2 = S.f * S.HDach;
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.walmFaktor = S.len / S.b < 1.21;
    if (S.walmFaktor) S.Hs1 = S.Hs1 * 0.6;
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = S.HDach;
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = S.HDach + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function mansardTotal(S) {
    return r2((S.b - S.bo) / 2 * T(S.al2) + S.bo / 2 * T(S.al));
  }

  function roofMansBis20(S) {
    gammaF(S, S.al);
    S.HDach20 = S.b / 2 * T(20);
    S.HDacho = r2(S.bo / 2 * T(S.al));
    S.H1o = (S.a + S.b / 2) * T(20) - S.HDacho;
    S.f = S.al / 20 * 0.85;
    S.H2o = (1 + S.f) * S.bo / 2 * T(20) - S.HDacho;
    gammaF(S, S.al2);
    S.HDachu = r2(T(S.al2) * S.b / 2);
    S.H1u = S.a * T(S.al2 - S.gamma);
    S.H2u = S.f * S.HDachu;
    S.H1 = r2(S.bo / S.b * S.H1o + (1 - S.bo / S.b) * S.H1u);
    S.H2 = r2(S.bo / S.b * S.H2o + (1 - S.bo / S.b) * S.H2u);
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = mansardTotal(S);
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = mansardTotal(S) + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  function roofMansOver20(S) {
    gammaF(S, S.al);
    S.HDacho = r2(T(S.al) * S.b / 2);
    S.H1o = S.a * T(S.al - S.gamma);
    S.H2o = S.f * S.HDacho;
    gammaF(S, S.al2);
    S.HDachu = r2(T(S.al2) * S.b / 2);
    S.H1u = S.a * T(S.al2 - S.gamma);
    S.H2u = S.f * S.HDachu;
    S.H1 = r2(S.bo / S.b * S.H1o + (1 - S.bo / S.b) * S.H1u);
    S.H2 = r2(S.bo / S.b * S.H2o + (1 - S.bo / S.b) * S.H2u);
    S.Hs1 = r2(Math.min(S.H1, S.H2));
    S.HA1 = S.HUe + S.Hs1;
    S.HA1 = Math.max(S.HA1, S.HA2v);
    S.hausmitte = r2(S.b / 2);
    S.l12 = mansardTotal(S);
    S.l13 = S.HA1;
    S.l14 = r2(S.a * T(S.al) + S.HA1);
    S.l15 = mansardTotal(S) + S.HA1 + S.ht;
    S.HFirst = S.ht + S.HDach;
  }

  /* Umkreis (m) und Mindestüberragung (m) von Fenstern/Lüftungsöffnungen je Nennwärmeleistung in kW
     (Festbrennstoff: § 19 Abs. 1 Satz 5 der 1. BImSchV; Öl/Gas: Rechenverfahren des Programms) */
  function fensterAbstand(nn /* Nennwärmeleistung in kW */, oelgas) {
    let meter = Math.trunc((nn - 1) / 50);
    let hoehe = 0;
    if (oelgas) {
      if (meter < 9) hoehe = 1;
      if (meter === 9 || meter === 10) hoehe = 2;
      if (meter > 10 && meter < 15) hoehe = 3;
      if (meter > 14 && meter < 23) hoehe = 4;
      if (meter > 22) hoehe = 5;
      meter = meter + 8;
      if (meter > 50) meter = 50;
    } else {
      if (meter === 0) hoehe = 1;
      if (meter === 1) hoehe = 2;
      if (meter === 2 || meter === 3) hoehe = 3;
      if (meter > 3 && meter < 8) hoehe = 4;
      if (meter > 7) { hoehe = 5; meter = 50; }
      else meter = 15 + 2 * meter;
    }
    return { meter, hoehe };
  }

  /* inp: vt (0..6), nn, b, len, a, ht, al, al2, bo, att, ha2v, oelgas */
  function calcRoof(inp) {
    const S = {
      vt: inp.vt, b: inp.b, len: inp.len, a: inp.a, ht: inp.ht,
      al: Math.round(inp.al || 0), al2: Math.round(inp.al2 || 0),
      bo: inp.bo || 0, att: inp.att || 0, HA2v: inp.ha2v || 0,
      nn: Math.round(inp.nn || 0),
      HDach: 0, HDach20: 0, HFirst: 0, HA1: 0, hoehePult: 0, asyna: 0, asynb: 0,
      gamma: 0, f: 0, HDacho: 0, HDachu: 0, walmFaktor: false
    };
    S.HUe = huebernn(S.nn);
    if (S.vt === 0) S.hausTyp = 0;
    if (S.vt === 1) S.hausTyp = 7;
    S.unter20 = false;
    if (S.vt >= 2 && S.al < 21) S.unter20 = true;
    if ((S.vt === 3 || S.vt === 6) && S.al2 < 21) S.unter20 = true;
    gammaF(S, S.al);
    const u = S.unter20;
    if (S.vt === 2) S.hausTyp = u ? 1 : 2;
    if (S.vt === 3) S.hausTyp = u ? 3 : 4;
    if (S.vt === 4) S.hausTyp = u ? 5 : 6;
    if (S.vt === 5) S.hausTyp = u ? 8 : 9;
    if (S.vt === 6) S.hausTyp = u ? 10 : 11;

    let loc2 = 0;
    if (S.hausTyp === 0) roofFlat(S);
    if (S.hausTyp === 1) { roofSattelBis20(S); loc2 = S.HDach20; }
    if (S.hausTyp === 2) roofSattelOver20(S);
    if (S.hausTyp === 3) { roofAsymBis20(S); loc2 = S.HDach20; }
    if (S.hausTyp === 4) roofAsymOver20(S);
    if (S.hausTyp === 5) roofPultBis20(S);
    if (S.hausTyp === 6) roofPultOver20(S);
    if (S.hausTyp === 7) roofShed(S);
    if (S.hausTyp === 8) { roofWalmBis20(S); loc2 = S.HDach20; }
    if (S.hausTyp === 9) roofWalmOver20(S);
    if (S.hausTyp === 10) { roofMansBis20(S); loc2 = S.HDach20; }
    if (S.hausTyp === 11) roofMansOver20(S);

    /* § 19 Abs. 1 Satz 1 bis 3 der 1. BImSchV (Hinweis des Programms) */
    let abstandOk = S.b / 4 - S.a > 0;
    let hoeheOk = S.a < S.HA1 - loc2;
    if (S.hausTyp === 0 || S.hausTyp === 7) { abstandOk = true; hoeheOk = true; }
    if (S.hausTyp === 3 || S.hausTyp === 4) {
      abstandOk = S.a < 0 ? S.asynb / 2 + S.a > 0 : S.asyna / 2 - S.a > 0;
      hoeheOk = S.a < S.HA1 - loc2;
    }
    S.bimschv = { abstandOk: abstandOk, hoeheOk: hoeheOk, ok: abstandOk && hoeheOk };

    /* Fenster-/Lüftungsöffnungen (§ 19 Abs. 2) */
    const fa = fensterAbstand(S.nn, !!inp.oelgas);
    const ieff = Math.sqrt(S.b * S.b + S.len * S.len);
    const lrz = r1c(1.75 * ieff / (1 + 0.25 * ieff / S.HFirst));
    S.fenster = { meter: fa.meter, hoehe: fa.hoehe, ieff: ieff, lrz: lrz, radius: lrz + fa.meter };
    return S;
  }

  /* Vorgelagerte Gebäude (Vorgelagert.Button2Click) */
  function calcVorg(rows, HFirst, HUe) {
    const out = [];
    let anyIn = false;
    let HA2v = 0;
    rows.forEach(function (r) {
      const o = { used: false };
      out.push(o);
      if (r.skip) return;
      o.used = true;
      let df = Math.round(r.df);
      if (!(df >= 1 && df <= 5)) df = 1;
      const Lv = r.lv, Bv = r.bv, beta = r.beta, Ia = r.ia, Hf = r.hf, bd = r.bd, dH = r.dh || 0;
      let f = 0;
      if (bd < 21) f = 1 + bd / 20 * 0.85;
      if (bd > 20 && bd < 31) f = 0.85 - 0.015 * (bd - 20);
      if (bd >= 31 && bd < 46) f = 0.7 - 0.01333 * (bd - 30);
      if (bd > 45 && bd < 60) f = 0.5 - 0.00333 * (bd - 45);
      if (bd >= 60) f = 0.45;
      const HDv = Lv > Bv ? T(bd) * Bv / 2 : T(bd) * Lv / 2;
      let H2v = HDv * f;
      if (bd <= 20) {
        const l6 = Lv > Bv ? 0.364 * Bv / 2 : 0.364 * Lv / 2;
        H2v = f * l6 - HDv;
      }
      if (df === 1) {
        let l7 = Lv > Bv ? 0.364 * Bv / 2 : 0.364 * Lv / 2;
        l7 = r2(l7);
        const l8 = r2(Math.pow(Hf * Hf, 0.33333333) * 1.3);
        H2v = Math.min(l7, l8);
      }
      if (df === 4) H2v = Lv > Bv ? 0.364 * Bv / 2 : 0.364 * Lv / 2;
      const Ieff = Lv * Math.sin(beta * BM) + Bv * Math.cos(beta * BM);
      const Irz = r1c(1.75 * Ieff / (1 + 0.25 * Ieff / Hf));
      o.f = f; o.HDv = HDv; o.H2v = H2v; o.Ieff = Ieff; o.Irz = Irz; o.HA2 = 0;
      if (Irz > Ia) {
        anyIn = true;
        const p = Math.sqrt(1 - Math.pow(Ia, 2) / Math.pow(Irz, 2));
        o.p = p;
        o.Hs2 = p * (Hf + H2v) - HFirst;
        o.HA2 = r1c(o.Hs2 + HUe) + dH;
        o.status = o.HA2 > 0 ? "erforderlich" : "kein Einfluss";
      } else {
        o.status = "ausserhalb";
      }
    });
    if (anyIn) {
      out.forEach(function (o) {
        if (o.used && HA2v < o.HA2) HA2v = o.HA2;
      });
    }
    return { rows: out, HA2v: HA2v, anyIn: anyIn };
  }

  /* Gesamtberechnung: erst ohne, dann mit vorgelagerten Gebäuden */
  function calcAll(inp, vrows) {
    const base = calcRoof(Object.assign({}, inp, { ha2v: 0 }));
    let vg = null;
    let S = base;
    if (vrows && vrows.length) {
      vg = calcVorg(vrows, base.HFirst, base.HUe);
      if (vg.HA2v > 0) S = calcRoof(Object.assign({}, inp, { ha2v: vg.HA2v }));
    }
    return { S: S, base: base, vg: vg };
  }
  /* =========================================================
     DARSTELLUNG / BEDIENUNG
     ========================================================= */
  if (typeof document === "undefined") {
    root.SPVDI = { calcRoof: calcRoof, calcVorg: calcVorg, calcAll: calcAll, fensterAbstand: fensterAbstand };
    return;
  }

  const KEY = "schornsteinplaner_vdi3781_v1";
  const VIEW_ID = "vdiView";

  const $ = (s, r) => (r || document).querySelector(s);
  const E = s =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const numOrNaN = x => {
    const s = String(x == null ? "" : x).trim().replace(",", ".");
    if (s === "" || isNaN(Number(s))) return NaN;
    return Number(s);
  };
  const has = x => !isNaN(numOrNaN(x));
  const fmt = (x, d) =>
    isFinite(x) ? Number(x).toFixed(d == null ? 2 : d).replace(".", ",") : "–";

  const DACHFORM_V = [
    [1, "Flachdach / Sheddach"],
    [2, "Sattel- / Walmdach"],
    [3, "asymmetrisches Dach"],
    [4, "Pultdach"],
    [5, "Mansardendach"]
  ];

  function emptyData() {
    return {
      p: { n: "", kn: "", dt: today(), ers: "", en: "", ea: "", ga: "", bem: "" },
      g: {
        vt: 2, fuel: "gas", nn: "", b: "", len: "", a: "", ht: "",
        al: "", al2: "", bo: "", att: "", sh: "", exist: "", bim: false
      },
      vn: 0,
      v: []
    };
  }

  function emptyV() {
    return { st: "", df: 2, lv: "", bv: "", beta: "", ia: "", hf: "", bd: "", dh: "" };
  }

  function today() {
    const d = new Date();
    const p = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function uid() {
    return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- Speicher ---------- */
  let store = { v: 2, cur: null, list: [] };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && Array.isArray(o.list)) store = o;
      }
    } catch (e) {}

    if (!store.v || store.v < 2) {
      /* bis Version 1 war das Feld „Nennwärmeleistung“ getrennt und „NN“ irrtümlich als Höhe beschriftet */
      store.list.forEach(it => {
        const g = (it.D && it.D.g) || {};
        g.nn = g.kw ? g.kw : "";
        delete g.kw;
      });
      store.v = 2;
    }

    if (!store.list.length) {
      const id = uid();
      store.list.push({ id: id, name: "", upd: Date.now(), D: emptyData() });
      store.cur = id;
    }

    if (!store.list.some(x => x.id === store.cur)) store.cur = store.list[0].id;

    store.list.forEach(it => {
      const e = emptyData();
      it.D = it.D || e;
      it.D.p = Object.assign({}, e.p, it.D.p);
      it.D.g = Object.assign({}, e.g, it.D.g);
      it.D.v = Array.isArray(it.D.v) ? it.D.v : [];
      it.D.vn = Number(it.D.vn) || 0;
      while (it.D.v.length < 6) it.D.v.push(emptyV());
    });
  }

  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 250);
  }
  function saveNow() {
    clearTimeout(saveT);
    try {
      const it = cur();
      it.upd = Date.now();
      it.name = projName(it);
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("VDI: Speichern nicht möglich", e);
    }
  }

  const cur = () => store.list.find(x => x.id === store.cur);
  const D = () => cur().D;

  function projName(it) {
    const p = it.D.p;
    return (p.n || "").trim() || (p.ga || "").trim() || (p.en || "").trim() || "Neue Berechnung";
  }

  /* ---------- Auswertung der Eingaben ---------- */
  function evaluate(d) {
    const g = d.g;
    const vt = Number(g.vt);
    const errs = [];
    const warn = [];
    const need = (k, label) => {
      if (!has(g[k])) errs.push(label + " fehlt.");
    };

    need("nn", "Nennwärmeleistung");
    need("b", "Gebäudelänge am Giebel (b)");
    need("len", "Andere Hausseite");
    need("ht", "Höhe Gelände bis " + (vt === 0 ? "Oberkante Dach" : vt === 1 ? "oberster Punkt" : "Traufe"));
    if (vt >= 2) {
      need("a", "Abstand Schornstein zum First (a)");
      need("al", vt === 6 ? "Dachneigung αo" : vt === 3 ? "Dachneigung α1" : "Dachneigung α");
    }
    if (vt === 3 || vt === 6) need("al2", vt === 6 ? "Dachneigung αu" : "Dachneigung α2");
    if (vt === 6) need("bo", "Abstand Knick zu Knick (bo)");
    if (vt === 0 && !has(g.att)) g.att === "" ? warn.push("Attika nicht angegeben – es wird 0 m angenommen.") : 0;

    if (errs.length) return { ok: false, errs: errs, warn: warn };

    const x = k => numOrNaN(g[k]);
    const inp = {
      vt: vt,
      nn: rint(x("nn")),
      b: x("b"),
      len: x("len"),
      a: vt >= 2 ? x("a") : has(g.a) ? x("a") : 0,
      ht: x("ht"),
      al: vt >= 2 ? rint(x("al")) : 0,
      al2: vt === 3 || vt === 6 ? rint(x("al2")) : 0,
      bo: vt === 6 ? x("bo") : 0,
      att: vt === 0 ? (has(g.att) ? x("att") : 0) : 0,
      oelgas: g.fuel === "gas"
    };

    if (!(inp.b > 0)) errs.push("Die Gebäudelänge b muss größer als 0 sein.");
    if (!(inp.len > 0)) errs.push("Die andere Hausseite muss größer als 0 sein.");
    if (!(inp.ht > 0)) errs.push("Die Höhe bis Traufe / Oberkante muss größer als 0 sein.");
    if (vt !== 3 && inp.a < 0) errs.push("Der Abstand zum First (a) darf nicht negativ sein.");
    if ((vt === 0 || vt === 1) && inp.len < inp.b) {
      errs.push("Bei Flach- und Sheddach ist b die schmale Seite – die andere Hausseite darf nicht kürzer als b sein.");
    }
    if (vt >= 2 && !(inp.al > 0 && inp.al < 90)) errs.push("Die Dachneigung muss zwischen 1° und 89° liegen.");
    if ((vt === 3 || vt === 6) && !(inp.al2 > 0 && inp.al2 < 90)) errs.push("Die zweite Dachneigung muss zwischen 1° und 89° liegen.");
    if ((vt === 3 || vt === 6) && inp.al2 < inp.al) {
      errs.push(vt === 6 ? "αo muss kleiner oder gleich αu sein." : "α1 muss kleiner sein als α2.");
    }
    if (vt === 6 && !(inp.bo > 0 && inp.bo < inp.b)) errs.push("bo (Abstand Knick zu Knick) muss größer als 0 und kleiner als b sein.");
    if (vt === 0 && inp.att < 0) errs.push("Die Attika darf nicht negativ sein.");
    if (!(inp.nn > 0)) errs.push("Die Nennwärmeleistung muss größer als 0 kW sein.");
    if (inp.nn >= 1000) warn.push("Die 1. BImSchV und die Rechenregeln gelten für kleine und mittlere Feuerungsanlagen (unter 1 MW) – bitte Nennwärmeleistung prüfen.");
    if (vt >= 2 && vt !== 3 && inp.a > inp.b / 2 + 0.001) {
      warn.push("Der Abstand zum First (a) ist größer als die halbe Gebäudelänge – bitte prüfen.");
    }

    /* Vorgelagerte Gebäude */
    const vrows = [];
    const vinfo = [];
    for (let i = 0; i < d.vn; i++) {
      const r = d.v[i];
      const full =
        has(r.lv) && has(r.bv) && has(r.ia) && has(r.hf) && has(r.bd) && has(r.beta);
      const any = has(r.lv) || has(r.bv) || has(r.ia) || has(r.hf) || has(r.bd) || has(r.beta);
      let bad = "";
      if (full) {
        if (numOrNaN(r.beta) > 90) bad = "Der Winkel β darf nicht über 90° liegen.";
        else if (!(numOrNaN(r.lv) > 0 && numOrNaN(r.bv) > 0 && numOrNaN(r.hf) > 0))
          bad = "Längen und Höhe müssen größer als 0 sein.";
        else if (numOrNaN(r.bd) < 0) bad = "Die Dachneigung darf nicht negativ sein.";
      }
      vinfo.push({ full: full && !bad, any: any, bad: bad });
      if (bad) errs.push("Vorgelagertes Gebäude " + (i + 1) + ": " + bad);
      vrows.push(
        full && !bad
          ? {
              df: Number(r.df),
              lv: numOrNaN(r.lv), bv: numOrNaN(r.bv), beta: numOrNaN(r.beta),
              ia: numOrNaN(r.ia), hf: numOrNaN(r.hf), bd: numOrNaN(r.bd),
              dh: has(r.dh) ? numOrNaN(r.dh) : 0
            }
          : { skip: true }
      );
      if (any && !full) warn.push("Vorgelagertes Gebäude " + (i + 1) + ": Angaben unvollständig – wird nicht berücksichtigt.");
    }

    if (errs.length) return { ok: false, errs: errs, warn: warn };

    const A = calcAll(inp, d.vn ? vrows : null);
    const S = A.S;

    /* vorhandener Schornstein */
    let exist = null;
    if (has(g.exist)) {
      const h = rnd(numOrNaN(g.exist), 2);
      exist = { h: h, ok: S.HA1 < h || Math.abs(S.HA1 - h) < 1e-9, need: rnd(S.HA1 - h, 1) };
    }

    return { ok: true, inp: inp, A: A, S: S, vinfo: vinfo, exist: exist, warn: warn, errs: [] };
  }

  /* ---------- Beschriftungen ---------- */
  function labelsFor(vt) {
    const L = {
      b: "Länge des Gebäudes am Giebel – b –",
      a: "Abstand vom Schornstein zum First – a –",
      ht: "Höhe von Geländeoberfläche bis Traufe",
      al: "Dachneigung α in Grad",
      al2: "",
      bo: "",
      att: ""
    };
    if (vt === 0) {
      L.b = "Länge des Gebäudes an der schmalen Seite – b –";
      L.a = "Abstand des Schornsteins von links (lange Seite)";
      L.ht = "Höhe von Geländeoberfläche bis Oberkante Dach";
      L.att = "Höhe der Attika";
      L.al = "";
    }
    if (vt === 1) {
      L.b = "Länge des Gebäudes an der schmalen Seite – b –";
      L.a = "Abstand des Schornsteins von links (lange Seite)";
      L.ht = "Höhe von Geländeoberfläche zum obersten Punkt";
      L.al = "";
    }
    if (vt === 3) {
      L.al = "Dachneigung α1 in Grad (flacherer Teil)";
      L.al2 = "Dachneigung α2 in Grad (steilerer Teil)";
      L.a = "Abstand vom Schornstein zum First – a – (positiv: Seite α2, negativ: Seite α1)";
    }
    if (vt === 4) {
      L.ht = "Höhe des unteren Punktes (Dachrinne)";
      L.a = "Abstand vom Schornstein zum höchsten Punkt (First) – a –";
    }
    if (vt === 5) L.b = "Länge des Gebäudes an der schmalen Seite – b –";
    if (vt === 6) {
      L.al = "Dachneigung αo in Grad (oberer Teil)";
      L.al2 = "Dachneigung αu in Grad (unterer Teil)";
      L.bo = "Abstand Knick zu Knick – bo –";
    }
    return L;
  }

  /* Rechtsbezug Fenster / Lüftungsöffnungen / Türen und § 19 Abs. 1 Satz 1 bis 3 (1. BImSchV) – gemeinsam für Anzeige und PDF */
  function fensterText(S, fest) {
    const F = S.fenster;
    if (fest) {
      return (
        "Hinweis zu Fenstern, Lüftungsöffnungen und Türen: Die Mündung muss die Oberkanten von Lüftungsöffnungen, Fenstern und Türen anderer Gebäude im Umkreis von " +
        F.meter + " m um min. " + F.hoehe + " m überragen (§ 19 Abs. 1 Satz 5 der 1. BImSchV). " +
        "Bei vor dem 1.1.2022 errichteten Gebäuden und schwingungsanfälliger Abgasanlage (freie Höhe über der obersten Halterung über 3 m) kann die Unverhältnismäßigkeit nach § 19 Abs. 1 Satz 7 geprüft und dann Absatz 2 angewandt werden, " +
        "wenn alle Lüftungsöffnungen, Fenster und Türen anderer Gebäude weiter als " + fmt(F.radius, 1) +
        " m entfernt sind (Länge der Rezirkulationszone " + fmt(F.lrz, 1) + " m plus Umkreis " + F.meter + " m; LAI-Auslegungsfragenkatalog zur 1. BImSchV, Frage 35)."
      );
    }
    return (
      "Hinweis zu Fenstern und Lüftungsöffnungen: Nach dem Rechenverfahren der VDI 3781 Blatt 4 sollen Fenster und Lüftungsöffnungen anderer Gebäude im Umkreis von " +
      F.meter + " m um die Mündung mindestens " + F.hoehe + " m überragt werden. Für Öl- und Gasfeuerstätten gelten außerdem die Anforderungen des Landesrechts (Feuerungsverordnung)."
    );
  }
  function bimschvText(S) {
    const B = S.bimschv;
    if (B.ok) return "Die Ableitbedingungen nach § 19 Abs. 1 Satz 1 bis 3 der 1. BImSchV (firstnahe Mündung, First um min. 40 cm überragt) werden eingehalten.";
    const why = !B.abstandOk && !B.hoeheOk ? "zu weit vom First entfernt und zu niedrig" : !B.abstandOk ? "zu weit vom First entfernt" : "zu niedrig";
    return (
      "Die Anforderungen des § 19 Abs. 1 Satz 1 bis 3 der 1. BImSchV werden nicht eingehalten, weil der Schornstein " + why +
      " ist. Unter Berücksichtigung der VDI 3781 Blatt 4 (§ 19 Abs. 1 Satz 4) kann dieser jedoch genutzt werden. Die Angaben gelten für nach dem 31.12.2021 errichtete Anlagen; für ältere Anlagen gilt § 19 Abs. 2."
    );
  }

  function resultLabels(vt) {
    if (vt === 0 || vt === 1)
      return {
        main: "Erforderliche Höhe der Mündung über Dach",
        roof: vt === 0 ? "Höhe Traufe bis fiktiver First" : "Höchster Punkt bis fiktiver First",
        ueber: "Zuschlag über der Rezirkulationszone"
      };
    if (vt === 4)
      return {
        main: "Erforderliche Höhe der Mündung über der Spitze des Pultdachs",
        roof: "Höhe von Traufe bis fiktivem First",
        ueber: ""
      };
    return {
      main: "Erforderliche Höhe der Mündung über First",
      roof: "Höhe von Traufe bis zum First",
      ueber: ""
    };
  }

  /* ---------- Seitenansicht (Geometrie) ---------- */
  function sketchGeom(S) {
    const b = S.b, ht = S.ht, t = S.hausTyp;
    let outline = [];
    let surf = () => ht;
    let cx = b / 2;
    let refY = S.l15 - S.HA1;
    const mouthY = S.l15;
    const teeth = [];

    if (t === 0) {
      outline = [[0, 0], [0, ht + S.att], [0, ht], [b, ht], [b, ht + S.att], [b, 0]];
      refY = ht;
    } else if (t === 7) {
      const n = 5, th = Math.min(0.9, b / 10), w = b / n;
      outline = [[0, 0], [0, ht]];
      for (let i = 0; i < n; i++) {
        outline.push([w * i + w * 0.15, ht - th]);
        outline.push([w * (i + 1), ht]);
      }
      outline.push([b, 0]);
      refY = ht;
    } else if (t === 3 || t === 4) {
      const rx = S.asyna || b / 2;
      const ry = ht + S.hoehea;
      outline = [[0, 0], [0, ht], [rx, ry], [b, ht], [b, 0]];
      surf = x => (x <= rx ? ht + (ry - ht) * (x / rx) : ht + (ry - ht) * (1 - (x - rx) / Math.max(0.01, b - rx)));
      cx = Math.min(b - 0.3, Math.max(0.3, rx + S.a));
    } else if (t === 5 || t === 6) {
      const hp = S.hoehePult;
      outline = [[0, 0], [0, ht], [b, ht + hp], [b, 0]];
      surf = x => ht + hp * (x / b);
      cx = Math.min(b - 0.3, Math.max(0.3, b - S.a));
      refY = ht + hp;
    } else if (t === 10 || t === 11) {
      const k = (b - S.bo) / 2;
      const y1 = ht + k * T(S.al2);
      const y2 = y1 + (S.bo / 2) * T(S.al);
      outline = [[0, 0], [0, ht], [k, y1], [b / 2, y2], [b - k, y1], [b, ht], [b, 0]];
      surf = x => {
        const d = Math.abs(x - b / 2);
        return d >= S.bo / 2 ? y1 - (d - S.bo / 2) * (y1 - ht) / Math.max(0.01, k) : y2 - d * (y2 - y1) / (S.bo / 2);
      };
      cx = Math.min(b - 0.3, Math.max(0.3, b / 2 + S.a));
    } else {
      const ry = ht + S.HDach;
      outline = [[0, 0], [0, ht], [b / 2, ry], [b, ht], [b, 0]];
      surf = x => ht + S.HDach * (1 - Math.abs(x - b / 2) / (b / 2));
      cx = Math.min(b - 0.3, Math.max(0.3, b / 2 + S.a));
    }

    if (t === 0 || t === 7) cx = b / 2;

    return { outline: outline, cx: cx, base: surf(cx), refY: refY, mouthY: mouthY, b: b, ht: ht };
  }

  function sketchSvg(S) {
    const G = sketchGeom(S);
    const top = Math.max(G.mouthY, ...G.outline.map(p => p[1])) + 1.3;
    const VW = 560, VH = 310, M = 56;
    const s = Math.min((VW - 2 * M) / G.b, (VH - 50) / top);
    const ox = (VW - G.b * s) / 2;
    const gy = VH - 28;
    const X = x => ox + x * s;
    const Y = y => gy - y * s;
    const pts = G.outline.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ");
    const cw = Math.max(6, 0.32 * s);
    const cxp = X(G.cx);
    const yb = Y(G.base - 0.25);
    const ym = Y(G.mouthY);
    const right = cxp < VW * 0.5;
    const tx = right ? cxp + cw + 8 : cxp - cw - 8;
    const an = right ? "start" : "end";
    const over = S.hausTyp === 0 || S.hausTyp === 7 ? "Dach" : "First";

    return (
      '<svg class="vd-sk" viewBox="0 0 ' + VW + " " + VH + '" role="img" aria-label="Seitenansicht des Gebäudes mit Schornstein">' +
      '<line x1="8" y1="' + Y(0) + '" x2="' + (VW - 8) + '" y2="' + Y(0) + '" stroke="#8a929a" stroke-width="2"/>' +
      '<polyline points="' + pts + '" fill="#eef1f3" stroke="#59626b" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line x1="' + X(0) + '" y1="' + Y(G.refY) + '" x2="' + X(G.b) + '" y2="' + Y(G.refY) + '" stroke="#c79a42" stroke-width="1.3" stroke-dasharray="6 4"/>' +
      '<line x1="' + (VW - 150) + '" y1="' + (VH - 9) + '" x2="' + (VW - 128) + '" y2="' + (VH - 9) + '" stroke="#c79a42" stroke-width="1.3" stroke-dasharray="6 4"/>' +
      '<text x="' + (VW - 124) + '" y="' + (VH - 5) + '" font-size="11" fill="#8a6a22">' + (S.hausTyp === 0 || S.hausTyp === 7 ? "Dachkante" : "First / fikt. First") + "</text>" +
      '<rect x="' + (cxp - cw / 2).toFixed(1) + '" y="' + ym.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + Math.max(2, yb - ym).toFixed(1) + '" fill="#9aa2a9" stroke="#59626b" stroke-width="1.4"/>' +
      '<line x1="' + (cxp - cw) + '" y1="' + ym + '" x2="' + (cxp + cw) + '" y2="' + ym + '" stroke="#c84d4d" stroke-width="2.2"/>' +
      '<text x="' + tx + '" y="' + (ym - 17) + '" font-size="12" font-weight="700" text-anchor="' + an + '" fill="#c84d4d">Mündung ' + fmt(S.l15) + " m über Gelände</text>" +
      '<text x="' + tx + '" y="' + (ym - 4) + '" font-size="11" text-anchor="' + an + '" fill="#c84d4d">(' + fmt(S.HA1) + " m über " + over + ")</text>" +
      '<text x="' + X(G.b / 2) + '" y="' + (Y(0) + 17) + '" font-size="12" text-anchor="middle" fill="#59626b">b = ' + fmt(G.b, 2) + " m</text>" +
      '<text x="' + (X(0) - 6) + '" y="' + Y(G.ht / 2) + '" font-size="11" text-anchor="end" fill="#59626b">' + fmt(G.ht, 2) + " m</text>" +
      "</svg>"
    );
  }

  /* ---------- Ergebnis (HTML) ---------- */
  function resultHtml(R, d) {
    if (!R.ok) {
      return (
        '<div class="vd-err"><strong>Bitte prüfen:</strong><ul>' +
        R.errs.map(e => "<li>" + E(e) + "</li>").join("") +
        "</ul></div>"
      );
    }

    const S = R.S, g = d.g, vt = Number(g.vt);
    const RL = resultLabels(vt);
    const names = ROOFS.map(r => r.name);
    const rowsT = [];
    const kv = (k, v, cls) => rowsT.push('<tr class="' + (cls || "") + '"><th>' + k + "</th><td>" + v + "</td></tr>");

    kv(RL.main, "<strong>" + fmt(S.HA1) + " m</strong>", "vd-main");
    if (vt >= 2 && vt !== 4) kv("Freie Höhe über Dach am Schornstein", fmt(S.l14) + " m");
    if (vt === 4) kv("Freie Höhe über Dach am Schornstein", fmt(S.l14) + " m");
    kv("Mündungshöhe über Gelände", "<strong>" + fmt(S.l15) + " m</strong>", "vd-main");
    kv(RL.roof, fmt(S.l12) + " m");
    if (RL.ueber) kv(RL.ueber, fmt(S.l13) + " m");
    if (R.A.vg && R.A.vg.HA2v > 0)
      kv("davon bestimmt durch vorgelagerte Gebäude", fmt(R.A.vg.HA2v) + " m über Dach / First");

    let more =
      '<details class="vd-more"><summary>Rechenweg anzeigen</summary><table class="vd-t">' +
      [
        ["Nennwärmeleistung → Zuschlag H<sub>Ü</sub>", fmt(S.nn, 0) + " kW → " + fmt(S.HUe) + " m"],
        ["Verwendetes Verfahren", "Dachform-Typ " + S.hausTyp + " (" + (S.unter20 ? "bis" : "über") + " 20° Dachneigung)"],
        ["Winkel γ / Faktor f", fmt(S.gamma, 3) + "° / " + fmt(S.f, 4)],
        ["H1 / H2", fmt(S.H1, 3) + " m / " + fmt(S.H2, 3) + " m"],
        ["Maßgebende Höhe H<sub>s1</sub>", fmt(S.Hs1, 3) + " m"]
      ]
        .map(r => "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>")
        .join("") +
      "</table></details>";

    const hints = [];
    if (S.walmFaktor) hints.push("Grundriss nahezu quadratisch (Seitenverhältnis bis 1 : 1,2): Beim Walmdach wird die Höhe H<sub>s1</sub> mit dem Faktor 0,6 verringert.");
    if (S.hausTyp === 5 && (vt === 3)) hints.push("Bei α2 über 75° wird das asymmetrische Dach wie ein Pultdach gerechnet.");

    const fest = g.fuel === "fest";
    if (fest && g.bim) hints.push(E(bimschvText(S)));
    hints.push("<strong>" + E(fensterText(S, fest).split(":")[0]) + ":</strong>" + E(fensterText(S, fest).slice(fensterText(S, fest).indexOf(":") + 1)));

    let ex = "";
    if (R.exist) {
      const e = R.exist;
      ex =
        '<div class="vd-ex ' + (e.ok ? "ok" : "no") + '">Der vorhandene Schornstein ragt ' + fmt(e.h) + " m über " +
        (vt === 0 ? "das Flachdach" : vt === 1 ? "das Dach" : "den First") + ". " +
        (e.ok ? "Er ist damit ausreichend hoch." : "Er muss um min. " + fmt(e.need, 1) + " m erhöht werden.") + "</div>";
    }

    let vg = "";
    if (R.A.vg) {
      const lines = [];
      R.A.vg.rows.forEach((o, i) => {
        if (!o.used) return;
        const nm = (d.v[i].st || "").trim();
        const status =
          o.status === "ausserhalb"
            ? "liegt außerhalb der Rezirkulationszone"
            : o.status === "kein Einfluss"
              ? "ohne Einfluss (Schornstein im Bereich, aber bereits hoch genug)"
              : "Schornstein liegt in der Rezirkulationszone – erforderliche Höhe " + fmt(o.HA2, 1) + " m";
        lines.push(
          "<tr><th>Haus " + (i + 1) + (nm ? " – " + E(nm) : "") + "</th><td>Länge der Rezirkulationszone " + fmt(o.Irz, 1) +
            " m, Abstand " + fmt(numOrNaN(d.v[i].ia), 1) + " m: " + status + "</td></tr>"
        );
      });
      if (lines.length) {
        vg =
          '<h3 class="vd-h3">Vorgelagerte Gebäude</h3><table class="vd-t">' + lines.join("") + "</table>" +
          (R.A.vg.anyIn
            ? '<p class="vd-note">Die resultierende Höhe bezieht sich auf das Gebäude, in dem die Feuerstätte betrieben werden soll.</p>'
            : '<p class="vd-note">Alle Gebäude liegen außerhalb der Rezirkulationszone – kein Einfluss.</p>');
      }
    }

    return (
      '<table class="vd-t vd-res">' + rowsT.join("") + "</table>" +
      ex + sketchSvg(S) + more + vg +
      (hints.length ? '<ul class="vd-hints">' + hints.map(h => "<li>" + h + "</li>").join("") + "</ul>" : "") +
      (R.warn.length ? '<div class="vd-warn">' + R.warn.map(w => "<div>⚠ " + E(w) + "</div>").join("") + "</div>" : "")
    );
  }

  /* ---------- Formular ---------- */
  const val = path => {
    const [a, b] = path.split(".");
    return b === undefined ? D()[a] : D()[a][b];
  };

  function inp(path, label, o) {
    o = o || {};
    const v = val(path);
    return (
      '<div class="field' + (o.cls ? " " + o.cls : "") + '"><label>' + label + "</label>" +
      '<input data-k="' + path + '" type="' + (o.t || "text") + '" ' +
      (o.t ? "" : 'inputmode="' + (o.im || "decimal") + '" ') +
      'value="' + E(v) + '"' + (o.ph ? ' placeholder="' + o.ph + '"' : "") + ' autocomplete="off"></div>'
    );
  }

  function sel(path, label, opts, o) {
    const v = String(val(path));
    return (
      '<div class="field' + ((o && o.cls) ? " " + o.cls : "") + '"><label>' + label + '</label><select data-k="' + path + '">' +
      opts.map(x => '<option value="' + x[0] + '"' + (String(x[0]) === v ? " selected" : "") + ">" + x[1] + "</option>").join("") +
      "</select></div>"
    );
  }

  function card(ic, title, sub, body, extra) {
    return (
      '<div class="card ' + (extra || "") + '"><div class="card-header"><div><h2>' + title + "</h2>" +
      (sub ? "<p>" + sub + "</p>" : "") + '</div><div class="section-icon">' + ic + "</div></div>" + body + "</div>"
    );
  }

  function projectBar() {
    const opts = store.list
      .slice()
      .sort((a, b) => b.upd - a.upd)
      .map(it => '<option value="' + it.id + '"' + (it.id === store.cur ? " selected" : "") + ">" + E(projName(it)) + "</option>")
      .join("");
    return (
      '<div class="card vd-bar"><div class="field"><label>Gespeicherte Berechnungen</label><select id="vdPick">' + opts + "</select></div>" +
      '<div class="vd-bar-btns"><button class="btn btn-gold" data-a="new">＋ Neu</button>' +
      '<button class="btn btn-light" data-a="dup">Duplizieren</button>' +
      '<button class="btn btn-danger" data-a="del">Löschen</button></div></div>'
    );
  }

  function vorgHtml(d) {
    let h = sel("vn", "Anzahl vorgelagerter Gebäude in nächster Nähe", [0, 1, 2, 3, 4, 5, 6].map(n => [n, n === 0 ? "keine" : String(n)]));
    h = h.replace('data-k="vn"', 'data-k="vn" id="vdVn"');
    if (!d.vn) {
      return h + '<p class="vd-note">Vorgelagerte Gebäude erzeugen eigene Rezirkulationszonen. Liegt der Schornstein darin, kann eine größere Höhe erforderlich sein.</p>';
    }
    h += '<p class="vd-note">Je Haus: Seite mit Schornstein = L<sub>v</sub>, andere Seite = B<sub>v</sub>. Winkel β: von der Mitte des vorgelagerten Gebäudes (Linie entlang des Firsts) zum geplanten Schornstein, höchstens 90°. l<sub>A</sub>: Abstand vom Schornstein zur Mitte des vorgelagerten Gebäudes.</p>';
    h += '<div class="vd-vg">';
    for (let i = 0; i < d.vn; i++) {
      const p = "v." + i + ".";
      h +=
        '<div class="vd-vcard"><h4>Haus ' + (i + 1) + '</h4><div class="form-grid two">' +
        vi(i, "st", "Straße und Hausnummer", "text") +
        vsel(i, "df", "Dachform", DACHFORM_V) +
        vi(i, "lv", "Seite zum Haus mit Schornstein L<sub>v</sub> (m)") +
        vi(i, "bv", "Andere Seite B<sub>v</sub> (m)") +
        vi(i, "beta", "Winkel β in Grad (max. 90)") +
        vi(i, "ia", "Abstand zum Schornstein l<sub>A</sub> (m)") +
        vi(i, "hf", "Höhe Gelände bis First (m)") +
        vi(i, "bd", "Dachneigung der abgewandten Seite (°)") +
        vi(i, "dh", "Unterschied Geländehöhe Mitte zu Mitte ΔH (m, optional)") +
        '</div><div class="vd-vres" id="vdVres' + i + '"></div></div>';
    }
    return h + "</div>";
  }

  function vi(i, k, label, t) {
    const v = D().v[i][k];
    return (
      '<div class="field"><label>' + label + '</label><input data-v="' + i + "." + k + '" type="text" ' +
      (t === "text" ? "" : 'inputmode="decimal" ') + 'value="' + E(v) + '" autocomplete="off"></div>'
    );
  }

  function vsel(i, k, label, opts) {
    const v = String(D().v[i][k]);
    return (
      '<div class="field"><label>' + label + '</label><select data-v="' + i + "." + k + '">' +
      opts.map(x => '<option value="' + x[0] + '"' + (String(x[0]) === v ? " selected" : "") + ">" + x[1] + "</option>").join("") +
      "</select></div>"
    );
  }

  function formHtml() {
    const d = D();
    const vt = Number(d.g.vt);
    const L = labelsFor(vt);

    const geb =
      '<div class="form-grid">' +
      sel("g.vt", "Dachform", ROOFS.map(r => [r.id, r.name])) +
      sel("g.fuel", "Feuerstätte", [["gas", "Öl- oder Gasfeuerstätte"], ["fest", "Festbrennstoff"]]) +
      inp("g.nn", "Nennwärmeleistung der Feuerstätte in kW", { im: "numeric" }) +
      "</div>" +
      '<div class="form-grid vd-dim">' +
      inp("g.b", L.b) +
      inp("g.len", "Andere Hausseite (m)") +
      inp("g.a", L.a, { cls: "" }) +
      inp("g.ht", L.ht) +
      (L.al ? inp("g.al", L.al, { im: "numeric" }) : "") +
      (L.al2 ? inp("g.al2", L.al2, { im: "numeric" }) : "") +
      (L.bo ? inp("g.bo", L.bo) : "") +
      (L.att ? inp("g.att", L.att) : "") +
      inp("g.exist", "Vorhandener Schornstein ragt über " + (vt === 0 ? "das Flachdach" : vt === 1 ? "das Dach" : "den First") + " (m, optional)") +
      "</div>" +
      (vt === 3
        ? '<p class="vd-note">Bei einem asymmetrischen Dach wird ab einer Dachneigung α2 von über 75° wie ein Pultdach gerechnet.</p>'
        : "") +
      (vt === 5
        ? '<p class="vd-note">Beim Walmdach ist b die schmale Seite. Bei annähernd quadratischem Grundriss (bis 1 : 1,2) wird ein Faktor von 0,6 angewendet.</p>'
        : "") +
      (d.g.fuel === "fest"
        ? '<label class="vd-chk"><input type="checkbox" data-k="g.bim"' + (d.g.bim ? " checked" : "") + '> Hinweis zu § 19 Abs. 1 Satz 1 bis 3 der 1. BImSchV (firstnahe Mündung, First um 40 cm überragen) mit ausgeben</label>'
        : '<p class="vd-note">Die Ableitbedingungen des § 19 der 1. BImSchV gelten für Feuerungsanlagen für feste Brennstoffe. Für Öl- und Gasfeuerstätten sind die Feuerungsverordnung des Landes und die VDI 3781 Blatt 4 maßgeblich.</p>');

    return (
      projectBar() +
      card("📐", "Berechnung", "Schornsteinhöhe und Rezirkulationszone nach VDI 3781 Blatt 4", geb) +
      card("🏘️", "Vorgelagerte Gebäude", "Optional – Einfluss höherer Nachbargebäude", vorgHtml(d)) +
      card(
        "👤",
        "Auftrag und Kunde",
        "Für den Ausdruck – Name und Adresse können aus der Kundenverwaltung übernommen werden.",
        '<div class="vd-pick"><button class="btn btn-gold" data-a="pick">👥 Kunde aus Kundenverwaltung wählen</button></div>' +
          '<div class="form-grid">' +
          inp("p.n", "Bezeichnung / Projekt", { t: "text" }) +
          inp("p.kn", "Kundennummer", { t: "text" }) +
          inp("p.dt", "Datum der Besichtigung", { t: "date" }) +
          inp("p.en", "Eigentümer / Verwalter", { t: "text" }) +
          inp("p.ea", "Anschrift des Eigentümers", { t: "text" }) +
          inp("p.ga", "Anschrift des Gebäudes", { t: "text" }) +
          inp("p.ers", "Schornsteinfegerbetrieb / Sachverständiger", { t: "text" }) +
          inp("p.bem", "Bemerkungen", { t: "text" }) +
          "</div>"
      ) +
      '<div class="card vd-result"><div class="card-header"><div><h2>Ergebnis</h2><p>Wird bei jeder Eingabe neu berechnet.</p></div><div class="section-icon">✅</div></div>' +
      '<div id="vdResult"></div>' +
      '<div class="form-actions"><button class="btn btn-primary" data-a="pdf">📄 Ergebnis als PDF / Drucken</button></div></div>' +
      '<p class="vd-src">Rechenverfahren nach VDI 3781 Blatt 4 (2017), umgesetzt nach dem Programm „VDI3781-4“ (Version 1.23) von Andreas Schoßland. ' +
      "Die Ergebnisse sind eine Hilfe – alle Maße sind vor Ort zu prüfen; für die Richtigkeit der Eingaben ist der Anwender verantwortlich.</p>"
    );
  }

  let view = null;

  function render() {
    view.innerHTML = '<div class="vd-wrap">' + formHtml() + "</div>";
    update();
  }

  let lastR = null;
  function update() {
    const d = D();
    const R = evaluate(d);
    lastR = R;
    const el = $("#vdResult", view);
    if (el) el.innerHTML = resultHtml(R, d);
    const btn = view.querySelector('[data-a="pdf"]');
    if (btn) btn.disabled = !R.ok;

    for (let i = 0; i < d.vn; i++) {
      const t = $("#vdVres" + i, view);
      if (!t) continue;
      let h = "";
      if (R.ok && R.A.vg && R.A.vg.rows[i] && R.A.vg.rows[i].used) {
        const o = R.A.vg.rows[i];
        h =
          o.status === "ausserhalb"
            ? "Liegt außerhalb der Rezirkulationszone (Länge " + fmt(o.Irz, 1) + " m)."
            : o.status === "kein Einfluss"
              ? "Im Bereich der Rezirkulationszone – kein Einfluss."
              : "<strong>Erforderliche Höhe: " + fmt(o.HA2, 1) + " m</strong> (Länge Rezirkulationszone " + fmt(o.Irz, 1) + " m).";
      } else if (R.vinfo) {
        const vi_ = R.vinfo[i];
        if (vi_ && vi_.bad) h = '<span class="vd-bad">' + E(vi_.bad) + "</span>";
        else if (vi_ && vi_.any && !vi_.full) h = "Bitte alle Angaben außer der Straße ergänzen.";
      }
      t.innerHTML = h;
    }
  }

  function setPath(path, v) {
    const [a, b] = path.split(".");
    if (b === undefined) D()[a] = v;
    else D()[a][b] = v;
  }

  /* ---------- Ereignisse ---------- */
  function onInput(e) {
    const t = e.target;
    if (!t || !view.contains(t)) return;

    if (t.id === "vdPick") return;

    if (t.dataset.v != null) {
      const [i, k] = t.dataset.v.split(".");
      D().v[+i][k] = t.value;
      save();
      update();
      return;
    }

    const k = t.dataset.k;
    if (!k) return;

    if (t.type === "checkbox") setPath(k, t.checked);
    else if (k === "g.vt" || k === "g.fuel" || k === "vn") {
      setPath(k, k === "g.fuel" ? t.value : Number(t.value));
    } else setPath(k, t.value);

    save();

    if (e.type === "change" && (k === "g.vt" || k === "vn" || k === "g.fuel")) {
      saveNow();
      render();
      return;
    }

    update();
  }

  function newProject(copy) {
    saveNow();
    const id = uid();
    const D0 = copy ? JSON.parse(JSON.stringify(D())) : emptyData();
    if (copy) D0.p.n = (D0.p.n || projName(cur())) + " (Kopie)";
    store.list.push({ id: id, name: "", upd: Date.now(), D: D0 });
    store.cur = id;
    saveNow();
    render();
  }

  function delProject() {
    if (!confirm("Diese Berechnung „" + projName(cur()) + "“ wirklich löschen?")) return;
    store.list = store.list.filter(x => x.id !== store.cur);
    if (!store.list.length) {
      const id = uid();
      store.list.push({ id: id, name: "", upd: Date.now(), D: emptyData() });
    }
    store.cur = store.list[0].id;
    saveNow();
    render();
  }

  function onClick(e) {
    const t = e.target.closest && e.target.closest("[data-a]");
    if (!t || !view.contains(t)) return;
    const a = t.dataset.a;

    if (a === "new") return newProject(false);
    if (a === "dup") return newProject(true);
    if (a === "del") return delProject();
    if (a === "pdf") return doPdf();

    if (a === "pick") {
      if (!root.SPKunden) {
        alert("Die Kundenverwaltung ist nicht geladen. Bitte die Seite neu laden.");
        return;
      }
      root.SPKunden.pick(k => {
        const S = root.SPKunden;
        const adr = S.addressLine(k);
        const p = D().p;
        p.kn = k.nr;
        p.en = k.name || "";
        p.ga = adr;
        p.ea = k.ownerAddr || adr;
        if (!p.n) p.n = [S.streetLine(k), k.name].filter(Boolean).join(" – ");
        saveNow();
        render();
      });
    }
  }

  /* ---------- PDF ---------- */
  function fileSafe(s) {
    return String(s || "Berechnung").trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "Berechnung";
  }

  function pdfText(d, R) {
    const g = d.g, S = R.S, vt = Number(g.vt);
    const roof = ROOFS[vt].name;
    const lines = [];
    let t = "Das Gebäude besitzt ein " + roof;
    if (vt >= 2) {
      t += " mit einer Dachneigung von " + fmt(S.al, 0) + "°" + (vt === 3 || vt === 6 ? " und " + fmt(S.al2, 0) + "°" : "");
    }
    const bh = vt === 0 ? S.ht + S.att : vt === 1 ? S.ht : S.l15 - S.HA1;
    t += ". Die Höhe des Gebäudes beträgt " + fmt(bh) + " Meter.";
    lines.push(t);
    lines.push(
      "Vorgelagerte Gebäude werden " + (R.A.vg && R.A.vg.rows.some(o => o.used) ? "" : "nicht ") + "berücksichtigt."
    );
    lines.push(
      "Das Gebäude besitzt eine Breite von " + fmt(S.b) + " Meter und eine Länge von " + fmt(S.len) + " Meter."
    );
    lines.push(
      "Es soll eine " + (g.fuel === "gas" ? "Öl- oder Gasfeuerstätte" : "Feuerstätte für Festbrennstoff") +
        " mit einer Nennwärmeleistung von " + fmt(S.nn, 0) + " kW eingebaut werden."
    );
    if (vt >= 2) {
      lines.push("Der Schornstein soll in einem Abstand von " + fmt(S.a) + " Meter vom First entfernt errichtet werden.");
    }
    return lines;
  }

  function buildPdf(d, R) {
    const W = 595.28, H = 841.89, ML = 44, MT = 48, CW = W - 2 * ML;
    const cpMap = { "€": 0x80, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97 };
    const tr = { "≥": ">=", "≤": "<=", "→": "->", "α": "alpha", "β": "beta", "γ": "gamma", "Δ": "Delta", "ΔH": "dH", "−": "-", "∙": "·", " ": " ", " ": " " };
    const nz = str => {
      let o = "";
      for (const ch of String(str == null ? "" : str).replace(/<[^>]+>/g, "")) {
        const c = ch.codePointAt(0);
        if (c < 32) o += " ";
        else if (c < 128 || (c >= 160 && c <= 255)) o += ch;
        else if (cpMap[ch]) o += ch;
        else if (tr[ch] !== undefined) o += tr[ch];
        else o += ch.normalize("NFKD").replace(/[^\x20-\x7e]/g, "") || "?";
      }
      return o;
    };
    const enc = str => {
      let o = "";
      for (const ch of str) o += cpMap[ch] ? String.fromCharCode(cpMap[ch]) : ch;
      return o.replace(/([\\()])/g, "\\$1");
    };
    const cv = document.createElement("canvas").getContext("2d");
    const wid = (s, bold, size) => {
      cv.font = (bold ? "bold " : "") + "100px Helvetica, Arial, sans-serif";
      return cv.measureText(nz(s)).width * size / 100 * 1.02;
    };
    const col = hex => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255).toFixed(3)).join(" ");
    };
    const f = v => Number(v).toFixed(2);
    const pages = [];
    let ops = [];
    let y = MT;

    const txt = (x, yy, str, o) => {
      o = o || {};
      const size = o.size || 9.5;
      let px = x;
      if (o.align === "right") px = x - wid(str, o.bold, size);
      if (o.align === "center") px = x - wid(str, o.bold, size) / 2;
      ops.push("BT /" + (o.bold ? "F2" : "F1") + " " + f(size) + " Tf " + col(o.color || "#22272d") + " rg " + f(px) + " " + f(H - yy) + " Td (" + enc(nz(str)) + ") Tj ET");
    };
    const line = (x1, y1, x2, y2, o) => {
      o = o || {};
      ops.push(col(o.color || "#c9ced2") + " RG " + (o.lw || 0.6) + " w " + (o.dash ? "[" + o.dash + "] 0 d " : "[] 0 d ") + f(x1) + " " + f(H - y1) + " m " + f(x2) + " " + f(H - y2) + " l S");
    };
    const poly = (pts, o) => {
      o = o || {};
      const p = pts.map((q, i) => f(q[0]) + " " + f(H - q[1]) + (i ? " l" : " m")).join(" ");
      ops.push(
        (o.fill ? col(o.fill) + " rg " : "") + (o.stroke ? col(o.stroke) + " RG " + (o.lw || 1) + " w [] 0 d " : "") + p + (o.close ? " h" : "") + (o.fill && o.stroke ? " B" : o.fill ? " f" : " S")
      );
    };
    const rect = (x, yy, w, h, o) => poly([[x, yy], [x + w, yy], [x + w, yy + h], [x, yy + h]], Object.assign({ close: true }, o));
    const newPage = () => { pages.push(ops.join("\n")); ops = []; y = MT; };
    const ensure = h => { if (y + h > H - 60) newPage(); };

    const wrap = (str, size, bold, maxW) => {
      const out = [];
      String(str).split("\n").forEach(par => {
        let cur = "";
        par.split(/\s+/).forEach(wd => {
          const test = cur ? cur + " " + wd : wd;
          if (wid(test, bold, size) > maxW && cur) { out.push(cur); cur = wd; } else cur = test;
        });
        out.push(cur);
      });
      return out;
    };
    const para = (str, o) => {
      o = o || {};
      const size = o.size || 9.5;
      wrap(nz(str), size, o.bold, o.w || CW).forEach(l => {
        ensure(size + 5);
        y += size + 3.2;
        txt(o.x || ML, y, l, o);
      });
    };
    const h2 = s => { ensure(26); y += 14; para(s, { bold: true, size: 11.5 }); line(ML, y + 3, ML + CW, y + 3); y += 4; };

    const S = R.S, g = d.g, p = d.p, vt = Number(g.vt);
    const RL = resultLabels(vt);

    /* Kopf */
    rect(ML, y - 4, CW, 54, { fill: "#22272d" });
    txt(ML + 14, y + 20, "Bescheinigung", { bold: true, size: 17, color: "#ffffff" });
    txt(ML + 14, y + 38, "über das Ergebnis der Berechnung der Ableitbedingungen nach VDI 3781 Blatt 4", { size: 9.5, color: "#f3e4c1" });
    y += 62;

    const kvs = [
      ["Schornsteinfegerbetrieb / Sachverständiger", p.ers],
      ["Eigentümer / Verwalter", [p.en, p.ea].filter(Boolean).join(", ")],
      ["Standort des Gebäudes", p.ga],
      ["Kundennummer", p.kn],
      ["Datum der Besichtigung", p.dt ? p.dt.split("-").reverse().join(".") : ""]
    ].filter(r => r[1]);
    kvs.forEach(r => {
      ensure(14);
      y += 12.5;
      txt(ML, y, r[0] + ":", { size: 8.6, color: "#6c757d" });
      wrap(nz(r[1]), 9.5, true, CW - 190).forEach((l, i) => {
        if (i) { y += 12; ensure(12); }
        txt(ML + 190, y, l, { bold: true, size: 9.5 });
      });
    });

    h2("Beschreibung des Gebäudes");
    pdfText(d, R).forEach(l => para(l));

    h2("Ergebnis");
    const res = [
      [RL.main, fmt(S.HA1) + " m", true],
      ["Freie Höhe über Dach am Schornstein", fmt(S.l14) + " m"],
      ["Mündungshöhe über Gelände", fmt(S.l15) + " m", true],
      [RL.roof, fmt(S.l12) + " m"]
    ];
    if (R.A.vg && R.A.vg.HA2v > 0) res.push(["bestimmt durch vorgelagerte Gebäude", fmt(R.A.vg.HA2v) + " m"]);
    res.forEach(r => {
      ensure(18);
      y += 15;
      txt(ML + 4, y, r[0], { bold: !!r[2], size: r[2] ? 10.5 : 9.5 });
      txt(ML + CW - 4, y, r[1], { bold: true, size: r[2] ? 11 : 9.5, align: "right", color: r[2] ? "#9b6f12" : "#22272d" });
      line(ML, y + 4, ML + CW, y + 4, { color: "#e1e5e9" });
    });
    if (R.exist) {
      const e = R.exist;
      y += 6;
      para(
        "Der vorhandene Schornstein ragt " + fmt(e.h) + " Meter über " + (vt === 0 ? "das Flachdach" : vt === 1 ? "das Dach" : "den First") + ". " +
          (e.ok ? "Er ist damit ausreichend hoch." : "Er muss um min. " + fmt(e.need, 1) + " Meter erhöht werden."),
        { bold: true }
      );
    }

    /* Skizze */
    const G = sketchGeom(S);
    const top = Math.max(G.mouthY, ...G.outline.map(q => q[1])) + 1.4;
    const boxH = 200;
    ensure(boxH + 20);
    y += 12;
    const sc = Math.min((CW - 90) / (G.b + 1), (boxH - 28) / top);
    const ox = ML + 45 + ((CW - 90) - G.b * sc) / 2;
    const gy = y + boxH - 20;
    const X = v => ox + v * sc;
    const Y = v => gy - v * sc;
    line(ML + 10, gy, ML + CW - 10, gy, { color: "#8a929a", lw: 1.6 });
    poly(G.outline.map(q => [X(q[0]), Y(q[1])]), { fill: "#eef1f3", stroke: "#59626b", lw: 1.8 });
    line(X(0), Y(G.refY), X(G.b), Y(G.refY), { color: "#c79a42", lw: 0.9, dash: "4 3" });
    rect(X(G.cx) - 3, Y(G.mouthY), 6, Math.max(2, Y(G.base - 0.25) - Y(G.mouthY)), { fill: "#9aa2a9", stroke: "#59626b", lw: 0.8 });
    line(X(G.cx) - 9, Y(G.mouthY), X(G.cx) + 9, Y(G.mouthY), { color: "#c84d4d", lw: 1.4 });
    txt(X(G.cx) + 13, Y(G.mouthY) - 14, "Mündung " + fmt(S.l15) + " m über Gelände", { size: 8.4, bold: true, color: "#c84d4d" });
    txt(X(G.cx) + 13, Y(G.mouthY) - 4, "(" + fmt(S.HA1) + " m über " + (vt === 0 || vt === 1 ? "Dach" : "First") + ")", { size: 8, color: "#c84d4d" });
    line(ML + CW - 120, gy + 9, ML + CW - 100, gy + 9, { color: "#c79a42", lw: 0.9, dash: "4 3" });
    txt(ML + CW - 96, gy + 12, vt === 0 || vt === 1 ? "Dachkante" : "First / fikt. First", { size: 8, color: "#8a6a22" });
    txt(X(G.b / 2), gy + 12, "b = " + fmt(G.b) + " m", { size: 8.4, align: "center", color: "#59626b" });
    txt(X(0) - 5, Y(G.ht / 2), fmt(G.ht) + " m", { size: 8.2, align: "right", color: "#59626b" });
    y += boxH;

    /* Vorgelagerte Gebäude */
    if (R.A.vg && R.A.vg.rows.some(o => o.used)) {
      h2("Vorgelagerte Gebäude");
      R.A.vg.rows.forEach((o, i) => {
        if (!o.used) return;
        const r = d.v[i];
        para(
          "Haus " + (i + 1) + (r.st ? ", " + r.st : "") + ", ist " + fmt(numOrNaN(r.ia), 1) + " Meter entfernt und hat eine Höhe von " + fmt(numOrNaN(r.hf), 1) +
            " Meter. Die Länge der Rezirkulationszone beträgt " + fmt(o.Irz, 1) + " Meter. " +
            (o.status === "ausserhalb" ? "Das Gebäude liegt außerhalb der Rezirkulationszone." : o.status === "kein Einfluss" ? "Die Berücksichtigung des Gebäudes ist ohne Einfluss." : "Die resultierende Höhe beträgt " + fmt(o.HA2, 1) + " Meter.")
        );
      });
      if (R.A.vg.HA2v > 0)
        para("Hieraus resultiert eine Höhe der Abgasanlage unter Berücksichtigung der vorgelagerten Gebäude von " + fmt(R.A.vg.HA2v) + " Meter. Dieses wurde in der Berechnung berücksichtigt.", { bold: true });
    }

    /* Hinweise */
    h2("Hinweise");
    const fest = g.fuel === "fest";
    para(fensterText(S, fest));
    if (fest && g.bim) para(bimschvText(S));
    if (p.bem) para("Bemerkungen: " + p.bem);
    para(
      "Die in der Berechnung aufgeführten und verwendeten Maße und Daten basieren auf den zur Verfügung gestellten Daten. Für fehlerhafte oder ungenaue Datenangaben kann keine Haftung übernommen werden. Sämtliche Maße sind vor Ort zu prüfen. Berechnung angelehnt an die VDI 3781-4:2017.",
      { size: 8.4, color: "#6c757d" }
    );

    ensure(60);
    y += 34;
    line(ML, y, ML + 200, y, { color: "#59626b", lw: 0.7 });
    txt(ML, y + 11, "Datum, Unterschrift", { size: 8.2, color: "#6c757d" });

    pages.push(ops.join("\n"));
    const total = pages.length;
    const foot = projName(cur());
    const streams = pages.map((pg, i) =>
      pg + "\n" + col("#c9ced2") + " RG 0.5 w " + f(ML) + " 38 m " + f(ML + CW) + " 38 l S\n" +
      "BT /F1 7.8 Tf " + col("#6c757d") + " rg " + f(ML) + " 26 Td (" + enc(nz("Schornsteinhöhe nach VDI 3781 Blatt 4 · " + foot)) + ") Tj ET\n" +
      "BT /F1 7.8 Tf " + col("#6c757d") + " rg " + f(ML + CW - wid("Seite " + (i + 1) + " / " + total, false, 7.8)) + " 26 Td (Seite " + (i + 1) + " / " + total + ") Tj ET"
    );

    const objs = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [" + streams.map((_, i) => 5 + 2 * i + " 0 R").join(" ") + "] /Count " + streams.length + " >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    ];
    streams.forEach((st, i) => {
      objs.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + (6 + 2 * i) + " 0 R >>");
      objs.push("<< /Length " + st.length + " >>\nstream\n" + st + "\nendstream");
    });
    let pdf = "%PDF-1.4\n%âãÏÓ\n";
    const offs = [];
    objs.forEach((o, i) => { offs.push(pdf.length); pdf += i + 1 + " 0 obj\n" + o + "\nendobj\n"; });
    const xr = pdf.length;
    pdf += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") +
      "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF";
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 255;
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
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function openPdf(blob, name) {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  }

  function doPdf() {
    saveNow();
    const d = D();
    const R = evaluate(d);
    if (!R.ok) { alert("Bitte zuerst die Eingaben vervollständigen."); return; }
    let blob = null;
    try { blob = buildPdf(d, R); } catch (err) { console.error(err); }
    if (!blob) { alert("Das PDF konnte nicht erstellt werden."); return; }
    const name = "Schornsteinhoehe_VDI3781_" + fileSafe(projName(cur())) + ".pdf";
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (window.navigator.standalone === true || ios) sharePdf(blob, name);
    else openPdf(blob, name);
  }

  /* ---------- Stil ---------- */
  function css() {
    const s = document.createElement("style");
    s.textContent =
      "#vdiView .vd-bar{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:end}" +
      "#vdiView .vd-bar-btns{display:flex;gap:8px;flex-wrap:wrap}" +
      "#vdiView .vd-dim{margin-top:15px}" +
      "#vdiView .vd-note{margin:12px 0 0;color:var(--muted);font-size:.84rem;line-height:1.45}" +
      "#vdiView .vd-src{color:var(--muted);font-size:.78rem;line-height:1.5;margin:4px 2px 24px}" +
      "#vdiView .vd-chk{display:flex;align-items:center;gap:9px;margin-top:15px;font-size:.88rem;font-weight:650;color:#4f5962}" +
      "#vdiView .vd-chk input{width:18px;height:18px;accent-color:var(--gold)}" +
      "#vdiView .vd-pick{margin:0 0 14px}" +
      "#vdiView .vd-vg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px}" +
      "#vdiView .vd-vcard{border:1px solid var(--border);border-radius:13px;padding:14px;background:#fafbfc}" +
      "#vdiView .vd-vcard h4{margin:0 0 11px;font-size:.98rem}" +
      "#vdiView .vd-vres{margin-top:11px;font-size:.84rem;color:#4f5962;min-height:1.2em}" +
      "#vdiView .vd-bad{color:var(--red);font-weight:700}" +
      "#vdiView .vd-t{width:100%;border-collapse:collapse;font-size:.92rem}" +
      "#vdiView .vd-t th{font-weight:600;text-align:left;padding:10px 6px;border-bottom:1px solid var(--border);color:#4f5962;vertical-align:top}" +
      "#vdiView .vd-t td{padding:10px 6px;border-bottom:1px solid var(--border);text-align:right;vertical-align:top}" +
      "#vdiView .vd-res .vd-main th,#vdiView .vd-res .vd-main td{font-size:1.06rem;color:var(--text);background:#fffaf0}" +
      "#vdiView .vd-res .vd-main td{color:#8a6218}" +
      "#vdiView .vd-h3{margin:20px 0 6px;font-size:1rem}" +
      "#vdiView .vd-sk{width:100%;max-width:640px;height:auto;display:block;margin:18px auto 6px;background:#fff;border:1px solid var(--border);border-radius:13px}" +
      "#vdiView .vd-more{margin:12px 0}" +
      "#vdiView .vd-more summary{cursor:pointer;font-weight:700;font-size:.86rem;color:#4f5962}" +
      "#vdiView .vd-hints{margin:16px 0 0;padding:0 0 0 18px;color:#4f5962;font-size:.86rem;line-height:1.5}" +
      "#vdiView .vd-hints li{margin-bottom:8px}" +
      "#vdiView .vd-ex{margin:14px 0 0;padding:12px 14px;border-radius:12px;font-weight:700}" +
      "#vdiView .vd-ex.ok{background:var(--green-light);color:#0f6a49}" +
      "#vdiView .vd-ex.no{background:var(--red-light);color:#a73737}" +
      "#vdiView .vd-err{background:var(--red-light);color:#8f2f2f;border-radius:12px;padding:12px 16px;font-size:.9rem}" +
      "#vdiView .vd-err ul{margin:6px 0 0;padding-left:18px}" +
      "#vdiView .vd-warn{margin-top:14px;background:#fff8e6;color:#7d5b20;border-radius:12px;padding:10px 14px;font-size:.86rem}" +
      "@media(max-width:700px){#vdiView .vd-bar{grid-template-columns:1fr}#vdiView .form-grid,#vdiView .form-grid.two{grid-template-columns:1fr 1fr}#vdiView .vd-vg{grid-template-columns:1fr}}" +
      "@media(max-width:430px){#vdiView .form-grid,#vdiView .form-grid.two{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  /* ---------- Start ---------- */
  function init() {
    view = document.getElementById(VIEW_ID);
    if (!view) return false;
    load();
    css();
    view.addEventListener("input", onInput);
    view.addEventListener("change", onInput);
    view.addEventListener("click", onClick);
    view.addEventListener("change", e => {
      if (e.target && e.target.id === "vdPick") {
        saveNow();
        store.cur = e.target.value;
        saveNow();
        render();
      }
    });
    window.addEventListener("beforeunload", saveNow);
    render();
    return true;
  }

  root.SPVDI = { calcRoof: calcRoof, calcVorg: calcVorg, calcAll: calcAll, fensterAbstand: fensterAbstand, evaluate: evaluate, render: render };

  if (!init()) {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
