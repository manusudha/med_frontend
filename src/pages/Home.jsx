import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tile } from '../components/ui';
import { GRAD } from '../lib/theme';
import { fmtLongDate, greeting } from '../lib/format';

const shortName = (name) => {
  const p = name.trim().split(/\s+/);
  return /^dr\.?$/i.test(p[0]) && p[1] ? `${p[0]} ${p[1]}` : p[0];
};

export default function Home() {
  const { user, clinic, perms, can } = useAuth();
  const nav = useNavigate();
  const now = new Date();
  const edit = (m) => can(m, 'edit');

  let tiles = [];
  if (perms.isPatient) {
    tiles = [
      { icon: 'cal', title: 'My Appointments', desc: 'View your upcoming and past clinic visits.', to: '/my/appointments', theme: GRAD.purple },
      { icon: 'rx', title: 'My Prescriptions', desc: 'View your current prescriptions and medicines.', to: '/my/prescriptions', theme: GRAD.teal },
      { icon: 'addPt', title: 'Book a Visit', desc: 'Request your next appointment.', to: '/my/book', theme: GRAD.green },
    ];
  } else {
    const all = [
      can('sheets') && { icon: 'sheet', title: 'Patient Sheet', desc: 'Daily records for admitted patients — vitals, medicines, diet.', to: '/sheets', theme: GRAD.purple, order: perms.roleKey === 'nurse' ? 0 : 4 },
      can('appointments') && { icon: 'cal', title: 'Appointments', desc: edit('appointments') ? "Today's schedule, bookings and full appointment history." : "View today's schedule and older appointments.", to: '/appointments', theme: GRAD.blue, order: 1 },
      can('patients') && { icon: 'users', title: 'Patient Registry', desc: edit('patients') ? 'Search, view and manage all patient records.' : 'Search and view patient records (read only).', to: '/patients', theme: GRAD.teal, order: 2 },
      edit('addPatient') && { icon: 'addPt', title: 'Add Patient', desc: 'Register a new patient — PT-XXXX login auto-assigned.', to: '/patients/new', theme: GRAD.green, order: 3 },
      can('stock') && { icon: 'stock', title: 'Medicines & Supplies', desc: 'Track medicines, herbs, oils and supplies.', to: '/stock', theme: GRAD.green, order: 5 },
      can('users') && { icon: 'manage', title: 'User Management', desc: 'Manage staff & patients — access rights, roles and account status.', to: '/admin/users', theme: GRAD.blue, order: perms.isAdmin ? -3 : 6 },
      perms.isAdmin && { icon: 'modules', title: 'Role Management', desc: 'Create roles, set module permissions and edit rights for each role.', to: '/admin/roles', theme: GRAD.teal, order: -2 },
      perms.isAdmin && { icon: 'settings', title: 'Clinic Settings', desc: 'Clinic name, location and the therapies you offer.', to: '/admin/settings', theme: GRAD.slate, order: 9 },
    ];
    tiles = all.filter(Boolean).sort((a, b) => a.order - b.order);
  }

  return (
    <>
      <div className="tiles-hdr">
        <h2>{greeting(now)}, {shortName(user.name)} 👋</h2>
        <p>{fmtLongDate(now)} &nbsp;·&nbsp; {clinic.name}</p>
      </div>
      {tiles.length === 0 ? (
        <div className="panel"><div className="state"><strong>No modules assigned yet.</strong>Ask your clinic admin to give your role access.</div></div>
      ) : (
        <div className="tiles-grid">
          {tiles.map((t, i) => <Tile key={t.to} {...t} index={i} onClick={() => nav(t.to)} />)}
        </div>
      )}
    </>
  );
}
