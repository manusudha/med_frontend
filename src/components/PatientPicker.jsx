import { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import { useDebounced } from '../lib/useFetch';

/** Search-as-you-type patient selector. value = selected patient object or null */
export default function PatientPicker({ value, onChange, placeholder = 'Search by name, phone or PT- number…' }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q, 250);
  const box = useRef();

  useEffect(() => {
    if (!open || value) return;
    let alive = true;
    api.patients.list({ q: dq, status: 'active', limit: 8 })
      .then((r) => alive && setItems(r.items))
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [dq, open, value]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input readOnly value={`${value.name} · ${value.patientCode}`} style={{ flex: 1 }} />
        <button type="button" className="btn-sm" onClick={() => { onChange(null); setQ(''); setOpen(true); }}>Change</button>
      </div>
    );
  }

  return (
    <div className="picker" ref={box}>
      <input type="search" value={q} placeholder={placeholder} onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} aria-label="Find patient" />
      {open && (
        <div className="picker-list" role="listbox">
          {items.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--txt2)' }}>No matching patients.</div>}
          {items.map((p) => (
            <button type="button" key={p._id} onClick={() => { onChange(p); setOpen(false); }}>
              {p.name} <small>· {p.patientCode} · {p.age} yrs · {p.phone}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
