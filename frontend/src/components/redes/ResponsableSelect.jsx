import { useEffect, useState } from 'react';
import { Select } from '../ui/FormField.jsx';
import { userService } from '../../services/userService';

/** Quién de TI administra la red o el dispositivo (usuario del sistema, no colaborador). */
export default function ResponsableSelect({ id, value, onChange, error }) {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    userService.list().then((res) => setUsers(res.data.users)).catch(() => setUsers([]));
  }, []);

  return (
    <Select id={id} value={value} error={error} disabled={!users} onChange={(e) => onChange(e.target.value)}>
      <option value="">Sin responsable asignado</option>
      {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
    </Select>
  );
}
