/* Moteur : donnees, series d'exercices, notation (port de engine.py, pronun.py, writing.py). */
"use strict";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Expert"];
const PLACEMENT_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const EXAM_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const EXAM_SECTIONS = [["co", ["ecoute", "prononciation"], 90], ["ce", ["lecture"], 90],
  ["ml", ["grammaire", "vocabulaire", "conjugaison", "orthographe", "expressions"], 45], ["eo", ["oral"], 60]];
const WRITING_MINUTES = { A1: 10, A2: 15, B1: 25, B2: 35, C1: 40, C2: 45 };
const EXAM_PASS = 50, EXAM_SECTION_MIN = 20;
const PASS_SCORE = 70, GREEN = 85, ORANGE = 50;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function choice(a) { return a[Math.floor(Math.random() * a.length)]; }

/* ------------------------------------------------------------------ chargement des fichiers */
async function gunzipJSON(url, asText) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
  const buf = new Uint8Array(await r.arrayBuffer());
  let txt;
  if (buf[0] === 0x1f && buf[1] === 0x8b) {         // encore compresse
    if (typeof DecompressionStream === "undefined") throw new Error("NO_GZIP");
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
    txt = await new Response(ds).text();
  } else txt = new TextDecoder().decode(buf);       // l'hebergeur l'a deja decompresse
  return asText ? txt : JSON.parse(txt);
}
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
  return r.json();
}

function normalize(s) {
  s = String(s).trim().toLowerCase().replace(/’/g, "'").replace(/[«»]/g, "").replace(/,/g, " ");
  s = s.replace(/\s+/g, " ");
  return s.trim().replace(/[ .!?;]+$/, "");
}

const Engine = {
  byLevel: {},      // niveau -> [exercices]
  loading: {},
  custom: [],
  counts: {},
  tasks: [],
  byId: {},

  async init() {
    const idx = await getJSON("data/index.json");
    this.counts = idx.counts;
    this.tasks = await getJSON("data/tasks.json");
  },
  setCustom(list) {
    this.custom = (list || []).filter(e => this.valid(e));
    for (const e of this.custom) this.byId[e.id] = e;
  },
  async loadLevel(lv) {
    if (this.byLevel[lv]) return this.byLevel[lv];
    if (!this.loading[lv]) {
      this.loading[lv] = gunzipJSON(`data/ex_${lv}.json.gz`).then(list => {
        this.byLevel[lv] = list;
        for (const e of list) this.byId[e.id] = e;
        return list;
      }).catch(err => { delete this.loading[lv]; throw err; });
    }
    return this.loading[lv];
  },
  async loadLevels(levels) { return Promise.all(levels.map(l => this.loadLevel(l))); },
  levelOfId(id) {
    const p = String(id).split("-")[0];
    return LEVELS.includes(p) ? p : null;
  },
  exercisesOf(level) {
    return (this.byLevel[level] || []).concat(this.custom.filter(e => e.level === level));
  },
  count(level, cats) {
    const c = this.counts[level] || {};
    let n = 0;
    for (const k in c) if (!cats || cats.includes(k)) n += c[k];
    n += this.custom.filter(e => e.level === level && (!cats || cats.includes(e.cat))).length;
    return n;
  },
  valid(e) {
    try {
      return ["qcm", "fill", "order", "speak"].includes(e.type) && e.question != null && e.answer &&
        LEVELS.includes(e.level) && e.cat && typeof e.explain === "object" && "vi" in e;
    } catch (_) { return false; }
  },
  goodAnswer(ex) { return Array.isArray(ex.answer) ? ex.answer[0] : ex.answer; },
  check(ex, answer) {
    const exp = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
    const a = normalize(answer);
    return exp.some(x => normalize(x) === a);
  },
  questionAudio(ex) {
    if (ex.audio) return ex.audio;
    if (ex.type === "order") return this.goodAnswer(ex);
    return ex.question.replace(/[«»]/g, "").replace(/___/g, ", ");
  },
  pronText(ex) {
    if (ex.say) return ex.say;
    if (ex.type === "fill") return ex.question.split(" — ")[0].replace(/___/g, this.goodAnswer(ex));
    return this.goodAnswer(ex);
  },

  /* serie equilibree : on alterne les categories choisies ; les exercices rates reviennent en priorite */
  async makeSession({ level, last, cats, review, size, oral, due }) {
    due = due || new Set();
    let chosen;
    if (review) {
      const ids = new Set([...due, ...Object.keys(last).filter(k => last[k] === 0)]);
      const levels = new Set();
      for (const id of ids) { const l = this.levelOfId(id); if (l) levels.add(l); }
      await this.loadLevels([...levels]);
      let pool = [];
      for (const id of ids) {
        const e = this.byId[id];
        if (e && (oral || e.type !== "speak")) pool.push(e);
      }
      shuffle(pool);
      pool.sort((a, b) => (due.has(a.id) ? 0 : 1) - (due.has(b.id) ? 0 : 1));
      chosen = pool.slice(0, size);
    } else {
      await this.loadLevel(level);
      const pool = this.exercisesOf(level).filter(e => (oral || e.type !== "speak") && (!cats || cats.includes(e.cat)));
      const groups = {};
      for (const e of pool) (groups[e.cat] = groups[e.cat] || []).push(e);
      const queues = [];
      for (const g of Object.values(groups)) {
        const late = g.filter(e => due.has(e.id));
        const rest = g.filter(e => !due.has(e.id));
        const fresh = rest.filter(e => !(e.id in last));
        const failed = rest.filter(e => last[e.id] === 0);
        const done = rest.filter(e => last[e.id] === 1);
        [late, fresh, failed, done].forEach(shuffle);
        queues.push([...late.slice(0, 3), ...failed.slice(0, 2), ...fresh, ...failed.slice(2), ...late.slice(3), ...done]);
      }
      chosen = [];
      while (chosen.length < size && queues.some(q => q.length)) {
        shuffle(queues);
        for (const q of queues) if (q.length && chosen.length < size) chosen.push(q.shift());
      }
      shuffle(chosen);
    }
    return new Session(chosen, level);
  },

  async makePlacement(perLevel = 3) {
    // reservoir prepare a la construction (80 questions par niveau et par categorie)
    if (!this.placementPool) this.placementPool = await gunzipJSON("data/placement.json.gz");
    for (const e of this.placementPool) if (!this.byId[e.id]) this.byId[e.id] = e;
    let picked = [];
    for (const lv of PLACEMENT_LEVELS) {
      const pool = this.placementPool.filter(e => e.level === lv);
      const byCat = {};
      for (const e of pool) (byCat[e.cat] = byCat[e.cat] || []).push(e);
      const cats = shuffle(Object.keys(byCat));
      const chosen = [];
      let i = 0;
      while (chosen.length < perLevel && cats.length) {
        const c = cats[i % cats.length];
        if (byCat[c].length) { chosen.push(byCat[c].splice(Math.floor(Math.random() * byCat[c].length), 1)[0]); i++; }
        else cats.splice(cats.indexOf(c), 1);
      }
      picked = picked.concat(chosen);
    }
    const s = new Session(picked, "TEST");
    s.placement = true;
    return s;
  },
  placementLevel(results, need = 2) {
    const per = {};
    for (const [lv, ok] of results) {
      const a = per[lv] = per[lv] || [0, 0];
      a[0] += ok ? 1 : 0; a[1] += 1;
    }
    for (const lv of PLACEMENT_LEVELS) if (per[lv] && per[lv][0] < Math.min(need, per[lv][1])) return [lv, per];
    return ["Expert", per];
  },

  async makeExam(level, last, oral, writing, perSection = 10) {
    await this.loadLevel(level);
    last = last || {};
    let picked = [], secs = [], limit = 0;
    const all = this.exercisesOf(level);
    for (const [key, cats, spq] of EXAM_SECTIONS) {
      if (key === "eo" && !oral) continue;
      let pool = all.filter(e => cats.includes(e.cat) && (key === "eo" ? e.type === "speak" : ["qcm", "fill"].includes(e.type)));
      if (key === "co") pool = pool.filter(e => e.audio);
      else if (key === "ce" || key === "ml") pool = pool.filter(e => !e.audio && !e.dictation);
      shuffle(pool);
      pool.sort((a, b) => ((a.id in last) ? 1 : 0) - ((b.id in last) ? 1 : 0));
      let chosen;
      if (key === "ml") {
        const groups = {};
        for (const e of pool) (groups[e.cat] = groups[e.cat] || []).push(e);
        chosen = [];
        while (chosen.length < perSection && Object.values(groups).some(g => g.length))
          for (const g of Object.values(groups)) if (g.length && chosen.length < perSection) chosen.push(g.shift());
      } else chosen = pool.slice(0, perSection);
      picked = picked.concat(chosen);
      secs = secs.concat(chosen.map(() => key));
      limit += spq * chosen.length;
    }
    if (writing) {
      const task = this.pickTask(level);
      if (task) { picked.push(this.taskExercise(task)); secs.push("ew"); limit += (WRITING_MINUTES[level] || 30) * 60; }
    }
    const s = new Session(picked, level);
    s.exam = true; s.sec = secs; s.limit = limit;
    return s;
  },
  examReport(s) {
    const per = {};
    s.sec.forEach((key, i) => {
      const a = per[key] = per[key] || [0, 0];
      if (key === "ew") { a[0] = s.wres[i] ? s.wres[i].total : 0; a[1] = 25; return; }
      a[1] += 1;
      if (s.log[i] && s.log[i][1]) a[0] += 1;
    });
    const pcts = {};
    for (const k in per) pcts[k] = per[k][1] ? Math.round(100 * per[k][0] / per[k][1]) : 0;
    const vals = Object.values(pcts);
    const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const passed = total >= EXAM_PASS && vals.every(p => p >= EXAM_SECTION_MIN);
    return { sections: per, pcts, total, passed };
  },

  /* ---------------- expression ecrite */
  pickTask(level, exclude = []) {
    const pool = this.tasks.filter(t => t.level === level);
    const fresh = pool.filter(t => !exclude.includes(t.id));
    return (fresh.length ? choice(fresh) : pool.length ? choice(pool) : null);
  },
  taskExercise(task) {
    return { id: task.id, level: task.level, theme: "ecrit", cat: "ecrit", type: "write", question: task.fr, vi: task.vi,
      answer: "", explain: { fr: "", vi: "" }, task };
  }
};

class Session {
  constructor(exercises, level) {
    this.exercises = exercises; this.level = level;
    this.results = []; this.idx = 0; this.correct = 0; this.sid = null;
    this.t0 = Date.now(); this.tEx = Date.now();
    this.pron = []; this.sec = []; this.log = {}; this.wres = {};
    this.placement = false; this.exam = false; this.limit = 0;
  }
  current() { return this.exercises[this.idx]; }
  submit(ok) {
    this.results.push([this.exercises[this.idx].level, !!ok]);
    this.correct += ok ? 1 : 0;
    return (Date.now() - this.tEx) / 1000;
  }
  advance() { this.idx++; this.tEx = Date.now(); return this.idx < this.exercises.length; }
  get total() { return this.exercises.length; }
  get duration() { return (Date.now() - this.t0) / 1000; }
}

/* ------------------------------------------------------------------ prononciation (pronun.py) */
const Pron = {
  wordsOf(text) {
    let t = String(text).toLowerCase().replace(/’/g, "'").replace(/œ/g, "oe");
    t = t.replace(/[«»"“”.,;:!?¿…()\[\]\/]/g, " ").replace(/'/g, " ").replace(/-/g, " ");
    return t.split(/\s+/).filter(Boolean);
  },
  fold(w) { return w.normalize("NFD").replace(/[̀-ͯ]/g, ""); },
  ratio(a, b) {                 // difflib.SequenceMatcher(None, a, b).ratio()
    const matches = (a0, a1, b0, b1) => {
      let best = 0, bi = 0, bj = 0;
      for (let i = a0; i < a1; i++) for (let j = b0; j < b1; j++) {
        let k = 0;
        while (i + k < a1 && j + k < b1 && a[i + k] === b[j + k]) k++;
        if (k > best) { best = k; bi = i; bj = j; }
      }
      if (!best) return 0;
      return best + matches(a0, bi, b0, bj) + matches(bi + best, a1, bj + best, b1);
    };
    const t = a.length + b.length;
    return t ? 2 * matches(0, a.length, 0, b.length) / t : 1;
  },
  wordSim(a, b) {
    if (a === b) return 1;
    const fa = this.fold(a), fb = this.fold(b);
    if (fa === fb) return 0.85;
    const r = this.ratio(fa, fb);
    return r >= 0.6 ? Math.round(0.6 * r * 1000) / 1000 : 0;
  },
  align(target, heard) {
    const n = target.length, m = heard.length;
    const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    const back = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
    for (let i = 1; i <= n; i++) back[i][0] = "del";
    for (let j = 1; j <= m; j++) back[0][j] = "ins";
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const sim = this.wordSim(target[i - 1], heard[j - 1]);
      const opts = [[best[i - 1][j - 1] + sim, "sub"], [best[i - 1][j], "del"], [best[i][j - 1] - 0.15, "ins"]];
      let o = opts[0];
      for (const x of opts) if (x[0] > o[0]) o = x;
      best[i][j] = o[0]; back[i][j] = o[1];
    }
    const out = new Array(n).fill(null);
    let extra = 0, i = n, j = m;
    while (i > 0 || j > 0) {
      const step = back[i][j];
      if (step === "sub") {
        const s = this.wordSim(target[i - 1], heard[j - 1]);
        out[i - 1] = [s, s > 0 ? heard[j - 1] : null];
        if (s === 0) extra++;
        i--; j--;
      } else if (step === "del") { out[i - 1] = [0, null]; i--; }
      else { extra++; j--; }
    }
    return [out, extra];
  },
  score(targetText, heardText) {
    const target = this.wordsOf(targetText), heard = this.wordsOf(heardText || "");
    if (!target.length) return { percent: 0, words: [], heard: heardText || "", extra: 0, verdict: "retry", silent: true };
    if (!heard.length) return { percent: 0, words: target.map(w => [w, 0, null]), heard: "", extra: 0, verdict: "retry", silent: true };
    const [aligned, extra] = this.align(target, heard);
    const weights = target.map(w => Math.max(this.fold(w).length, 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let raw = weights.reduce((s, wt, k) => s + wt * aligned[k][0], 0) / total;
    raw -= Math.min(0.25, 0.05 * extra);
    const pct = Math.max(0, Math.min(100, Math.round(100 * raw)));
    return { percent: pct, words: target.map((w, k) => [w, aligned[k][0], aligned[k][1]]), heard: heard.join(" "),
      extra, verdict: this.verdict(pct), silent: false };
  },
  verdict(p) { return p >= 90 ? "excellent" : p >= PASS_SCORE ? "good" : p >= 50 ? "medium" : "retry"; },
  color(s) { const v = s * 100; return v >= GREEN ? "#16A34A" : v >= ORANGE ? "#D97706" : "#DC2626"; }
};

/* ------------------------------------------------------------------ expression ecrite (writing.py) */
const Writing = {
  CRITERIA: [["consigne", 10], ["longueur", 4], ["connecteurs", 4], ["lexique", 4], ["structure", 3]],
  LABELS: {
    consigne: ["Respect de la consigne", "Đáp ứng yêu cầu đề bài"], longueur: ["Longueur", "Độ dài"],
    connecteurs: ["Connecteurs logiques", "Từ nối logic"], lexique: ["Variété du lexique", "Sự đa dạng từ vựng"],
    structure: ["Structure et formules", "Cấu trúc và công thức"]
  },
  CONNECTORS: ("et|mais|ou|donc|puis|ensuite|alors|parce que|car|pourtant|cependant|d'abord|enfin|aussi|par exemple|" +
    "en effet|toutefois|neanmoins|en revanche|par ailleurs|en outre|d'une part|d'autre part|de plus|" +
    "premierement|deuxiemement|en conclusion|pour conclure|en definitive|en somme|certes|or|ainsi|" +
    "c'est pourquoi|dès lors|des lors|en consequence|d'ailleurs|quant a|bien que|malgre|afin de|pour que|" +
    "tandis que|alors que|au contraire|dans un premier temps|dans un second temps|au terme|force est de constater|" +
    "pour ma part|en definitive|par consequent|en resume").split("|"),
  NEED: { A1: 1, A2: 2, B1: 3, B2: 5, C1: 6, C2: 7 },
  TTR: { A1: 0.5, A2: 0.5, B1: 0.55, B2: 0.6, C1: 0.62, C2: 0.65 },
  OPENERS: "cher|chere|bonjour|salut|madame|monsieur|coucou|messieurs|bonsoir".split("|"),
  CLOSERS: ("cordialement|bises|bisous|a bientot|amicalement|salutations|agreer|a samedi|a tres vite|bien a vous|" +
    "a+|a plus|ecris-moi|ecrivez-moi|merci d'avance|dans l'attente|respectueux|considerat").split("|"),
  INTRO: ("aujourd'hui|de nos jours|on peut se demander|question|depuis quelques|de plus en plus|dans quelle mesure|" +
    "faut-il|est-il|peut-on|constat|se demander").split("|"),
  CONCL: "en conclusion|pour conclure|en definitive|en somme|en resume|au terme|finalement|pour finir|en fin de compte|enfin".split("|"),
  SELF_CHECK: [
    ["Chaque phrase a un sujet et un verbe conjugué.", "Mỗi câu có chủ ngữ và động từ đã chia."],
    ["J'ai vérifié les accords (genre et nombre) des noms, adjectifs et participes.", "Tôi đã kiểm tra sự hợp giống và số của danh từ, tính từ, phân từ."],
    ["J'ai vérifié les terminaisons des verbes et les temps utilisés.", "Tôi đã kiểm tra đuôi động từ và các thì đã dùng."],
    ["J'ai contrôlé les accents et l'orthographe des mots difficiles.", "Tôi đã kiểm tra dấu và chính tả những từ khó."],
    ["Le registre est cohérent (tu/vous, formules de politesse).", "Văn phong nhất quán (tu/vous, công thức lịch sự)."]
  ],
  known: null,
  async loadKnown() {
    if (this.known) return;
    try { this.known = new Set((await gunzipJSON("data/words.txt.gz", true)).split(" ")); }
    catch (_) { this.known = new Set(); }
  },
  norm(s) { return s.toLowerCase().replace(/’/g, "'").normalize("NFD").replace(/[̀-ͯ]/g, ""); },
  wordsOf(text) { return text.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœæ]+(?:'[a-zàâäçéèêëîïôöùûüÿœæ]+)*/g) || []; },
  esc(p) { return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); },
  has(textN, list) { return list.filter(p => new RegExp("(?<![a-z])" + this.esc(p) + "(?![a-z])").test(textN)); },
  unknownWords(text, limit = 10) {
    const k = this.known;
    if (!k || !k.size) return [];
    const out = [], seen = new Set();
    const re = /[A-Za-zÀ-ÿœŒ]+(?:'[A-Za-zÀ-ÿœŒ]+)*/g;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[0];
      const parts = raw.toLowerCase().split("'");
      const w = parts[parts.length - 1];
      const before = text.slice(0, m.index).replace(/\s+$/, "");
      const start = m.index === 0 || ".!?\n:".includes(before.slice(-1)) || before === "";
      if (w.length < 4 || k.has(w) || seen.has(w) || (raw[0] !== raw[0].toLowerCase() && !start)) continue;
      if ([1, 2, 3].some(n => w.length - n >= 3 && k.has(w.slice(0, -n))) || k.has(w + "s") || k.has(w + "e")) continue;
      seen.add(w); out.push(raw);
      if (out.length >= limit) break;
    }
    return out;
  },
  score(task, text) {
    const level = task.level;
    text = text || "";
    const n_text = this.norm(text);
    const ws = this.wordsOf(text);
    const n = ws.length;
    const pts = {};
    const els = task.elements, found = [];
    for (const el of els) {
      const pats = el.kw.split("|");
      const hit = pats.some(p => {
        try {
          const re = /[\\?+*\[(]/.test(p) ? new RegExp(p) : new RegExp("(?<![a-z])" + this.esc(p));
          return re.test(n_text);
        } catch (_) { return n_text.includes(p); }
      });
      if (hit) found.push(el);
    }
    pts.consigne = els.length ? Math.round(100 * found.length / els.length) / 10 : 0;
    const mn = task.min, mx = task.max;
    if (n >= mn && n <= mx * 1.3) pts.longueur = 4;
    else if (n > mx * 1.3) pts.longueur = 2;
    else pts.longueur = n > 0.4 * mn ? Math.round(40 * Math.max(0, n - 0.4 * mn) / (0.6 * mn)) / 10 : 0;
    const conns = this.has(n_text, this.CONNECTORS.map(c => this.norm(c)));
    const need = this.NEED[level] || 3;
    pts.connecteurs = Math.round(40 * Math.min(1, new Set(conns).size / need)) / 10;
    const content = ws.filter(w => w.length > 2);
    const ttr = content.length ? new Set(content).size / content.length : 0;
    pts.lexique = n >= 0.5 * mn ? Math.round(40 * Math.min(1, ttr / (this.TTR[level] || 0.55))) / 10
      : Math.round(20 * Math.min(1, ttr / 0.55)) / 10;
    const form = task.form || "essay";
    let s = 0;
    const paras = text.split(/\n\s*\n|\n/).filter(p => p.trim());
    if (form === "letter" || form === "message") {
      if (this.has(n_text, this.OPENERS).length) s += 1;
      if (this.has(n_text, this.CLOSERS).length) s += 1;
      if ((n && ".!?)".includes(text.trim().slice(-1)) && text.trim()) || (n && paras.length > 1)) s += 1;
      else if (n) s += 0.5;
    } else {
      if (this.has(n_text, this.INTRO).length) s += 1;
      if (this.has(n_text, this.CONCL).length) s += 1;
      if (paras.length >= 2 || (text.match(/[.!?]/g) || []).length >= 6) s += 1;
    }
    pts.structure = s;
    if (n === 0) for (const [k] of this.CRITERIA) pts[k] = 0;
    const total = Math.round(10 * Object.values(pts).reduce((a, b) => a + b, 0)) / 10;
    return { pts, total, pct: Math.round(100 * total / 25), words: n, found: found.map(e => e.fr),
      missing: els.filter(e => !found.includes(e)), connectors: [...new Set(conns)].sort(),
      unknown: n ? this.unknownWords(text) : [] };
  }
};
