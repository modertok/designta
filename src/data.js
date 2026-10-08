// ДЕМО-ДАНІ: детермінований генератор (seed), жодних реальних користувачів чи публікацій.
// Формули збігаються з підрозділом 1.4 розділу 1 пояснювальної записки.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANCHOR = new Date("2026-09-30T20:00:00Z").getTime();
export const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const TOPICS = {
  кава: ["Ранкова кава з новим рецептом", "Знайшов улюблену кав'ярню біля університету", "Без кави код не пишеться"],
  код: ["Сьогодні дописав модуль збору даних", "Знайшов баг у пагінації — довго шукав", "Рефакторинг дав приємний результат", "Тести нарешті зелені"],
  навчання: ["Дедлайн по диплому наближається, але я встигаю", "Склав іспит — дякую всім за підтримку", "Складно, але цікаво вчити статистику", "Захист кафедри пройшов добре"],
  дизайн: ["Новий макет дашборда виглядає чудово", "Темна тема — це завжди класно", "Анімація зробила інтерфейс живим"],
  подорожі: ["Поїздка в Карпати надихає на нові ідеї", "Потяг запізнився — дратує, але краєвиди чудові", "Люблю гірські маршрути"],
  музика: ["Новий альбом на репіті всю неділю", "Концерт був неймовірний", "Плейлист для роботи — ідеальний фокус"],
  ші: ["Модель тональності помилилась на сарказмі", "Аналіз тексту виявив цікаві теми", "Статистика не бреше: вечір працює краще"],
  спорт: ["Пробіжка вранці — і день вдався", "Втомився після тренування, але задоволений", "Нова особиста рекордна дистанція"],
};
const TAGS = Object.keys(TOPICS);
const EXTRA = ["", " Що думаєте?", " Поділіться досвідом.", " Дякую, що читаєте!", " Завтра продовжу.", ""];

export const POS = ["чудово", "класно", "люблю", "дякую", "надихає", "добре", "приємн", "ідеальн", "неймовірн", "цікав", "успіх", "зелені", "рекорд", "задоволен"];
export const NEG = ["баг", "дедлайн", "складно", "дратує", "втомив", "запізнив", "помилил", "проблем", "жахлив", "не вийшло"];

const STOP = new Set("і й та в у на з із до за що це як але або не я ми ти ви він вона воно вони цей ця ці той ця то так вже ще лише тільки при для від по про над під між через щоб чи ж би вам мій моя мої наш який яка які а думаєте дякую поділіться досвідом завтра читаєте продовжу"
  .split(" "));

export function sentimentOf(text) {
  const t = text.toLowerCase();
  let p = 0, n = 0;
  POS.forEach((w) => { if (t.includes(w)) p++; });
  NEG.forEach((w) => { if (t.includes(w)) n++; });
  return (p - n) / (p + n + 1);
}

export function tokens(text) {
  return text.toLowerCase().replace(/[^\p{L}\s']/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

function genPosts({ seed, count, authorPool, ownerMode }) {
  const r = mulberry32(seed);
  const hours = [8, 9, 9, 10, 12, 13, 13, 14, 17, 18, 19, 20, 20, 21, 22, 7, 11, 15, 16, 23];
  const out = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(r() * 90);
    const hour = hours[Math.floor(r() * hours.length)];
    const date = new Date(ANCHOR - daysAgo * 86400000);
    date.setUTCHours(hour, Math.floor(r() * 60), 0, 0);
    const tag = TAGS[Math.floor(r() * TAGS.length)];
    const base = TOPICS[tag][Math.floor(r() * TOPICS[tag].length)];
    const text = (base + "." + EXTRA[Math.floor(r() * EXTRA.length)] + (r() > 0.55 ? ` #${tag}` : "")).trim();
    const m = r();
    const media = m < 0.58 ? "TEXT" : m < 0.86 ? "IMAGE" : "VIDEO";
    const dow = (date.getUTCDay() + 6) % 7;
    const hourBoost = hour >= 19 && hour <= 21 ? 1.5 : hour >= 12 && hour <= 14 ? 1.2 : hour <= 8 ? 0.8 : 1;
    const mediaBoost = media === "VIDEO" ? 1.7 : media === "IMAGE" ? 1.3 : 1;
    const dowBoost = dow >= 5 ? 0.85 : dow === 3 ? 1.15 : 1;
    const views = Math.round(400 * hourBoost * mediaBoost * dowBoost * Math.exp((r() - 0.5) * 1.6) * (1 + (r() > 0.93 ? 4 : 0)));
    const rate = (0.04 + r() * 0.05) * (media === "TEXT" ? 1 : 1.15);
    const likes = Math.round(views * rate * (0.8 + r() * 0.5));
    const replies = Math.round(likes * (0.08 + r() * 0.2));
    const reposts = Math.round(likes * (0.05 + r() * 0.12));
    const quotes = Math.round(likes * (0.02 + r() * 0.06));
    const shares = Math.round(likes * (0.03 + r() * 0.08));
    const author = ownerMode ? "demo_author" : authorPool[Math.floor(r() * authorPool.length)];
    out.push({
      id: (ownerMode ? "p" : "s") + (1000 + i),
      ts: date.getTime(), hour, dow, text, tag, media, len: text.length,
      views, likes, replies, reposts, quotes, shares, author,
      sentiment: sentimentOf(text),
    });
  }
  out.sort((a, b) => b.ts - a.ts);
  return out;
}

export const POSTS = genPosts({ seed: 2026, count: 138, ownerMode: true, authorPool: [] });
const POOL = Array.from({ length: 24 }, (_, i) => "user_" + (0xa1 + i * 7).toString(16) + (i * 13 % 10));
export const PUBLIC = genPosts({ seed: 77, count: 260, ownerMode: false, authorPool: POOL });

// ---------- формули розділу 1.4 ----------
export const er = (p) => ((p.likes + p.replies + p.reposts + p.quotes) / p.views) * 100; // (1.2)
export const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);                // (1.1)
export const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export function ranks(a) {
  const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
  const r = new Array(a.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}
export function pearson(x, y) { // (1.5)
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return num / Math.sqrt(dx * dy || 1);
}
export const spearman = (x, y) => pearson(ranks(x), ranks(y)); // (1.6) через ранги
function erf(x) { // Abramowitz–Stegun
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
export function mannWhitney(a, b) {
  const all = [...a.map((v) => [v, 0]), ...b.map((v) => [v, 1])];
  const rk = ranks(all.map((x) => x[0]));
  let R1 = 0;
  all.forEach((x, i) => { if (x[1] === 0) R1 += rk[i]; });
  const n1 = a.length, n2 = b.length;
  const U = R1 - (n1 * (n1 + 1)) / 2;
  const mu = (n1 * n2) / 2, sd = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = (U - mu) / sd;
  return { U, z, p: 2 * (1 - normCdf(Math.abs(z))) };
}
export const spearmanP = (rho, n) => { // нормальне наближення для демо
  const z = rho * Math.sqrt(n - 1);
  return 2 * (1 - normCdf(Math.abs(z)));
};

// ---------- агрегати ----------
export function heatmap(posts, minCount = 2) {
  const cells = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ n: 0, sum: 0 })));
  posts.forEach((p) => { const c = cells[p.dow][p.hour]; c.n++; c.sum += er(p); });
  return cells.map((row) => row.map((c) => ({ n: c.n, v: c.n ? c.sum / c.n : 0, ok: c.n >= minCount })));
}
export function bestSlots(posts, k = 3, minCount = 2) {
  const hm = heatmap(posts, minCount), out = [];
  hm.forEach((row, d) => row.forEach((c, h) => { if (c.ok) out.push({ d, h, v: c.v, n: c.n }); }));
  return out.sort((a, b) => b.v - a.v).slice(0, k);
}
export function weekly(posts) {
  const weeks = 13, out = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = ANCHOR - w * 7 * 86400000, start = end - 7 * 86400000;
    const ps = posts.filter((p) => p.ts > start && p.ts <= end);
    out.push({
      label: new Date(end).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }),
      views: ps.reduce((s, p) => s + p.views, 0),
      er: ps.length ? mean(ps.map(er)) : 0,
      n: ps.length,
    });
  }
  return out;
}
export function wordFreq(posts, top = 12) {
  const m = new Map();
  posts.forEach((p) => tokens(p.text).forEach((w) => m.set(w, (m.get(w) || 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([label, value]) => ({ label, value }));
}
export function tfidfTop(group, rest, top = 8) { // (1.7)
  const docs = [...group, ...rest].map((p) => new Set(tokens(p.text)));
  const N = docs.length, df = new Map();
  docs.forEach((s) => s.forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const tf = new Map();
  group.forEach((p) => tokens(p.text).forEach((w) => tf.set(w, (tf.get(w) || 0) + 1)));
  return [...tf.entries()].map(([w, f]) => ({ label: w, value: f * Math.log(N / df.get(w)) }))
    .sort((a, b) => b.value - a.value).slice(0, top);
}
export function sentimentBuckets(posts) {
  let pos = 0, neu = 0, neg = 0;
  posts.forEach((p) => { if (p.sentiment > 0.05) pos++; else if (p.sentiment < -0.05) neg++; else neu++; });
  return { pos, neu, neg };
}
export const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : String(Math.round(n)));
export const fmtDate = (ts) => new Date(ts).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });

export function summary(posts) {
  const ers = posts.map(er);
  return {
    n: posts.length,
    views: posts.reduce((s, p) => s + p.views, 0),
    likes: posts.reduce((s, p) => s + p.likes, 0),
    erMean: mean(ers), erMedian: median(ers),
    likesMedian: median(posts.map((p) => p.likes)),
  };
}

// ---------- метрики для розширення (формули 1.3, 1.4) ----------
export function profileStats(posts) {
  const T = 90 * 24; // вікно, год
  const byHour = new Array(24).fill(0);
  posts.forEach((p) => byHour[p.hour]++);
  const media = { TEXT: 0, IMAGE: 0, VIDEO: 0 };
  posts.forEach((p) => media[p.media]++);
  return {
    perHour: posts.length / T, perDay: posts.length / 90, perWeek: (posts.length / 90) * 7, // (1.3)
    avgLikes: mean(posts.map((p) => p.likes)), avgReplies: mean(posts.map((p) => p.replies)),
    byHour, media, top: [...posts].sort((a, b) => er(b) - er(a))[0],
  };
}
export const velocity = (likes, ageHours) => likes / Math.max(ageHours, 0.25); // (1.4)

