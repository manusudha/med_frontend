import { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch, { useDebounced } from '../../lib/useFetch';
import {
  Strip, BackButton, AccessTag, SearchBox, Pager, StatusBadge, TableState, useTrail,
} from '../../components/ui';
import Icon from '../../components/Icon';
import PatientModal from '../../components/PatientModal';
import BookAppointment from './BookAppointment';
import { STRIP } from '../../lib/theme';
import { fmtTime, fmtYmd } from '../../lib/format';

const CONF = {
  today: { title: "Today's Appointments", crumb: "Today's Appointments", bg: STRIP.today },
  upcoming: { title: 'Upcoming & Requests', crumb: 'Upcoming', bg: STRIP.today },
  past: { title: 'Older Appointments', crumb: 'Older Appointments', bg: STRIP.older },
};

export default function AppointmentList({ scope }) {
  const c = CONF[scope];
  useTrail([{ label: 'Appointments', to: '/appointments' }, { label: c.crumb }]);
  const { can } = useAuth();
  const toast = useToast();
  const canEdit = can('appointments', 'edit') && scope !== 'past';
  const canOpen = can('patients');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [openPt, setOpenPt] = useState(null);
  const dq = useDebounced(q);

  const list = useFetch(() => api.appointments.list({ scope, q: dq, page }), [scope, dq, page]);
  const stats = useFetch(() => (scope === 'today' ? api.appointments.stats() : Promise.resolve(null)), [scope]);
  const items = list.data?.items || [];

  async function update(a, body) {
    try {
      const updated = await api.appointments.update(a._id, body);
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === a._id ? updated : x)) }));
      if (body.status) toast(`Status updated to: ${body.status[0].toUpperCase()}${body.status.slice(1)}`);
      else toast('✓ Appointment updated.');
      if (scope === 'today') stats.reload();
    } catch (e) {
      toast(e.message);
    }
  }

  const sub = scope === 'today'
    ? `${list.data?.total ?? '…'} patients scheduled today`
    : scope === 'upcoming' ? 'Future bookings and requests from the patient portal' : 'Past appointment history — read only';
  const showDate = scope !== 'today';
  const cols = showDate ? 6 : 5;

  return (
    <div className="marea">
      <Strip title={c.title} sub={sub} bg={c.bg} />
      <BackButton to="/appointments" label="Appointments" />

      {canEdit && <BookAppointment scope={scope} onBooked={() => { list.reload(); stats.reload(); }} />}

      <div className="panel">
        <div className="ph">
          <h3>{scope === 'today' ? "Today's Schedule" : scope === 'upcoming' ? 'Upcoming' : 'Appointment History'}</h3>
          <div className="ph-r">
            <AccessTag edit={canEdit} editText="✎ Can Edit Status" />
            {list.data && <span style={{ fontSize: 12, background: 'var(--blue3)', color: 'var(--blue2)', padding: '4px 12px', borderRadius: 50, fontWeight: 600 }}>{list.data.total} {scope === 'today' ? 'patients' : 'records'}</span>}
          </div>
        </div>
        {scope !== 'today' && <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by patient name, ID or therapy…" icon="cal" />}
        <div style={{ overflowX: 'auto', paddingTop: scope !== 'today' ? 4 : 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Patient</th>{showDate && <th>Date</th>}<th>Time</th><th>Therapy</th><th>Doctor</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} cols={cols + 1}
                empty={!items.length} emptyText={scope === 'today' ? 'No appointments today.' : 'No appointments found.'} />
              {items.map((a) => (
                <tr key={a._id} className={canOpen ? 'crow' : ''} onClick={canOpen ? () => setOpenPt(a.patientId) : undefined}
                  title={canOpen ? 'Click to view patient details' : undefined}>
                  <td>
                    <span className="pname">{a.patientName}</span><br />
                    <span className="psub">{a.patientCode}{a.patientAge != null && ` · ${a.patientAge} yrs`}{a.source === 'patient' && ' · requested online'}</span>
                  </td>
                  {showDate && <td>{fmtYmd(a.date)}</td>}
                  <td onClick={(e) => canEdit && e.stopPropagation()}>
                    {canEdit
                      ? <input type="time" className="status-sel" defaultValue={a.time} aria-label="Time"
                          onBlur={(e) => e.target.value !== a.time && update(a, { time: e.target.value })} />
                      : fmtTime(a.time)}
                  </td>
                  <td>{a.therapy}{a.concern && <><br /><span className="psub">{a.concern}</span></>}</td>
                  <td style={{ fontSize: 13 }}>{a.doctorName || '—'}</td>
                  <td onClick={(e) => canEdit && e.stopPropagation()}>
                    <StatusBadge status={a.status} />
                    {canEdit && (
                      <select className="status-sel" value={a.status} aria-label="Change status"
                        onChange={(e) => update(a, { status: e.target.value })}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={list.data?.page} pages={list.data?.pages} total={list.data?.total} onPage={setPage} />
      </div>

      {scope === 'today' && stats.data && (
        <div className="stats-row">
          <div className="stc"><div className="stc-i"><Icon name="user" size={15} color="var(--blue)" /></div><div className="stc-l">Today</div><div className="stc-v">{stats.data.today}</div>
            <div className="stc-s">{stats.data.today - stats.data.yesterday >= 0 ? '↑' : '↓'} {Math.abs(stats.data.today - stats.data.yesterday)} from yesterday</div></div>
          <div className="stc"><div className="stc-i"><Icon name="cal" size={15} color="var(--teal)" /></div><div className="stc-l">This Week</div><div className="stc-v">{stats.data.week}</div><div className="stc-s">Mon – Today</div></div>
          <div className="stc"><div className="stc-i"><Icon name="user" size={15} color="var(--green)" /></div><div className="stc-l">Total Patients</div><div className="stc-v">{stats.data.totalPatients}</div><div className="stc-s">Registered</div></div>
          <div className="stc"><div className="stc-i"><Icon name="cal" size={15} color="var(--warn)" /></div><div className="stc-l">Pending</div><div className="stc-v">{stats.data.pendingToday}</div><div className="stc-s">Today</div></div>
        </div>
      )}

      {openPt && <PatientModal patientId={openPt} onClose={() => setOpenPt(null)} />}
    </div>
  );
}
