import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, AccessTag, Loading, ErrorState, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { fmtYmd } from '../../lib/format';

const VITALS = [
  ['bp', 'Blood Pressure', 'e.g. 120/80 mmHg'],
  ['pulse', 'Pulse Rate', 'e.g. 72 / min'],
  ['temperature', 'Temperature (°F)', 'e.g. 98.4 °F'],
  ['weight', 'Weight (kg)', 'e.g. 68 kg'],
  ['spo2', 'SpO2 (%)', 'e.g. 98%'],
  ['painLevel', 'Pain Level (1–10)', '1 = none, 10 = severe'],
];

const TIMETABLE = [
  ['wakeUp', '6:00 AM — Wake Up / Morning Routine', 'Activities on waking…'],
  ['morningMedication', '7:00 AM — Morning Medication', 'Medicines given, dosage…'],
  ['breakfast', '8:00 AM — Breakfast', 'Food given…'],
  ['morningTherapy', '10:00 AM — Morning Therapy', 'Therapy, duration, notes…'],
  ['preLunchMedication', '12:00 PM — Pre-Lunch Medication', 'Medicines…'],
  ['lunch', '1:00 PM — Lunch', 'Food given…'],
  ['afternoonRest', '3:00 PM — Afternoon Rest', 'Rest quality, observations…'],
  ['eveningSnack', '4:00 PM — Evening Snack', 'Snack given…'],
  ['eveningTherapy', '6:00 PM — Evening Therapy / Walk', 'Light exercise, therapy, walk…'],
  ['dinner', '7:00 PM — Dinner', 'Food given…'],
  ['nightMedication', '9:00 PM — Night Medication', 'Night medicines…'],
  ['sleepNotes', '10:00 PM — Sleep / Night Notes', 'Sleep quality, any night complaints…'],
];

const EMPTY = {
  vitals: Object.fromEntries(VITALS.map(([k]) => [k, ''])),
  timetable: Object.fromEntries(TIMETABLE.map(([k]) => [k, ''])),
  medicineCompliance: '', medicineNotes: '', dietCompliance: '', dietNotes: '',
  condition: '', doctorNotes: '', staffNotes: '',
};

function fromSheet(s) {
  if (!s) return EMPTY;
  return {
    vitals: { ...EMPTY.vitals, ...(s.vitals || {}) },
    timetable: { ...EMPTY.timetable, ...(s.timetable || {}) },
    medicineCompliance: s.medicineCompliance || '', medicineNotes: s.medicineNotes || '',
    dietCompliance: s.dietCompliance || '', dietNotes: s.dietNotes || '',
    condition: s.condition || '', doctorNotes: s.doctorNotes || '', staffNotes: s.staffNotes || '',
  };
}

export default function SheetForm() {
  const { admissionId, day } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const r = useFetch(() => api.admissions.getDay(admissionId, day), [admissionId, day]);
  const [f, setF] = useState(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const d = r.data;
  const a = d?.admission;
  const isFuture = d ? d.date > d.today : false;
  const canEdit = can('sheets', 'edit') && !isFuture;

  useTrail([
    { label: 'Patient Sheet', to: '/sheets' },
    { label: a?.patientName || '…', to: `/sheets/${admissionId}` },
    { label: `Day ${day}` },
  ]);

  useEffect(() => { if (d) { setF(fromSheet(d.sheet)); setDirty(false); } }, [d]);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const setGroup = (g, k) => (e) => { setF({ ...f, [g]: { ...f[g], [k]: e.target.value } }); setDirty(true); };
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDirty(true); };

  async function save() {
    setBusy(true);
    try {
      const sheet = await api.admissions.saveDay(admissionId, day, f);
      r.setData({ ...d, sheet });
      setDirty(false);
      toast(`✓ Day ${day} sheet saved.`);
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (r.loading && !d) return <div className="panel"><Loading /></div>;
  if (r.error) return <div className="panel"><ErrorState error={r.error} onRetry={r.reload} /></div>;

  const ro = !canEdit;
  const inp = (props) => <input type="text" readOnly={ro} {...props} />;

  return (
    <div className="marea">
      <Strip title={`Day ${day} — Patient Sheet`} sub={`${a.patientName} · ${fmtYmd(d.date)}`} bg={STRIP.sheet} />
      <BackButton to={`/sheets/${admissionId}`} label={a.patientName} />
      <div className="panel">
        <div className="ph">
          <div>
            <h3>{a.patientName} — Day {day}</h3>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>{fmtYmd(d.date)} · {a.therapy} · {a.patientCode}</div>
          </div>
          <AccessTag edit={canEdit} />
        </div>
        <div className="pb">
          {d.sheet && (
            <div className="cred" style={{ marginTop: 0 }}>
              ✓ This day was filled{d.sheet.filledByName ? ` by ${d.sheet.filledByName}` : ''}{d.sheet.updatedAt ? ` · last saved ${new Date(d.sheet.updatedAt).toLocaleString()}` : ''}.
            </div>
          )}
          {isFuture && <div className="state" style={{ padding: 12 }}>This day hasn't started yet — it can be filled on {fmtYmd(d.date)}.</div>}

          <div className="ss">🩺 Vitals</div>
          <div className="sform">
            {VITALS.map(([k, label, ph]) => (
              <div className="sf" key={k}><label htmlFor={`v-${k}`}>{label}</label>{inp({ id: `v-${k}`, value: f.vitals[k], onChange: setGroup('vitals', k), placeholder: ph })}</div>
            ))}
          </div>

          <div className="ss">🕐 Daily Timetable</div>
          <div className="sform">
            {TIMETABLE.map(([k, label, ph]) => (
              <div className="sf" key={k}><label htmlFor={`t-${k}`}>{label}</label>{inp({ id: `t-${k}`, value: f.timetable[k], onChange: setGroup('timetable', k), placeholder: ph })}</div>
            ))}
          </div>

          <div className="ss">💊 Medicine Compliance</div>
          <div className="sform">
            <div className="sf full"><label>All Medicines Taken As Prescribed?</label>
              <select value={f.medicineCompliance} onChange={set('medicineCompliance')} disabled={ro}>
                <option value="">— Select —</option>
                <option value="yes">Yes — all medicines taken as prescribed</option>
                <option value="partial">Partially — some missed</option>
                <option value="no">No — details in notes</option>
              </select>
            </div>
            <div className="sf full"><label>Medicine Notes</label><textarea readOnly={ro} value={f.medicineNotes} onChange={set('medicineNotes')} placeholder="Missed doses, side effects, complaints…" /></div>
          </div>

          <div className="ss">🥗 Diet Compliance</div>
          <div className="sform">
            <div className="sf full"><label>Diet Restrictions Followed?</label>
              <select value={f.dietCompliance} onChange={set('dietCompliance')} disabled={ro}>
                <option value="">— Select —</option>
                <option value="yes">Yes — fully followed the diet</option>
                <option value="partial">Partially followed</option>
                <option value="no">No — not followed</option>
              </select>
            </div>
            <div className="sf full"><label>Diet Notes</label><textarea readOnly={ro} value={f.dietNotes} onChange={set('dietNotes')} placeholder="Food preferences, refusals, appetite, digestion notes…" /></div>
          </div>

          <div className="ss">📋 Day Summary & Observations</div>
          <div className="sform">
            <div className="sf full"><label>Patient Overall Condition Today</label>
              <select value={f.condition} onChange={set('condition')} disabled={ro}>
                <option value="">— Select —</option>
                <option value="improving">Improving — better than yesterday</option>
                <option value="stable">Stable — no change</option>
                <option value="attention">Needs attention</option>
              </select>
            </div>
            <div className="sf full"><label>Doctor's Observations / Instructions</label><textarea readOnly={ro} value={f.doctorNotes} onChange={set('doctorNotes')} placeholder="Doctor's notes, treatment changes, next day plan…" /></div>
            <div className="sf full"><label>Staff / Nurse Notes</label><textarea readOnly={ro} value={f.staffNotes} onChange={set('staffNotes')} placeholder="Behaviour, family visits, sleep, any other notes…" /></div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {canEdit && (
              <button type="button" className="btn-main" onClick={save} disabled={busy}>
                <Icon name="save" size={15} color="#fff" /> {busy ? 'Saving…' : `Save Day ${day} Sheet`}
              </button>
            )}
            <button type="button" className="btn-sm" style={{ padding: '10px 18px' }} onClick={() => window.print()}>
              <Icon name="print" size={14} /> Print
            </button>
            {dirty && <span style={{ fontSize: 12, color: 'var(--warn)', alignSelf: 'center' }}>Unsaved changes</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
