import { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { fmtClock, fmtLongDate } from '../lib/format';

/* ── Breadcrumb trail shown in the top bar ── */
export const TrailCtx = createContext(() => {});
export function useTrail(items) {
  const setTrail = useContext(TrailCtx);
  const key = JSON.stringify(items);
  useEffect(() => {
    setTrail(items);
    return () => setTrail([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setTrail]);
}

/* ── Coloured welcome strip at the top of each module ── */
export function Strip({ title, sub, bg }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="wstrip" style={{ background: bg }}>
      <div className="ws-t"><h3>{title}</h3><p>{sub}</p></div>
      <div className="ws-r"><strong>{fmtClock(now)}</strong><span>{fmtLongDate(now)}</span></div>
    </div>
  );
}

export function BackButton({ to, label = 'Previous' }) {
  const nav = useNavigate();
  return (
    <button type="button" className="back-btn" onClick={() => nav(to)}>
      <Icon name="back" size={14} strokeWidth={2.2} /> Back to {label}
    </button>
  );
}

/* ── Navigation tile ── */
export function Tile({ icon, title, desc, theme, onClick, index = 0, children }) {
  return (
    <button type="button" className="tile" onClick={onClick} style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="t-ico" style={{ background: theme.bg, boxShadow: `0 6px 18px ${theme.sh}` }}>
        <Icon name={icon} color="#fff" />
      </div>
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {children}
      <div className="t-arr"><Icon name="arr" size={13} strokeWidth={2.5} /></div>
    </button>
  );
}

export function AccessTag({ edit, editText = '✎ Can Edit', viewText = '👁 View Only' }) {
  return <span className={`ac ${edit ? 'ac-edit' : 'ac-read'}`}>{edit ? editText : viewText}</span>;
}

export function Loading({ text = 'Loading…' }) {
  return <div className="state"><div className="spinner" />{text}</div>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state">
      <strong>Couldn't load this.</strong>
      {error?.message}
      {onRetry && <div style={{ marginTop: 12 }}><button type="button" className="btn-sm pri" onClick={onRetry}>Try again</button></div>}
    </div>
  );
}

export function Empty({ title, children }) {
  return <div className="state"><strong>{title}</strong>{children}</div>;
}

/** Wraps table bodies: loading / error / empty / rows */
export function TableState({ loading, error, empty, cols, onRetry, emptyText = 'Nothing here yet.' }) {
  if (loading) return <tr><td colSpan={cols}><Loading /></td></tr>;
  if (error) return <tr><td colSpan={cols}><ErrorState error={error} onRetry={onRetry} /></td></tr>;
  if (empty) return <tr><td colSpan={cols}><Empty title={emptyText} /></td></tr>;
  return null;
}

export function SearchBox({ value, onChange, placeholder, icon = 'user' }) {
  return (
    <div className="sw">
      <div className="sb">
        <Icon name={icon} size={15} color="var(--txt3)" />
        <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </div>
    </div>
  );
}

export function Pager({ page, pages, total, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="pager">
      <span>{total} records · page {page} of {pages}</span>
      <span style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button type="button" className="btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const label = { pending: 'Pending', confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled' }[status] || status;
  return <span className={`badge ${status}`}>{label}</span>;
}

export function Avatar({ text, bg = 'linear-gradient(135deg,#7C3AED,#6D28D9)', size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontSize: size > 38 ? 14 : 11, fontWeight: 700, flexShrink: 0,
    }}>{text}</div>
  );
}

/** Field wrapper matching the prototype's .fg look */
export function Field({ label, error, children, className = 'fg' }) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

/** Shows a one-time login/password after creating an account */
export function Credentials({ loginId, password, who = 'The patient' }) {
  return (
    <div className="cred" role="alert">
      ✓ Login created. {who} can sign in with ID <code>{loginId}</code> and temporary password <code>{password}</code>.
      <div style={{ fontSize: 12, marginTop: 6 }}>Write this down or share it now — the password won't be shown again.</div>
    </div>
  );
}
