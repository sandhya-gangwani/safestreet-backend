import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { useAuthStore } from '../../store/useAuthStore';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface DashboardStats {
  departments: { label: string; count: number }[];
  slaTrend: { date: string; compliance: number }[];
  priority: { critical: number; high: number; standard: number };
  status: { pending: number; assigned: number; inProgress: number; resolved: number; closed: number };
}

export default function AdminDashboard() {
  const token = useAuthStore((state) => state.token);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/incidents/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Simple check to ensure the payload has what we expect
        if (response.data && response.data.departments) {
          setStats(response.data);
          setIsUsingMock(false);
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.warn('Failed to fetch real stats, falling back to mock dataset.', error);
        // Robust fallback mock dataset
        setStats({
          departments: [
            { label: 'Roads', count: 120 },
            { label: 'Water', count: 85 },
            { label: 'Electricity', count: 45 },
            { label: 'Sanitation', count: 60 },
            { label: 'General', count: 30 },
          ],
          slaTrend: [
            { date: 'Week 1', compliance: 92 },
            { date: 'Week 2', compliance: 88 },
            { date: 'Week 3', compliance: 95 },
            { date: 'Week 4', compliance: 90 },
          ],
          priority: { critical: 15, high: 45, standard: 200 },
          status: { pending: 40, assigned: 20, inProgress: 35, resolved: 150, closed: 200 },
        });
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-indigo-500 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // 1. Bar Chart: Volume by Department
  const departmentData = {
    labels: stats.departments.map(d => d.label),
    datasets: [
      {
        label: 'Incident Volume',
        data: stats.departments.map(d => d.count),
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo-500
        borderRadius: 4,
      },
    ],
  };

  // 2. Line Chart: Historical SLA Compliance Trend
  const slaData = {
    labels: stats.slaTrend.map(s => s.date),
    datasets: [
      {
        label: 'SLA Compliance (%)',
        data: stats.slaTrend.map(s => s.compliance),
        borderColor: '#10b981', // Emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // 3. Pie Chart: Urgency Composition (Priority)
  const priorityData = {
    labels: ['Critical', 'High', 'Standard'],
    datasets: [
      {
        data: [stats.priority.critical, stats.priority.high, stats.priority.standard],
        backgroundColor: ['#ef4444', '#f97316', '#3b82f6'], // Red, Orange, Blue
        borderWidth: 1,
      },
    ],
  };

  // 4. Doughnut Chart: Lifecycle Tracking (Status)
  const statusData = {
    labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [
          stats.status.pending,
          stats.status.assigned,
          stats.status.inProgress,
          stats.status.resolved,
          stats.status.closed,
        ],
        backgroundColor: ['#facc15', '#60a5fa', '#c084fc', '#4ade80', '#9ca3af'], // Yellow, Blue, Purple, Green, Gray
        borderWidth: 1,
      },
    ],
  };

  // Common options to force the chart to respect its container height
  const chartOptions = { responsive: true, maintainAspectRatio: false };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Analytics</h2>
          <p className="text-slate-500 mt-1 text-sm">System-wide overview of municipal incidents and resolution metrics.</p>
        </div>
        {isUsingMock && (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-200 shadow-sm">
            Using Mock Data
          </span>
        )}
      </div>

      {/* Grid Layout for Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 text-center">Volume by Department</h3>
          <div className="h-64 flex justify-center">
            <Bar data={departmentData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Chart 2: Line */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 text-center">Historical SLA Compliance Trend</h3>
          <div className="h-64 flex justify-center">
            <Line data={slaData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 text-center">Urgency Composition (Priority)</h3>
          <div className="h-64 flex justify-center">
            <Pie data={priorityData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 4: Doughnut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 text-center">Lifecycle Tracking (Status)</h3>
          <div className="h-64 flex justify-center">
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}
