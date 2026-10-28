import { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AIMenu } from './Menu';
import { useAuth } from './AuthGate';

export default function TopBar({ minimal = false }) {
  const auth = useAuth();
  const extra = useMemo(() => (auth?.ready ? [{ label: 'יציאה מהחשבון', onSelect: () => auth.signOut() }] : []), [auth?.ready, auth]);
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
              <NavLink to="/" end>
                מטופלים
              </NavLink>
            )}
          </nav>
        )}
        {!minimal && <AIMenu extra={extra} />}
      </div>
    </header>
  );
}
