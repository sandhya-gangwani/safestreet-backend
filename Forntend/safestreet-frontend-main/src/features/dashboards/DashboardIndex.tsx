import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';

export default function DashboardIndex() {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
}
