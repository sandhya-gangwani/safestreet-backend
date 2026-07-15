// src/layouts/DashboardLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Navigation Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
        <div className="font-bold text-xl tracking-wide">🛡️ SafeStreet Platform</div>
        <nav className="flex items-center space-x-4 text-sm">
          <Link to="/dashboard/admin" className="hover:underline">
            Admin
          </Link>
          <Link to="/dashboard/citizen" className="hover:underline">
            Citizen
          </Link>
          <Link to="/dashboard/worker" className="hover:underline">
            Worker
          </Link>
          <Link to="/dashboard/supervisor" className="hover:underline">
            Supervisor
          </Link>
          <span className="ml-4">Logged in as: {user?.role || 'Guest'}</span>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Dashboard Content Workspace */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <Outlet /> {/* Nested routes render here */}
      </main>
    </div>
  );
}
