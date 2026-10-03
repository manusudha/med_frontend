import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, Loading, ErrorState, Field, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';

const BADGE = { doctor: 'rb-doctor', receptionist: 'rb-staff', nurse: 'rb-nurse', admin: 'rb-doctor' };

function RoleModal({ role, modules, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(role?.name || '');
  const [mods, setMods] = useState(role?.modules || []);
  const [edits, setEdits] = useState(role?.editModules || []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (k) => {
    if (mods.includes(k)) { setMods(mods.filter((x) => x !== k)); setEdits(edits.filter((x) => x !== k)); } else setMods([...mods, k]);
  };
  const toggleEdit = (k) => {
    if (!mods.includes(k)) return;
    setEdits(edits.includes(k) ? edits.filter((x) => x !== k) : [...edits, k]);
  };

  async function save() {
    if (!name.trim()) return setErr('Enter a role name.');
    setBusy(true);
    setErr('');
    try {
      const body = { name: name.trim(), modules: mods, editModules: edits };
      if (role) await api.roles.update(role._id, body); else await api.roles.create(body);
      toast(role ? `✓ ${name} updated. Staff get the change on their next action.` : `✓ Role ${name} created.`);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="roleModal" className="open" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rm-box">
        <div className="rm-hdr">
          <div><h3>{role ? `Edit ${role.name}` : 'New Role'}</h3><p>Choose which modules this role can see and edit</p></div>
          <button type="button" className="rm-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="rm-body">
          <Field label="Role Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lab Technician" /></Field>
          <div className="perm-toggle-grid">
            {modules.map((m) => {
              const on = mods.includes(m.key);
              const ed = edits.includes(m.key);
              return (
                <div key={m.key} className={`perm-toggle-item ${on ? 'on' : ''}`}>
                  <div>
                    <div className="pti-label">{m.label}</div>
                    <div className="pti-sub">
                      {on ? (
                        <button type="button" onClick={() => toggleEdit(m.key)} style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: ed ? 'var(--green2)' : '#D97706', cursor: 'pointer', textDecoration: 'underline' }}>
                          {ed ? '✎ Can edit' : '👁 View only'}
                        </button>
                      ) : 'No access'}
                    </div>
                  </div>
                  <button type="button" className={`tog ${on ? 'on' : 'off'}`} onClick={() => toggle(m.key)} aria-pressed={on} aria-label={`Access to ${m.label}`} />
                </div>
              );
            })}
          </div>
          <p className="form-note">Tap “View only / Can edit” to switch the level for a module.</p>
          {err && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{err}</p>}
          <div className="form-row">
            <button type="button" className="btn-main" onClick={save} disabled={busy}><Icon name="save" size={15} color="#fff" /> {busy ? 'Saving…' : 'Save Role'}</button>
            <button type="button" className="btn-sm" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoleMgmt() {
  useTrail([{ label: 'Role Management' }]);
  const { session } = useAuth();
  const toast = useToast();
  const modules = session.modules;
  const label = Object.fromEntries(modules.map((m) => [m.key, m.label]));
  const list = useFetch(() => api.roles.list(true), []);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new role

  async function remove(r) {
    if (!window.confirm(`Delete the role “${r.name}”?`)) return;
    try {
      await api.roles.remove(r._id);
      toast(`Role ${r.name} deleted.`);
      list.reload();
    } catch (e) {
      toast(e.message);
    }
  }

  return (
    <div className="marea">
      <Strip title="Role Management" sub="Module permissions and edit rights for each role" bg={STRIP.modules} />
      <BackButton to="/" label="Home" />
      <div className="panel">
        <div className="ph">
          <h3>Roles</h3>
          <button type="button" className="btn-main" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setEditing(null)}>
            <Icon name="plus" size={14} strokeWidth={2.5} /> New Role
          </button>
        </div>
        <div className="pb">
          {list.loading && !list.data && <Loading />}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {list.data?.items.map((r) => (
            <div className="role-card" key={r._id}>
              <div className="role-card-hdr">
                <div>
                  <div className="role-name">{r.name}</div>
                  <div className="psub">{r.userCount} staff {r.userCount === 1 ? 'member' : 'members'}</div>
                </div>
                <span className={`role-badge ${BADGE[r.key] || 'rb-custom'}`}>{r.kind === 'admin' ? 'Full access' : r.system ? 'Built-in' : 'Custom'}</span>
              </div>
              <div className="role-perms">
                {r.modules.length === 0 && <span className="psub">No modules yet</span>}
                {r.modules.map((k) => (
                  <span key={k} className={`perm-chip ${r.editModules.includes(k) ? 'edit-chip' : ''}`}>
                    {r.editModules.includes(k) ? '✎' : '👁'} {label[k] || k}
                  </span>
                ))}
              </div>
              {r.kind !== 'admin' && (
                <div className="role-actions">
                  <button type="button" className="btn-role-edit" onClick={() => setEditing(r)}>Edit Permissions</button>
                  {!r.system && <button type="button" className="btn-role-del" onClick={() => remove(r)}>Delete</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {editing !== undefined && (
        <RoleModal role={editing} modules={modules} onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); list.reload(); }} />
      )}
    </div>
  );
}
