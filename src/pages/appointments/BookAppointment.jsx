import { useEffect, useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PatientPicker from '../../components/PatientPicker';
import { Field } from '../../components/ui';
import Icon from '../../components/Icon';
import { localYmd } from '../../lib/format';

export default function BookAppointment({ scope, onBooked }) {
  const { clinic, user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const tomorrow = localYmd(new Date(Date.now() + 86400000));
  const blank = { patient: null, date: scope === 'upcoming' ? tomorrow : localYmd(), time: '', therapy: '', doctorId: '', notes: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || doctors.length) return;
    api.users.doctors().then((r) => {
      setDoctors(r.items);
      if (r.items.some((d) => d.id === user.id)) setF((x) => ({ ...x, doctorId: user.id }));
    }).catch(() => {});
  }, [open, doctors.length, user.id]);

  async function submit(e) {
    e.preventDefault();
    if (!f.patient) return setErr('Select a patient.');
    if (!f.date) return setErr('Pick a date.');
    if (!f.therapy) return setErr('Select a therapy.');
    setBusy(true);
    setErr('');
    try {
      await api.appointments.create({
        patientId: f.patient._id, date: f.date, time: f.time, therapy: f.therapy,
        doctorId: f.doctorId || undefined, notes: f.notes,
      });
      toast(`✓ Appointment booked for ${f.patient.name}.`);
      setF({ ...blank, doctorId: f.doctorId });
      onBooked();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel no-print">
      <div className="ph" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(!open)}>
        <h3>Book Appointment</h3>
        <button type="button" className="btn-main" style={{ padding: '8px 18px', fontSize: 13 }}>
          <Icon name={open ? 'back' : 'plus'} size={14} strokeWidth={2.5} /> {open ? 'Close' : 'New Booking'}
        </button>
      </div>
      {open && (
        <form className="pb" style={{ maxWidth: 700, animation: 'slideRight .28s ease both' }} onSubmit={submit}>
          <div className="fgrid full"><Field label="Patient *"><PatientPicker value={f.patient} onChange={(p) => setF({ ...f, patient: p })} /></Field></div>
          <div className="fgrid">
            <Field label="Date *"><input type="date" value={f.date} min={localYmd()} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
            <Field label="Therapy *">
              <select value={f.therapy} onChange={(e) => setF({ ...f, therapy: e.target.value })}>
                <option value="" disabled>Select therapy</option>
                {clinic.settings.therapies.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Doctor">
              <select value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>
                <option value="">Not assigned</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="fgrid full"><Field label="Notes" error={err}><input type="text" value={f.notes} placeholder="Optional" onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field></div>
          <button className="btn-main" type="submit" disabled={busy}><Icon name="cal" size={15} color="#fff" /> {busy ? 'Booking…' : 'Book Appointment'}</button>
        </form>
      )}
    </div>
  );
}
