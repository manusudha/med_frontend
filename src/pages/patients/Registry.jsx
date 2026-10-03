import { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import useFetch, { useDebounced } from '../../lib/useFetch';
import { Strip, BackButton, AccessTag, SearchBox, Pager, TableState, useTrail } from '../../components/ui';
import PatientModal from '../../components/PatientModal';
import { STRIP } from '../../lib/theme';
import { fmtYmd } from '../../lib/format';

export default function Registry() {
  useTrail([{ label: 'Patient Registry' }]);
  const { can } = useAuth();
  const canEdit = can('patients', 'edit');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const dq = useDebounced(q);
  const r = useFetch(() => api.patients.list({ q: dq, page }), [dq, page]);
  const items = r.data?.items || [];

  return (
    <div className="marea">
      <Strip title="Patient Registry" sub={canEdit ? 'Full edit access — click any row for complete details' : 'Read only access — click any row to view details'} bg={STRIP.registry} />
      <BackButton to="/" label="Home" />
      <div className="panel">
        <div className="ph"><h3>All Patients</h3><div className="ph-r"><AccessTag edit={canEdit} editText="✎ Full Edit Access" viewText="👁 Read Only" /></div></div>
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, phone or patient ID…" />
        <div style={{ overflowX: 'auto', paddingTop: 4 }}>
          <table className="tbl">
            <thead><tr><th>Patient ID</th><th>Name</th><th>Age / Gender</th><th>Phone</th><th>Last Therapy</th><th>Last Visit</th><th>Status</th></tr></thead>
            <tbody>
              <TableState loading={r.loading && !r.data} error={r.error} onRetry={r.reload} cols={7} empty={!items.length} emptyText="No patients found." />
              {items.map((p) => (
                <tr key={p._id} className="crow" onClick={() => setOpen(p._id)} title="Click to view patient details">
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue)' }}>{p.patientCode}</td>
                  <td><span className="pname">{p.name}</span></td>
                  <td>{p.age} yrs · {p.gender}</td>
                  <td>{p.phone}</td>
                  <td>{p.lastTherapy || '—'}</td>
                  <td>{fmtYmd(p.lastVisitDate)}</td>
                  <td><span className={`badge ${p.status === 'active' ? 'active-b' : 'done'}`}>{p.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={r.data?.page} pages={r.data?.pages} total={r.data?.total} onPage={setPage} />
      </div>
      {open && <PatientModal patientId={open} onClose={() => setOpen(null)} onChanged={r.reload} />}
    </div>
  );
}
