import api from '../../api/api';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, Loading, ErrorState, Empty, useTrail } from '../../components/ui';
import { STRIP } from '../../lib/theme';
import { fmtYmd } from '../../lib/format';

export default function MyPrescriptions() {
  useTrail([{ label: 'My Prescriptions' }]);
  const r = useFetch(() => api.portal.prescriptions(), []);
  const items = r.data?.items || [];
  const active = items.filter((p) => p.active);
  const old = items.filter((p) => !p.active);

  const Rx = ({ p }) => (
    <div className={`rx-item ${p.active ? '' : 'stopped'}`}>
      <strong>{p.medicine}</strong>
      <span>{p.dosage}{p.duration && ` · ${p.duration}`}{p.purpose && <><br />For: {p.purpose}</>}<br />
        Prescribed {fmtYmd(p.prescribedDate)}{p.prescribedByName && ` by ${p.prescribedByName}`}{!p.active && ' · Stopped'}</span>
    </div>
  );

  return (
    <div className="marea">
      <Strip title="My Prescriptions" sub="Your current medicines and past prescriptions" bg={STRIP.rx} />
      <BackButton to="/" label="Home" />
      {r.loading && !r.data && <div className="panel"><Loading /></div>}
      {r.error && <div className="panel"><ErrorState error={r.error} onRetry={r.reload} /></div>}
      {r.data && (
        <>
          <div className="panel">
            <div className="ph"><h3>Current Medicines</h3></div>
            <div className="pb">{active.length ? active.map((p) => <Rx key={p._id} p={p} />) : <Empty title="No active prescriptions." />}</div>
          </div>
          {old.length > 0 && (
            <div className="panel">
              <div className="ph"><h3>Earlier Prescriptions</h3></div>
              <div className="pb">{old.map((p) => <Rx key={p._id} p={p} />)}</div>
            </div>
          )}
          <p className="form-note">Always follow your doctor's instructions. Contact the clinic before stopping or changing any medicine.</p>
        </>
      )}
    </div>
  );
}
