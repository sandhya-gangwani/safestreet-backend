import React from 'react';
import IncidentForm from '../incidents/IncidentForm';

export default function CitizenDashboard() { 
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Citizen Dashboard</h2>
        <p className="text-gray-600">Welcome to your dashboard. You can report new incidents below.</p>
      </div>
      
      <IncidentForm />
    </div>
  ); 
}
