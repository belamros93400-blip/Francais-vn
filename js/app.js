/* Interface de l'application iPhone (port de ui.py et editor.py). */
"use strict";

const LEVEL_COLORS = { A1: "#22C55E", A2: "#14B8A6", B1: "#3B82F6", B2: "#8B5CF6", C1: "#F59E0B", C2: "#EF4444", Expert: "#1E293B" };
const PALETTE = ["#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];
const ACCENTS = ["é", "è", "ê", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "ë", "œ", "æ", "’"];

let I18N = null, S = {}, CAT_KEYS = [], CAT_INFO = {}, THEMES = {}, LEVEL_DESC = {};

/* textes propres a l'iPhone (remplacent ceux qui parlaient de Windows ou du PC) */
const EXTRA = {
  no_voice: { fr: "Aucune voix française trouvée. Sur l'iPhone : Réglages > Accessibilité > Contenu énoncé > Voix > Français.",
    vi: "Không tìm thấy giọng đọc tiếng Pháp. Trên iPhone: Cài đặt > Trợ năng > Nội dung được đọc > Giọng nói > Tiếng Pháp." },
  oral_off: { fr: "Les exercices oraux sont désactivés : la reconnaissance vocale n'est pas disponible sur cet appareil.",
    vi: "Bài tập nói đang bị tắt: thiết bị này không hỗ trợ nhận dạng giọng nói." },
  mic_fail: { fr: "Impossible d'utiliser le micro. Autorisez le micro et la reconnaissance vocale : Réglages > Confidentialité et sécurité > Micro / Reconnaissance vocale.",
    vi: "Không dùng được micro. Hãy cho phép micro và nhận dạng giọng nói: Cài đặt > Quyền riêng tư & Bảo mật > Micrô / Nhận dạng lời nói." },
  speech_net: { fr: "La reconnaissance vocale a besoin d'Internet sur cet iPhone. Connectez-vous puis réessayez.",
    vi: "Nhận dạng giọng nói cần có Internet trên iPhone này. Hãy kết nối rồi thử lại." },
  ph_confirm: { fr: "Télécharger {n} photos depuis Wikipédia / Wikimedia Commons (photos libres de droits) ?\nIl faut Internet. Cela prend quelques minutes ; ensuite les photos restent sur cet iPhone.",
    vi: "Tải {n} ảnh từ Wikipedia / Wikimedia Commons (ảnh có giấy phép tự do)?\nCần có Internet. Mất vài phút; sau đó ảnh được lưu trên điện thoại này." },
  ph_all_done: { fr: "Toutes les photos disponibles sont déjà sur cet iPhone.", vi: "Tất cả ảnh đã có trên điện thoại này." },
  leave_confirm: { fr: "Quitter cette série ? Les réponses déjà données sont enregistrées.", vi: "Thoát loạt bài này? Các câu đã trả lời vẫn được lưu." },
  install_title: { fr: "Installer l'application", vi: "Cài đặt ứng dụng" },
  install_text: { fr: "Dans Safari, touchez le bouton Partager (carré avec une flèche ↑), puis « Sur l'écran d'accueil ». L'application aura son icône, s'ouvrira en plein écran comme les autres et fonctionnera sans Internet.",
    vi: "Trong Safari, chạm nút Chia sẻ (hình vuông có mũi tên ↑), rồi chọn « Thêm vào MH chính ». Ứng dụng sẽ có biểu tượng riêng, mở toàn màn hình như các ứng dụng khác và dùng được khi không có Internet." },
  loading: { fr: "Chargement…", vi: "Đang tải…" },
  old_ios: { fr: "Cet iPhone est trop ancien pour cette application : il faut iOS 16.4 ou plus récent.",
    vi: "iPhone này quá cũ cho ứng dụng: cần iOS 16.4 trở lên." },
  load_fail: { fr: "Impossible de charger les exercices. Ouvrez l'application une fois avec Internet, puis réessayez.",
    vi: "Không tải được bài tập. Hãy mở ứng dụng một lần khi có Internet rồi thử lại." },
  yes: { fr: "Oui", vi: "Có" }, no: { fr: "Non", vi: "Không" }, cancel: { fr: "Annuler", vi: "Hủy" }, ok: { fr: "OK", vi: "OK" },
  close: { fr: "Fermer", vi: "Đóng" },
  activities: { fr: "Activités", vi: "Hoạt động" },
  settings: { fr: "Réglages", vi: "Cài đặt" },
  cert_print: { fr: "🖨 Imprimer / Enregistrer en PDF", vi: "🖨 In / Lưu thành PDF" },
  backup_tip: { fr: "Conseil : sauvegardez votre profil de temps en temps. Le fichier va dans l'app « Fichiers » (ou iCloud).",
    vi: "Mẹo: thỉnh thoảng hãy sao lưu hồ sơ. Tệp được lưu trong ứng dụng « Tệp » (hoặc iCloud)." },
  offline_ok: { fr: "✓ Application prête à fonctionner sans Internet", vi: "✓ Ứng dụng đã sẵn sàng dùng không cần Internet" },
  pick_emoji: { fr: "Choisissez une image", vi: "Chọn hình đại diện" },
  photos_mine: { fr: "Photos téléchargées", vi: "Ảnh đã tải" },
  quit_q: { fr: "Quitter", vi: "Thoát" },
  remove_word: { fr: "Touchez un mot pour le retirer.", vi: "Chạm vào một từ để bỏ nó ra." },
  version: { fr: "Version", vi: "Phiên bản" },
  update_ready: { fr: "Nouvelle version installée. Elle sera utilisée au prochain lancement.", vi: "Đã cài phiên bản mới. Sẽ dùng ở lần mở tiếp theo." }
};
const APP_VERSION = "0.17-ios.1";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function fmt(text, kw) { return kw ? text.replace(/\{(\w+)\}/g, (m, k) => (k in kw ? kw[k] : m)) : text; }
function tr(lang, key, kw) { const d = S[key] || {}; return fmt(d[lang] || d.fr || key, kw); }
const App = {
  lang: "vi", profile: null, session: null, answered: false, last: null, view: "home",
  get L() { return this.lang; }
};
function t(key, kw) { return tr(App.lang, key, kw); }
function bi(key, kw) { return `${tr("fr", key, kw)}  /  ${tr("vi", key, kw)}`; }
function biH(key, kw) { return `${esc(tr("fr", key, kw))}<br><span class="vi">${esc(tr("vi", key, kw))}</span>`; }
function catName(L, k) { return (CAT_INFO[k] || {})[L] || k; }
function themeName(L, k) { return (THEMES[k] || {})[L] || k; }
function html(el, s) { el.innerHTML = s; return el; }

/* ------------------------------------------------------------------ fenetres (remplacent les QMessageBox) */
const Modal = {
  open(inner, { dismiss = true } = {}) {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal" role="dialog">${inner}</div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    if (dismiss) bg.addEventListener("click", e => { if (e.target === bg) { close(); bg.dispatchEvent(new Event("dismiss")); } });
    return { bg, box: bg.firstChild, close };
  },
  alert(msg, title) {
    return new Promise(res => {
      const m = this.open(`${title ? `<div class="mt">${esc(title)}</div>` : ""}<div class="mb">${msg}</div>
        <div class="acts"><button class="btn" data-ok>${esc(t("ok"))}</button></div>`);
      m.bg.addEventListener("dismiss", () => res());
      $("[data-ok]", m.box).onclick = () => { m.close(); res(); };
    });
  },
  confirm(msg, title, yes, no) {
    return new Promise(res => {
      const m = this.open(`${title ? `<div class="mt">${esc(title)}</div>` : ""}<div class="mb">${msg}</div>
        <div class="acts"><button class="btn" data-y>${esc(yes || t("yes"))}</button>
        <button class="btn ghost" data-n>${esc(no || t("no"))}</button></div>`);
      m.bg.addEventListener("dismiss", () => res(false));
      $("[data-y]", m.box).onclick = () => { m.close(); res(true); };
      $("[data-n]", m.box).onclick = () => { m.close(); res(false); };
    });
  },
  pick(title, options, current) {
    return new Promise(res => {
      const m = this.open(`<div class="mt">${esc(title)}</div><div class="acts">${options.map((o, i) =>
        `<button class="btn ${o.value === current ? "" : "ghost"}" data-i="${i}">${esc(o.label)}</button>`).join("")}
        <button class="btn small" style="background:#94A3B8" data-c>${esc(t("cancel"))}</button></div>`);
      m.bg.addEventListener("dismiss", () => res(null));
      $$("[data-i]", m.box).forEach(b => b.onclick = () => { m.close(); res(options[+b.dataset.i].value); });
      $("[data-c]", m.box).onclick = () => { m.close(); res(null); };
    });
  }
};
function toast(msg, ms = 3200) {
  const d = document.createElement("div");
  d.className = "toast"; d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), ms);
}

/* ------------------------------------------------------------------ cadre general */
const root = () => $("#app");
function header() {
  const p = App.profile ? App.profile.meta : null;
  return `<header class="top">
    <div class="ttl">🇫🇷 ${App.lang === "fr" ? "Français" : "Tiếng Pháp"}<small>${esc(t("title"))}</small></div>
    ${p ? `<button class="chip-btn prof" data-act="profiles">${esc(p.emoji)} ${esc(p.name)} ▾</button>` : ""}
    <div class="lang"><button data-lang="fr" class="${App.lang === "fr" ? "on" : ""}">FR</button><button data-lang="vi" class="${App.lang === "vi" ? "on" : ""}">VI</button></div>
  </header>`;
}
function bindHeader(el) {
  $$("[data-lang]", el).forEach(b => b.onclick = () => {
    App.lang = b.dataset.lang; Store.cfg.lang = App.lang; Store.saveCfg(); rerender();
  });
  const pb = $("[data-act=profiles]", el);
  if (pb) pb.onclick = () => showProfiles();
}
let rerender = () => showHome();
function isStandalone() { return window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches; }
function isIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function scrollTop() { window.scrollTo(0, 0); }

/* ------------------------------------------------------------------ profils */
async function showProfiles(first) {
  App.view = "profiles";
  rerender = () => showProfiles(first);
  const cfg = Store.cfg;
  let emoji = EMOJIS[0];
  const el = html(root(), `${header()}<div class="page">
    ${App.profile ? `<div style="margin-bottom:10px"><button class="btn small" style="background:#64748B;width:auto" id="pback">${esc(t("home"))}</button></div>` : ""}
    <h2>${biH("profile_title")}</h2>
    <div class="profiles">${cfg.profiles.map((p, i) => `<div class="prow">
      <button class="btn" style="background:${PALETTE[i % 4]}" data-choose="${i}">${esc(p.emoji)}&nbsp; ${esc(p.name)}</button>
      <button class="btn del" data-del="${i}" aria-label="supprimer">🗑</button></div>`).join("")}</div>
    <h3>${esc(tr("fr", "new_profile"))} / <span class="vi">${esc(tr("vi", "new_profile"))}</span></h3>
    <div class="field"><input id="pname" maxlength="40" placeholder="${esc(bi("name_ph"))}" autocomplete="off"></div>
    <div class="emojis">${EMOJIS.map((e, i) => `<button data-emo="${i}" class="${i ? "" : "on"}">${e}</button>`).join("")}</div>
    <div style="margin-top:12px"><button class="btn" style="background:#22C55E" id="pcreate">${esc(bi("create"))}</button></div>
    ${cfg.profiles.length ? `<div style="margin-top:28px"><button class="btn small" style="background:#EF4444" id="pdelall">${esc(bi("delete_all"))}</button></div>` : ""}
  </div>`);
  bindHeader(el);
  if ($("#pback")) $("#pback").onclick = showHome;
  $$("[data-emo]", el).forEach(b => b.onclick = () => {
    $$("[data-emo]", el).forEach(x => x.classList.remove("on")); b.classList.add("on"); emoji = EMOJIS[+b.dataset.emo];
  });
  $$("[data-choose]", el).forEach(b => b.onclick = () => enterProfile(cfg.profiles[+b.dataset.choose]));
  $$("[data-del]", el).forEach(b => b.onclick = async () => {
    const p = cfg.profiles[+b.dataset.del];
    if (await Modal.confirm(esc(tr("fr", "confirm_delete", { n: p.name })) + "\n" + esc(tr("vi", "confirm_delete", { n: p.name })))) {
      await Store.deleteProfile(p);
      if (App.profile && App.profile.meta.id === p.id) App.profile = null;
      showProfiles(first);
    }
  });
  const create = async () => {
    const meta = Store.addProfile($("#pname").value, emoji);
    if (!meta) return Modal.alert(esc(bi("profile_exists")));
    enterProfile(meta);
  };
  $("#pcreate").onclick = create;
  $("#pname").onkeydown = e => { if (e.key === "Enter") create(); };
  const da = $("#pdelall");
  if (da) da.onclick = async () => {
    if (await Modal.confirm(esc(tr("fr", "confirm_delete_all")) + "\n" + esc(tr("vi", "confirm_delete_all")))) {
      await Store.deleteAll(); App.profile = null; showProfiles(first);
    }
  };
  scrollTop();
}

async function enterProfile(meta) {
  if (App.profile) await App.profile.save(true);
  App.profile = await Store.openProfile(meta);
  App.session = null;
  const p = App.profile;
  if (!p.get("cats")) p.set("cats", CAT_KEYS.join(","));
  showHome();
  maybeOfferPlacement();
}
async function maybeOfferPlacement() {
  const p = App.profile;
  if (!p || p.get("placement_offered") || p.overall()[0]) return;
  p.set("placement_offered", "1");
  if (await Modal.confirm(esc(t("placement_ask")), t("a_placement"))) startPlacement();
}

/* ------------------------------------------------------------------ accueil */
function selCats() {
  const s = (App.profile.get("cats") || "").split(",").filter(k => CAT_KEYS.includes(k));
  return s.length ? s : [...CAT_KEYS];
}
function showHome() {
  if (!App.profile) return showProfiles(true);
  stopExamTimer();
  Voice.stop(); Speech.stop(true);
  App.view = "home";
  rerender = showHome;
  const p = App.profile, L = App.lang;
  const [n, c] = p.overall();
  const cats = selCats();
  const size = +p.get("size", 10);
  const rec = p.get("level_rec");
  const what = cats.length === CAT_KEYS.length ? t("all_cats") : cats.length === 1 ? catName(L, cats[0]) : t("n_cats", { n: cats.length });
  const open = !!App.optsOpen;
  const installHint = isIOS() && !isStandalone()
    ? `<div class="install"><b>📲 ${esc(t("install_title"))}</b><br>${esc(t("install_text"))}</div>` : "";
  const el = html(root(), `${header()}<div class="page">
    ${installHint}
    <div class="welcome">${esc(t("welcome", { name: p.meta.name }))}</div>
    <div class="stats">
      <div class="stat" style="background:#3B82F6"><b>${n}</b><span>${esc(t("answered"))}</span></div>
      <div class="stat" style="background:#22C55E"><b>${n ? Math.round(100 * c / n) + " %" : "–"}</b><span>${esc(t("success_rate"))}</span></div>
      <div class="stat" style="background:#F59E0B"><b>${p.dueIds().size}</b><span>${esc(t("to_review"))}</span></div>
    </div>
    <button class="btn ghost opts-btn" id="opts"><span>⚙ ${esc(what)} · ${esc(t("n_ex_short", { n: size }))}</span><span>${open ? "▴" : "▾"}</span></button>
    <div id="optp" class="${open ? "" : "hidden"}">
      <h3>${esc(t("categories"))}</h3>
      <div class="cats">${CAT_KEYS.map(k => `<button class="cat ${cats.includes(k) ? "on" : ""}" style="--c:${CAT_INFO[k].color}" data-cat="${k}">${CAT_INFO[k].emoji} ${esc(catName(L, k))}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px;align-items:center">
        <button class="btn small" style="background:#7C3AED" id="mix">${esc(t("mix_all"))}</button>
        <div class="seg">${[10, 20, 30].map(v => `<button data-size="${v}" class="${v === size ? "on" : ""}">${v}</button>`).join("")}</div>
      </div>
      <div class="muted center" style="margin-top:6px;font-size:14px">${esc(t("nb_ex"))}</div>
    </div>
    <h3>${esc(t("levels_title"))}</h3>
    <div class="levels">${LEVELS.map(lv => `<button class="level" style="background:${LEVEL_COLORS[lv]}" data-level="${lv}">
      ${rec === lv ? `<span class="rec">⭐ ${esc(t("level_rec"))}</span>` : ""}
      <span class="lv">${lv}</span><span class="ds">${esc(LEVEL_DESC[lv][L])}</span><span class="ct">${Engine.count(lv, cats)} ✎</span></button>`).join("")}</div>
    <div class="stack" style="margin-top:12px">
      <button class="btn" style="background:#2563EB" id="resume">${esc(t("resume"))}</button>
      <button class="btn" style="background:#F59E0B" id="review">${esc(t("review"))}</button>
    </div>
    <h3>${esc(t("activities"))}</h3>
    <div class="tiles">
      <button class="tile" data-go="placement"><span class="em">🎯</span><b>${esc(t("a_placement"))}</b></button>
      <button class="tile" data-go="exam"><span class="em">📝</span><b>${esc(t("a_exam"))}</b></button>
      <button class="tile" data-go="writing"><span class="em">✍️</span><b>${esc(t("a_writing"))}</b></button>
      <button class="tile" data-go="history"><span class="em">📊</span><b>${esc(t("a_history"))}</b></button>
      <button class="tile" data-go="mine"><span class="em">🗂️</span><b>${esc(t("m_mine"))}</b></button>
      <button class="tile" data-go="more"><span class="em">⚙️</span><b>${esc(t("settings"))}</b></button>
    </div>
    <p class="muted center" style="font-size:12px;margin-top:20px">${esc(t("version"))} ${APP_VERSION}</p>
  </div>`);
  bindHeader(el);
  $("#opts").onclick = () => { App.optsOpen = !App.optsOpen; showHome(); };
  $$("[data-cat]", el).forEach(b => b.onclick = () => {
    let cs = selCats();
    const all = cs.length === CAT_KEYS.length;
    const k = b.dataset.cat;
    cs = cs.includes(k) ? cs.filter(x => x !== k) : cs.concat(k);
    if (!cs.length) cs = [...CAT_KEYS];
    p.set("cats", CAT_KEYS.filter(x => cs.includes(x)).join(","));
    void all;
    showHome();
  });
  $("#mix").onclick = () => { p.set("cats", CAT_KEYS.join(",")); showHome(); };
  $$("[data-size]", el).forEach(b => b.onclick = () => { p.set("size", +b.dataset.size); showHome(); });
  $$("[data-level]", el).forEach(b => b.onclick = () => start(b.dataset.level));
  $("#resume").onclick = () => {
    let lv = p.lastLevel();
    if (!LEVELS.includes(lv)) lv = p.get("level_rec");
    start(LEVELS.includes(lv) ? lv : "A1");
  };
  $("#review").onclick = () => start(null, true);
  $$("[data-go]", el).forEach(b => b.onclick = () => ({
    placement: startPlacement, exam: () => startExam(), writing: () => startWriting(), history: showHistory,
    mine: () => showEditor(0), more: showMore
  }[b.dataset.go]()));
}

/* ------------------------------------------------------------------ demarrage des series */
async function withLoading(fn) {
  const m = Modal.open(`<div class="splash" style="min-height:auto"><div class="spin"></div>${esc(t("loading"))}</div>`, { dismiss: false });
  try { return await fn(); }
  catch (e) {
    console.error(e);
    m.close();
    await Modal.alert(esc(t(e && e.message === "NO_GZIP" ? "old_ios" : "load_fail")));
    return null;
  } finally { m.close(); }
}
let oralWarned = false;
async function start(level, review = false) {
  const p = App.profile;
  const oral = Speech.available;
  const cats = selCats();
  if (!oral && cats.includes("oral") && !review && !oralWarned) {
    oralWarned = true;
    await Modal.alert(biH("oral_off"));
  }
  const s = await withLoading(() => Engine.makeSession({ level, last: p.lastResults(), cats, review, size: +p.get("size", 10), oral, due: p.dueIds() }));
  if (!s) return;
  if (!s.exercises.length) return Modal.alert(biH(review ? "no_review" : "no_ex"));
  s.level = review ? "REV" : level;
  s.sid = p.startSession(s.level, review ? "review" : "level");
  App.session = s;
  showExercise();
}
async function startPlacement() {
  const s = await withLoading(() => Engine.makePlacement());
  if (!s || !s.exercises.length) return;
  s.sid = App.profile.startSession("TEST", "placement");
  App.session = s;
  showExercise();
}
async function pickLevel(titleKey) {
  const def = App.profile.get("level_rec");
  return Modal.pick(t(titleKey), EXAM_LEVELS.map(l => ({ label: `${l} · ${LEVEL_DESC[l][App.lang]}`, value: l })), EXAM_LEVELS.includes(def) ? def : null);
}
async function startExam(level) {
  const L = App.lang;
  if (!EXAM_LEVELS.includes(level)) level = await pickLevel("exam_pick");
  if (!level) return;
  const oral = Speech.available;
  const withW = Engine.tasks.length > 0 && await Modal.confirm(esc(t("w_ask_include", { min: WRITING_MINUTES[level] || 30 })), t("exam_mode"));
  const s = await withLoading(() => Engine.makeExam(level, App.profile.lastResults(), oral, withW));
  if (!s) return;
  if (!s.exercises.length) return Modal.alert(biH("no_ex"));
  const names = [...new Set(s.sec)].map(k => tr(L, "exam_sec_" + k)).join(" / ");
  let text = t("exam_intro", { lv: level, n: s.total, sections: new Set(s.sec).size, min: Math.round(s.limit / 60) });
  if (!oral) text = t("exam_no_oral") + "\n\n" + text;
  if (!await Modal.confirm(esc(text + "\n\n" + names), t("exam_mode"))) return;
  s.examLevel = level; s.withWriting = withW; s.level = "EXAM";
  s.sid = App.profile.startSession("EXAM", "exam");
  App.session = s;
  App.examDeadline = Date.now() + s.limit * 1000;
  App.examRunning = true;
  clearInterval(App.examTimer);
  App.examTimer = setInterval(examTick, 1000);
  showExercise();
}
async function startWriting(level) {
  if (!EXAM_LEVELS.includes(level)) level = await pickLevel("w_pick");
  if (!level) return;
  const p = App.profile;
  const done = (p.get("writing_done") || "").split(",").filter(Boolean);
  const task = Engine.pickTask(level, done);
  if (!task) return Modal.alert(biH("no_ex"));
  p.set("writing_done", done.concat(task.id).slice(-12).join(","));
  Writing.loadKnown();
  const s = new Session([Engine.taskExercise(task)], level);
  s.sid = p.startSession(level, "writing");
  s.writingOnly = true;
  App.session = s;
  showExercise();
}

/* ------------------------------------------------------------------ examen : chronometre */
function examActive() { return !!(App.session && App.session.exam && App.examRunning); }
function examTick() {
  if (!examActive()) return;
  const left = Math.round((App.examDeadline - Date.now()) / 1000);
  const el = $("#timer");
  if (left <= 0) { if (el) el.textContent = "⏱ 00:00"; finish(true); return; }
  if (el) {
    el.textContent = `⏱ ${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
    el.classList.toggle("low", left < 60);
  }
}
function stopExamTimer() { App.examRunning = false; clearInterval(App.examTimer); }
function cancelExam() {
  if (examActive()) {
    stopExamTimer();
    const s = App.session;
    App.profile.endSession(s.sid, s.duration, Object.keys(s.log).length, Object.values(s.log).filter(x => x[1]).length);
  }
}

/* ------------------------------------------------------------------ exercice */
const X = { getAnswer: () => "", speakRes: null, micState: "idle" };

function showExercise() {
  App.view = "exercise";
  rerender = () => renderExercise(true);
  App.answered = false; App.last = null;
  X.getAnswer = () => ""; X.speakRes = null; X.micState = "idle"; X.order = null;
  Speech.stop(true); Voice.stop();
  renderExercise(false);
  scrollTop();
}

function instrKey(ex) { return ex.dictation ? "q_dict" : ex.cat === "image" ? "q_image" : "q_" + ex.type; }

function renderExercise(keep) {
  const s = App.session, ex = s.current(), L = App.lang;
  const savedAns = keep ? X.getAnswer() : null;
  const themeLine = ex.type === "write"
    ? `${tr("fr", "writing_mode").toUpperCase()} / ${tr("vi", "writing_mode")} · ${ex.level}`
    : `${catName("fr", ex.cat).toUpperCase()} · ${themeName("fr", ex.theme)} / ${themeName("vi", ex.theme)} · ${ex.level}`;
  const k = instrKey(ex);
  const pct = Math.round(100 * s.idx / s.total);
  const el = html(root(), `
    <div class="exbar">
      <button class="xbtn" id="leave" aria-label="${esc(t("quit_q"))}">✕</button>
      <div class="prog"><i style="width:${pct}%"></i><span>${esc(t("exercise_n", { i: s.idx + 1, n: s.total }))}</span></div>
      ${s.exam ? `<div class="timer" id="timer"></div>` : ""}
    </div>
    <div class="page" style="padding-top:4px">
      <div class="card">
        <div class="theme">${esc(themeLine)}</div>
        <div class="instr">${esc(tr("fr", k))}<small>${esc(tr("vi", k))}</small></div>
        <div id="img"></div>
        ${ex.type === "order" ? "" : `<div class="q">${esc(ex.question).replace(/\n/g, "<br>")}</div>`}
        <div class="qvi">${esc(ex.vi)}</div>
        ${ex.type === "write" ? "" : `<div class="listen">
          <button class="btn" style="background:#0EA5E9" id="listen">${esc(t("listen"))}</button>
          <button class="btn" style="background:#14B8A6" id="slow">${esc(t("slow"))}</button></div>`}
        <div class="dyn" id="dyn"></div>
      </div>
      <div id="fb"></div>
    </div>
    <div class="bottom" id="bottom"></div>`);
  $("#leave").onclick = leaveExercise;
  if ($("#listen")) {
    $("#listen").onclick = () => say(Engine.questionAudio(ex));
    $("#slow").onclick = () => say(Engine.questionAudio(ex), true);
  }
  showImage(ex);
  const dyn = $("#dyn");
  ({ qcm: buildQcm, fill: buildFill, order: buildOrder, speak: buildSpeak, write: buildWrite })[ex.type](dyn, ex, savedAns);
  if (s.exam) examTick();
  renderBottom();
  if (App.answered) { lockAnswer(); renderFeedback(); }
}

function say(text, slow) {
  if (!Voice.speak(text, slow)) toast(bi("no_voice"), 6000);
}

function renderBottom() {
  const s = App.session, ex = s.current();
  const b = $("#bottom");
  if (!b) return;
  if (App.answered && !s.exam) {
    const lastOne = s.idx >= s.total - 1;
    html(b, `<button class="btn" style="background:#2563EB" id="next">${esc(t(lastOne ? "finish" : "next"))}</button>`);
    $("#next").onclick = nextExercise;
    return;
  }
  const checkLabel = t(ex.type === "speak" ? "validate_speak" : "check");
  const showCheck = ex.type !== "speak" || (X.speakRes && X.micState === "idle");
  html(b, `${s.exam ? `<button class="btn" style="background:#64748B;font-size:16px" id="skip">${esc(t("exam_skip"))}</button>` : ""}
    ${showCheck ? `<button class="btn" style="background:#22C55E" id="check">${esc(checkLabel)}</button>` : ""}`);
  if ($("#skip")) $("#skip").onclick = nextExercise;
  if ($("#check")) $("#check").onclick = check;
}

/* --- image : vraie photo ou dessin (emoji) */
async function showImage(ex) {
  const box = $("#img");
  if (!box) return;
  const img = ex.image;
  const key = img && img.photo;
  const use = !!key && Store.cfg.photos !== false;
  const emoji = img && img.emoji ? `<div class="img">${esc(img.emoji)}</div>` : "";
  box.innerHTML = emoji;
  if (!use) return;
  let url = await Photos.url(key);
  if (!url && !Photos.rejected.has(key) && navigator.onLine) {
    if (await Photos.fetch(key)) url = await Photos.url(key);
  }
  if (!url || App.session.current() !== ex || !$("#img")) return;
  html($("#img"), `<div class="img"><img src="${url}" alt=""></div>
    <div class="credit">${esc(Photos.creditText(key))} <button id="badph">${esc(tr("fr", "ph_bad"))} / ${esc(tr("vi", "ph_bad"))}</button></div>`);
  $("#badph").onclick = async () => { await Photos.reject(key); $("#img").innerHTML = emoji; };
}

/* --- QCM */
function buildQcm(dyn, ex, saved) {
  if (!X.qcmOrder || X.qcmEx !== ex) { X.qcmOrder = shuffle([...ex.choices]); X.qcmEx = ex; }
  const choices = X.qcmOrder;
  const two = choices.every(c => c.t.length <= 14);
  html(dyn, `<div class="choices ${two ? "two" : ""}">${choices.map((c, i) =>
    `<button class="choice" style="--c:${PALETTE[i % 4]}" data-i="${i}">${esc(c.t)}${c.vi ? `<small class="hidden">${esc(c.vi)}</small>` : ""}</button>`).join("")}</div>`);
  let sel = saved || "";
  const mark = () => $$(".choice", dyn).forEach(b => b.classList.toggle("sel", choices[+b.dataset.i].t === sel));
  $$(".choice", dyn).forEach(b => b.onclick = () => { if (App.answered) return; sel = choices[+b.dataset.i].t; mark(); });
  mark();
  X.getAnswer = () => sel;
}
/* --- texte a trous */
function buildFill(dyn, ex, saved) {
  html(dyn, `<input class="fill" id="fillin" type="text" lang="fr" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      enterkeyhint="done" placeholder="${esc(tr("fr", "type_here"))}">
    <div class="accents">${ACCENTS.map(a => `<button data-a="${a}" tabindex="-1">${a}</button>`).join("")}</div>`);
  const inp = $("#fillin");
  if (saved) inp.value = saved;
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
  $$("[data-a]", dyn).forEach(b => {
    b.onpointerdown = e => e.preventDefault();       // garde le clavier ouvert
    b.onclick = () => {
      if (App.answered) return;
      const a = b.dataset.a === "’" ? "'" : b.dataset.a;
      const st = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, st) + a + inp.value.slice(en);
      inp.focus(); inp.setSelectionRange(st + a.length, st + a.length);
    };
  });
  X.getAnswer = () => inp.value;
}
/* --- remise en ordre */
function buildOrder(dyn, ex) {
  if (!X.order || X.orderEx !== ex) { X.order = []; X.orderEx = ex; }
  const chosen = X.order;      // indices des mots choisis
  const draw = () => {
    html(dyn, `<div class="built" id="built">${chosen.length ? chosen.map((i, k) =>
      `<button class="word" data-k="${k}">${esc(ex.words[i])}</button>`).join("") : `<span class="muted" style="font-size:14px">${esc(t("remove_word"))}</span>`}</div>
      <div class="words">${ex.words.map((w, i) => `<button class="word" style="background:${PALETTE[i % 4]}" data-i="${i}" ${chosen.includes(i) ? "disabled" : ""}>${esc(w)}</button>`).join("")}</div>
      <div style="margin-top:12px"><button class="btn small" style="background:#64748B" id="oreset">${esc(t("reset"))}</button></div>`);
    $$("[data-i]", dyn).forEach(b => b.onclick = () => { if (App.answered) return; chosen.push(+b.dataset.i); draw(); });
    $$("[data-k]", dyn).forEach(b => b.onclick = () => { if (App.answered) return; chosen.splice(+b.dataset.k, 1); draw(); });
    $("#oreset").onclick = () => { if (App.answered) return; chosen.length = 0; draw(); };
    if (App.answered) lockAnswer();
  };
  draw();
  X.getAnswer = () => chosen.map(i => ex.words[i]).join(" ");
}
/* --- expression ecrite */
function buildWrite(dyn, ex, saved) {
  const tk = ex.task;
  const hint = tk.elements.map(e => `${e.fr} / ${e.vi}`).join(" ; ");
  html(dyn, `<div class="note">💡 ${esc(hint)}</div>
    <textarea class="write" id="wtext" lang="fr" autocapitalize="sentences" spellcheck="false"></textarea>
    <div class="accents">${ACCENTS.map(a => `<button data-a="${a}" tabindex="-1">${a}</button>`).join("")}</div>
    <div class="count" id="wcount"></div>`);
  const ta = $("#wtext");
  if (saved) ta.value = saved;
  else if (App.draft && App.draft.id === tk.id) ta.value = App.draft.text;
  const upd = () => {
    const n = Writing.wordsOf(ta.value).length;
    const ok = tk.min <= n && n <= tk.max * 1.3;
    const c = $("#wcount");
    c.textContent = `${tr("fr", "w_words")} / ${tr("vi", "w_words")} : ${n}  (${tk.min}–${tk.max})${ok ? "   ✔" : ""}`;
    c.classList.toggle("ok", ok);
    App.draft = { id: tk.id, text: ta.value };
  };
  ta.oninput = upd; upd();
  $$("[data-a]", dyn).forEach(b => {
    b.onpointerdown = e => e.preventDefault();
    b.onclick = () => {
      const a = b.dataset.a === "’" ? "'" : b.dataset.a;
      const st = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, st) + a + ta.value.slice(en);
      ta.focus(); ta.setSelectionRange(st + a.length, st + a.length); upd();
    };
  });
  X.getAnswer = () => ta.value;
}

/* --- oral (micro) */
function buildSpeak(dyn, ex) {
  html(dyn, `${ex.ipa ? `<div class="ipa">/${esc(ex.ipa)}/</div>` : ""}
    <div style="margin-top:10px"><button class="btn mic" id="mic"></button></div>
    <div class="mic-status" id="micst"></div>
    <div id="spres"></div>
    <div class="note">${esc(bi("pron_note"))}</div>`);
  $("#mic").onclick = toggleMic;
  X.getAnswer = () => X.speakRes ? `${X.speakRes.percent} % — ${X.speakRes.heard}` : "";
  speakTexts();
}
function speakTexts(status) {
  const mic = $("#mic");
  if (!mic) return;
  const st = X.micState;
  const key = { idle: X.speakRes ? "mic_retry" : "mic_start", rec: "mic_stop", busy: "mic_analyzing" }[st];
  mic.textContent = bi(key);
  mic.disabled = st === "busy" || App.answered;
  mic.classList.toggle("rec", st === "rec");
  $("#micst").textContent = status || bi(st === "rec" ? "mic_listening" : st === "busy" ? "mic_analyzing" : "pron_how");
  const r = X.speakRes, box = $("#spres");
  if (!r) { box.innerHTML = ""; return; }
  const col = Pron.color(r.percent / 100);
  const vk = "v_" + r.verdict;
  html(box, `<div class="center" style="margin-top:12px">
    <div class="pct-big" style="color:${col}">${r.percent} %</div>
    <div style="font-weight:800;color:${col}">${esc(tr("fr", vk))} <span class="vi">/ ${esc(tr("vi", vk))}</span></div>
    <div class="pwords">${r.words.map(([w, sc]) => `<span style="color:${Pron.color(sc)}">${esc(w)}</span>`).join(" ")}</div>
    <div style="font-size:15px;color:#475569"><b>${esc(bi("heard_label"))}</b> : ${esc(r.heard || bi("heard_nothing"))}</div>
    <div class="note">${esc(bi("pron_legend"))}</div></div>`);
}
function toggleMic() {
  if (App.answered) return;
  if (X.micState === "rec") { Speech.stop(); X.micState = "busy"; speakTexts(); return; }
  if (X.micState === "busy") return;
  if (!Speech.available) return Modal.alert(biH("oral_off"));
  Voice.stop();
  const ex = App.session.current();
  const target = ex.answer && !Array.isArray(ex.answer) ? ex.answer : Engine.goodAnswer(ex);
  const ok = Speech.start({
    onpartial: txt => { const m = $("#micst"); if (m && X.micState === "rec") m.textContent = "🎙 " + txt; },
    onresult: alts => {
      if (App.session.current() !== ex) return;
      X.micState = "idle";
      if (!alts.length) { speakTexts(bi("mic_too_short")); renderBottom(); return; }
      let best = null;
      for (const a of alts) { const r = Pron.score(target, a); if (!best || r.percent > best.percent) best = r; }
      X.speakRes = best;
      speakTexts(); renderBottom();
    },
    onerror: code => {
      if (App.session.current() !== ex) return;
      X.micState = "idle";
      const msg = code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture" ? bi("mic_fail")
        : code === "network" ? bi("speech_net") : code === "no-speech" || code === "aborted" ? bi("mic_too_short")
        : `${bi("speech_fail")} : ${code}`;
      speakTexts(msg); renderBottom();
    }
  });
  if (!ok) return Modal.alert(biH("mic_fail"));
  X.micState = "rec";
  speakTexts(); renderBottom();
}

/* ------------------------------------------------------------------ verification */
function check() {
  const s = App.session;
  if (App.answered || !s) return;
  const ex = s.current();
  const raw = X.getAnswer();
  const ans = String(raw || "").trim();
  if (!ans) return;
  const p = App.profile;
  if (ex.type === "write") {
    const res = Writing.score(ex.task, raw);
    s.wres[s.idx] = res;
    App.draft = null;
    if (s.exam) return examRecord(ex, res.pct >= 50, raw);
    s.submit(res.pct >= 50);
    s.log[s.idx] = [raw, res.pct >= 50];
    return finishWriting();
  }
  let ok, pron = null;
  if (ex.type === "speak") {
    if (!X.speakRes) return;
    ok = X.speakRes.percent >= PASS_SCORE;
    pron = X.speakRes.percent;
    s.pron.push(pron);
    Speech.stop(true);
  } else ok = Engine.check(ex, ans);
  if (s.exam) {
    if (pron != null) p.recordPronWords(X.speakRes.words.map(([w, sc]) => [w, sc]));
    return examRecord(ex, ok, ans, pron);
  }
  s.submit(ok);
  p.record(ex, ok, pron);
  if (pron != null) p.recordPronWords(X.speakRes.words.map(([w, sc]) => [w, sc]));
  Sounds.play(ok ? "correct" : "wrong");
  App.answered = true;
  App.last = [ok, ans];
  if (document.activeElement) document.activeElement.blur();
  lockAnswer();
  renderFeedback();
  renderBottom();
  setTimeout(() => { const f = $("#fb"); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
}
function examRecord(ex, ok, ans, pron) {
  const s = App.session;
  s.submit(ok);
  s.log[s.idx] = [ans, !!ok];
  if (ex.type !== "write") App.profile.record(ex, ok, pron);
  App.answered = true;
  nextExercise();
}
function lockAnswer() {
  const s = App.session, ex = s.current();
  if (!App.answered || !App.last) return;
  const [ok, ans] = App.last;
  const good = Engine.goodAnswer(ex);
  if (ex.type === "qcm") {
    $$(".choice").forEach(b => {
      const c = X.qcmOrder[+b.dataset.i];
      b.classList.remove("sel");
      if (c.t === good) b.classList.add("good"); else if (c.t === ans) b.classList.add("bad");
      b.disabled = true;
      const sm = $("small", b); if (sm) sm.classList.remove("hidden");
    });
  }
  const f = $("#fillin");
  if (f) { f.readOnly = true; f.classList.add(ok ? "good" : "bad"); $$(".accents").forEach(a => a.classList.add("hidden")); }
  $$(".words .word, .built .word, #oreset").forEach(b => b.disabled = true);
  const mic = $("#mic"); if (mic) mic.disabled = true;
}
function renderFeedback() {
  const [ok, ans] = App.last;
  const ex = App.session.current();
  const speak = ex.type === "speak";
  const good = Engine.goodAnswer(ex);
  const ch = ex.choices || [];
  const gvi = (ch.find(c => c.t === good && c.vi) || {}).vi || "";
  const avi = (ch.find(c => c.t === ans && c.vi) || {}).vi || "";
  const hk = speak ? "v_" + X.speakRes.verdict : ok ? "correct" : "wrong";
  const col = ok ? "#16A34A" : "#DC2626";
  let h = `<div class="head" style="color:${col}">${ok ? "✅" : "❌"} ${esc(tr("fr", hk))} <span class="vi">/ ${esc(tr("vi", hk))}</span></div>`;
  if (speak) {
    const r = X.speakRes;
    h += `<p><b>🎤 ${esc(bi("pron_score"))}</b> : <b style="color:${col};font-size:22px">${r.percent} %</b></p>
      <p><b>${esc(bi("heard_label"))}</b> : <span class="muted">${esc(r.heard || bi("heard_nothing"))}</span></p>`;
  } else if (!ok) {
    h += `<p><b>${esc(bi("your_answer"))}</b> : <b style="color:#DC2626">${esc(ans)}</b>${avi ? ` — <span class="vi">${esc(avi)}</span>` : ""}</p>`;
  }
  h += `<p><b>${esc(bi(speak ? "target_label" : "good_answer"))}</b> : <b style="color:#15803D;font-size:20px">${esc(good)}</b>${gvi ? ` — <span class="vi">${esc(gvi)}</span>` : ""}</p>`;
  const x = ex.explain || {};
  h += `<p><b>💡 ${esc(bi("explanation"))}</b></p>
    <p><b style="color:#2563EB">FR</b>&nbsp; ${esc(x.fr || "").replace(/\n/g, "<br>")}</p>
    <p><b class="vi">VI</b>&nbsp; ${esc(x.vi || "").replace(/\n/g, "<br>")}</p>`;
  const text = Engine.pronText(ex);
  const words = text.split(/\s+/).map(w => w.replace(/^[ ,.;:!?«»]+|[ ,.;:!?«»]+$/g, "")).filter(Boolean);
  h += `<div class="pron"><b style="color:#1D4ED8">🗣 ${esc(bi("pron"))} : ${esc(text)}</b>
    ${ex.ipa ? `<div class="ipa">/${esc(ex.ipa)}/</div>` : ""}
    <div class="note">${esc(bi("pron_hint"))}</div>
    <div class="pbtns"><button class="all" data-say="${esc(text)}">${esc(t("listen"))}</button>
    ${words.length > 12 ? `<button data-slow="${esc(text)}">${esc(t("slow"))}</button>`
      : words.map(w => `<button data-slow="${esc(w)}">🐢 ${esc(w)}</button>`).join("")}</div></div>`;
  const fb = $("#fb");
  fb.className = "fb " + (ok ? "good" : "bad");
  html(fb, h);
  $$("[data-say]", fb).forEach(b => b.onclick = () => say(b.dataset.say));
  $$("[data-slow]", fb).forEach(b => b.onclick = () => say(b.dataset.slow, true));
}

async function leaveExercise() {
  if (examActive()) {
    if (!await Modal.confirm(esc(t("exam_leave")), t("exam_mode"))) return;
    cancelExam();
  } else if (App.session && App.session.idx > 0 && !App.answered) {
    if (!await Modal.confirm(esc(t("leave_confirm")))) return;
  }
  App.draft = null;
  showHome();
}
function nextExercise() {
  const s = App.session;
  if (s.exam && !App.answered) { Speech.stop(true); return examRecord(s.current(), false, ""); }
  X.qcmOrder = null;
  if (s.advance()) showExercise(); else finish();
}

/* ------------------------------------------------------------------ resultats */
function donut(c, w) {
  const tot = c + w || 1, r = 70, C = 2 * Math.PI * r, a = C * c / tot;
  return `<svg class="donut" viewBox="0 0 170 170"><circle cx="85" cy="85" r="${r}" fill="none" stroke="#EF4444" stroke-width="22"/>
    <circle cx="85" cy="85" r="${r}" fill="none" stroke="#22C55E" stroke-width="22" stroke-dasharray="${a} ${C - a}" transform="rotate(-90 85 85)" stroke-linecap="${c && w ? "butt" : "round"}"/>
    <text x="85" y="95" text-anchor="middle" font-size="30" font-weight="800" fill="#0F172A">${Math.round(100 * c / tot)}%</text></svg>`;
}
function resultPage({ emoji, title, score, legend, extra, again }) {
  App.view = "result";
  const el = html(root(), `${header()}<div class="page">
    <div class="res-head"><div class="em">${emoji}</div><div class="res-title">${title}</div>${donut.apply(null, App.resDonut)}
    <div class="res-score">${score}</div><div>${legend || ""}</div></div>
    ${extra ? `<div class="box">${extra}</div>` : ""}
    <div class="stack" style="margin-top:16px">
      <button class="btn" style="background:#F59E0B" id="again">${esc(t("again"))}</button>
      <button class="btn" style="background:#2563EB" id="rhome">${esc(t("home"))}</button>
      <button class="btn" style="background:#7C3AED" id="rhist">${esc(t("history"))}</button></div></div>`);
  bindHeader(el);
  $("#again").onclick = again;
  $("#rhome").onclick = showHome;
  $("#rhist").onclick = showHistory;
  scrollTop();
}
function finish(timeout = false) {
  const s = App.session;
  if (s.exam) return finishExam(timeout);
  const p = App.profile, L = App.lang;
  p.endSession(s.sid, s.duration, s.total, s.correct);
  const pct = Math.round(100 * s.correct / s.total);
  let legend = `<span style="color:#16A34A;font-weight:700">● ${esc(t("correct_n"))} : ${s.correct}</span>&nbsp;&nbsp;<span style="color:#EF4444;font-weight:700">● ${esc(t("wrong_n"))} : ${s.total - s.correct}</span>`;
  if (s.pron.length) legend += `<br><span style="color:#7C3AED;font-weight:700">🎤 ${esc(t("pron_avg"))} : ${Math.round(s.pron.reduce((a, b) => a + b, 0) / s.pron.length)} %</span>`;
  let title = `${esc(tr("fr", "result_title"))}<br><span class="vi" style="font-size:18px">${esc(tr("vi", "result_title"))}</span>`;
  let score = esc(t("score", { c: s.correct, n: s.total, p: pct }));
  if (s.placement) {
    const [rec, per] = Engine.placementLevel(s.results);
    p.set("level_rec", rec);
    const detail = PLACEMENT_LEVELS.filter(l => per[l]).map(l => `${l} ${per[l][0]}/${per[l][1]}`).join(" · ");
    title = esc(t("placement_title"));
    score = `🎯 ${rec}`;
    legend = `${esc(t("placement_detail"))} : ${esc(detail)}<br><span class="muted">${esc(t("placement_note"))}</span>`;
  }
  App.resDonut = [s.correct, s.total - s.correct];
  Sounds.play(pct >= 50 ? "win" : "lose");
  void L;
  resultPage({ emoji: pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪", title, score, legend,
    again: () => s.placement ? startPlacement() : start(LEVELS.includes(s.level) ? s.level : null, !LEVELS.includes(s.level)) });
}
function writingHTML(task, res, withModel = true) {
  const L = App.lang;
  const rows = Writing.CRITERIA.map(([key, mx]) => {
    const got = res.pts[key] || 0;
    const col = got >= 0.75 * mx ? "#16A34A" : got >= 0.4 * mx ? "#D97706" : "#DC2626";
    const [fr, vi] = Writing.LABELS[key];
    return `<tr><td>${esc(L === "fr" ? fr : vi)}</td><td style="color:${col};text-align:right;white-space:nowrap"><b>${+got.toFixed(1)} / ${mx}</b></td></tr>`;
  }).join("");
  let h = `<p><b>${esc(t("w_criteria"))}</b> — ${esc(t("w_words"))} : ${res.words}</p><table>${rows}</table>`;
  const lab = L === "fr" ? "fr" : "vi";
  if (res.found.length || res.missing.length)
    h += `<p>✅ <b>${esc(t("w_found"))}</b> : ${esc(res.found.join(", ") || "–")}<br>❌ <b>${esc(t("w_missing"))}</b> : ${esc(res.missing.map(m => m[lab]).join(", ") || "–")}</p>`;
  h += `<p>🔗 <b>${esc(t("w_conn"))}</b> : ${esc(res.connectors.join(", ") || "–")}</p>`;
  if (res.unknown.length) h += `<p>🔎 <b>${esc(t("w_unknown"))}</b> : ${esc(res.unknown.join(", "))}</p>`;
  h += `<p><b>${esc(t("w_self"))}</b><br>${Writing.SELF_CHECK.map(([f, v]) => "☐ " + esc(L === "fr" ? f : v)).join("<br>")}</p>`;
  if (withModel) h += `<p><b>📖 ${esc(t("w_model"))}</b><br><i>${esc(task.model_fr)}</i><br><span class="vi">${esc(task.model_vi)}</span></p>`;
  h += `<p class="muted" style="font-size:13px">⚠ ${esc(t("w_limit"))}</p>`;
  return h;
}
function finishWriting() {
  const s = App.session, ex = s.current(), res = s.wres[s.idx];
  App.profile.endSession(s.sid, s.duration, 1, res.pct >= 50 ? 1 : 0);
  App.resDonut = [Math.round(res.total), Math.max(0, 25 - Math.round(res.total))];
  Sounds.play(res.pct >= 50 ? "win" : "lose");
  resultPage({ emoji: res.pct >= 80 ? "🏆" : res.pct >= 50 ? "👍" : "💪",
    title: `${esc(tr("fr", "writing_mode"))} / <span class="vi">${esc(tr("vi", "writing_mode"))}</span> · ${esc(s.level)}`,
    score: `${esc(t("w_score"))} : ${+res.total.toFixed(1)} / 25`, legend: `<b>${res.pct} %</b>`,
    extra: writingHTML(ex.task, res), again: () => startWriting(s.level) });
}
function finishExam(timeout) {
  const s = App.session, L = App.lang;
  stopExamTimer(); Speech.stop(true);
  const cur = s.idx < s.total ? s.current() : null;
  if (cur && cur.type === "write" && !(s.idx in s.log)) {      // temps ecoule pendant la redaction
    const txt = String(X.getAnswer() || "").trim();
    const r0 = Writing.score(cur.task, txt);
    s.wres[s.idx] = r0; s.log[s.idx] = [txt, r0.pct >= 50]; s.results.push([cur.level, r0.pct >= 50]);
  }
  App.draft = null;
  const rep = Engine.examReport(s);
  const okN = Object.values(s.log).filter(x => x[1]).length;
  App.profile.endSession(s.sid, Math.min(s.duration, s.limit), s.total, okN);
  const rows = Object.entries(rep.sections).map(([key, [c, n]]) => {
    const pct = rep.pcts[key];
    const col = pct < EXAM_SECTION_MIN ? "#DC2626" : pct >= 50 ? "#16A34A" : "#D97706";
    return `<tr><td>${esc(tr(L, "exam_sec_" + key))}</td><td style="color:${col};white-space:nowrap"><b>${+(+c).toFixed(1)} / ${n}</b></td><td style="color:${col};white-space:nowrap"><b>${Math.round(pct / 4)} / 25</b></td></tr>`;
  }).join("");
  let legend = `<p style="font-size:20px"><b>${esc(t(rep.passed ? "exam_passed" : "exam_failed"))}</b></p>`;
  if (timeout) legend += `<p style="color:#DC2626"><b>${esc(t("exam_timeout"))}</b></p>`;
  if (Math.min(...Object.values(rep.pcts)) < EXAM_SECTION_MIN) legend += `<p style="color:#DC2626;font-size:14px">${esc(t("exam_low_section"))}</p>`;
  let extra = `<table>${rows}</table>`;
  const wrong = s.exercises.map((ex, i) => [i, ex]).filter(([i, ex]) => ex.type !== "write" && !(s.log[i] && s.log[i][1]));
  if (wrong.length) {
    extra += `<p><b>${esc(t("exam_review"))} (${wrong.length})</b></p>` + wrong.slice(0, 40).map(([i, ex]) => {
      const a = s.log[i] && s.log[i][0] ? s.log[i][0] : t("exam_empty");
      return `<p style="font-size:14px">• ${esc(ex.question.replace(/\n/g, " ").slice(0, 120))}<br>
        <span style="color:#DC2626">${esc(t("exam_your"))}: ${esc(a)}</span> · <span style="color:#15803D">${esc(t("exam_good"))}: ${esc(Engine.goodAnswer(ex))}</span></p>`;
    }).join("");
  }
  s.exercises.forEach((ex, i) => {
    if (ex.type === "write" && s.wres[i]) extra += `<hr><p><b>✍️ ${esc(t("exam_sec_ew"))}</b></p>` + writingHTML(ex.task, s.wres[i]);
  });
  extra += `<p class="muted" style="font-size:13px">${esc(t("exam_note"))}</p>`;
  App.resDonut = [okN, s.total - okN];
  Sounds.play(rep.passed ? "win" : "lose");
  resultPage({ emoji: rep.passed ? "🏆" : "💪",
    title: `${esc(tr("fr", "exam_mode"))} / <span class="vi">${esc(tr("vi", "exam_mode"))}</span> · ${esc(s.examLevel)}`,
    score: `${esc(t("exam_total"))} : ${rep.total} / 100`, legend, extra, again: () => startExam(s.examLevel) });
}

/* ------------------------------------------------------------------ historique */
function lineChart(pts, none) {
  if (!pts.length) return `<div class="empty">${esc(none)}</div>`;
  const W = 340, H = 170, l = 30, r = 10, tp = 10, b = 26;
  const n = pts.length, x = i => l + (n === 1 ? (W - l - r) / 2 : i * (W - l - r) / (n - 1)), y = v => tp + (100 - v) * (H - tp - b) / 100;
  let g = "";
  for (const v of [0, 50, 100]) g += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="#E2E8F0"/><text x="${l - 4}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="#64748B">${v}</text>`;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
  const step = Math.ceil(n / 6);
  const labels = pts.map((p, i) => i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#64748B">${esc(p[0])}</text>` : "").join("");
  const dots = pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p[1])}" r="3.5" fill="#2563EB"/>`).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}<path d="${path}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linejoin="round"/>${dots}${labels}</svg></div>`;
}
function bars(rows, none) {
  if (!rows.length) return `<div class="empty">${esc(none)}</div>`;
  return `<div class="bars">${rows.map(([name, pct, color]) => `<div class="bar"><div class="lab"><span>${esc(name)}</span><span>${pct} %</span></div>
    <div class="trk"><i style="width:${pct}%;background:${color}"></i></div></div>`).join("")}</div>`;
}
function dm(iso) { return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : ""; }
async function showHistory(tab) {
  cancelExam();
  App.view = "history";
  tab = typeof tab === "number" ? tab : (App.histTab || 0);
  App.histTab = tab;
  rerender = () => showHistory(App.histTab);
  const p = App.profile, L = App.lang, none = t("chart_none");
  const levAgg = p.statsBy("level"), catAgg = p.statsBy("cat");
  const levelRows = LEVELS.filter(l => levAgg[l] && levAgg[l][0]).map(l => [l, levAgg[l][0], Math.round(100 * levAgg[l][1] / levAgg[l][0]), LEVEL_COLORS[l]]);
  const catRows = CAT_KEYS.filter(k => catAgg[k] && catAgg[k][0]).map(k => [`${CAT_INFO[k].emoji} ${catName(L, k)}`, catAgg[k][0], Math.round(100 * catAgg[k][1] / catAgg[k][0]), CAT_INFO[k].color]);
  const tabs = ["tab_charts", "tab_sessions", "tab_progress", "tab_errors", "tab_pron"];
  let body = "";
  if (tab === 0) {
    body = `<h3>${esc(t("chart_score"))}</h3><div class="box">${lineChart(p.sessionSeries(20).map(s => [dm(s.started), Math.round(100 * s.correct / s.total)]), none)}</div>
      <h3>${esc(t("chart_level"))}</h3><div class="box">${bars(levelRows.map(r => [r[0], r[2], r[3]]), none)}</div>
      <h3>${esc(t("chart_cat"))}</h3><div class="box">${bars(catRows.map(r => [r[0], r[2], r[3]]), none)}</div>`;
  } else if (tab === 1) {
    const rows = p.recentSessions(50);
    body = `<div class="list" style="margin-top:10px">${rows.length ? rows.map(s => {
      const lvl = s.level === "REV" ? t("review_mode") : s.level === "TEST" ? t("placement_mode") : s.level === "EXAM" ? t("exam_mode") : s.mode === "writing" ? `${t("writing_mode")} ${s.level}` : s.level;
      const pct = s.total ? Math.round(100 * s.correct / s.total) : 0;
      const d = s.started;
      return `<div class="li"><div class="main"><b>${esc(lvl)}</b><small>${dm(d)}/${d.slice(0, 4)} ${d.slice(11, 16)} · ${Math.floor(s.duration / 60)} min ${String(s.duration % 60).padStart(2, "0")} s</small></div>
        <div class="val">${s.correct} / ${s.total}<br><span style="color:${pct >= 50 ? "#16A34A" : "#DC2626"}">${pct} %</span></div></div>`;
    }).join("") : `<div class="empty">${esc(none)}</div>`}</div>`;
  } else if (tab === 2) {
    const data = levelRows.concat(catRows);
    body = `<div class="list" style="margin-top:10px">${data.length ? data.map(([name, n, pct]) =>
      `<div class="li"><div class="main"><b>${esc(name)}</b><small>${n} ${esc(t("col_answers").toLowerCase())}</small></div><div class="val">${pct} %</div></div>`).join("")
      : `<div class="empty">${esc(none)}</div>`}</div>`;
  } else if (tab === 3) {
    const errs = p.frequentErrors(15);
    const lv = [...new Set(errs.map(e => Engine.levelOfId(e[0])).filter(Boolean))];
    try { await Engine.loadLevels(lv); } catch (_) {}
    body = `<div class="list" style="margin-top:10px">${errs.length ? errs.map(([id, n, r]) => {
      const ex = Engine.byId[id];
      return `<div class="li"><div class="main"><small>${esc(catName(L, r[5]))} · ${esc(r[6] || "")}</small>${esc(ex ? ex.question.replace(/\n/g, " ") : id)}
        ${ex ? `<small style="color:#15803D">✔ ${esc(Engine.goodAnswer(ex))}</small>` : ""}</div><div class="val" style="color:#DC2626">× ${n}</div></div>`;
    }).join("") : `<div class="empty">${esc(none)}</div>`}</div>`;
  } else {
    const [avg, np] = p.pronAverage();
    const worst = p.worstWords(15);
    body = `<h3>🎤 ${esc(np ? `${t("pron_avg")} : ${avg} %  (${np})` : t("pron_none"))}</h3>
      <h3>${esc(t("chart_pron"))}</h3><div class="box">${lineChart(p.pronSeries(30).map(([ts, v]) => [dm(ts), v]), none)}</div>
      <h3>${esc(t("pron_words_title"))}</h3><div class="list">${worst.length ? worst.map(([w, n, pct]) =>
        `<div class="li"><div class="main"><b>${esc(w)}</b><small>${n} × ${esc(t("col_tries").toLowerCase())}</small></div><div class="val" style="color:${Pron.color(pct / 100)}">${pct} %</div></div>`).join("")
        : `<div class="empty">${esc(none)}</div>`}</div>`;
  }
  const el = html(root(), `${header()}<div class="page">
    <div class="row" style="align-items:center;margin-bottom:10px"><button class="btn small" style="background:#64748B;flex:none;width:auto" id="hhome">${esc(t("home"))}</button><div></div></div>
    <div class="tabs">${tabs.map((k, i) => `<button data-tab="${i}" class="${i === tab ? "on" : ""}">${esc(t(k))}</button>`).join("")}</div>
    ${body}</div>`);
  bindHeader(el);
  $("#hhome").onclick = showHome;
  $$("[data-tab]", el).forEach(b => b.onclick = () => showHistory(+b.dataset.tab));
}

/* ------------------------------------------------------------------ mes exercices */
async function showEditor(tab = 0, msg) {
  App.view = "editor";
  rerender = () => showEditor(tab);
  const L = App.lang;
  const list = Engine.custom;
  const tabsH = `<div class="tabs"><button data-etab="0" class="${tab === 0 ? "on" : ""}">${esc(t("ed_tab_add"))}</button>
    <button data-etab="1" class="${tab === 1 ? "on" : ""}">${esc(t("ed_tab_list"))} (${list.length})</button></div>`;
  let body;
  if (tab === 0) {
    body = `<div class="box">
      <div class="field"><label>${esc(bi("ed_type"))}</label><select id="etype">
        <option value="qcm">${esc(bi("ed_t_qcm"))}</option><option value="fill">${esc(bi("ed_t_fill"))}</option><option value="order">${esc(bi("ed_t_order"))}</option></select></div>
      <div class="row"><div class="field"><label>${esc(bi("ed_level"))}</label><select id="elevel">${LEVELS.map(l => `<option>${l}</option>`).join("")}</select></div>
        <div class="field"><label>${esc(bi("ed_cat"))}</label><select id="ecat">${CAT_KEYS.map(k => `<option value="${k}">${CAT_INFO[k].emoji} ${esc(catName(L, k))}</option>`).join("")}</select></div></div>
      <div class="field" id="fq"><label>${esc(bi("ed_q_fr"))}<br><span class="muted">${esc(bi("ed_q_hint"))}</span></label><input id="eq" lang="fr" autocapitalize="off"></div>
      <div class="field"><label>${esc(bi("ed_q_vi"))}</label><input id="evi" lang="vi"></div>
      <div id="bqcm" class="field"><label>${esc(bi("ed_correct"))} · ${esc(bi("ed_choice_fr"))} · ${esc(bi("ed_choice_vi"))}</label>
        ${[0, 1, 2, 3].map(i => `<div class="qrow"><input type="radio" name="eok" value="${i}" ${i ? "" : "checked"}><input id="cf${i}" placeholder="${esc(t("ed_choice"))} ${i + 1}" autocapitalize="off"><input id="cv${i}" placeholder="VI"></div>`).join("")}</div>
      <div id="bfill" class="field hidden"><label>${esc(bi("ed_answers"))}</label><input id="efill" autocapitalize="off"></div>
      <div id="border" class="field hidden"><label>${esc(bi("ed_sentence"))}</label><input id="eorder" autocapitalize="off"></div>
      <div class="field"><label>${esc(bi("ed_exp_fr"))}</label><textarea id="exfr"></textarea></div>
      <div class="field"><label>${esc(bi("ed_exp_vi"))}</label><textarea id="exvi"></textarea></div>
      <div class="row"><div class="field" style="flex:1"><label>${esc(t("ed_emoji"))}</label><input id="eemo" maxlength="8"></div>
        <div class="field" style="flex:2"><label>${esc(t("ed_audio"))}</label><input id="eaud" autocapitalize="off"></div></div>
      <div class="msg ${msg ? "ok" : ""}" id="emsg">${msg ? esc(msg) : ""}</div>
      <div style="margin-top:12px"><button class="btn" style="background:#22C55E" id="esave">${esc(bi("ed_save"))}</button></div></div>`;
  } else {
    body = `<div class="list" style="margin-top:10px">${list.length ? list.map((ex, i) => `<div class="li"><div class="main">
      <small>${ex.level} · ${CAT_INFO[ex.cat] ? CAT_INFO[ex.cat].emoji + " " + esc(catName(L, ex.cat)) : esc(ex.cat)} · ${({ qcm: "QCM", fill: "✏️", order: "🧩" })[ex.type] || ex.type}</small>
      ${esc(ex.question.replace(/\n/g, " ").slice(0, 100))}</div><button class="btn small" style="width:auto;background:#DC2626" data-delx="${i}">🗑</button></div>`).join("")
      : `<div class="empty">${esc(bi("ed_empty"))}</div>`}</div>
      <div class="row" style="margin-top:12px"><button class="btn small" style="background:#7C3AED" id="eexp" ${list.length ? "" : "disabled"}>${esc(t("ed_export"))}</button>
      <button class="btn small" style="background:#0EA5E9" id="eimp">${esc(t("ed_import"))}</button></div>`;
  }
  const el = html(root(), `${header()}<div class="page">
    <div class="row" style="align-items:center;margin-bottom:10px"><button class="btn small" style="background:#64748B;flex:none;width:auto" id="ehome">${esc(t("home"))}</button><div></div></div>
    <h2>${esc(t("ed_title"))}</h2>${tabsH}${body}</div>`);
  bindHeader(el);
  $("#ehome").onclick = showHome;
  $$("[data-etab]", el).forEach(b => b.onclick = () => showEditor(+b.dataset.etab));
  if (tab === 0) {
    const onType = () => {
      const ty = $("#etype").value;
      $("#bqcm").classList.toggle("hidden", ty !== "qcm");
      $("#bfill").classList.toggle("hidden", ty !== "fill");
      $("#border").classList.toggle("hidden", ty !== "order");
      $("#fq").classList.toggle("hidden", ty === "order");
    };
    $("#etype").onchange = onType;
    $("#esave").onclick = async () => {
      const err = k => { const m = $("#emsg"); m.className = "msg err"; m.textContent = bi(k); return null; };
      const ty = $("#etype").value, q = $("#eq").value.trim(), vi = $("#evi").value.trim();
      const ex = { level: $("#elevel").value, cat: $("#ecat").value, type: ty, vi,
        explain: { fr: $("#exfr").value.trim() || "—", vi: $("#exvi").value.trim() || "—" } };
      if (ty !== "order" && !q) return err("ed_err_q");
      if (!vi) return err("ed_err_vi");
      if (ty === "qcm") {
        const choices = []; let ok = null;
        const okI = +($("input[name=eok]:checked") || { value: 0 }).value;
        for (let i = 0; i < 4; i++) {
          const tx = $("#cf" + i).value.trim(), v = $("#cv" + i).value.trim();
          if (tx) { choices.push(v ? { t: tx, vi: v } : { t: tx }); if (i === okI) ok = tx; }
        }
        if (choices.length < 2 || ok == null || new Set(choices.map(c => c.t)).size !== choices.length) return err("ed_err_choices");
        Object.assign(ex, { question: q, choices, answer: ok });
      } else if (ty === "fill") {
        const ans = $("#efill").value.split(";").map(a => a.trim()).filter(Boolean);
        if (!ans.length) return err("ed_err_answer");
        Object.assign(ex, { question: q, answer: ans.length > 1 ? ans : ans[0] });
      } else {
        const sentence = $("#eorder").value.split(/\s+/).filter(Boolean).join(" ");
        const words = sentence.split(" ");
        if (words.length < 2) return err("ed_err_sentence");
        let sh = [...words];
        for (let k = 0; k < 20; k++) { shuffle(sh); if (sh.join(" ") !== words.join(" ")) break; }
        Object.assign(ex, { question: sh.join(" / "), words: sh, answer: sentence });
      }
      const emo = $("#eemo").value.trim(), aud = $("#eaud").value.trim();
      if (emo) ex.image = { emoji: emo };
      if (aud) ex.audio = aud;
      await addCustom([ex]);
      showEditor(0, bi("ed_saved"));
    };
  } else {
    $$("[data-delx]", el).forEach(b => b.onclick = async () => {
      if (!await Modal.confirm(esc(bi("ed_confirm_del")))) return;
      const id = list[+b.dataset.delx].id;
      const all = (await Store.customList()).filter(e => e.id !== id);
      await Store.saveCustom(all); Engine.setCustom(all); delete Engine.byId[id];
      showEditor(1);
    });
    const ex = $("#eexp");
    if (ex) ex.onclick = () => shareFile("mes_exercices.json", JSON.stringify(Engine.custom, null, 1), "application/json");
    $("#eimp").onclick = () => pickFile(".json,application/json", async text => {
      let data;
      try { data = JSON.parse(text); } catch (_) { return Modal.alert(esc(bi("ed_bad_file"))); }
      const n = await addCustom(Array.isArray(data) ? data : []);
      await Modal.alert(`${n} ${esc(tr("fr", "ed_imported"))} / ${esc(tr("vi", "ed_imported"))}`);
      showEditor(1);
    });
  }
}
async function addCustom(items, dedupe) {
  const all = await Store.customList();
  const have = new Set(all.map(e => e.question + "|" + JSON.stringify(e.answer)));
  let nums = all.map(e => /^C-\d+$/.test(e.id) ? +e.id.slice(2) : 0);
  let next = (nums.length ? Math.max(...nums) : 0) + 1;
  let n = 0;
  for (const e0 of items) {
    const e = Object.assign({}, e0);
    if (!Engine.valid(e)) continue;
    const key = e.question + "|" + JSON.stringify(e.answer);
    if (dedupe && have.has(key)) continue;
    e.id = "C-" + String(next++).padStart(4, "0");
    e.theme = "perso";
    all.push(e); have.add(key); n++;
  }
  await Store.saveCustom(all);
  Engine.setCustom(all);
  return n;
}

/* ------------------------------------------------------------------ fichiers (partage iPhone) */
async function shareFile(name, text, type) {
  const file = new File([text], name, { type });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; }
  } catch (e) { if (e && e.name === "AbortError") return false; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
function pickFile(accept, cb) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = accept;
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if (f) cb(await f.text(), f); };
  inp.click();
}

/* ------------------------------------------------------------------ reglages (menu « Plus ») */
function showMore() {
  const cfg = Store.cfg;
  const item = (act, em, label, sw) => `<button class="menu-item" data-m="${act}"><span class="em">${em}</span><span>${esc(label)}</span>${sw === undefined ? "" : `<span class="sw ${sw ? "on" : ""}"></span>`}</button>`;
  const m = Modal.open(`<div class="mt">${esc(t("settings"))}</div>
    ${item("profiles", "👤", t("a_profile"))}
    ${item("export", "💾", t("a_export_profile"))}
    ${item("import", "📥", t("a_import_profile"))}
    ${item("cert", "🎓", t("a_certificate"))}
    ${item("photos_dl", "📷", t("a_photos_dl"))}
    ${item("photos", "🖼️", t("a_photos_show"), cfg.photos !== false)}
    ${item("sound", "🔔", t("a_sound"), cfg.sound !== false)}
    ${item("about", "ℹ️", t("a_about"))}
    <p class="note">${esc(t("backup_tip"))}</p>
    <div class="acts"><button class="btn ghost" data-close>${esc(t("close"))}</button></div>`);
  $("[data-close]", m.box).onclick = m.close;
  $$("[data-m]", m.box).forEach(b => b.onclick = async () => {
    const a = b.dataset.m;
    if (a === "photos" || a === "sound") {
      const key = a === "photos" ? "photos" : "sound";
      cfg[key] = cfg[key] === false;
      Store.saveCfg();
      if (key === "sound") { Sounds.enabled = cfg.sound; if (cfg.sound) Sounds.play("correct"); }
      $(".sw", b).classList.toggle("on", cfg[key]);
      return;
    }
    m.close();
    if (a === "profiles") showProfiles();
    else if (a === "export") exportProfile();
    else if (a === "import") importProfile();
    else if (a === "cert") makeCertificate();
    else if (a === "photos_dl") downloadPhotos();
    else if (a === "about") Modal.alert(`${esc(tr("fr", "about_text"))}<br><br><span class="vi">${esc(tr("vi", "about_text"))}</span><br><br>
      <b>${esc(t("install_title"))}</b><br>${esc(t("install_text"))}<br><br><span class="muted">${esc(t("version"))} ${APP_VERSION}${isStandalone() ? "<br>" + esc(t("offline_ok")) : ""}</span>`, t("a_about"));
  });
}
async function exportProfile() {
  const p = App.profile;
  await p.save(true);
  const text = await Store.exportProfile(p, Engine.custom);
  const ok = await shareFile(`${p.meta.name.replace(/[^\wÀ-ɏ-]+/g, "_")}.efv`, text, "application/json");
  if (ok) toast(t("bk_exported"));
}
function importProfile() {
  pickFile(".efv,.json,application/json,application/octet-stream", async text => {
    try {
      const { meta, custom } = await Store.importProfile(text);
      const added = await addCustom(custom, true);
      await Modal.alert(`${esc(t("bk_imported"))} ${esc(meta.emoji)} ${esc(meta.name)}<br><br>${esc(t("bk_imported_more"))} ${added}`, t("bk_import_title"));
    } catch (e) {
      await Modal.alert(esc(t(e.message === "bad_file" ? "bk_bad" : "bk_error")) + (e.message === "bad_file" ? "" : " " + esc(e.message)));
    }
  });
}
async function makeCertificate() {
  const p = App.profile, agg = p.statsBy("level");
  const ok = LEVELS.filter(l => agg[l] && agg[l][0] >= 30 && 100 * agg[l][1] / agg[l][0] >= 80)
    .map(l => [l, agg[l][0], Math.round(100 * agg[l][1] / agg[l][0])]);
  if (!ok.length) return Modal.alert(esc(t("cert_none")), t("cert_title"));
  let chosen = ok[ok.length - 1];
  if (ok.length > 1) {
    const lv = await Modal.pick(t("cert_choose"), ok.map(([l, , pc]) => ({ label: `${l}  (${pc} %)`, value: l })), chosen[0]);
    if (!lv) return;
    chosen = ok.find(x => x[0] === lv);
  }
  const [level, n, pct] = chosen;
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const cert = `<div class="cert">
    <div class="c1">Attestation de progression</div><div class="c2">Giấy xác nhận tiến bộ</div>
    <p style="color:#475569">Exercice de Français pour Vietnamiens</p>
    <p>Cette attestation est décernée à<br><i>Giấy này được trao cho</i></p>
    <div class="nm">${esc(p.meta.name)}</div>
    <p>pour sa réussite au niveau<br><i>vì đã hoàn thành trình độ</i></p>
    <div class="lv">${esc(level)}</div>
    <p>${esc(LEVEL_DESC[level].fr)} — <span class="vi">${esc(LEVEL_DESC[level].vi)}</span></p>
    <p>${pct} % de réponses justes sur ${n} exercices<br><span class="vi"><i>${pct} % câu trả lời đúng trên tổng số ${n} bài tập</i></span></p>
    <p>${date}</p>
    <p style="font-size:11px;color:#64748B">Document personnel généré par l'application, sans valeur officielle (ce n'est pas un diplôme DELF/DALF).<br>
    Tài liệu cá nhân do ứng dụng tạo ra, không có giá trị chính thức (không phải chứng chỉ DELF/DALF).</p></div>`;
  $("#print").innerHTML = cert;
  const m = Modal.open(`${cert}<div class="acts"><button class="btn" data-pr>${esc(t("cert_print"))}</button><button class="btn ghost" data-c>${esc(t("close"))}</button></div>`);
  $("[data-pr]", m.box).onclick = () => window.print();
  $("[data-c]", m.box).onclick = m.close;
}
async function downloadPhotos() {
  const todo = Photos.missing();
  if (!todo.length) return Modal.alert(esc(t("ph_all_done")), t("m_photos"));
  if (!await Modal.confirm(esc(t("ph_confirm", { n: todo.length })), t("m_photos"))) return;
  let stop = false;
  const m = Modal.open(`<div class="mt">${esc(t("ph_progress"))}</div><div id="phn" class="center" style="font-weight:800">0 / ${todo.length}</div>
    <div class="pbar"><i id="phb"></i></div><div class="acts"><button class="btn ghost" data-s>${esc(t("ph_stop"))}</button></div>`, { dismiss: false });
  $("[data-s]", m.box).onclick = () => { stop = true; };
  const [ok, n] = await Photos.fetchAll((i, tot) => {
    $("#phn").textContent = `${i} / ${tot}`; $("#phb").style.width = `${Math.round(100 * i / tot)}%`;
  }, () => stop);
  m.close();
  Modal.alert(esc(t("ph_done", { ok, n })), t("m_photos"));
}

/* ------------------------------------------------------------------ lancement */
async function boot() {
  try {
    await Store.load();
    App.lang = Store.cfg.lang;
    I18N = await getJSON("data/i18n.json");
    S = I18N.S; CAT_KEYS = I18N.CAT_KEYS; CAT_INFO = I18N.CAT_INFO; THEMES = I18N.THEMES; LEVEL_DESC = I18N.LEVEL_DESC;
    Object.assign(S, EXTRA);
    await Engine.init();
    Engine.setCustom(await Store.customList());
    await Photos.init();
    Voice.init(); Sounds.init(); Sounds.enabled = Store.cfg.sound !== false;
    if (typeof DecompressionStream === "undefined") {
      html(root(), `<div class="splash">${biH("old_ios")}</div>`);
      return;
    }
    const cfg = Store.cfg;
    const last = cfg.profiles.find(p => p.id === cfg.last);
    if (cfg.profiles.length === 1) await enterProfile(cfg.profiles[0]);
    else if (cfg.profiles.length > 1) showProfiles(true);
    else showProfiles(true);
    void last;
    Engine.loadLevel(App.profile && LEVELS.includes(App.profile.get("level_rec")) ? App.profile.get("level_rec") : "A1").catch(() => {});
  } catch (e) {
    console.error(e);
    html(root(), `<div class="splash">⚠️<div>Impossible de démarrer / Không khởi động được.<br><small>${esc(e && e.message)}</small></div>
      <button class="btn" style="max-width:260px" onclick="location.reload()">↻</button></div>`);
  }
}
window.addEventListener("pagehide", () => { if (App.profile) App.profile.save(true); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && App.profile) App.profile.save(true);
  if (document.visibilityState === "visible" && examActive()) examTick();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
boot();
