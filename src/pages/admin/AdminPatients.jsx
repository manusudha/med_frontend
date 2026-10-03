import { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch, { useDebounced } from '../../lib/useFetch';
import { Strip, BackButton, AccessTag, SearchBox, Pager, TableState, Credentials, useTrail } from '../../components/ui';
import PatientModal from '../../components/PatientModal';
import { STRIP } from '../../lib/theme';
import { fmtYmd } from '../../lib/format';

export default function AdminPatients() {
  useTrail([{ label: 'User Management', to: '/admin/users' }, { label: 'Patients' }]);
  const { can } = useAuth();
  const toast = useToast();
  const canEdit = can('users', 'edit');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openPt, setOpenPt] = useState(null);
  const [cred, setCred] = useState(null);
  const dq = useDebounced(q);
  const list = useFetch(() => api.patients.list({ q: dq, status, page }), [dq, status, page]);
  const items = list.data?.items || [];

  async function setPtStatus(p, value) {
    try {
      const u = await api.patients.update(p._id, { status: value });
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === p._id ? u : x)) }));
      toast(value === 'active' ? `✓ ${p.name}'s login is active.` : `${p.name}'s login is disabled.`);
    } catch (e) {
      toast(e.message);
    }
  }

  async function resetLogin(p) {
    if (!window.confirm(`Generate a new portal password for ${p.name}?`)) return;
    try {
      const r = await api.patients.resetPassword(p._id);
      setCred({ ...r, name: p.name });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast(e.message);
    }
  }

  return (
    <div className="marea">
      <Strip title="Patient Accounts" sub={`${list.data?.total ?? '…'} registered patients`} bg={STRIP.adminPt} />
      <BackButton to="/admin/users" label="User Management" />
      {cred && <Credentials loginId={cred.loginId} password={cred.tempPassword} who={cred.name} />}
      <div className="panel">
        <div className="ph">
          <h3>Patients</h3>
          <div className="ph-r">
            <div className="chips">
              {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([k, l]) => (
                <button key={k} type="button" className={`chip ${status === k ? 'on' : ''}`} onClick={() => { setStatus(k); setPage(1); }}>{l}</button>
              ))}
            </div>
            <AccessTag edit={canEdit} />
          </div>
        </div>
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, phone or PT- number…" />
        <div style={{ overflowX: 'auto', paddingTop: 4 }}>
          <table className="user-table">
            <thead><tr><th>Patient</th><th>Login ID</th><th>Registered</th><th>Status</th>{canEdit && <th />}</tr></thead>
            <tbody>
              <TableState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} cols={5} empty={!items.length} emptyText="No patients found." />
              {items.map((p) => (
                <tr key={p._id} className="crow" onClick={() => setOpenPt(p._id)}>
                  <td><span className="pname">{p.name}</span><br /><span className="psub">{p.age} yrs · {p.gender} · {p.phone}</span></td>
                  <td><code>{p.patientCode}</code></td>
                  <td style={{ fontSize: 13 }}>{p.createdAt ? fmtYmd(p.createdAt.slice(0, 10)) : '—'}</td>
                  <td onClick={(e) => canEdit && e.stopPropagation()}>
                    {canEdit ? (
                      <select className="status-drop" value={p.status || 'active'} onChange={(e) => setPtStatus(p, e.target.value)} aria-label="Account status">
                        <option value="active">Active</option><option value="inactive">Inactive</option>
                      </select>
                    ) : <span className={p.status === 'inactive' ? 'stock-out' : 'stock-ok'}>{p.status === 'inactive' ? 'Inactive' : 'Active'}</span>}
                  </td>
                  {canEdit && <td onClick={(e) => e.stopPropagation()}><button type="button" className="btn-sm" onClick={() => resetLogin(p)}>Reset Login</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.data?.page} pages={list.data?.pages} total={list.data?.total} onPage={setPage} />
      </div>
      {openPt && <PatientModal patientId={openPt} onClose={() => setOpenPt(null)} onChanged={list.reload} />}
    </div>
  );
}
