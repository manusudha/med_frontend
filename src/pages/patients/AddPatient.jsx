import { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Strip, BackButton, Field, Credentials, useTrail } from '../../components/ui';
import Icon from '../../components/Icon';
import { STRIP } from '../../lib/theme';

const BLANK = { name: '', phone: '', age: '', gender: '', bloodGroup: '', address: '', primaryConcern: '', allergies: '', initialTherapy: '' };

export default function AddPatient() {
  useTrail([{ label: 'Add Patient' }]);
  const { clinic } = useAuth();
  const toast = useToast();
  const [f, setF] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function check() {
    const e = {};
    if (!f.name.trim()) e.name = 'Enter the patient\'s full name.';
    if (!/^[+\d][\d\s-]{6,19}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
    if (f.age === '' || +f.age < 0 || +f.age > 130) e.age = 'Enter an age between 0 and 130.';
    if (!f.gender) e.gender = 'Select a gender.';
    if (!f.primaryConcern.trim()) e.primaryConcern = 'Describe what brings the patient here.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (!check()) return;
    setBusy(true);
    try {
      const r = await api.patients.create({ ...f, age: Number(f.age) });
      setCreated({ name: r.patient.name, ...r.login });
      setF(BLANK);
      toast(`✓ ${r.patient.name} registered as ${r.login.loginId}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ex) {
      setErrors({ form: ex.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marea">
      <Strip title="Add Patient" sub="Register a new patient — PT-XXXX ID auto-assigned" bg={STRIP.addPt} />
      <BackButton to="/" label="Home" />
      {created && <Credentials loginId={created.loginId} password={created.tempPassword} who={created.name} />}
      <div className="panel">
        <div className="ph">
          <h3>New Patient Registration</h3>
          <span style={{ fontSize: 12, background: 'var(--blue3)', color: 'var(--blue)', padding: '4px 12px', borderRadius: 50, fontWeight: 500 }}>PT-XXXX login ID auto-generated</span>
        </div>
        <form className="pb" style={{ maxWidth: 680 }} onSubmit={submit} noValidate>
          <div className="fgrid">
            <Field label="Full Name *" error={errors.name}><input value={f.name} onChange={set('name')} placeholder="Patient's full name" /></Field>
            <Field label="Phone Number *" error={errors.phone}><input type="tel" value={f.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="Age *" error={errors.age}><input type="number" min="0" max="130" value={f.age} onChange={set('age')} placeholder="Age in years" /></Field>
            <Field label="Gender *" error={errors.gender}>
              <select value={f.gender} onChange={set('gender')}>
                <option value="" disabled>Select gender</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="Blood Group">
              <select value={f.bloodGroup} onChange={set('bloodGroup')}>
                <option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Address"><input value={f.address} onChange={set('address')} placeholder="City / Area" /></Field>
          </div>
          <div className="fgrid full">
            <Field label="Primary Health Concern *" error={errors.primaryConcern}><input value={f.primaryConcern} onChange={set('primaryConcern')} placeholder="What brings the patient here?" /></Field>
          </div>
          <div className="fgrid">
            <Field label="Known Allergies"><input value={f.allergies} onChange={set('allergies')} placeholder="Any known allergies? Or 'None'" /></Field>
            <Field label="Initial Therapy">
              <select value={f.initialTherapy} onChange={set('initialTherapy')}>
                <option value="">Select therapy</option>
                {clinic.settings.therapies.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          {errors.form && <p className="err" style={{ color: 'var(--red)', fontSize: 13 }}>{errors.form}</p>}
          <button className="btn-main" type="submit" style={{ marginTop: 12 }} disabled={busy}>
            <Icon name="addPt" size={18} color="#fff" /> {busy ? 'Registering…' : 'Register Patient'}
          </button>
          <p className="form-note">The patient gets a PT-XXXX login to see their own appointments and prescriptions.</p>
        </form>
      </div>
    </div>
  );
}
