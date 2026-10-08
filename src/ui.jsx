import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

/* ---------- іконки (inline SVG, без залежностей) ---------- */
const P = {
  chart: "M3 3v18h18M7 14l4-4 3 3 5-6",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  search: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z",
  smile: "M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  puzzle: "M10 4a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h-1a2 2 0 1 0 0 4h1v3a1 1 0 0 1-1 1h-3v-1a2 2 0 1 0-4 0v1H7a1 1 0 0 1-1-1v-3h1a2 2 0 1 0 0-4H6V6a1 1 0 0 1 1-1h3V4z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z",
  check: "M5 12l5 5 9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  table: "M3 5h18v14H3zM3 10h18M9 5v14",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  x: "M6 6l12 12M18 6L6 18",
};
export function Icon({ name, size = 20, stroke = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

/* ---------- анімації появи ---------- */
export function Reveal({ children, delay = 0, y = 26, className = "", as = "div", ...rest }) {
  const M = motion[as] || motion.div;
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}>
      {children}
    </M>
  );
}

export function Counter({ to, decimals = 0, suffix = "", prefix = "", duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: "easeOut", onUpdate: (x) => setV(x) });
    return () => c.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
}

/* картка з «прожектором» за курсором */
export function Card({ children, className = "", ...rest }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
    e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
  };
  return <div className={"card " + className} onMouseMove={onMove} {...rest}>{children}</div>;
}

/* ---------- графіки ---------- */
export function LineChart({ data, height = 230, valueKey = "views", format = (v) => v }) {
  const [hover, setHover] = useState(null);
  const W = 700, H = height, pad = { l: 44, r: 14, t: 14, b: 28 };
  const vals = data.map((d) => d[valueKey]);
  const max = Math.max(...vals) * 1.1 || 1;
  const x = (i) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const pts = data.map((d, i) => [x(i), y(d[valueKey])]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${x(data.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const gid = "g" + valueKey;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Лінійний графік"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (data.length - 1));
        setHover(Math.max(0, Math.min(data.length - 1, i)));
      }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.35" /><stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="#2a2a2e" strokeDasharray="3 5" />
          <text x={pad.l - 8} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="#6b6b73">{format(max * t)}</text>
        </g>
      ))}
      {data.map((d, i) => i % 2 === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b6b73">{d.label}</text>)}
      <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} key={"a" + valueKey} />
      <motion.path d={path} fill="none" stroke="#3ecf8e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: "easeInOut" }} key={"l" + valueKey} />
      {hover !== null && (
        <g>
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={pad.t} y2={H - pad.b} stroke="#3ecf8e" strokeOpacity=".4" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="#0f0f10" stroke="#3ecf8e" strokeWidth="2.5" />
          <g transform={`translate(${Math.min(pts[hover][0] + 10, W - 130)},${Math.max(pts[hover][1] - 46, 6)})`}>
            <rect width="120" height="38" rx="8" fill="#1d1d1f" stroke="#36363b" />
            <text x="10" y="15" fontSize="11" fill="#a0a0a8">{data[hover].label}</text>
            <text x="10" y="31" fontSize="13" fontWeight="600" fill="#ededee">{format(data[hover][valueKey])}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

export function Sparkline({ values, width = 120, height = 36, color = "#3ecf8e" }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 3 - ((v - min) / (max - min || 1)) * (height - 8)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <motion.path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.1 }} />
    </svg>
  );
}

export function Bars({ items, color = "#3ecf8e", format = (v) => v, max }) {
  const m = max || Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {items.map((it, i) => (
        <div key={it.label} style={{ display: "grid", gridTemplateColumns: "92px 1fr 52px", gap: 10, alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "#a0a0a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
          <div style={{ height: 8, background: "#242427", borderRadius: 99, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: it.color || color, borderRadius: 99 }}
              initial={{ width: 0 }} whileInView={{ width: (it.value / m) * 100 + "%" }} viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.05, ease: "easeOut" }} />
          </div>
          <span className="mono" style={{ textAlign: "right", color: "#ededee" }}>{format(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments, size = 150, thickness = 18, center }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} role="img" aria-label="Кільцева діаграма">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#242427" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C, off = acc; acc += len;
          return (
            <motion.circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"
              strokeDasharray={`${Math.max(len - 3, 0)} ${C}`} strokeDashoffset={-off}
              initial={{ opacity: 0, strokeDasharray: `0 ${C}` }} whileInView={{ opacity: 1, strokeDasharray: `${Math.max(len - 3, 0)} ${C}` }}
              viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.15 }} />
          );
        })}
      </svg>
      {center && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>}
    </div>
  );
}

export function Heatmap({ cells, dayLabels }) {
  const max = Math.max(...cells.flat().filter((c) => c.ok).map((c) => c.v), 0.001);
  return (
    <div className="heat" role="img" aria-label="Теплова карта залученості: день тижня × година">
      <span />
      {Array.from({ length: 24 }, (_, h) => <span key={h} className="h">{h % 3 === 0 ? h : ""}</span>)}
      {cells.map((row, d) => (
        <Row key={d} row={row} d={d} label={dayLabels[d]} max={max} />
      ))}
    </div>
  );
}
function Row({ row, d, label, max }) {
  return (
    <>
      <span className="d">{label}</span>
      {row.map((c, h) => {
        const a = c.ok ? 0.12 + (c.v / max) * 0.88 : 0;
        return (
          <motion.span key={h} className="c" title={`${label}, ${h}:00 — ${c.n} публ.${c.ok ? ", ER " + c.v.toFixed(1) + "%" : " (замало даних)"}`}
            style={{ background: c.ok ? `rgba(62,207,142,${a})` : c.n ? "#2a2a2e" : "#1a1a1c" }}
            initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: (d * 24 + h) * 0.003, duration: 0.35 }} />
        );
      })}
    </>
  );
}
