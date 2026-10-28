import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AIMenu } from './Menu';
import { useAuth } from './AuthGate';

function Tab({ to, end, children }) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }} />}
          <span className="nav-t">{children}</span>
        </>
      )}
    </NavLink>
  );
}

export default function TopBar({ minimal = false }) {
  const auth = useAuth();
  useLocation();
  const extra = useMemo(
    () =>
      auth?.ready
        ? [
            ...(auth.mfaOn ? [] : [{ label: 'הפעלת אימות דו־שלבי', hint: 'לא חובה', onSelect: () => auth.enrollMfa() }]),
            { label: 'יציאה מהחשבון', onSelect: () => auth.signOut() },
          ]
        : [],
    [auth?.ready, auth?.mfaOn, auth],
  );
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="AccBars, לדף הבית">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">AccBars</span>
          <span className="brand-sub">יומן מטופלים</span>
        </Link>
        {!minimal && (
          <nav className="topnav" aria-label="ניווט ראשי">
            {auth?.ready && (
              <>
                <Tab to="/" end>
                  מטופלים
                </Tab>
                <Tab to="/library">ספרייה</Tab>
                <Tab to="/method">השיטה</Tab>
              </>
            )}
          </nav>
        )}
        {!minimal && <AIMenu extra={extra} />}
      </div>
    </header>
  );
}
