import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars, Counter, Donut, Heatmap, Icon, LineChart, Sparkline } from "../ui.jsx";
import {
  DAYS, POSTS, PUBLIC, bestSlots, er, fmt, fmtDate, heatmap, mannWhitney, mean, median, pearson, sentimentBuckets,
  spearman, spearmanP, summary, tfidfTop, weekly, wordFreq,
} from "../data.js";

const TABS = [
  ["overview", "Огляд", "home"], ["time", "Найкращий час", "clock"], ["posts", "Публікації", "table"],
  ["search", "Пошук за словом", "search"], ["text", "Текст і тональність", "smile"], ["stats", "Статистика", "sliders"],
  ["reports", "Звіти й експорт", "file"], ["connect", "Підключення", "key"],
];

const erBadge = (v) => (v > 12 ? "g" : v > 8 ? "b" : v > 5 ? "y" : "");
const strength = (r) => { const a = Math.abs(r); return a < 0.1 ? "практично відсутній" : a < 0.3 ? "слабкий" : a < 0.5 ? "помірний" : "сильний"; };
const pTxt = (p) => (p < 0.001 ? "p < 0,001" : "p = " + p.toFixed(3).replace(".", ","));
const maskName = (n) => n.slice(0, 2) + "•••" + n.slice(-1);

function Title({ title, sub, right }) {
  return <div className="page-title"><div><h1>{title}</h1><p>{sub}</p></div>{right}</div>;
}
const Seg = ({ value, onChange, items }) => (
  <div className="seg" role="tablist">{items.map(([v, l]) => <button key={v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>
);

/* ---------------------------------------------------------------- Огляд */
function Overview() {
  const s = useMemo(() => summary(POSTS), []);
  const wk = useMemo(() => weekly(POSTS), []);
  const [metric, setMetric] = useState("views");
  const sorted = useMemo(() => [...POSTS].sort((a, b) => er(b) - er(a)), []);
  return (
    <>
      <Title title="Огляд акаунта" sub="@demo_author · останні 90 днів" right={<Seg value={metric} onChange={setMetric} items={[["views", "Перегляди"], ["er", "Залученість"]]} />} />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        {[["Публікацій", s.n, 0, "", "+" + POSTS.filter((p) => p.ts > POSTS[0].ts - 7 * 86400000).length + " за 7 днів"], ["Перегляди", s.views / 1000, 1, "K", "сума за 90 днів"], ["Сер. ER", s.erMean, 1, "%", "медіана " + s.erMedian.toFixed(1) + "%"], ["Медіана вподобань", s.likesMedian, 0, "", "на публікацію"]].map(([l, v, d, suf, note], i) => (
          <motion.div key={l} className="panel kpi" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="l">{l}</div><div className="v"><Counter to={v} decimals={d} suffix={suf} /></div><div className="d">{note}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid g-main">
        <div className="panel">
          <h3>{metric === "views" ? "Перегляди за тижнями" : "Середній показник залученості за тижнями"}</h3><div className="sub">13 тижнів · наведіть курсор на точку</div>
          <LineChart data={wk} valueKey={metric} format={(v) => (metric === "er" ? v.toFixed(1) + "%" : fmt(v))} />
        </div>
        <div className="panel">
          <h3>Найуспішніші публікації</h3><div className="sub">за показником залученості</div>
          <div style={{ display: "grid", gap: 12 }}>
            {sorted.slice(0, 5).map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 10, justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#c9c9ce" }}>{p.text.length > 58 ? p.text.slice(0, 58) + "…" : p.text}</span>
                <span className={"badge " + erBadge(er(p))}>{er(p).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Час */
function TimeTab() {
  const [minN, setMinN] = useState(2);
  const hm = useMemo(() => heatmap(POSTS, minN), [minN]);
  const best = useMemo(() => bestSlots(POSTS, 3, minN), [minN]);
  const byHour = useMemo(() => {
    const m = new Map();
    POSTS.forEach((p) => { const a = m.get(p.hour) || []; a.push(er(p)); m.set(p.hour, a); });
    return [...m.entries()].filter(([, a]) => a.length >= minN).map(([h, a]) => ({ label: String(h).padStart(2, "0") + ":00", value: mean(a) })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [minN]);
  return (
    <>
      <Title title="Найкращий час публікації" sub="Середній показник залученості за днем тижня та годиною" right={<Seg value={minN} onChange={setMinN} items={[[1, "мін. 1 публ."], [2, "мін. 2"], [3, "мін. 3"]]} />} />
      <div className="grid g-main">
        <div className="panel"><h3>Теплова карта «день × година»</h3><div className="sub">сірі клітинки — замало публікацій для висновку (поріг {minN})</div><Heatmap cells={hm} dayLabels={DAYS} /></div>
        <div className="panel">
          <h3>Топ-3 слоти</h3><div className="sub">за середньою залученістю</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {best.map((b, i) => (
              <motion.div key={b.d + "-" + b.h + minN} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 12, background: i === 0 ? "var(--brand-soft)" : "var(--bg-2)" }}>
                <b>{DAYS[b.d]}, {String(b.h).padStart(2, "0")}:00</b><span className="badge g">{b.v.toFixed(1)}% · {b.n} публ.</span>
              </motion.div>
            ))}
          </div>
          <h3>Найкращі години</h3><div className="sub">середній ER</div>
          <Bars items={byHour} format={(v) => v.toFixed(1) + "%"} />
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Публікації */
function PostsTab() {
  const [q, setQ] = useState(""), [media, setMedia] = useState("ALL"), [sort, setSort] = useState({ k: "ts", dir: -1 }), [page, setPage] = useState(0);
  const rows = useMemo(() => {
    let r = POSTS.filter((p) => (media === "ALL" || p.media === media) && p.text.toLowerCase().includes(q.toLowerCase()));
    const val = { ts: (p) => p.ts, views: (p) => p.views, likes: (p) => p.likes, er: er, replies: (p) => p.replies };
    return [...r].sort((a, b) => (val[sort.k](a) - val[sort.k](b)) * sort.dir);
  }, [q, media, sort]);
  const pages = Math.ceil(rows.length / 10);
  const th = (k, l) => <th onClick={() => { setSort((s) => ({ k, dir: s.k === k ? -s.dir : -1 })); setPage(0); }}>{l}{sort.k === k ? (sort.dir < 0 ? " ↓" : " ↑") : ""}</th>;
  return (
    <>
      <Title title="Публікації" sub={`Знайдено ${rows.length} із ${POSTS.length} · сортування за заголовком колонки`} />
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Пошук у тексті…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Пошук у тексті" />
        <Seg value={media} onChange={(v) => { setMedia(v); setPage(0); }} items={[["ALL", "Усі"], ["TEXT", "Текст"], ["IMAGE", "Фото"], ["VIDEO", "Відео"]]} />
      </div>
      <div className="panel tbl-wrap">
        <table className="tbl">
          <thead><tr>{th("ts", "Дата")}<th>Текст</th><th>Тип</th>{th("views", "Перегляди")}{th("likes", "♥")}{th("replies", "Відп.")}{th("er", "ER")}</tr></thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {rows.slice(page * 10, page * 10 + 10).map((p) => (
                <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td className="mono muted">{fmtDate(p.ts)}</td><td className="txt">{p.text}</td>
                  <td><span className={"badge " + (p.media === "VIDEO" ? "b" : p.media === "IMAGE" ? "y" : "")}>{p.media}</span></td>
                  <td className="mono">{fmt(p.views)}</td><td className="mono">{p.likes}</td><td className="mono">{p.replies}</td>
                  <td><span className={"badge " + erBadge(er(p))}>{er(p).toFixed(1)}%</span></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
          <span className="muted" style={{ fontSize: 13 }}>Сторінка {page + 1} з {pages || 1}</span>
          <div className="row"><button className="btn sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← Назад</button><button className="btn sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Далі →</button></div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Пошук */
function SearchTab() {
  const [kw, setKw] = useState("кава"), [mode, setMode] = useState("KEYWORD"), [order, setOrder] = useState("TOP"), [anon, setAnon] = useState(true);
  const res = useMemo(() => {
    const k = kw.trim().toLowerCase();
    if (!k) return [];
    let r = PUBLIC.filter((p) => (mode === "TAG" ? p.tag === k.replace("#", "") : p.text.toLowerCase().includes(k)));
    r = order === "TOP" ? [...r].sort((a, b) => b.likes - a.likes) : [...r].sort((a, b) => b.ts - a.ts);
    return r;
  }, [kw, mode, order]);
  const sent = sentimentBuckets(res);
  const words = useMemo(() => wordFreq(res, 8).filter((w) => w.label !== kw.toLowerCase()), [res, kw]);
  const timeline = useMemo(() => {
    const out = new Array(13).fill(0);
    res.forEach((p) => { const w = 12 - Math.floor((Date.parse("2026-09-30T20:00:00Z") - p.ts) / (7 * 86400000)); if (w >= 0 && w < 13) out[w]++; });
    return out;
  }, [res]);
  return (
    <>
      <Title title="Пошук за ключовим словом" sub="Аналіз публічних публікацій за темою або тегом" />
      <div className="demo-banner"><Icon name="key" size={16} />У реальній системі пошук публічних публікацій вимагає схваленого дозволу <span className="mono">threads_keyword_search</span>; без нього API шукає лише у власних публікаціях.</div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 300 }} value={kw} onChange={(e) => setKw(e.target.value)} placeholder="напр. код, навчання, дизайн" aria-label="Ключове слово" />
        <Seg value={mode} onChange={setMode} items={[["KEYWORD", "Слово"], ["TAG", "Тег"]]} />
        <Seg value={order} onChange={setOrder} items={[["TOP", "Популярні"], ["RECENT", "Нові"]]} />
        <label className="row muted" style={{ fontSize: 13, gap: 8 }}><span className={"toggle" + (anon ? " on" : "")} onClick={() => setAnon(!anon)} role="switch" aria-checked={anon} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setAnon(!anon)} />Анонімізувати імена</label>
      </div>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="panel kpi"><div className="l">Знайдено публікацій</div><div className="v"><Counter key={res.length} to={res.length} duration={0.6} /></div><div style={{ marginTop: 6 }}><Sparkline key={kw + mode} values={timeline.length > 1 ? timeline : [0, 0]} width={200} height={34} /></div></div>
        <div className="panel"><h3>Тональність</h3><div className="sub">по знайдених</div><div className="row" style={{ gap: 18 }}>
          <Donut size={96} thickness={13} segments={[{ label: "p", value: sent.pos, color: "#3ecf8e" }, { label: "n", value: sent.neu, color: "#6b6b73" }, { label: "g", value: sent.neg, color: "#f06a6a" }]} />
          <div style={{ fontSize: 13, display: "grid", gap: 3 }}><span className="brand">● позитивні {sent.pos}</span><span className="muted">● нейтральні {sent.neu}</span><span style={{ color: "#f06a6a" }}>● негативні {sent.neg}</span></div></div></div>
        <div className="panel"><h3>Супутні слова</h3><div className="sub">частотний аналіз</div><div className="chips">{words.length ? words.map((w) => <span className="chip on" key={w.label}>{w.label} · {w.value}</span>) : <span className="muted">немає даних</span>}</div></div>
      </div>
      <div className="panel tbl-wrap">
        <table className="tbl"><thead><tr><th>Автор</th><th>Текст</th><th>♥</th><th>Дата</th></tr></thead>
          <tbody>{res.slice(0, 8).map((p) => <tr key={p.id}><td className="mono muted">{anon ? maskName(p.author) : "@" + p.author}</td><td className="txt">{p.text}</td><td className="mono">{p.likes}</td><td className="mono muted">{fmtDate(p.ts)}</td></tr>)}
            {!res.length && <tr><td colSpan="4" className="muted">Нічого не знайдено — спробуйте інше слово.</td></tr>}</tbody></table>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Текст */
function TextTab() {
  const wf = useMemo(() => wordFreq(POSTS, 10), []);
  const sent = useMemo(() => sentimentBuckets(POSTS), []);
  const { top, rest } = useMemo(() => { const s = [...POSTS].sort((a, b) => er(b) - er(a)), k = Math.round(s.length * 0.25); return { top: s.slice(0, k), rest: s.slice(k) }; }, []);
  const tf = useMemo(() => tfidfTop(top, rest, 8), [top, rest]);
  const extremes = useMemo(() => { const s = [...POSTS].sort((a, b) => a.sentiment - b.sentiment); return { neg: s[0], pos: s[s.length - 1] }; }, []);
  return (
    <>
      <Title title="Текст і тональність" sub="Частотний аналіз, TF-IDF та лексиконна оцінка тональності" />
      <div className="grid g3">
        <div className="panel"><h3>Найчастіші слова</h3><div className="sub">після очищення тексту</div><Bars items={wf} /></div>
        <div className="panel"><h3>Характерні слова топ-25 % за ER</h3><div className="sub">TF-IDF: tf · log(N / df)</div><Bars items={tf} color="#6aa8ff" format={(v) => v.toFixed(1)} /></div>
        <div className="panel"><h3>Тональність публікацій</h3><div className="sub">лексиконний метод</div>
          <div style={{ display: "grid", placeItems: "center", margin: "10px 0 16px" }}><Donut size={150} thickness={18} segments={[{ label: "p", value: sent.pos, color: "#3ecf8e" }, { label: "n", value: sent.neu, color: "#6b6b73" }, { label: "g", value: sent.neg, color: "#f06a6a" }]} center={<div><b style={{ fontSize: 24 }}>{POSTS.length}</b><div style={{ fontSize: 11, color: "#6b6b73" }}>публікацій</div></div>} /></div>
          <div style={{ fontSize: 13, display: "grid", gap: 4 }}><span className="brand">● позитивні — {sent.pos}</span><span className="muted">● нейтральні — {sent.neu}</span><span style={{ color: "#f06a6a" }}>● негативні — {sent.neg}</span></div>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="panel"><span className="badge g">найпозитивніша</span><p style={{ marginTop: 10 }}>{extremes.pos.text}</p></div>
        <div className="panel"><span className="badge r">найнегативніша</span><p style={{ marginTop: 10 }}>{extremes.neg.text}</p></div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Статистика */
function StatsTab() {
  const ers = POSTS.map(er);
  const rho1 = spearman(POSTS.map((p) => p.len), ers), rho2 = spearman(POSTS.map((p) => p.hour), ers);
  const r3 = pearson(POSTS.map((p) => p.views), POSTS.map((p) => p.likes));
  const mw = mannWhitney(POSTS.filter((p) => p.media !== "TEXT").map(er), POSTS.filter((p) => p.media === "TEXT").map(er));
  const medMedia = median(POSTS.filter((p) => p.media !== "TEXT").map(er)), medText = median(POSTS.filter((p) => p.media === "TEXT").map(er));
  const n = POSTS.length;
  const rows = [
    ["Довжина тексту ↔ ER", "Спірмен ρ", rho1, spearmanP(rho1, n)],
    ["Година публікації ↔ ER", "Спірмен ρ", rho2, spearmanP(rho2, n)],
    ["Перегляди ↔ вподобання", "Пірсон r", r3, spearmanP(r3, n)],
  ];
  return (
    <>
      <Title title="Статистичний аналіз" sub="Які ознаки публікації пов'язані із залученістю" />
      <div className="grid g-main">
        <div className="panel tbl-wrap"><h3>Кореляційний аналіз</h3><div className="sub">n = {n} публікацій · α = 0,05</div>
          <table className="tbl"><thead><tr><th>Пара ознак</th><th>Метод</th><th>Коефіцієнт</th><th>Значущість</th><th>Висновок</th></tr></thead>
            <tbody>{rows.map(([a, m, r, p]) => <tr key={a}><td>{a}</td><td className="muted">{m}</td><td className="mono">{r.toFixed(2)}</td><td className="mono">{pTxt(p)}</td><td><span className={"badge " + (p < 0.05 ? "g" : "")}>{strength(r)}{p < 0.05 ? ", значущий" : ", не значущий"}</span></td></tr>)}</tbody></table>
        </div>
        <div className="panel"><h3>Фото/відео проти тексту</h3><div className="sub">критерій Манна–Уітні (ER)</div>
          <div className="grid g2" style={{ gap: 10, marginBottom: 12 }}><div className="lm" style={{ background: "var(--bg-2)", padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}><b style={{ fontSize: 20 }}>{medMedia.toFixed(1)}%</b><div className="muted" style={{ fontSize: 12 }}>медіана з медіа</div></div><div style={{ background: "var(--bg-2)", padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}><b style={{ fontSize: 20 }}>{medText.toFixed(1)}%</b><div className="muted" style={{ fontSize: 12 }}>медіана без медіа</div></div></div>
          <p style={{ fontSize: 14 }}>U = {mw.U.toFixed(0)}, z = {mw.z.toFixed(2)}, <b>{pTxt(mw.p)}</b>. {mw.p < 0.05 ? "Різниця статистично значуща." : "Статистично значущої різниці не виявлено."}</p>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="panel"><h3>Формули, що використовуються</h3><div className="sub">за підрозділом 1.4</div><div style={{ display: "grid", gap: 8 }}>
          <div className="formula">ER = (L + R + P + Q) / V · 100 %</div><div className="formula">ρ = 1 − 6·Σdᵢ² / ( n·(n² − 1) )</div><div className="formula">tfidf(t,d) = tf(t,d) · log( N / df(t) )</div></div></div>
        <div className="panel"><h3>Як читати результат</h3><p className="muted" style={{ fontSize: 14 }}>Коефіцієнт близький до 0 означає відсутність зв'язку, до ±1 — сильний. Значущість p &lt; 0,05 свідчить, що зв'язок навряд чи випадковий. Ранговий коефіцієнт та критерій Манна–Уітні не потребують нормальності розподілу, тому надійні на малих вибірках.</p></div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Звіти */
function download(name, mime, content) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function ReportsTab() {
  const s = summary(POSTS);
  const toCsv = () => {
    const head = ["id", "date", "text", "media", "views", "likes", "replies", "reposts", "quotes", "er_percent"];
    const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    return "﻿" + [head.join(",")].concat(POSTS.map((p) => [p.id, new Date(p.ts).toISOString(), esc(p.text), p.media, p.views, p.likes, p.replies, p.reposts, p.quotes, er(p).toFixed(2)].join(","))).join("\n");
  };
  return (
    <>
      <Title title="Звіти й експорт" sub="Експорт працює повністю в браузері — дані нікуди не надсилаються" />
      <div className="grid g3">
        <div className="panel"><div className="ico card" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center", color: "var(--brand)" }}><Icon name="table" /></div><h3 style={{ marginTop: 14 }}>CSV</h3><div className="sub">таблиця публікацій з ER</div><button className="btn primary sm" onClick={() => download("threadscope-posts.csv", "text/csv;charset=utf-8", toCsv())}><Icon name="download" size={15} /> Завантажити CSV</button></div>
        <div className="panel"><div className="ico card" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center", color: "var(--brand)" }}><Icon name="db" /></div><h3 style={{ marginTop: 14 }}>JSON</h3><div className="sub">сирі дані та зведення</div><button className="btn sm" onClick={() => download("threadscope-report.json", "application/json", JSON.stringify({ summary: s, posts: POSTS }, null, 2))}><Icon name="download" size={15} /> Завантажити JSON</button></div>
        <div className="panel"><div className="ico card" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center", color: "var(--brand)" }}><Icon name="file" /></div><h3 style={{ marginTop: 14 }}>PDF / друк</h3><div className="sub">зведений звіт для друку</div><button className="btn sm" onClick={() => window.print()}><Icon name="file" size={15} /> Друк звіту</button></div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Попередній перегляд зведення</h3><div className="sub">демо-дані, 90 днів</div>
        <table className="tbl"><tbody>
          {[["Публікацій", s.n], ["Сума переглядів", s.views], ["Сума вподобань", s.likes], ["Середній ER", s.erMean.toFixed(2) + " %"], ["Медіана ER", s.erMedian.toFixed(2) + " %"], ["Медіана вподобань", s.likesMedian]].map(([a, b]) => <tr key={a}><td className="muted">{a}</td><td className="mono">{b}</td></tr>)}
        </tbody></table>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Підключення */
function ConnectTab() {
  const steps = ["Користувач натискає «Підключити акаунт Threads»", "Застосунок відкриває вікно авторизації (scope, redirect_uri)", "Threads повертає код авторизації після згоди користувача", "Обмін коду на короткостроковий токен (діє 1 годину)", "Обмін на довгостроковий токен (діє 60 днів, продовжується)", "Збір публікацій і метрик із токеном доступу"];
  const [done, setDone] = useState(0), [busy, setBusy] = useState(false);
  const run = () => { setDone(0); setBusy(true); let i = 0; const t = setInterval(() => { i++; setDone(i); if (i >= steps.length) { clearInterval(t); setBusy(false); } }, 650); };
  return (
    <>
      <Title title="Підключення акаунта" sub="Послідовність OAuth 2.0 для Threads API (імітація)" right={<button className="btn primary" disabled={busy} onClick={run}><Icon name="bolt" size={16} /> {busy ? "Виконується…" : done ? "Повторити імітацію" : "Імітувати підключення"}</button>} />
      <div className="demo-banner"><Icon name="shield" size={16} />Це інтерфейсний макет: реальне підключення потребує застосунку Meta for Developers і дозволів threads_basic, threads_manage_insights, threads_keyword_search.</div>
      <div className="grid g-main">
        <div className="panel oauth">{steps.map((t, i) => (
          <motion.div key={t} className={"oauth-step" + (i < done ? " done" : "")} animate={{ x: i < done ? 0 : 0 }}><span className="n">{i < done ? "✓" : i + 1}</span><span>{t}</span></motion.div>
        ))}</div>
        <div className="panel"><h3>Стан токена</h3><div className="sub">демонстрація</div>
          <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Акаунт</span><span className="mono">@demo_author</span></div>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Токен</span><span className="mono">{done >= 5 ? "довгостроковий" : done >= 4 ? "короткостроковий" : "—"}</span></div>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Строк дії</span><span className="mono">{done >= 5 ? "60 днів" : done >= 4 ? "1 година" : "—"}</span></div>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="muted">Зберігання</span><span className="badge g">зашифровано</span></div>
          </div></div>
      </div>
    </>
  );
}

const VIEWS = { overview: Overview, time: TimeTab, posts: PostsTab, search: SearchTab, text: TextTab, stats: StatsTab, reports: ReportsTab, connect: ConnectTab };

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const View = VIEWS[tab];
  return (
    <div className="app">
      <aside className="side">
        <div className="side-label">Аналітика</div>
        {TABS.slice(0, 6).map(([k, l, i]) => <button key={k} className={"side-btn" + (tab === k ? " active" : "")} onClick={() => setTab(k)}><Icon name={i} size={17} />{l}</button>)}
        <div className="side-label">Дані</div>
        {TABS.slice(6).map(([k, l, i]) => <button key={k} className={"side-btn" + (tab === k ? " active" : "")} onClick={() => setTab(k)}><Icon name={i} size={17} />{l}</button>)}
        <div className="acc"><b>@demo_author</b><div className="muted" style={{ fontSize: 12 }}>демо-акаунт · {POSTS.length} публікацій</div></div>
      </aside>
      <div className="main">
        <div className="demo-banner" style={{ marginBottom: 18 }}><Icon name="bolt" size={16} />Демонстраційні дані (генерація за seed). Усі розрахунки виконуються у вашому браузері за формулами з пояснювальної записки.</div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <View />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


