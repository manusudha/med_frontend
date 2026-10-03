import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../lib/useFetch';
import { Loading, ErrorState, Field } from './ui';
import { fmtTime, fmtYmd } from '../lib/format';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const COMPLIANCE = { yes: 'Yes', partial: 'Partial', no: 'No' };

export default function PatientModal({ patientId, onClose, onChanged }) {
  const { can } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const p = useFetch(() => api.patients.get(patientId), [patientId]);
  const canEditInfo = can('patients', 'edit') || can('users', 'edit');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const pt = p.data;

  return (
    <div id="patModal" className="open" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="pmName">
      <div className="pm-box">
        <div className="pm-hdr">
          <div>
            <h3 id="pmName">{pt ? pt.name : 'Patient'}</h3>
            <p>{pt ? `${pt.patientCode} · ${pt.age} yrs · ${pt.gender} · Blood Group: ${pt.bloodGroup || '—'}` : '—'}</p>
            {pt && (
              <div className="pm-tags">
                <span className="pm-tag">📞 {pt.phone}</span>
                <span className="pm-tag">🗓 {pt.visitCount} visits</span>
                <span className="pm-tag">{pt.status === 'active' ? '✅ Active' : '⚪ Inactive'}</span>
              </div>
            )}
          </div>
          <button type="button" className="pm-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="pm-tabs" role="tablist">
          {[['info', 'Patient Info'], ['visits', 'Visit History'], ['rx', 'Prescriptions'], ['sheet', 'Patient Sheet']].map(([k, l]) => (
            <button type="button" key={k} role="tab" aria-selected={tab === k} className={`pm-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="pm-body">
          {p.loading && !pt && <Loading />}
          {p.error && <ErrorState error={p.error} onRetry={p.reload} />}
          {pt && tab === 'info' && (editing
            ? <EditInfo pt={pt} onCancel={() => setEditing(false)}
                onSaved={(u) => { p.setData({ ...pt, ...u }); setEditing(false); toast('✓ Patient details saved.'); onChanged?.(); }} />
            : <Info pt={pt} canEdit={canEditInfo} onEdit={() => setEditing(true)} />)}
          {pt && tab === 'visits' && <Visits id={pt._id} />}
          {pt && tab === 'rx' && <Prescriptions pt={pt} canEdit={can('prescriptions', 'edit')} />}
          {pt && tab === 'sheet' && <Sheets id={pt._id} />}
        </div>
      </div>
    </div>
  );
}

function Info({ pt, canEdit, onEdit }) {
  const rows = [
    ['Full Name', pt.name], ['Patient ID', pt.patientCode], ['Age / Gender', `${pt.age} yrs · ${pt.gender}`],
    ['Blood Group', pt.bloodGroup || '—'], ['Phone', pt.phone], ['Address', pt.address || '—'],
    ['Registered On', fmtYmd(pt.createdAt?.slice(0, 10))], ['Primary Concern', pt.primaryConcern],
  ];
  return (
    <>
      {canEdit && <div className="pm-actions"><button type="button" className="btn-sm pri" onClick={onEdit}>✎ Edit Details</button></div>}
      <div className="igrid">
        {rows.map(([l, v]) => (
          <div className="ii" key={l}><label>{l}</label>
            <span style={l === 'Patient ID' ? { fontFamily: 'monospace', color: 'var(--blue)' } : undefined}>{v}</span></div>
        ))}
        <div className="ii full"><label>Known Allergies</label><span>{pt.allergies || 'None'}</span></div>
        <div className="ii"><label>Last Therapy</label><span>{pt.lastTherapy || '—'}</span></div>
        <div className="ii"><label>Last Visit</label><span>{fmtYmd(pt.lastVisitDate)}</span></div>
      </div>
    </>
  );
}

function EditInfo({ pt, onCancel, onSaved }) {
  const [f, setF] = useState({
    name: pt.name, phone: pt.phone, age: pt.age, gender: pt.gender, bloodGroup: pt.bloodGroup || '',
    address: pt.address || '', primaryConcern: pt.primaryConcern, allergies: pt.allergies || '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      onSaved(await api.patients.update(pt._id, { ...f, age: Number(f.age) }));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="fgrid">
        <Field label="Full Name"><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Age"><input type="number" min="0" max="130" value={f.age} onChange={set('age')} /></Field>
        <Field label="Gender"><select value={f.gender} onChange={set('gender')}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></Field>
        <Field label="Blood Group"><select value={f.bloodGroup} onChange={set('bloodGroup')}><option value="">Unknown</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Address"><input value={f.address} onChange={set('address')} /></Field>
      </div>
      <div className="fgrid full">
        <Field label="Primary Health Concern"><input value={f.primaryConcern} onChange={set('primaryConcern')} /></Field>
        <Field label="Known Allergies" error={err}><input value={f.allergies} onChange={set('allergies')} /></Field>
      </div>
      <div className="form-row">
        <button className="btn-main" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Details'}</button>
        <button type="button" className="btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Visits({ id }) {
  const v = useFetch(() => api.patients.visits(id), [id]);
  if (v.loading) return <Loading />;
  if (v.error) return <ErrorState error={v.error} onRetry={v.reload} />;
  if (!v.data.items.length) return <div className="state">No visits recorded yet.</div>;
  return v.data.items.map((a) => (
    <div className="hist-item" key={a._id}>
      <div className="hi-date">{fmtYmd(a.date)} · {fmtTime(a.time)} · {a.status[0].toUpperCase() + a.status.slice(1)}{a.doctorName && ` · ${a.doctorName}`}</div>
      <div className="hi-title">{a.therapy}</div>
      {(a.notes || a.concern) && <div className="hi-note">{a.notes || a.concern}</div>}
    </div>
  ));
}

function Prescriptions({ pt, canEdit }) {
  const toast = useToast();
  const r = useFetch(() => api.patients.prescriptions(pt._id), [pt._id]);
  const blank = { medicine: '', dosage: '', duration: '', purpose: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function add(e) {
    e.preventDefault();
    if (!f.medicine.trim()) return setErr('Enter the medicine name.');
    setBusy(true);
    setErr('');
    try {
      await api.prescriptions.create({ ...f, patientId: pt._id });
      setF(blank);
      toast('✓ Prescription added.');
      r.reload();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(rx) {
    try {
      await api.prescriptions.update(rx._id, { active: !rx.active });
      toast(rx.active ? 'Marked as stopped.' : 'Marked as active.');
      r.reload();
    } catch (ex) { toast(ex.message); }
  }

  return (
    <>
      {canEdit && (
        <form onSubmit={add} style={{ marginBottom: 16, padding: 14, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div className="fgrid">
            <Field label="Medicine *"><input value={f.medicine} onChange={set('medicine')} placeholder="e.g. Yogaraja Guggulu" /></Field>
            <Field label="Dosage"><input value={f.dosage} onChange={set('dosage')} placeholder="e.g. 2 tablets twice daily" /></Field>
            <Field label="Duration"><input value={f.duration} onChange={set('duration')} placeholder="e.g. 30 days / Ongoing" /></Field>
            <Field label="Purpose" error={err}><input value={f.purpose} onChange={set('purpose')} placeholder="e.g. Joint inflammation" /></Field>
          </div>
          <button className="btn-sm pri" type="submit" disabled={busy}>{busy ? 'Adding…' : '+ Add Prescription'}</button>
        </form>
      )}
      {r.loading && <Loading />}
      {r.error && <ErrorState error={r.error} onRetry={r.reload} />}
      {r.data && !r.data.items.length && <div className="state">No prescriptions yet.</div>}
      {r.data?.items.map((rx) => (
        <div className={`rx-item ${rx.active ? '' : 'stopped'}`} key={rx._id}>
          <strong>{rx.medicine}{!rx.active && ' (stopped)'}</strong>
          <span>
            {[rx.dosage, rx.duration, rx.purpose].filter(Boolean).join(' · ') || '—'}
            <span className="rx-foot">
              <em style={{ fontSize: 11, color: 'var(--teal2)' }}>Prescribed: {fmtYmd(rx.prescribedDate)}{rx.prescribedByName && ` · ${rx.prescribedByName}`}</em>
              {canEdit && <button type="button" className="btn-sm" onClick={() => toggle(rx)}>{rx.active ? 'Stop' : 'Resume'}</button>}
            </span>
          </span>
        </div>
      ))}
    </>
  );
}

function Sheets({ id }) {
  const s = useFetch(() => api.patients.sheets(id), [id]);
  if (s.loading) return <Loading />;
  if (s.error) return <ErrorState error={s.error} onRetry={s.reload} />;
  if (!s.data.items.length) return <div className="state">No daily sheets — the patient hasn't been admitted.</div>;
  return s.data.items.map((d) => {
    const v = d.vitals || {};
    const vit = [v.bp && `BP: ${v.bp}`, v.pulse && `Pulse: ${v.pulse}`, v.weight && `Weight: ${v.weight}`, v.temperature && `Temp: ${v.temperature}`, v.spo2 && `SpO2: ${v.spo2}`, v.painLevel && `Pain: ${v.painLevel}/10`].filter(Boolean).join(' · ');
    return (
      <div className="hist-item" key={d._id}>
        <div className="hi-date">{fmtYmd(d.date)} · Day {d.dayNumber}{d.filledByName && ` · ${d.filledByName}`}</div>
        <div className="hi-title">Vitals & Compliance</div>
        <div className="hi-note">
          {vit || 'No vitals recorded.'}
          {d.medicineCompliance && ` · Medicines: ${COMPLIANCE[d.medicineCompliance]}`}
          {d.dietCompliance && ` · Diet: ${COMPLIANCE[d.dietCompliance]}`}
          {d.doctorNotes && <><br />Doctor: {d.doctorNotes}</>}
        </div>
      </div>
    );
  });
}
