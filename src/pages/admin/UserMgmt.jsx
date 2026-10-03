import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Strip, BackButton, Tile, useTrail } from '../../components/ui';
import { GRAD, STRIP } from '../../lib/theme';

export default function UserMgmt() {
  useTrail([{ label: 'User Management' }]);
  const nav = useNavigate();
  const { perms } = useAuth();
  return (
    <div className="marea">
      <Strip title="User Management" sub="Staff accounts, patient logins and access rights" bg={STRIP.admin} />
      <BackButton to="/" label="Home" />
      <div className="tiles-grid">
        <Tile index={0} icon="users" title="Staff" desc="Add staff, change roles, set personal access and reset passwords." theme={GRAD.blue} onClick={() => nav('/admin/users/staff')} />
        <Tile index={1} icon="user" title="Patients" desc="Patient portal logins — activate, deactivate or reset passwords." theme={GRAD.teal} onClick={() => nav('/admin/users/patients')} />
        {perms.isAdmin && <Tile index={2} icon="modules" title="Role Management" desc="Which modules each role can see and edit." theme={GRAD.purple} onClick={() => nav('/admin/roles')} />}
      </div>
    </div>
  );
}
