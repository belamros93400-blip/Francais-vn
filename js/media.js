/* Voix francaise, sons, micro (reconnaissance vocale) et vraies photos Wikimedia. */
"use strict";

/* ------------------------------------------------------------------ voix (synthese vocale de l'iPhone) */
/* Par defaut on NE choisit PAS de voix : l'iPhone utilise sa voix francaise systeme (toujours installee).
   Forcer une voix de la liste peut rendre l'app muette si cette voix n'est pas telechargee (constate sur iPhone recents).
   L'utilisateur peut choisir une voix dans Reglages ; si elle ne demarre pas, on reessaie sans voix. */
const Voice = {
  ok: "speechSynthesis" in window,
  chosen: "",            // voiceURI choisi par l'utilisateur ("" = voix systeme)
  current: null,         // garde une reference (sinon WebKit peut perdre l'enonce)
  onfail: null,
  token: 0,
  frVoices() {
    if (!this.ok) return [];
    return speechSynthesis.getVoices().filter(v => /^fr([-_]|$)/i.test(v.lang));
  },
  init(chosen) {
    if (!this.ok) return;
    this.chosen = chosen || "";
    try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (_) {}
  },
  _utter(text, slow, useChosen) {
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "fr-FR";
    u.volume = 1;
    u.rate = slow ? 0.55 : 0.95;
    if (useChosen && this.chosen) {
      const v = this.frVoices().find(x => x.voiceURI === this.chosen);
      if (v) u.voice = v;
    }
    return u;
  },
  speak(text, slow) {
    if (!this.ok || !text || !String(text).trim()) return false;
    const synth = speechSynthesis;
    const my = ++this.token;
    const go = (useChosen, retry) => {
      if (my !== this.token) return;
      let started = false;
      const u = this._utter(text, slow, useChosen);
      u.onstart = () => { started = true; };
      u.onerror = e => {
        if (started || my !== this.token || (e && (e.error === "interrupted" || e.error === "canceled"))) return;
        started = true;
        if (retry) retry(); else if (this.onfail) this.onfail();
      };
      this.current = u;
      try { synth.resume(); synth.speak(u); } catch (_) { if (this.onfail) this.onfail(); return; }
      // garde-fou : si rien ne demarre, on relance une fois avec la voix systeme
      setTimeout(() => {
        if (started || my !== this.token) return;
        try { synth.cancel(); } catch (_) {}
        if (retry) setTimeout(retry, 150); else if (this.onfail) this.onfail();
      }, 2500);
    };
    const first = () => this.chosen ? go(true, () => go(false, null)) : go(false, () => go(false, null));
    try {
      if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(first, 150); }  // bug WebKit : cancel puis speak immediat
      else first();
    } catch (_) { return false; }
    return true;
  },
  stop() {
    this.token++;
    try { if (this.ok && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (_) {}
  }
};

/* ------------------------------------------------------------------ sons de jeu */
const Sounds = {
  enabled: true,
  bank: {},
  init() {
    for (const k of ["correct", "wrong", "win", "lose"]) {
      const a = new Audio(`snd/${k}.m4a`);
      a.preload = "auto";
      this.bank[k] = a;
    }
  },
  play(k) {
    if (!this.enabled || !this.bank[k]) return;
    try { const a = this.bank[k]; a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); } catch (_) {}
  }
};

/* ------------------------------------------------------------------ micro : reconnaissance vocale de l'iPhone */
const Speech = {
  Rec: window.SpeechRecognition || window.webkitSpeechRecognition || null,
  get available() { return !!this.Rec; },
  rec: null,
  /* cb.onresult(alternatives[]) ; cb.onerror(code) ; cb.onpartial(texte) */
  start(cb) {
    if (!this.Rec) return false;
    this.stop(true);
    const r = new this.Rec();
    r.lang = "fr-FR";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 5;
    const finals = [];
    let partial = "", done = false;
    r.onresult = ev => {
      partial = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          const alts = [];
          for (let k = 0; k < res.length; k++) alts.push(res[k].transcript);
          finals.push(alts);
        } else partial += res[0].transcript;
      }
      if (cb.onpartial) cb.onpartial((finals.map(a => a[0]).join(" ") + " " + partial).trim());
    };
    r.onerror = ev => { if (!done) { done = true; cb.onerror(ev.error || "error"); } };
    r.onend = () => {
      this.rec = null;
      if (done) return;
      done = true;
      // alternatives : premiere phrase complete + variantes de chaque morceau
      let alts = [];
      if (finals.length) {
        const main = finals.map(a => a[0]).join(" ");
        alts.push(main);
        finals.forEach((a, i) => a.slice(1).forEach(v => {
          const copy = finals.map(x => x[0]); copy[i] = v; alts.push(copy.join(" "));
        }));
      } else if (partial) alts = [partial];
      cb.onresult(alts);
    };
    try { r.start(); } catch (e) { return false; }
    this.rec = r;
    // garde-fou (bug iOS : la reconnaissance peut rester bloquee apres un son)
    clearTimeout(this.wd);
    this.wd = setTimeout(() => { if (this.rec === r && !done) { try { r.abort(); } catch (_) {} if (!done) { done = true; this.rec = null; cb.onresult(finals.map(a => a[0])); } } }, 15000);
    return true;
  },
  stop(abort) {
    if (!this.rec) return;
    try { abort ? this.rec.abort() : this.rec.stop(); } catch (_) {}
    if (abort) this.rec = null;
  }
};

/* ------------------------------------------------------------------ vraies photos (Wikipedia / Wikimedia Commons) */
const Photos = {
  API: "https://fr.wikipedia.org/w/api.php",
  WIDTH: 640,
  OK_MIME: ["image/jpeg", "image/png", "image/webp", "image/tiff"],
  HINTS: { nourriture: "aliment", animaux: "animal", objets: "objet", metiers: "métier", maison: "maison",
    vetements: "vêtement", transport: "véhicule", ecole: "école", bureau: "bureau", voyage: "voyage",
    logement: "logement", nature: "nature", ville: "ville", lieux: "bâtiment", loisirs: "loisir",
    restaurant: "cuisine", shopping: "commerce", sante: "santé", meteo: "météorologie", medias: "média",
    sciences: "science", culture: "art", vocab_image: "objet", travail: "travail" },
  words: {},
  credits: {},
  rejected: new Set(),
  urls: {},
  pending: {},
  async init() {
    try { this.words = await getJSON("data/photos.json"); } catch (_) { this.words = {}; }
    this.credits = await KV.get("photo_credits", {});
    this.rejected = new Set(await KV.get("photo_rejected", []));
  },
  saveCredits() { clearTimeout(this._t); this._t = setTimeout(() => KV.set("photo_credits", this.credits), 400); },
  async cache() { return "caches" in window ? caches.open("efv-photos") : null; },
  async url(key) {
    if (!key || this.rejected.has(key)) return null;
    if (this.urls[key]) return this.urls[key];
    const info = this.credits[key];
    if (!info || !info.ok) return null;
    const c = await this.cache();
    const r = c && await c.match("photo/" + key);
    if (!r) return null;
    this.urls[key] = URL.createObjectURL(await r.blob());
    return this.urls[key];
  },
  creditText(key) {
    const i = this.credits[key] || {};
    return i.ok ? `📷 ${i.author || "Wikimedia Commons"} — ${i.license || ""} — Wikimedia Commons` : "";
  },
  async reject(key) {
    this.rejected.add(key);
    await KV.set("photo_rejected", [...this.rejected]);
  },
  async _get(params) {
    const q = new URLSearchParams(Object.assign({}, params, { format: "json", formatversion: "2", origin: "*" }));
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(this.API + "?" + q.toString(), { signal: ctl.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  },
  async _pageImage(title) {
    const d = await this._get({ action: "query", titles: title, redirects: 1, prop: "pageimages|pageprops", piprop: "name", ppprop: "disambiguation" });
    for (const p of (d.query && d.query.pages) || []) {
      if (p.missing || (p.pageprops && "disambiguation" in p.pageprops)) return null;
      return p.pageimage || null;
    }
    return null;
  },
  async _searchImage(query) {
    const d = await this._get({ action: "query", generator: "search", gsrsearch: query, gsrlimit: 6, gsrnamespace: 0,
      prop: "pageimages|pageprops", piprop: "name", ppprop: "disambiguation" });
    const pages = ((d.query && d.query.pages) || []).sort((a, b) => (a.index || 99) - (b.index || 99));
    for (const p of pages) if (p.pageimage && !(p.pageprops && "disambiguation" in p.pageprops)) return p.pageimage;
    return null;
  },
  _strip(s) {
    const div = document.createElement("div");
    div.innerHTML = String(s || "").replace(/<[^>]+>/g, "");
    return div.textContent.replace(/\s+/g, " ").trim();
  },
  async _fileInfo(name) {
    const d = await this._get({ action: "query", titles: "Fichier:" + name, prop: "imageinfo", iiprop: "url|mime|extmetadata",
      iiurlwidth: this.WIDTH, iiextmetadatafilter: "Artist|LicenseShortName" });
    for (const p of (d.query && d.query.pages) || []) for (const ii of p.imageinfo || []) {
      const m = ii.extmetadata || {};
      return { thumb: ii.thumburl || ii.url, mime: ii.mime || "", page: ii.descriptionurl || "",
        license: this._strip((m.LicenseShortName || {}).value), author: this._strip((m.Artist || {}).value).slice(0, 80) };
    }
    return null;
  },
  _free(lic) {
    const l = (lic || "").toLowerCase();
    return /^(cc|public domain|domaine public|pd)/.test(l) || l.includes("cc0") || l.includes("cc by");
  },
  /* telecharge la photo d'un mot ; true si une photo est ensuite disponible */
  fetch(key) {
    if (this.pending[key]) return this.pending[key];
    this.pending[key] = this._fetch(key).finally(() => delete this.pending[key]);
    return this.pending[key];
  },
  async _fetch(key) {
    const known = this.credits[key];
    if (known && known.ok && await this.url(key)) return true;
    if (known && known.fail) return false;
    const e = this.words[key];
    if (!e || !navigator.onLine) return false;
    const names = [];
    try {
      let n = await this._pageImage(e.title);
      if (n) names.push(n);
      if (e.title !== e.word) {
        n = await this._pageImage(e.word[0].toUpperCase() + e.word.slice(1));
        if (n && !names.includes(n)) names.push(n);
      }
      n = await this._searchImage(`${e.word} ${this.HINTS[e.theme] || ""}`.trim());
      if (n && !names.includes(n)) names.push(n);
      for (const name of names) {
        if (/\.(svg|gif)$/i.test(name)) continue;
        const info = await this._fileInfo(name);
        if (!info || !info.thumb || !this.OK_MIME.includes(info.mime) || !this._free(info.license)) continue;
        const r = await fetch(info.thumb, { mode: "cors" });
        if (!r.ok) continue;
        const blob = await r.blob();
        if (blob.size < 1500) continue;
        const c = await this.cache();
        if (!c) return false;
        await c.put("photo/" + key, new Response(blob, { headers: { "Content-Type": blob.type || info.mime } }));
        this.credits[key] = { ok: true, author: info.author, license: info.license, url: info.page, title: name };
        this.saveCredits();
        return true;
      }
    } catch (_) {
      return false;                     // pas d'Internet ou erreur passagere : on reessaiera
    }
    this.credits[key] = { fail: true };  // aucune photo libre : on garde le dessin
    this.saveCredits();
    return false;
  },
  missing() {
    return Object.keys(this.words).filter(k => !(this.credits[k] && (this.credits[k].ok || this.credits[k].fail)));
  },
  async fetchAll(progress, stop) {
    const todo = this.missing();
    let i = 0, ok = 0, done = 0;
    const worker = async () => {
      while (i < todo.length && !stop()) {
        const k = todo[i++];
        if (await this.fetch(k)) ok++;
        done++;
        progress(done, todo.length);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return [ok, todo.length];
  }
};
