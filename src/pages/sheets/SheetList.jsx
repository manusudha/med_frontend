import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../lib/useFetch';
import { Strip, BackButton, AccessTag, TableState, Field, Avatar, useTrail } from '../../components/ui';
import PatientPicker from '../../components/PatientPicker';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { fmtYmd, initials, localYmd } from '../../lib/format';

function AdmitForm({ onDone }) {
  const { clinic } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const blank = { patient: null, therapy: '', admitDate: localYmd(), plannedDays: 7, concern: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!f.patient) return setErr('Select a patient.');
    if (!f.therapy) return setErr('Select a therapy course.');
    if (!(+f.plannedDays >= 1)) return setErr('Planned days must be at least 1.');
    setBusy(true);
    setErr('');
    try {
      await api.admissions.create({
        patientId: f.patient._id, therapy: f.therapy, admitDate: f.admitDate,
        plannedDays: Number(f.plannedDays), concern: f.concern || undefined,
      });
      toast(`✓ ${f.patient.name} admitted.`);
      setF(blank);
      setOpen(false);
      onDone();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel no-print">
      <div className="ph" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(!open)}>
        <h3>Admit Patient</h3>
        <button type="button" className="btn-main" style={{ padding: '8px 18px', fontSize: 13 }}>
          <Icon name={open ? 'back' : 'plus'} size={14} strokeWidth={2.5} /> {open ? 'Close' : 'New Admission'}
        </button>
      </div>
      {open && (
        <form className="pb" style={{ maxWidth: 700 }} onSubmit={submit}>
          <div className="fgrid full"><Field label="Patient *"><PatientPicker value={f.patient} onChange={(p) => setF({ ...f, patient: p })} /></Field></div>
          <div className="fgrid">
            <Field label="Therapy Course *">
              <select value={f.therapy} onChange={(e) => setF({ ...f, therapy: e.target.value })}>
                <option value="" disabled>Select therapy</option>
                {clinic.settings.therapies.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Admit Date *"><input type="date" value={f.admitDate} onChange={(e) => setF({ ...f, admitDate: e.target.value })} /></Field>
            <Field label="Planned Days *"><input type="number" min="1" max="365" value={f.plannedDays} onChange={(e) => setF({ ...f, plannedDays: e.target.value })} /></Field>
            <Field label="Concern"><input value={f.concern} placeholder="Defaults to the patient's primary concern" onChange={(e) => setF({ ...f, concern: e.target.value })} /></Field>
          </div>
          {err && <p className="err" style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <button className="btn-main" type="submit" disabled={busy}><Icon name="sheet" size={15} color="#fff" /> {busy ? 'Admitting…' : 'Admit Patient'}</button>
        </form>
      )}
    </div>
  );
}

export default function SheetList() {
  useTrail([{ label: 'Patient Sheet' }]);
  const { can } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const canEdit = can('sheets', 'edit');
  const [status, setStatus] = useState('admitted');
  const list = useFetch(() => api.admissions.list(status), [status]);
  const items = list.data?.items || [];

  async function discharge(a, e) {
    e.stopPropagation();
    if (!window.confirm(`Discharge ${a.patientName} today?`)) return;
    try {
      await api.admissions.discharge(a._id);
      toast(`✓ ${a.patientName} discharged.`);
      list.reload();
    } catch (ex) {
      toast(ex.message);
    }
  }

  return (
    <div className="marea">
      <Strip title="Patient Sheet" sub="Daily records for admitted patients — vitals, medicines, diet" bg={STRIP.sheet} />
      <BackButton to="/" label="Home" />
      {canEdit && <AdmitForm onDone={() => { setStatus('admitted'); list.reload(); }} />}
      <div className="panel">
        <div className="ph">
          <h3>{status === 'admitted' ? 'Admitted Patients' : 'Discharged Patients'}</h3>
          <div className="ph-r">
            <div className="chips">
              <button type="button" className={`chip ${status === 'admitted' ? 'on' : ''}`} onClick={() => setStatus('admitted')}>Admitted</button>
              <button type="button" className={`chip ${status === 'discharged' ? 'on' : ''}`} onClick={() => setStatus('discharged')}>Discharged</button>
            </div>
            <AccessTag edit={canEdit} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Therapy</th><th>Admitted</th><th>Progress</th>{canEdit && status === 'admitted' && <th />}</tr></thead>
            <tbody>
              <TableState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} cols={5}
                empty={!items.length} emptyText={status === 'admitted' ? 'No patients are admitted right now.' : 'No discharged patients yet.'} />
              {items.map((a) => (
                <tr key={a._id} className="crow" onClick={() => nav(`/sheets/${a._id}`)} title="Open daily sheets">
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Avatar text={initials(a.patientName)} />
                      <div><span className="pname">{a.patientName}</span><br /><span className="psub">{a.patientCode}{a.patientAge != null && ` · ${a.patientAge} yrs`}{a.patientGender && ` · ${a.patientGender}`}</span></div>
                    </div>
                  </td>
                  <td>{a.therapy}{a.concern && <><br /><span className="psub">{a.concern}</span></>}</td>
                  <td>{fmtYmd(a.admitDate)}{a.dischargeDate && <><br /><span className="psub">Discharged {fmtYmd(a.dischargeDate)}</span></>}</td>
                  <td><span className="badge active-b">Day {a.currentDay} of {a.plannedDays}</span></td>
                  {canEdit && status === 'admitted' && (
                    <td><button type="button" className="btn-sm danger" onClick={(e) => discharge(a, e)}>Discharge</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
