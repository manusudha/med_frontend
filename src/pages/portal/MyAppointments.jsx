import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, Loading, ErrorState, Empty, StatusBadge, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { fmtTime, fmtYmd } from '../../lib/format';

function Item({ a }) {
  return (
    <div className="hist-item">
      <div className="hi-date">{fmtYmd(a.date)} · {a.time ? fmtTime(a.time) : 'Time to be confirmed'}</div>
      <div className="hi-title" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span>{a.therapy}</span><StatusBadge status={a.status} />
      </div>
      <div className="hi-note">{a.doctorName ? `With ${a.doctorName}` : 'Doctor to be assigned'}{a.concern && ` · ${a.concern}`}</div>
    </div>
  );
}

export default function MyAppointments() {
  useTrail([{ label: 'My Appointments' }]);
  const nav = useNavigate();
  const r = useFetch(() => api.portal.appointments(), []);
  const t = r.data?.today;
  const items = r.data?.items || [];
  const upcoming = items.filter((a) => a.date >= t && a.status !== 'cancelled' && a.status !== 'done').reverse();
  const past = items.filter((a) => !upcoming.includes(a));

  return (
    <div className="marea">
      <Strip title="My Appointments" sub="Your upcoming and past clinic visits" bg={STRIP.patient} />
      <BackButton to="/" label="Home" />
      {r.loading && !r.data && <div className="panel"><Loading /></div>}
      {r.error && <div className="panel"><ErrorState error={r.error} onRetry={r.reload} /></div>}
      {r.data && (
        <>
          <div className="panel">
            <div className="ph"><h3>Upcoming</h3>
              <button type="button" className="btn-sm pri" onClick={() => nav('/my/book')}><Icon name="plus" size={12} strokeWidth={2.5} /> Book a Visit</button>
            </div>
            <div className="pb">{upcoming.length ? upcoming.map((a) => <Item key={a._id} a={a} />) : <Empty title="No upcoming visits.">Use “Book a Visit” to request one.</Empty>}</div>
          </div>
          <div className="panel">
            <div className="ph"><h3>Past Visits</h3></div>
            <div className="pb">{past.length ? past.map((a) => <Item key={a._id} a={a} />) : <Empty title="No past visits yet." />}</div>
          </div>
        </>
      )}
    </div>
  );
}
