import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Icon } from "./ui.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ExtensionPage from "./pages/ExtensionPage.jsx";

export function LogoMark({ size = 28 }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <svg width={size - 10} height={size - 10} viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18l6-7 4 4 8-10" /><circle cx="21" cy="5" r="1.6" fill="#3ecf8e" />
      </svg>
    </span>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  return (
    <header className="nav">
      <div className="container nav-in">
        <Link to="/" className="logo"><LogoMark /> ThreadScope</Link>
        <nav className={"nav-links" + (open ? " open" : "")} aria-label="Головна навігація">
          <NavLink to="/" end className="nav-link">Лендінг</NavLink>
          <NavLink to="/app" className="nav-link">Вебзастосунок</NavLink>
          <NavLink to="/extension" className="nav-link">Розширення</NavLink>
          <Link to="/app" className="btn primary sm" style={{ marginLeft: 8 }}>Відкрити демо <Icon name="arrow" size={15} /></Link>
        </nav>
        <button className="nav-burger" aria-label="Меню" onClick={() => setOpen(!open)}><Icon name="menu" /></button>
      </div>
    </header>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const loc = useLocation();
  const hideFooter = loc.pathname.startsWith("/app");
  return (
    <>
      <ScrollTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/extension" element={<ExtensionPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      {!hideFooter && (
        <footer>
          <div className="container foot">
            <span>© 2026 ThreadScope — навчальний проєкт: система збору та статистичної обробки даних для аналізу контенту Threads.</span>
            <span>Дані на сайті — демонстраційні. Проєкт не пов'язаний із Meta.</span>
          </div>
        </footer>
      )}
    </>
  );
}

