import { Navigate, Route, Routes } from 'react-router-dom';
import Layout, { Guard } from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Account from './pages/Account';
import AppointmentsHub from './pages/appointments/AppointmentsHub';
import AppointmentList from './pages/appointments/AppointmentList';
import Registry from './pages/patients/Registry';
import AddPatient from './pages/patients/AddPatient';
import SheetList from './pages/sheets/SheetList';
import SheetDays from './pages/sheets/SheetDays';
import SheetForm from './pages/sheets/SheetForm';
import Stock from './pages/Stock';
import MyAppointments from './pages/portal/MyAppointments';
import MyPrescriptions from './pages/portal/MyPrescriptions';
import BookVisit from './pages/portal/BookVisit';
import UserMgmt from './pages/admin/UserMgmt';
import StaffList from './pages/admin/StaffList';
import AdminPatients from './pages/admin/AdminPatients';
import RoleMgmt from './pages/admin/RoleMgmt';
import ClinicSettings from './pages/admin/ClinicSettings';

const g = (module, el) => <Guard module={module}>{el}</Guard>;
const k = (kind, el) => <Guard kind={kind}>{el}</Guard>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="account" element={<Account />} />

        <Route path="appointments" element={g('appointments', <AppointmentsHub />)} />
        <Route path="appointments/today" element={g('appointments', <AppointmentList scope="today" />)} />
        <Route path="appointments/upcoming" element={g('appointments', <AppointmentList scope="upcoming" />)} />
        <Route path="appointments/history" element={g('appointments', <AppointmentList scope="past" />)} />

        <Route path="patients" element={g('patients', <Registry />)} />
        <Route path="patients/new" element={g('addPatient', <AddPatient />)} />

        <Route path="sheets" element={g('sheets', <SheetList />)} />
        <Route path="sheets/:admissionId" element={g('sheets', <SheetDays />)} />
        <Route path="sheets/:admissionId/day/:day" element={g('sheets', <SheetForm />)} />

        <Route path="stock" element={g('stock', <Stock />)} />

        <Route path="my/appointments" element={k('patient', <MyAppointments />)} />
        <Route path="my/prescriptions" element={k('patient', <MyPrescriptions />)} />
        <Route path="my/book" element={k('patient', <BookVisit />)} />

        <Route path="admin/users" element={g('users', <UserMgmt />)} />
        <Route path="admin/users/staff" element={g('users', <StaffList />)} />
        <Route path="admin/users/patients" element={g('users', <AdminPatients />)} />
        <Route path="admin/roles" element={k('admin', <RoleMgmt />)} />
        <Route path="admin/settings" element={k('admin', <ClinicSettings />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
