import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storage } from '../api/api';
import Icon from '../components/Icon';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Automate Era';

export default function Login() {
  const { session, login } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const location = useLocation();
  const [clinicCode, setClinicCode] = useState(params.get('clinic') || storage.getClinicCode());
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState('');
  const idRef = useRef();

  useEffect(() => { idRef.current?.focus(); }, []);

  if (session) return <Navigate to={location.state?.from || '/'} replace />;

  const flag = (field, msg) => {
    setError(msg);
    setShake(field);
    setTimeout(() => setShake(''), 400);
  };

  async function submit(e) {
    e.preventDefault();
    if (!clinicCode.trim()) return flag('clinic', 'Enter your clinic code.');
    if (!loginId.trim()) return flag('id', 'Enter your User ID.');
    if (!password) return flag('pass', 'Enter your password.');
    setBusy(true);
    setError('');
    try {
      await login(clinicCode.trim().toLowerCase(), loginId.trim(), password);
      nav(location.state?.from || '/', { replace: true });
    } catch (err) {
      flag('pass', err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  const sh = (f) => (shake === f ? { animation: 'shake .35s ease' } : undefined);

  return (
    <div id="page-login" className="page active">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="login-brand">
          <div className="lb-logo"><Icon name="shield" strokeWidth={2.2} /></div>
          <h1>{APP_NAME}</h1>
          <p>Clinic Management Portal</p>
        </div>
        <div className="lf">
          <label htmlFor="clinicCode">Clinic Code</label>
          <input id="clinicCode" type="text" value={clinicCode} onChange={(e) => setClinicCode(e.target.value)}
            placeholder="Given by your clinic, e.g. metkari" autoCapitalize="off" autoCorrect="off" spellCheck="false"
            autoComplete="organization" style={sh('clinic')} />
        </div>
        <div className="lf">
          <label htmlFor="loginId">User ID</label>
          <input id="loginId" ref={idRef} type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)}
            placeholder="Enter your User ID" autoComplete="username" autoCapitalize="off" autoCorrect="off"
            spellCheck="false" style={sh('id')} />
        </div>
        <div className="lf">
          <label htmlFor="loginPass">Password</label>
          <input id="loginPass" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password" autoComplete="current-password" style={sh('pass')} />
        </div>
        <div className="login-err" role="alert">{error}</div>
        <button className="btn-login" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        <div className="login-hint">Patients: use your PT- number as User ID.</div>
        <div className="login-footer">Powered by <strong>{APP_NAME}</strong></div>
      </form>
    </div>
  );
}
