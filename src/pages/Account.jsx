import { useState } from 'react';
import api, { storage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Strip, BackButton, useTrail, Field } from '../components/ui';
import Icon from '../components/Icon';
import { STRIP } from '../lib/theme';

export default function Account() {
  useTrail([{ label: 'My Account' }]);
  const { user, clinic, perms } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (f.next.length < 8) return setErr('New password must be at least 8 characters.');
    if (f.next !== f.confirm) return setErr("The new passwords don't match.");
    setBusy(true);
    setErr('');
    try {
      const r = await api.auth.changePassword(f.current, f.next);
      storage.setToken(r.token);
      setF({ current: '', next: '', confirm: '' });
      toast('✓ Password changed. Other devices have been signed out.');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marea">
      <Strip title="My Account" sub={`${user.name} · ${perms.roleName} · ${clinic.name}`} bg={STRIP.admin} />
      <BackButton to="/" label="Home" />
      <div className="panel">
        <div className="ph"><h3>Change Password</h3></div>
        <form className="pb" style={{ maxWidth: 440 }} onSubmit={save}>
          <div className="fgrid full">
            <Field label="Current password"><input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
            <Field label="New password (min 8 characters)"><input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
            <Field label="Confirm new password" error={err}><input type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
          </div>
          <button className="btn-main" type="submit" disabled={busy}><Icon name="key" size={15} /> {busy ? 'Saving…' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
}
