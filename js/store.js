/* Stockage local sur le telephone (IndexedDB) : profils, progression, revision espacee (port de db.py, profiles.py). */
"use strict";

const KV = {
  db: null,
  mem: {},
  async open() {
    if (this.db) return;
    this.db = await new Promise((res, rej) => {
      const r = indexedDB.open("efv", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("kv");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }).catch(() => null);                 // navigation privee : on garde en memoire
  },
  async get(key, def) {
    if (!this.db) return key in this.mem ? this.mem[key] : def;
    return new Promise(res => {
      const t = this.db.transaction("kv").objectStore("kv").get(key);
      t.onsuccess = () => res(t.result === undefined ? def : t.result);
      t.onerror = () => res(def);
    });
  },
  async set(key, val) {
    if (!this.db) { this.mem[key] = val; return; }
    return new Promise(res => {
      const tx = this.db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = () => res(); tx.onerror = () => res();
    });
  },
  async del(key) {
    if (!this.db) { delete this.mem[key]; return; }
    return new Promise(res => {
      const tx = this.db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete(key);
      tx.oncomplete = () => res(); tx.onerror = () => res();
    });
  }
};

const EMOJIS = ["🙂", "😎", "🐱", "🐼", "🦊", "🌸", "⭐", "🚀", "🎨", "🍀"];
const INTERVALS = [0, 1, 3, 7, 21, 60];
function today() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
function nowISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19); }

function emptyProfileData() {
  return {
    settings: {},
    ex: {},            // id -> [essais, justes, dernier (0/1), boite, echeance (jour), categorie, niveau]
    sessions: [],      // {id, started, duration, level, mode, total, correct}
    pron: { sum: 0, n: 0, series: [] },
    pw: {}             // mot -> [essais, somme des scores]
  };
}

/* Profil en cours : toutes les donnees en memoire, enregistrees apres chaque changement */
class Profile {
  constructor(meta, data) {
    this.meta = meta;
    this.d = Object.assign(emptyProfileData(), data || {});
    this._t = null;
  }
  save(now) {
    clearTimeout(this._t);
    const run = () => KV.set("p:" + this.meta.id, this.d);
    if (now) return run();
    this._t = setTimeout(run, 300);
  }
  get(key, def) { return key in this.d.settings ? this.d.settings[key] : def; }
  set(key, val) { this.d.settings[key] = val; this.save(); }

  startSession(level, mode) {
    const id = (this.d.sessions.length ? this.d.sessions[this.d.sessions.length - 1].id : 0) + 1;
    this.d.sessions.push({ id, started: nowISO(), duration: 0, level, mode, total: 0, correct: 0 });
    if (this.d.sessions.length > 400) this.d.sessions.splice(0, this.d.sessions.length - 400);
    this.save();
    return id;
  }
  endSession(sid, duration, total, correct) {
    const s = this.d.sessions.find(x => x.id === sid);
    if (s) Object.assign(s, { duration: Math.round(duration), total, correct });
    this.save(true);
  }
  record(ex, ok, pron) {
    const r = this.d.ex[ex.id] || [0, 0, 0, 0, 0, ex.cat, ex.level];
    r[0] += 1; r[1] += ok ? 1 : 0; r[2] = ok ? 1 : 0;
    r[3] = ok ? Math.min(r[3] + 1, INTERVALS.length - 1) : 0;
    r[4] = today() + INTERVALS[r[3]];
    r[5] = ex.cat; r[6] = ex.level;
    this.d.ex[ex.id] = r;
    if (pron != null) {
      const p = this.d.pron;
      p.sum += pron; p.n += 1; p.series.push([nowISO(), pron]);
      if (p.series.length > 200) p.series.splice(0, p.series.length - 200);
    }
    this.save();
  }
  recordPronWords(words) {
    for (const [w, sc] of words) {
      const r = this.d.pw[w] || [0, 0];
      r[0] += 1; r[1] += sc;
      this.d.pw[w] = r;
    }
    this.save();
  }
  dueIds() {
    const t = today(), out = new Set();
    for (const id in this.d.ex) if (this.d.ex[id][4] <= t) out.add(id);
    return out;
  }
  lastResults() {
    const out = {};
    for (const id in this.d.ex) out[id] = this.d.ex[id][2];
    return out;
  }
  overall() {
    let n = 0, c = 0;
    for (const id in this.d.ex) { n += this.d.ex[id][0]; c += this.d.ex[id][1]; }
    return [n, c];
  }
  lastLevel() { const s = this.d.sessions; return s.length ? s[s.length - 1].level : null; }
  recentSessions(n = 50) { return this.d.sessions.filter(s => s.total > 0).slice(-n).reverse(); }
  sessionSeries(n = 20) { return this.d.sessions.filter(s => s.total > 0).slice(-n); }
  statsBy(col) {                 // col : 6 = categorie (index 5), 'level'
    const agg = {};
    for (const id in this.d.ex) {
      const r = this.d.ex[id];
      const k = col === "level" ? r[6] : r[5];
      const a = agg[k] = agg[k] || [0, 0];
      a[0] += r[0]; a[1] += r[1];
    }
    return agg;
  }
  frequentErrors(n = 15) {
    return Object.entries(this.d.ex).map(([id, r]) => [id, r[0] - r[1], r]).filter(x => x[1] > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, n);
  }
  pronAverage() { const p = this.d.pron; return p.n ? [Math.round(p.sum / p.n), p.n] : [null, 0]; }
  pronSeries(n = 30) { return this.d.pron.series.slice(-n); }
  worstWords(n = 15) {
    return Object.entries(this.d.pw).map(([w, r]) => [w, r[0], Math.round(100 * r[1] / r[0])])
      .filter(x => x[2] < 100).sort((a, b) => a[2] - b[2] || b[1] - a[1]).slice(0, n);
  }
}

const Store = {
  cfg: null,
  async load() {
    await KV.open();
    this.cfg = Object.assign({ profiles: [], last: null, lang: "vi", sound: true, photos: true }, await KV.get("cfg", {}));
    if (!["fr", "vi"].includes(this.cfg.lang)) this.cfg.lang = "vi";
  },
  saveCfg() { return KV.set("cfg", this.cfg); },
  async openProfile(meta) {
    const data = await KV.get("p:" + meta.id, null);
    this.cfg.last = meta.id;
    this.saveCfg();
    return new Profile(meta, data);
  },
  addProfile(name, emoji) {
    name = (name || "").trim();
    if (!name || this.cfg.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) return null;
    const meta = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, emoji };
    this.cfg.profiles.push(meta);
    this.cfg.last = meta.id;
    this.saveCfg();
    return meta;
  },
  async deleteProfile(meta) {
    this.cfg.profiles = this.cfg.profiles.filter(p => p.id !== meta.id);
    await KV.del("p:" + meta.id);
    if (this.cfg.last === meta.id) this.cfg.last = this.cfg.profiles[0] ? this.cfg.profiles[0].id : null;
    this.saveCfg();
  },
  async deleteAll() {
    for (const p of this.cfg.profiles) await KV.del("p:" + p.id);
    this.cfg.profiles = []; this.cfg.last = null;
    this.saveCfg();
  },
  async customList() { return KV.get("custom", []); },
  async saveCustom(list) { return KV.set("custom", list); },

  /* sauvegarde d'un profil dans un fichier (.efv au format JSON) */
  async exportProfile(profile, custom) {
    return JSON.stringify({ format: "efv-web", version: 1, app: "ExerciceFrancaisVietnamiens",
      name: profile.meta.name, emoji: profile.meta.emoji, exported: nowISO(), data: profile.d, custom }, null, 0);
  },
  async importProfile(text) {
    let o;
    try { o = JSON.parse(text); } catch (_) { throw new Error("bad_file"); }
    if (!o || o.app !== "ExerciceFrancaisVietnamiens" || o.format !== "efv-web" || !o.data || typeof o.data.ex !== "object")
      throw new Error("bad_file");
    const base = String(o.name || "Profil").trim().slice(0, 40) || "Profil";
    let name = base, i = 2;
    while (this.cfg.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) name = `${base} (${i++})`;
    const last = this.cfg.last;
    const meta = this.addProfile(name, EMOJIS.includes(o.emoji) ? o.emoji : "🙂");
    await KV.set("p:" + meta.id, Object.assign(emptyProfileData(), o.data));
    this.cfg.last = last;              // on reste sur le profil en cours
    this.saveCfg();
    return { meta, custom: Array.isArray(o.custom) ? o.custom : [] };
  }
};
