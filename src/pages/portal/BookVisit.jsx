import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Strip, BackButton, Field, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';
import { localYmd } from '../../lib/format';

export default function BookVisit() {
  useTrail([{ label: 'Book a Visit' }]);
  const { clinic } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState({ date: localYmd(new Date(Date.now() + 86400000)), therapy: '', concern: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const max = localYmd(new Date(Date.now() + 180 * 86400000));

  async function submit(e) {
    e.preventDefault();
    if (!f.date) return setErr('Pick a date.');
    if (!f.therapy) return setErr('Select what the visit is for.');
    setBusy(true);
    setErr('');
    try {
      await api.portal.requestAppointment(f);
      toast('✓ Request sent. The clinic will confirm your time.');
      nav('/my/appointments');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marea">
      <Strip title="Book a Visit" sub={`Request an appointment at ${clinic.name}`} bg={STRIP.book} />
      <BackButton to="/" label="Home" />
      <div className="panel">
        <div className="ph"><h3>Request an Appointment</h3></div>
        <form className="pb" style={{ maxWidth: 600 }} onSubmit={submit}>
          <div className="fgrid">
            <Field label="Preferred Date *"><input type="date" min={localYmd()} max={max} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Visit For *">
              <select value={f.therapy} onChange={(e) => setF({ ...f, therapy: e.target.value })}>
                <option value="" disabled>Select</option>
                {clinic.settings.therapies.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="fgrid full">
            <Field label="Anything the doctor should know?" error={err}>
              <textarea value={f.concern} maxLength={300} onChange={(e) => setF({ ...f, concern: e.target.value })} placeholder="Symptoms, questions… (optional)" />
            </Field>
          </div>
          <button className="btn-main" type="submit" disabled={busy}><Icon name="cal" size={15} color="#fff" /> {busy ? 'Sending…' : 'Send Request'}</button>
          <p className="form-note">Your request shows as “Pending” until the clinic confirms a time.{clinic.phone && ` For urgent help call ${clinic.phone}.`}</p>
        </form>
      </div>
    </div>
  );
}
