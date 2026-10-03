import { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Strip, BackButton, Field, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';

/** Editable list of short strings (therapies, categories, units). */
function ListEditor({ label, items, onChange, placeholder }) {
  const [v, setV] = useState('');
  const add = () => {
    const t = v.trim();
    if (!t || items.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...items, t]);
    setV('');
  };
  return (
    <Field label={label}>
      <div className="chips" style={{ marginBottom: 8 }}>
        {items.map((x) => (
          <span key={x} className="perm-chip">{x}
            <button type="button" aria-label={`Remove ${x}`} onClick={() => onChange(items.filter((y) => y !== x))}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn-sm pri" onClick={add}>Add</button>
      </div>
    </Field>
  );
}

export default function ClinicSettings() {
  useTrail([{ label: 'Clinic Settings' }]);
  const { clinic, setClinic } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    name: clinic.name || '', subtitle: clinic.subtitle || '', phone: clinic.phone || '', email: clinic.email || '', address: clinic.address || '',
    therapies: clinic.settings.therapies, stockCategories: clinic.settings.stockCategories, stockUnits: clinic.settings.stockUnits,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Clinic name is required.');
    if (!f.therapies.length) return setErr('Add at least one therapy / service.');
    setBusy(true);
    setErr('');
    try {
      const c = await api.clinic.update(f);
      setClinic(c);
      toast('✓ Clinic settings saved.');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marea">
      <Strip title="Clinic Settings" sub={`Clinic code: ${clinic.code} — staff and patients use this to sign in`} bg={STRIP.admin} />
      <BackButton to="/" label="Home" />
      <form className="panel" onSubmit={submit}>
        <div className="ph"><h3>Clinic Profile</h3></div>
        <div className="pb" style={{ maxWidth: 760 }}>
          <div className="fgrid">
            <Field label="Clinic Name *"><input value={f.name} onChange={set('name')} /></Field>
            <Field label="Subtitle"><input value={f.subtitle} onChange={set('subtitle')} placeholder="e.g. Ayurveda & Panchakarma Centre" /></Field>
            <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
          </div>
          <div className="fgrid full"><Field label="Address"><input value={f.address} onChange={set('address')} /></Field></div>
          <div className="ss">Therapies & Services</div>
          <ListEditor label="Used in appointments, admissions and patient booking" items={f.therapies} onChange={(v) => setF({ ...f, therapies: v })} placeholder="Add a therapy…" />
          <div className="ss">Stock</div>
          <div className="fgrid">
            <ListEditor label="Categories" items={f.stockCategories} onChange={(v) => setF({ ...f, stockCategories: v })} placeholder="Add a category…" />
            <ListEditor label="Units" items={f.stockUnits} onChange={(v) => setF({ ...f, stockUnits: v })} placeholder="Add a unit…" />
          </div>
          {err && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <button className="btn-main" type="submit" disabled={busy}><Icon name="save" size={15} color="#fff" /> {busy ? 'Saving…' : 'Save Settings'}</button>
          <p className="form-note">Sign-in link for this clinic: <code>{window.location.origin}/login?clinic={clinic.code}</code></p>
        </div>
      </form>
    </div>
  );
}
