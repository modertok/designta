import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars, Counter, Donut, Icon, Reveal, Sparkline } from "../ui.jsx";
import { POSTS, fmt, median, profileStats, velocity } from "../data.js";

const TABS = [["profile", "Сторінка профілю"], ["post", "Сторінка публікації"], ["popup", "Іконка й popup"], ["how", "Як це працює"]];

function Frame({ url, active, badge, children }) {
  return (
    <div className="browser">
      <div className="b-top">
        <div className="b-dots"><i /><i /><i /></div>
        <div className="b-url">{url}</div>
        <div className={"b-ext" + (active ? " on" : "")} title="ThreadScope Lens">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18l6-7 4 4 8-10" /></svg>
          {badge && <span className="badge-n">{badge}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SaveButton() {
  const [st, setSt] = useState("idle");
  const click = () => { if (st !== "idle") return setSt("idle"); setSt("saving"); setTimeout(() => setSt("saved"), 1000); };
  return (
    <button className={"btn sm" + (st === "saved" ? "" : " primary")} style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={click}>
      {st === "idle" && <><Icon name="download" size={15} /> Зберегти профіль у ThreadScope</>}
      {st === "saving" && <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #04140c", borderTopColor: "transparent", borderRadius: "50%" }} /> Передаємо…</>}
      {st === "saved" && <><span className="brand"><Icon name="check" size={15} /></span> Збережено · скасувати</>}
    </button>
  );
}

function HourBars({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }} role="img" aria-label="Розподіл публікацій за годинами">
      {values.map((v, h) => (
        <motion.i key={h} style={{ flex: 1, background: v === max ? "#3ecf8e" : "rgba(62,207,142,.35)", borderRadius: 2, display: "block" }}
          initial={{ height: 0 }} animate={{ height: Math.max((v / max) * 100, 4) + "%" }} transition={{ delay: h * 0.02, duration: 0.5 }} title={`${h}:00 — ${v}`} />
      ))}
    </div>
  );
}

function MockPosts({ list, hotIndex = -1 }) {
  return list.map((p, i) => (
    <div key={p.id} className={"mp" + (i === hotIndex ? " hot" : "")}>
      <div className="meta"><b style={{ color: "#151517" }}>demo_author</b><span>· {Math.max(1, i * 5 + 2)} год</span></div>
      <p>{p.text}</p>
      <div className="acts"><span>♡ {p.likes}</span><span>💬 {p.replies}</span><span>↻ {p.reposts}</span><span>❝ {p.quotes}</span></div>
      {i === hotIndex && <motion.span className="badge y flag" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>⚡ підвищена активність</motion.span>}
    </div>
  ));
}

function ProfileView() {
  const st = useMemo(() => profileStats(POSTS), []);
  const total = st.media.TEXT + st.media.IMAGE + st.media.VIDEO;
  return (
    <Frame url="threads.com/@demo_author" active badge="3">
      <div className="b-body">
        <div className="mock-page">
          <div className="mock-prof"><div className="av" /><div><b>Demo Author</b><span>@demo_author · 1 284 підписники</span><div style={{ fontSize: 14, marginTop: 4 }}>Пишу про код, дизайн і каву ☕</div></div></div>
          <MockPosts list={POSTS.slice(0, 4)} hotIndex={1} />
        </div>
        <motion.aside className="lens" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lens-head"><b>ThreadScope Lens</b><span className="badge g">профіль</span></div>
          <h4>Частота публікацій</h4>
          <div className="lens-metrics">
            <div className="lm"><b><Counter to={st.perHour} decimals={2} /></b><span>за годину</span></div>
            <div className="lm"><b><Counter to={st.perDay} decimals={1} /></b><span>за добу</span></div>
            <div className="lm"><b><Counter to={st.perWeek} decimals={1} /></b><span>за тиждень</span></div>
          </div>
          <h4>Середня реакція на публікацію</h4>
          <div className="lens-metrics" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="lm"><b><Counter to={st.avgLikes} decimals={1} /></b><span>вподобань</span></div>
            <div className="lm"><b><Counter to={st.avgReplies} decimals={1} /></b><span>відповідей</span></div>
          </div>
          <h4>Структура контенту</h4>
          <div className="row" style={{ gap: 16 }}>
            <Donut size={86} thickness={12} segments={[{ label: "t", value: st.media.TEXT, color: "#3ecf8e" }, { label: "i", value: st.media.IMAGE, color: "#6aa8ff" }, { label: "v", value: st.media.VIDEO, color: "#9b6bff" }]} />
            <div style={{ fontSize: 12, display: "grid", gap: 3 }}>
              <span style={{ color: "#3ecf8e" }}>● текст {Math.round(st.media.TEXT / total * 100)}%</span>
              <span style={{ color: "#6aa8ff" }}>● фото {Math.round(st.media.IMAGE / total * 100)}%</span>
              <span style={{ color: "#9b6bff" }}>● відео {Math.round(st.media.VIDEO / total * 100)}%</span>
            </div>
          </div>
          <h4>Коли публікує (за годинами)</h4>
          <HourBars values={st.byHour} />
          <div className="row muted" style={{ justifyContent: "space-between", fontSize: 10, marginTop: 4 }}><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
          <SaveButton />
          <div className="muted" style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}>Дані передаються лише після вашого кліку</div>
        </motion.aside>
      </div>
    </Frame>
  );
}

function PostView() {
  const base = useMemo(() => median(POSTS.map((p) => velocity(p.likes, 24))), []);
  const likes = Math.round(median(POSTS.map((p) => p.likes)) * 2.7), age = 3;
  const v = velocity(likes, age), ratio = v / base;
  const growth = [2, 5, 9, 14, 21, 29, 38, likes];
  return (
    <Frame url="threads.com/@demo_author/post/C8x2…" active badge="⚡">
      <div className="b-body">
        <div className="mock-page">
          <div className="mock-prof"><div className="av" style={{ width: 44, height: 44 }} /><div><b style={{ fontSize: 16 }}>Demo Author</b><span>@demo_author</span></div></div>
          <div className="mp hot" style={{ padding: 22 }}>
            <p style={{ fontSize: 17 }}>Сьогодні дописав модуль збору даних. Тести нарешті зелені. Дякую, що читаєте!</p>
            <div className="acts" style={{ fontSize: 14 }}><span>♡ {likes}</span><span>💬 {Math.round(likes * 0.16)}</span><span>↻ {Math.round(likes * 0.09)}</span><span>❝ {Math.round(likes * 0.04)}</span></div>
            <motion.span className="badge y flag" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>⚡ підвищена активність</motion.span>
          </div>
          <div className="mp"><div className="meta"><b style={{ color: "#151517" }}>reader_42</b><span>· 1 год</span></div><p>Супер, а як з тестами на пагінацію?</p></div>
        </div>
        <motion.aside className="lens" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lens-head"><b>ThreadScope Lens</b><span className="badge y">публікація</span></div>
          <h4>Швидкість зростання</h4>
          <div className="panel" style={{ padding: 14 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
              <div><div style={{ fontSize: 30, fontWeight: 750, letterSpacing: "-0.03em" }}><Counter to={v} decimals={1} /></div><div className="muted" style={{ fontSize: 12 }}>вподобань / год</div></div>
              <Sparkline values={growth} width={110} height={44} />
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "#242427", marginTop: 14, overflow: "hidden" }}>
              <motion.div style={{ height: "100%", background: "linear-gradient(90deg,#3ecf8e,#f5b84b)", borderRadius: 99 }} initial={{ width: 0 }} animate={{ width: Math.min(ratio / 4, 1) * 100 + "%" }} transition={{ duration: 1.2 }} />
            </div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 11, color: "#6b6b73", marginTop: 4 }}><span>норма профілю</span><span>×4</span></div>
          </div>
          <h4>Порівняння з медіаною профілю</h4>
          <div className="lens-metrics" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="lm"><b>×{ratio.toFixed(1)}</b><span>до медіани v</span></div>
            <div className="lm"><b>{age} год</b><span>вік публікації</span></div>
          </div>
          <h4>Вердикт</h4>
          <span className="badge y">⚡ підвищена активність (v &gt; 2 × медіана)</span>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>v = L / (t − t₀). Показник рахується локально з відображених на сторінці даних.</p>
        </motion.aside>
      </div>
    </Frame>
  );
}

function PopupView() {
  const [opts, setOpts] = useState({ panel: true, anon: true, send: false, hot: true });
  const tg = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const rows = [["panel", "Показувати панель на сторінці", "профіль і публікація"], ["hot", "Підсвічувати активні публікації", "мітка «⚡ підвищена активність»"], ["anon", "Анонімізувати імена", "у збережених профілях"], ["send", "Автопередача в застосунок", "вимкнено: лише за кліком"]];
  return (
    <div className="grid g2" style={{ alignItems: "start" }}>
      <div className="panel">
        <h3>Popup розширення</h3><div className="sub">натискання на іконку на панелі браузера</div>
        <div className="popup">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}><b>ThreadScope Lens</b><span className="badge g">v1.0</span></div>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>Сторінка: профіль @demo_author · 138 публікацій у вікні</div>
          {rows.map(([k, t, s]) => (
            <div className="sw" key={k}><span>{t}<small>{s}</small></span><button className={"toggle" + (opts[k] ? " on" : "")} role="switch" aria-checked={opts[k]} aria-label={t} onClick={() => tg(k)} /></div>
          ))}
          <div className="row" style={{ marginTop: 14 }}><a href="#/app" className="btn sm primary" style={{ flex: 1, justifyContent: "center" }}>Відкрити застосунок</a><button className="btn sm">Скинути</button></div>
        </div>
      </div>
      <div className="panel">
        <h3>Стани іконки</h3><div className="sub">бейдж показує кількість підсвічених публікацій</div>
        <div className="grid g3" style={{ gap: 12, marginBottom: 22 }}>
          {[["Неактивна", "інша сторінка", false, ""], ["Активна", "профіль/публікація", true, ""], ["Є сигнал", "підвищена активність", true, "3"]].map(([a, b, on, n]) => (
            <div key={a} style={{ textAlign: "center", padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-2)" }}>
              <div className={"b-ext" + (on ? " on" : "")} style={{ margin: "0 auto 10px", width: 40, height: 40, opacity: on ? 1 : 0.45 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18l6-7 4 4 8-10" /></svg>
                {n && <span className="badge-n">{n}</span>}
              </div><b style={{ fontSize: 13 }}>{a}</b><div className="muted" style={{ fontSize: 11.5 }}>{b}</div>
            </div>
          ))}
        </div>
        <h3>Принципи дизайну</h3>
        <ul className="list" style={{ marginTop: 10 }}>
          {["Панель не перекриває контент і не змінює елементів Threads", "Темна тема з акцентом #3ecf8e — відокремлює Lens від сторінки", "Жодних даних без явної дії користувача", "Мінімум дозволів у маніфесті"].map((t) => <li key={t}><Icon name="check" size={17} /><span>{t}</span></li>)}
        </ul>
      </div>
    </div>
  );
}

function HowView() {
  const manifest = `{
  "manifest_version": 3,
  "name": "ThreadScope Lens",
  "version": "1.0.0",
  "action": { "default_popup": "popup.html" },
  "permissions": ["storage"],
  "host_permissions": ["https://www.threads.com/*"],
  "content_scripts": [{
    "matches": ["https://www.threads.com/*"],
    "js": ["content.js"], "css": ["lens.css"]
  }]
}`;
  return (
    <>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        {[["eye", "1. Зчитує", "Content script аналізує відображену сторінку: час публікацій, лічильники, тип медіа."], ["sliders", "2. Рахує локально", "Частота f = N/T, швидкість v = L/(t−t₀), середні та медіана — у браузері користувача."], ["shield", "3. Показує й мовчить", "Панель з'являється на сторінці. Дані йдуть у застосунок лише після кліку «Зберегти»."]].map(([i, t, d], k) => (
          <Reveal key={t} delay={k * 0.08} className="panel"><div className="ico card" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center", color: "var(--brand)" }}><Icon name={i} /></div><h3 style={{ marginTop: 14 }}>{t}</h3><p className="muted" style={{ fontSize: 14 }}>{d}</p></Reveal>
        ))}
      </div>
      <div className="grid g2">
        <Reveal className="panel"><h3>Приклад manifest.json (Manifest V3)</h3><div className="sub">мінімальний набір дозволів</div><pre className="terminal" style={{ overflow: "auto", color: "#c7f5df" }}>{manifest}</pre></Reveal>
        <Reveal className="panel" delay={0.1}><h3>Що розширення НЕ робить</h3><div className="sub">межі за постановкою задачі (підрозд. 1.5)</div>
          <ul className="list" style={{ marginTop: 10 }}>
            {["Не збирає дані масово й не гортає сторінки автоматично", "Не обходить обмеження платформи й не звертається до API", "Не надсилає дані третім сторонам", "Не змінює й не блокує елементи інтерфейсу Threads"].map((t) => <li key={t}><span style={{ color: "var(--danger)" }}><Icon name="x" size={17} /></span><span>{t}</span></li>)}
          </ul>
          <div className="formula" style={{ marginTop: 16 }}>f = N / T &nbsp;·&nbsp; v = L / (t − t₀)</div>
        </Reveal>
      </div>
    </>
  );
}

export default function ExtensionPage() {
  const [tab, setTab] = useState("profile");
  return (
    <main className="ext-wrap">
      <div className="container" style={{ padding: "54px 0 90px" }}>
        <Reveal className="sec-head" style={{ marginBottom: 30 }}>
          <span className="eyebrow">// макет розширення</span>
          <h2>ThreadScope Lens</h2>
          <p>Дизайн розширення браузера: як воно виглядатиме на сторінках профілю та публікації Threads. Макет інтерактивний — перемикайте вкладки й натискайте кнопки.</p>
        </Reveal>
        <div className="tabs" style={{ justifyContent: "center" }} role="tablist">
          {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="demo-banner" style={{ maxWidth: 760, margin: "0 auto 24px" }}><Icon name="eye" size={16} />Макет на демонстраційних даних. Вигляд сторінки Threads умовний; розширення не пов'язане з Meta.</div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
            {tab === "profile" && <ProfileView />}
            {tab === "post" && <PostView />}
            {tab === "popup" && <PopupView />}
            {tab === "how" && <HowView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
