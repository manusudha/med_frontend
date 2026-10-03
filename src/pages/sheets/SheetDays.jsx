import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, Loading, ErrorState, Avatar, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { fmtYmd, initials } from '../../lib/format';

export default function SheetDays() {
  const { admissionId } = useParams();
  const nav = useNavigate();
  const r = useFetch(() => api.admissions.get(admissionId), [admissionId]);
  const a = r.data?.admission;
  useTrail([{ label: 'Patient Sheet', to: '/sheets' }, { label: a?.patientName || '…' }]);

  if (r.loading && !r.data) return <div className="panel"><Loading /></div>;
  if (r.error) return <div className="panel"><ErrorState error={r.error} onRetry={r.reload} /></div>;

  return (
    <div className="marea">
      <Strip title={`${a.patientName} — Patient Sheet`} sub={`${a.therapy} · Admitted ${fmtYmd(a.admitDate)} · ${a.plannedDays} days planned`} bg={STRIP.sheet} />
      <BackButton to="/sheets" label="Patient Sheet" />
      <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Avatar text={initials(a.patientName)} size={42} />
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 600, color: 'var(--txt)' }}>{a.patientName}</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)' }}>{a.patientCode}{a.patientAge != null && ` · ${a.patientAge} yrs`}{a.patientGender && ` · ${a.patientGender}`} · {a.therapy}{a.status === 'discharged' && ` · Discharged ${fmtYmd(a.dischargeDate)}`}</div>
        </div>
        {a.concern && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>Primary Concern</div>
            <div style={{ fontSize: 14, color: 'var(--txt)' }}>{a.concern}</div>
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--txt2)', margin: '14px 0' }}>Select a day to view or fill that day's patient record:</p>
      <div className="tiles-grid">
        {r.data.days.map((d, i) => {
          const look = d.isToday
            ? { bg: 'linear-gradient(135deg,#2563EB,#1D4ED8)', sh: 'rgba(37,99,235,.3)', badge: d.filled ? 'confirmed' : 'pending', label: d.filled ? '✓ Today — Filled' : 'Today — Fill Now' }
            : d.filled
              ? { bg: 'linear-gradient(135deg,#059669,#047857)', sh: 'rgba(5,150,105,.3)', badge: 'confirmed', label: '✓ Filled' }
              : d.isFuture
                ? { bg: 'linear-gradient(135deg,#64748B,#475569)', sh: 'rgba(69,90,100,.25)', badge: 'done', label: 'Upcoming' }
                : { bg: 'linear-gradient(135deg,#D97706,#B45309)', sh: 'rgba(217,119,6,.28)', badge: 'pending', label: 'Not filled' };
          return (
            <button type="button" key={d.dayNumber} className="tile" disabled={d.isFuture}
              style={{ animationDelay: `${Math.min(i, 20) * 0.04}s`, opacity: d.isFuture ? 0.6 : 1 }}
              onClick={() => nav(`/sheets/${admissionId}/day/${d.dayNumber}`)}>
              <div className="t-ico" style={{ background: look.bg, boxShadow: `0 5px 16px ${look.sh}` }}><Icon name="rx" size={20} color="#fff" /></div>
              <h3>Day {d.dayNumber}</h3>
              <p style={{ fontSize: 12, color: 'var(--txt2)' }}>{fmtYmd(d.date)}</p>
              <div style={{ marginTop: 8 }}><span className={`badge ${look.badge}`}>{look.label}</span></div>
              {!d.isFuture && <div className="t-arr"><Icon name="arr" size={13} strokeWidth={2.5} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
