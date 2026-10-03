import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrailCtx, Empty, Loading } from './ui';
import Icon from './Icon';
import { ROLE_PIP } from '../lib/theme';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function Layout() {
  const { session, booting, user, clinic, perms, logout } = useAuth();
  const [trail, setTrail] = useState([]);
  const online = useOnline();
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (clinic) document.title = `${clinic.name} — Automate Era`;
  }, [clinic]);

  if (booting) return <div className="boot"><Loading text="Opening your clinic…" /></div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const pip = ROLE_PIP[perms.roleKey] || 'staff';

  return (
    <TrailCtx.Provider value={setTrail}>
      {!online && <div className="offline">You're offline — changes can't be saved until the connection is back.</div>}
      <div id="page-app" className="page active">
        <header className="topbar">
          <Link to="/" className="tb-brand" title="Home">
            <div className="tb-logo"><Icon name="shield" size={15} strokeWidth={2.2} /></div>
            <div>
              <div className="tb-clinic">{clinic.name}</div>
              <div className="tb-sub">{clinic.subtitle}</div>
            </div>
          </Link>
          {trail.length > 0 && (
            <nav className="tb-trail" aria-label="Breadcrumb">
              {trail.map((c, i) => (i === trail.length - 1 || !c.to
                ? <span key={i} className="tcur">{c.label}</span>
                : <span key={i} style={{ display: 'contents' }}>
                    <button type="button" className="tc" onClick={() => nav(c.to)}>{c.label}</button>
                    <span className="ts">›</span>
                  </span>))}
            </nav>
          )}
          <div className="tb-right">
            <Link to="/account" className="user-pill" title="My account">
              <div className="u-av">{user.initials}</div>
              <div className="u-text">
                <div className="u-name">{user.name}<span className={`rpip rp-${pip}`}>{perms.roleName}</span></div>
                <div className="u-role">ID: {user.loginId}</div>
              </div>
            </Link>
            <button type="button" className="btn-lo" onClick={logout}>
              <Icon name="logout" size={14} /><span className="lo-text"> Logout</span>
            </button>
          </div>
        </header>
        <main className="app-body"><Outlet /></main>
      </div>
    </TrailCtx.Provider>
  );
}

/** Blocks a page when the user's role has no access to the module. */
export function Guard({ module, kind, children }) {
  const { can, perms } = useAuth();
  const ok = kind ? (kind === 'admin' ? perms.isAdmin : kind === 'patient' ? perms.isPatient : !perms.isPatient) : can(module);
  if (!ok) {
    return (
      <div className="panel"><Empty title="You don't have access to this page.">
        Ask your clinic admin to give your role access. <div style={{ marginTop: 12 }}><Link to="/" className="btn-sm pri">Go home</Link></div>
      </Empty></div>
    );
  }
  return children;
}
