import { useNavigate } from 'react-router-dom';
import { Strip, BackButton, Tile, useTrail } from '../../components/ui';
import { GRAD, STRIP } from '../../lib/theme';
import useFetch from '../../lib/useFetch';
import api from '../../api/api';

export default function AppointmentsHub() {
  useTrail([{ label: 'Appointments' }]);
  const nav = useNavigate();
  const { data: stats } = useFetch(() => api.appointments.stats(), []);
  const tiles = [
    { icon: 'cal', title: "Today's Appointments", desc: 'Scheduled patients for today — status and therapy.', to: '/appointments/today', theme: GRAD.blue },
    { icon: 'addPt', title: 'Upcoming & Requests', desc: stats?.upcomingRequests ? `${stats.upcomingRequests} visit request(s) from patients waiting for confirmation.` : 'Future bookings and visit requests from patients.', to: '/appointments/upcoming', theme: GRAD.navy },
    { icon: 'rx', title: 'Older Appointments', desc: 'Browse and search past appointment history.', to: '/appointments/history', theme: GRAD.deep },
  ];
  return (
    <div className="marea">
      <Strip title="Appointments" sub="Select to view appointments" bg={STRIP.appointments} />
      <BackButton to="/" label="Home" />
      <div className="tiles-grid" style={{ maxWidth: 780 }}>
        {tiles.map((t, i) => <Tile key={t.to} {...t} index={i} onClick={() => nav(t.to)} />)}
      </div>
    </div>
  );
}
