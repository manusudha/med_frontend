import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch, { useDebounced } from '../../lib/useFetch';
import { Strip, BackButton, AccessTag, SearchBox, TableState, Field, Avatar, Credentials, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { initials } from '../../lib/format';

function AddStaff({ roles, onCreated }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const blank = { name: '', roleKey: '', designation: '', password: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Enter the full name.');
    if (!f.roleKey) return setErr('Select a role.');
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    setErr('');
    try {
      const u = await api.users.create(f);
      setCreated({ loginId: u.loginId, password: f.password, name: u.name });
      toast(`✓ ${u.name} added with login ID ${u.loginId}.`);
      setF(blank);
      onCreated();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="ph" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(!open)}>
        <h3>Add Staff Member</h3>
        <button type="button" className="btn-main" style={{ padding: '8px 18px', fontSize: 13 }}>
          <Icon name={open ? 'back' : 'plus'} size={14} strokeWidth={2.5} /> {open ? 'Close' : 'New Staff'}
        </button>
      </div>
      {open && (
        <form className="pb" style={{ maxWidth: 680 }} onSubmit={submit}>
          {created && <Credentials loginId={created.loginId} password={created.password} who={created.name} />}
          <div className="fgrid">
            <Field label="Full Name *"><input value={f.name} onChange={set('name')} placeholder="e.g. Dr. Rohan Patil" /></Field>
            <Field label="Role *">
              <select value={f.roleKey} onChange={set('roleKey')}>
                <option value="" disabled>Select role</option>
                {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Designation"><input value={f.designation} onChange={set('designation')} placeholder="Shown under the name (optional)" /></Field>
            <Field label="Temporary Password *"><input type="text" autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="Min. 6 characters" /></Field>
          </div>
          {err && <p className="err" style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <button className="btn-main" type="submit" disabled={busy}><Icon name="addPt" size={15} color="#fff" /> {busy ? 'Creating…' : 'Create Account'}</button>
          <p className="form-note">A numeric login ID is assigned automatically. Ask them to change the password from “My Account” after first sign-in.</p>
        </form>
      )}
    </div>
  );
}

function StaffModal({ staff, roles, modules, onClose, onSaved }) {
  const { user: me, perms } = useAuth();
  const toast = useToast();
  const isSelf = staff.id === me.id;
  const locked = staff.roleKey === 'admin' && !perms.isAdmin;
  const role = roles.find((r) => r.key === staff.roleKey);
  const base = staff.accessOverride?.enabled ? staff.accessOverride : { modules: role?.modules || [], editModules: role?.editModules || [] };
  const [override, setOverride] = useState(Boolean(staff.accessOverride?.enabled));
  const [mods, setMods] = useState(base.modules);
  const [edits, setEdits] = useState(base.editModules);
  const [busy, setBusy] = useState(false);
  const [cred, setCred] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function patch(body, msg) {
    setBusy(true);
    try {
      const u = await api.users.update(staff.id, body);
      onSaved(u);
      toast(msg);
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm(`Generate a new password for ${staff.name}? They will be signed out everywhere.`)) return;
    try {
      const r = await api.users.resetPassword(staff.id);
      setCred({ loginId: r.loginId, password: r.tempPassword });
    } catch (e) {
      toast(e.message);
    }
  }

  const toggleMod = (k) => {
    if (mods.includes(k)) { setMods(mods.filter((x) => x !== k)); setEdits(edits.filter((x) => x !== k)); } else setMods([...mods, k]);
  };
  const toggleEdit = (k) => setEdits(edits.includes(k) ? edits.filter((x) => x !== k) : [...edits, k]);

  return (
    <div id="staffModal" className="open" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sm-box">
        <div className="sm-hdr">
          <div><h3>{staff.name}</h3><p>ID {staff.loginId} · {staff.roleName} · {staff.designation}</p></div>
          <button type="button" className="sm-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sm-body">
          {locked && <div className="state" style={{ padding: 10 }}>Only an admin can change an admin account.</div>}
          {cred && <Credentials loginId={cred.loginId} password={cred.password} who={staff.name} />}
          <div className="fgrid">
            <Field label="Status">
              <select className="status-drop" value={staff.status} disabled={busy || locked || isSelf}
                onChange={(e) => patch({ status: e.target.value }, `✓ ${staff.name} is now ${e.target.value}.`)}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Role">
              <select className="role-sel" value={staff.roleKey} disabled={busy || locked || isSelf}
                onChange={(e) => window.confirm('Changing the role resets personal access and signs them out. Continue?')
                  && patch({ roleKey: e.target.value }, '✓ Role updated.')}>
                {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
            </Field>
          </div>
          {isSelf && <p className="form-note" style={{ marginTop: 0 }}>You can't change your own role or status.</p>}

          {staff.roleKey !== 'admin' && (
            <>
              <div className="ss" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Personal Access</span>
                <label style={{ fontSize: 12, fontWeight: 500, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={override} disabled={locked} onChange={(e) => setOverride(e.target.checked)} /> Override role defaults
                </label>
              </div>
              {!override && <p className="form-note" style={{ marginTop: 0, marginBottom: 8 }}>Using the {staff.roleName} role's access. Tick “Override” to customise for this person only.</p>}
              <div className="access-grid">
                {modules.map((m) => {
                  const on = mods.includes(m.key);
                  return (
                    <div key={m.key} className={`access-item ${on ? 'on' : ''}`} style={{ opacity: override ? 1 : 0.6 }}>
                      <input type="checkbox" id={`acc-${m.key}`} checked={on} disabled={!override} onChange={() => toggleMod(m.key)} />
                      <div style={{ flex: 1 }}>
                        <label htmlFor={`acc-${m.key}`}>{m.label}</label>
                        <div className="access-lvl">
                          {on ? (
                            <label style={{ fontSize: 11, fontWeight: 400, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                              <input type="checkbox" style={{ width: 12, height: 12 }} checked={edits.includes(m.key)} disabled={!override} onChange={() => toggleEdit(m.key)} /> can edit
                            </label>
                          ) : 'No access'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="form-row">
                <button type="button" className="btn-sm pri" disabled={busy || locked}
                  onClick={() => patch({ accessOverride: { enabled: override, modules: mods, editModules: edits } }, '✓ Access saved.')}>Save Access</button>
              </div>
            </>
          )}

          <div className="ss">Password</div>
          <button type="button" className="btn-sm" disabled={locked} onClick={reset}><Icon name="key" size={12} /> Reset Password</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffList() {
  useTrail([{ label: 'User Management', to: '/admin/users' }, { label: 'Staff' }]);
  const { can, perms, session } = useAuth();
  const canEdit = can('users', 'edit');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const dq = useDebounced(q);
  const list = useFetch(() => api.users.list({ q: dq }), [dq]);
  const roles = useFetch(() => api.roles.list(perms.isAdmin), [perms.isAdmin]);
  const items = list.data?.items || [];
  const roleItems = roles.data?.items || [];
  const open = items.find((u) => u.id === openId);

  return (
    <div className="marea">
      <Strip title="Staff" sub={`${items.length || '…'} staff accounts`} bg={STRIP.admin} />
      <BackButton to="/admin/users" label="User Management" />
      {canEdit && <AddStaff roles={roleItems} onCreated={list.reload} />}
      <div className="panel">
        <div className="ph"><h3>Staff Accounts</h3><AccessTag edit={canEdit} /></div>
        <SearchBox value={q} onChange={setQ} placeholder="Search by name or login ID…" />
        <div style={{ overflowX: 'auto', paddingTop: 4 }}>
          <table className="user-table">
            <thead><tr><th>Name</th><th>Login ID</th><th>Role</th><th>Status</th><th>Last Sign-in</th></tr></thead>
            <tbody>
              <TableState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} cols={5} empty={!items.length} emptyText="No staff found." />
              {items.map((u) => (
                <tr key={u.id} className={canEdit ? 'crow' : ''} onClick={canEdit ? () => setOpenId(u.id) : undefined}>
                  <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar text={initials(u.name)} bg="linear-gradient(135deg,#2563EB,#0891B2)" />
                    <div><span className="pname">{u.name}</span><br /><span className="psub">{u.designation}{u.accessOverride?.enabled && ' · custom access'}</span></div></div></td>
                  <td><code>{u.loginId}</code></td>
                  <td>{u.roleName || u.roleKey}</td>
                  <td><span className={u.status === 'active' ? 'stock-ok' : 'stock-out'}>{u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: 12 }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <StaffModal key={open.id + JSON.stringify(open.accessOverride) + open.roleKey} staff={open} roles={roleItems} modules={session.modules}
          onClose={() => setOpenId(null)}
          onSaved={(u) => list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === u.id ? u : x)) }))} />
      )}
    </div>
  );
}
