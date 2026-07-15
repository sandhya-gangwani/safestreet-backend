import React from 'react';
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
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

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
  LineElement
);

// 1. Bar Chart: Incidents by Department
const IncidentsByDepartmentChart = () => {
  const data = {
    labels: ['Roads', 'Water', 'Electricity', 'Sanitation', 'General'],
    datasets: [
      {
        label: 'Incidents',
        data: [120, 85, 45, 60, 30],
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
      },
    ],
  };
  const options = { responsive: true, plugins: { legend: { display: false } } };
  return <Bar data={data} options={options} />;
};

// 2. Doughnut Chart: Incidents by Status
const IncidentsByStatusChart = () => {
  const data = {
    labels: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [40, 20, 35, 150, 200],
        backgroundColor: [
          '#facc15', // yellow-400
          '#60a5fa', // blue-400
          '#c084fc', // purple-400
          '#4ade80', // green-400
          '#9ca3af', // gray-400
        ],
        borderWidth: 1,
      },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: false };
  return <Doughnut data={data} options={options} />;
};

// 3. Line Chart: SLA Breaches over 30 Days
const SlaBreachesChart = () => {
  const data = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'SLA Breaches',
        data: [5, 12, 8, 3],
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3, // smooth curves
        fill: true,
      },
    ],
  };
  const options = { responsive: true };
  return <Line data={data} options={options} />;
};

// 4. Pie Chart: Incidents by Priority
const IncidentsByPriorityChart = () => {
  const data = {
    labels: ['Critical', 'High', 'Standard'],
    datasets: [
      {
        data: [15, 45, 200],
        backgroundColor: [
          '#ef4444', // red-500
          '#f97316', // orange-500
          '#3b82f6', // blue-500
        ],
        borderWidth: 1,
      },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: false };
  return <Pie data={data} options={options} />;
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">System-wide overview of municipal incidents and resolution metrics.</p>
        </div>
      </div>

      {/* Grid Layout for Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart Card 1: Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Incidents by Department</h3>
          <div className="h-64 flex justify-center">
            <IncidentsByDepartmentChart />
          </div>
        </div>

        {/* Chart Card 2: Doughnut */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Incidents by Status</h3>
          <div className="h-64 flex justify-center">
            <IncidentsByStatusChart />
          </div>
        </div>

        {/* Chart Card 3: Line */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">SLA Breaches over 30 Days</h3>
          <div className="h-64 flex justify-center">
            <SlaBreachesChart />
          </div>
        </div>

        {/* Chart Card 4: Pie */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Incidents by Priority</h3>
          <div className="h-64 flex justify-center">
            <IncidentsByPriorityChart />
          </div>
        </div>

      </div>
    </div>
  );
}
