import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bars, Card, Counter, Donut, Icon, LineChart, Reveal, Sparkline } from "../ui.jsx";
import { POSTS, PUBLIC, sentimentBuckets, summary, weekly, wordFreq } from "../data.js";

const LOG = [
  ["dim", "$ threadscope collect --account demo_author"],
  ["ok", "✔ OAuth 2.0: токен прийнято (довгостроковий, 60 днів)"],
  ["key", "GET /me/threads?limit=100 → 100 публікацій"],
  ["key", "GET /{id}/insights?metric=views,likes,replies → 100"],
  ["ok", "✔ збережено 138 публікацій, 0 дублікатів"],
  ["dim", "ліміт запитів: 41 / 2200 за 24 год"],
];

function Terminal() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= LOG.length + 3 ? 0 : x + 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="terminal" aria-label="Приклад журналу збору даних">
      {LOG.slice(0, n).map((l, i) => <motion.div key={i} className={l[0]} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>{l[1]}</motion.div>)}
      <span className="caret" />
    </div>
  );
}

function MiniHeat() {
  const cells = useMemo(() => Array.from({ length: 7 * 14 }, (_, i) => {
    const d = Math.floor(i / 14), h = i % 14;
    return Math.max(0.08, Math.min(1, 0.25 + Math.sin(h / 2.2 + d) * 0.28 + ((i * 37) % 17) / 40 + (h > 9 ? 0.2 : 0)));
  }), []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}>
      {cells.map((a, i) => (
        <motion.i key={i} style={{ aspectRatio: "1", borderRadius: 4, background: `rgba(62,207,142,${a})`, display: "block" }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.008 }}
          animate={{ opacity: [1, 0.55, 1] }} />
      ))}
    </div>
  );
}

const FAQ = [
  ["Звідки беруться дані?", "Основний застосунок отримує дані через офіційне Threads API (OAuth 2.0). Метрики доступні для власних публікацій користувача; пошук публічних публікацій потребує схваленого дозволу threads_keyword_search. На цьому сайті використано демонстраційні дані."],
  ["Чому розширення не збирає дані масово?", "Розширення лише зчитує те, що користувач уже бачить на відкритій сторінці, та обчислює показники на його стороні. Воно не звертається до API й не призначене для скрапінгу."],
  ["Чи зберігаються персональні дані?", "Збираються лише публічні поля та дані власного акаунта. Імена користувачів у звітах можна анонімізувати, токени зберігаються в зашифрованому вигляді."],
  ["Які методи аналізу використано?", "Описова статистика, показник залученості, теплова карта «день × година», кореляції Пірсона та Спірмена, критерій Манна–Уітні, TF-IDF, лексиконна тональність."],
];

export default function Landing() {
  const s = useMemo(() => summary(POSTS), []);
  const wk = useMemo(() => weekly(POSTS), []);
  const sent = useMemo(() => sentimentBuckets(POSTS), []);
  const words = useMemo(() => wordFreq(POSTS, 5), []);
  const [faq, setFaq] = useState(0);
  const tech = ["React", "Threads API", "OAuth 2.0", "PostgreSQL", "pandas", "SciPy", "scikit-learn", "TF-IDF", "Manifest V3", "JSON", "CSV", "Spearman ρ", "Mann–Whitney U", "Engagement Rate"];

  return (
    <main>
      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="orb a" /><div className="orb b" /><div className="orb c" />
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="pill"><b>Новинка</b><span className="dot-live" /> Демо: вебзастосунок + розширення для Threads</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            Аналітика контенту <span className="grad-text">Threads</span>, яка пояснює, а не лише рахує
          </motion.h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }}>
            Збір даних через офіційне API, статистична обробка, тональність і теплова карта найкращого часу публікації — у вебзастосунку та в розширенні браузера, що показує показники прямо на сторінці.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.34 }}>
            <Link to="/app" className="btn primary">Спробувати демо <Icon name="arrow" size={16} /></Link>
            <Link to="/extension" className="btn"><Icon name="puzzle" size={16} /> Дизайн розширення</Link>
          </motion.div>

          <motion.div className="hero-shot" initial={{ opacity: 0, y: 60, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="shot-bar"><i /><i /><i /><span>threadscope / огляд акаунта · демо-дані</span></div>
            <div className="shot-body">
              {[["Публікацій", s.n, 0, ""], ["Перегляди", s.views / 1000, 1, "K"], ["Сер. залученість", s.erMean, 1, "%"], ["Медіана вподобань", s.likesMedian, 0, ""]].map(([l, v, d, suf]) => (
                <div className="panel kpi" key={l}><div className="l">{l}</div><div className="v"><Counter to={v} decimals={d} suffix={suf} /></div></div>
              ))}
              <div className="panel shot-wide"><h3>Перегляди за тижнями</h3><div className="sub">останні 13 тижнів</div><LineChart data={wk} height={190} format={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + "K" : Math.round(v))} /></div>
              <div className="panel"><h3>Тональність</h3><div className="sub">публікації автора</div>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <Donut size={132} thickness={16} segments={[{ label: "pos", value: sent.pos, color: "#3ecf8e" }, { label: "neu", value: sent.neu, color: "#6b6b73" }, { label: "neg", value: sent.neg, color: "#f06a6a" }]}
                    center={<div><b style={{ fontSize: 22 }}>{Math.round((sent.pos / s.n) * 100)}%</b><div style={{ fontSize: 11, color: "#6b6b73" }}>позитивні</div></div>} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">{[...tech, ...tech].map((t, i) => <span key={i}>{t}</span>)}</div>
      </div>

      {/* ---------------- STATS ---------------- */}
      <section className="sec" style={{ paddingBottom: 0 }}>
        <div className="container">
          <Reveal>
            <div className="stats">
              {[["Метрик у системі", 12, 0, ""], ["Методів аналізу", 9, 0, ""], ["Вимог до застосунку", 16, 0, ""], ["Дані на сервер третіх сторін", 0, 0, ""]].map(([l, v, d, suf]) => (
                <div className="stat" key={l}><b><Counter to={v} decimals={d} suffix={suf} /></b><span>{l}</span></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- BENTO ---------------- */}
      <section className="sec" id="features">
        <div className="container">
          <Reveal className="sec-head">
            <span className="eyebrow">// можливості</span>
            <h2>Усе для аналізу Threads в одному місці</h2>
            <p>Від збору даних до пояснюваних висновків: система об'єднує офіційне API, статистику й текстовий аналіз.</p>
          </Reveal>
          <div className="bento">
            <Reveal className="b-4"><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="chart" /></div>
              <h3>Дашборд акаунта</h3><p>Перегляди, вподобання, відповіді, репости та показник залученості за тижнями — з історією знімків метрик.</p>
              <div className="visual"><LineChart data={wk} valueKey="er" height={170} format={(v) => v.toFixed(1) + "%"} /></div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.08}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="clock" /></div>
              <h3>Найкращий час публікації</h3><p>Теплова карта «день тижня × година» з порогом мінімальної кількості публікацій.</p>
              <div className="visual"><MiniHeat /></div>
            </Card></Reveal>
            <Reveal className="b-2"><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="smile" /></div>
              <h3>Тональність тексту</h3><p>Лексиконна оцінка для публікацій і відповідей, розподіл позитивних, нейтральних і негативних.</p>
              <div className="visual"><Bars items={[{ label: "позитивні", value: sent.pos }, { label: "нейтральні", value: sent.neu, color: "#6b6b73" }, { label: "негативні", value: sent.neg, color: "#f06a6a" }]} /></div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.08}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="search" /></div>
              <h3>Пошук за ключовим словом</h3><p>Теми, теги та динаміка згадок у публічних публікаціях.</p>
              <div className="visual"><div className="chips">{words.map((w, i) => <span key={w.label} className={"chip" + (i < 2 ? " on" : "")}>{w.label}</span>)}</div>
                <div style={{ marginTop: 16 }}><Sparkline values={[3, 5, 4, 8, 7, 12, 9, 15, 14, 19]} width={220} height={44} /></div></div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.16}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="db" /></div>
              <h3>Збір через офіційне API</h3><p>OAuth 2.0, пагінація, облік лімітів і дедуплікація.</p>
              <div className="visual"><Terminal /></div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.08}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="sliders" /></div>
              <h3>Статистика, що пояснює</h3><p>Кореляції, критерій Манна–Уітні й TF-IDF з поясненням результату простими словами.</p>
              <div className="visual" style={{ display: "grid", gap: 8 }}>
                <div className="formula">ER = (L+R+P+Q) / V · 100%</div>
                <div className="formula">ρ = 1 − 6Σd² / n(n²−1)</div>
              </div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.16}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="puzzle" /></div>
              <h3>Розширення для браузера</h3><p>Показує частоту публікацій, середні реакції та швидкість зростання посту прямо на сторінці Threads — без масового збору даних.</p>
              <div className="visual"><Link to="/extension" className="btn sm">Подивитися дизайн <Icon name="arrow" size={14} /></Link></div>
            </Card></Reveal>
            <Reveal className="b-2" delay={0.24}><Card style={{ height: "100%" }}>
              <div className="ico"><Icon name="shield" /></div>
              <h3>Приватність за замовчуванням</h3><p>Лише публічні дані та дані власного акаунта. Анонімізація імен, зашифровані токени, жодної передачі третім сторонам.</p>
              <div className="visual chips"><span className="chip on">GDPR-орієнтовано</span><span className="chip on">анонімізація</span><span className="chip">без трекерів</span></div>
            </Card></Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- PIPELINE ---------------- */}
      <section className="sec" style={{ background: "var(--bg-2)", borderBlock: "1px solid var(--border)" }}>
        <div className="container">
          <Reveal className="sec-head"><span className="eyebrow">// як це працює</span><h2>Шість етапів від даних до висновків</h2></Reveal>
          <div className="pipe">
            {[["Джерела", "API Threads"], ["Збір", "OAuth, ліміти"], ["Зберігання", "історія метрик"], ["Обробка", "очищення тексту"], ["Аналіз", "статистика, теми"], ["Подання", "дашборд, звіти"]].map(([a, b], i) => (
              <Reveal className="step" key={a} delay={i * 0.09}><div className="n">{String(i + 1).padStart(2, "0")}</div><b>{a}</b><span>{b}</span></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- EXTENSION TEASER ---------------- */}
      <section className="sec">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">// розширення браузера</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Показники — просто на сторінці профілю</h2>
            <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>Відкрили профіль чи публікацію — розширення за секунду рахує оперативні показники й підсвічує публікації з підвищеною активністю.</p>
            <ul className="list">
              {[["Частота публікацій", " за годину, добу й тиждень"], ["Швидкість зростання", " вподобань та мітка «підвищена активність»"], ["Лише за вашою дією", " — дані передаються в застосунок кнопкою"]].map(([b, t]) => (
                <li key={b}><Icon name="check" size={18} /><span><b>{b}</b>{t}</span></li>
              ))}
            </ul>
            <div style={{ marginTop: 28 }}><Link to="/extension" className="btn primary">Переглянути макет розширення <Icon name="arrow" size={16} /></Link></div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="panel" style={{ padding: 18 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}><b style={{ fontSize: 14 }}>ThreadScope Lens</b><span className="badge g">активно</span></div>
              <div className="lens-metrics">
                {[["0.06", "публ./год"], ["1.5", "публ./добу"], ["10.2", "публ./тиж"]].map(([v, l], i) => (
                  <motion.div className="lm" key={l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }}><b>{v}</b><span>{l}</span></motion.div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}><Bars items={[{ label: "Текст", value: 58 }, { label: "Фото", value: 28, color: "#6aa8ff" }, { label: "Відео", value: 14, color: "#9b6bff" }]} format={(v) => v + "%"} /></div>
              <div className="row" style={{ marginTop: 16 }}><span className="badge y">⚡ підвищена активність ×2.4</span><span className="badge">лайків/год: 18.6</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="sec-head"><span className="eyebrow">// питання</span><h2>Часті запитання</h2></Reveal>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <Reveal key={q} delay={i * 0.05}>
                <div className="faq-item">
                  <button className="faq-q" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>
                    {q}<motion.span animate={{ rotate: faq === i ? 45 : 0 }} style={{ color: "var(--brand)", fontSize: 22, lineHeight: 1 }}>+</motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {faq === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}><div className="faq-a">{a}</div></motion.div>}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="cta">
            <h2>Подивіться, як це працює на демо-даних</h2>
            <p className="muted" style={{ margin: "14px 0 28px" }}>{POSTS.length} демонстраційних публікацій і {PUBLIC.length} публічних для пошуку — усі показники рахуються в браузері.</p>
            <Link to="/app" className="btn primary">Відкрити вебзастосунок <Icon name="arrow" size={16} /></Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

