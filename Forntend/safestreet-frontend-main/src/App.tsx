import { useState, useEffect } from 'react';
import axios from 'axios';
import { IncidentMap } from './components/IncidentMap';

function ReportIncidentPage() {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('road_damage');
  const [priority, setPriority] = useState('standard');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // AI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRationale, setAiRationale] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');

  // State to store raw incidents fetched from the database
  const [incidents, setIncidents] = useState<any[]>([]);

  // Filter states for map visualization
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // State to track which pin is currently clicked/open in the sliding drawer
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  // Fetch incidents from NestJS backend on load
  const fetchIncidents = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/incidents');
      // Defensively ensure we only save arrays
      if (Array.isArray(response.data)) {
        setIncidents(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setIncidents(response.data.data);
      } else {
        setIncidents([]);
      }
    } catch (err) {
      console.error("Could not load existing database pins:", err);
      setIncidents([]); // Fallback to empty array on network failure
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
  };

  // Trigger AI Endpoint to auto-fill classifications
  const handleAiClassify = async () => {
    if (!title || !description) {
      alert("Please fill out both the Title and Description first so the AI has enough information to analyze!");
      return;
    }
    if (!selectedCoords) {
      alert("Please lock in a location on the map first so the AI can evaluate the route!");
      return;
    }

    setIsAnalyzing(true);
    setAiRationale('');
    setAssignedDepartment('');

    try {
      const response = await axios.post('http://localhost:3000/api/ai/classify', {
        title,
        description,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
      });

      const { category: aiCat, priority: aiPri, rationale, department } = response.data;

      // Automatically auto-fill the form
      setCategory(aiCat || 'other');
      setPriority(aiPri || 'standard');
      setAiRationale(rationale || '');
      setAssignedDepartment(department || '');
    } catch (error) {
      console.error("AI triage error. Graceful degradation active.", error);
      alert("AI Service is offline or configuring. Please select categories manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Defensively filter the list only if incidents is an array
  const filteredIncidents = Array.isArray(incidents) 
    ? incidents.filter((incident) => {
        if (!incident) return false;
        const matchCategory = filterCategory === 'all' || incident.category === filterCategory;
        const matchPriority = filterPriority === 'all' || incident.priority === filterPriority;
        const matchStatus = filterStatus === 'all' || (incident.status || 'pending').toLowerCase() === filterStatus.toLowerCase();
        return matchCategory && matchPriority && matchStatus;
      })
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoords) {
      setSubmitStatus({
        type: 'error',
        message: 'Please click on the map to pin the incident location first!'
      });
      return;
    }

    const token = localStorage.getItem('token'); 

    const payload = {
      title,
      description,
      category,
      priority,
      address,
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
    };

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post('http://localhost:3000/api/incidents', payload, {
        headers
      });
      
      console.log('Backend response:', response.data);
      
      setSubmitStatus({
        type: 'success',
        message: '🎉 Incident successfully reported and saved to the database!'
      });

      setTitle('');
      setDescription('');
      setAddress('');
      setAiRationale('');
      setAssignedDepartment('');
      setSelectedCoords(null);

      // Refresh map pins immediately after report
      fetchIncidents();
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setSubmitStatus({
          type: 'error',
          message: '🔑 Your session has expired. Please sign in again and resubmit.'
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: err.response?.data?.message || 'Failed to reach backend server.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col justify-center items-center">
      <div className="max-w-5xl w-full flex justify-end mb-4 gap-2">
        {localStorage.getItem('token') ? (
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="text-sm font-semibold text-rose-600 hover:text-rose-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 cursor-pointer"
          >
            Sign Out
          </button>
        ) : (
          <a href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            Sign In / Register
          </a>
        )}
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Map Panel Column */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Pinpoint the Issue</h2>
              {selectedCoords ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                  ✓ Location Locked
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full animate-pulse">
                  ⚠️ Select Location on Map
                </span>
              )}
            </div>

            {/* Map Interactive Filter Bar */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="road_damage">Road Damage</option>
                  <option value="flooding">Flooding</option>
                  <option value="power_outage">Power Outage</option>
                  <option value="water_issue">Water & Sewerage</option>
                  <option value="garbage">Garbage Pileup</option>
                  <option value="street_light">Street Light</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <IncidentMap 
              onLocationSelect={handleLocationSelect} 
              incidents={filteredIncidents}
              onIncidentSelect={(incident) => setSelectedIncident(incident)} 
            />
          </div>

          {selectedCoords && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono flex justify-between items-center">
              <div><strong>LAT:</strong> {selectedCoords.lat.toFixed(6)}</div>
              <div><strong>LNG:</strong> {selectedCoords.lng.toFixed(6)}</div>
            </div>
          )}

          {/* Sliding Detail Drawer */}
          {selectedIncident && (
            <div className="absolute inset-x-0 bottom-0 bg-slate-900 text-white p-5 rounded-t-2xl shadow-2xl border-t border-slate-800 transition-all duration-300 transform translate-y-0 z-[2000] flex flex-col justify-between max-h-[70%]">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-slate-100">{selectedIncident.title}</h3>
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 h-6 w-6 rounded-full flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-slate-300 text-xs mb-3 leading-relaxed">{selectedIncident.description}</p>
                
                <div className="space-y-2 font-sans text-xs">
                  {selectedIncident.address && (
                    <div>
                      <span className="text-slate-400 font-semibold">Address:</span> {selectedIncident.address}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold">Coords:</span> {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
                <div className="flex gap-2">
                  <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize">
                    📁 {(selectedIncident.category || 'other').replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                    selectedIncident.priority === 'critical' ? 'bg-red-900/50 text-red-200 border border-red-700' :
                    selectedIncident.priority === 'high' ? 'bg-amber-900/50 text-amber-200 border border-amber-700' : 'bg-blue-900/50 text-blue-200 border border-blue-700'
                  }`}>
                    ⚠️ {selectedIncident.priority || 'standard'}
                  </span>
                </div>
                <span className="bg-emerald-900/50 text-emerald-200 border border-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize">
                  ⚡ {selectedIncident.status || 'Pending'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form Panel Column */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Report Incident</h2>
          <p className="text-slate-500 text-xs mb-6">Provide details below to alert local authorities.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Broken Sewer Line"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Smart AI Classification Row */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={isAnalyzing}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition flex justify-center items-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin inline-block h-3 w-3 border-2 border-indigo-700 border-t-transparent rounded-full"></span>
                    AI is triaging details...
                  </>
                ) : (
                  <>✨ Auto-Fill Categories & Routing with AI</>
                )}
              </button>
            </div>

            {/* Rationale Display */}
            {aiRationale && (
              <div className="p-3 bg-indigo-950 text-indigo-100 rounded-xl border border-indigo-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300">AI Diagnosis Decision</span>
                  <span className="text-[10px] bg-indigo-800 px-1.5 py-0.5 rounded font-mono">{assignedDepartment}</span>
                </div>
                <p className="text-xs italic leading-snug">"{aiRationale}"</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="road_damage">Road Damage</option>
                <option value="flooding">Flooding</option>
                <option value="power_outage">Power Outage</option>
                <option value="water_issue">Water & Sewerage</option>
                <option value="garbage">Garbage Pileup</option>
                <option value="street_light">Broken Street Light</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['standard', 'high', 'critical'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border capitalize transition ${
                      priority === p
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Near Millenium Mall"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {submitStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  submitStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-lg text-sm font-bold text-white shadow transition cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isSubmitting ? 'Reporting Issue...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIncidentPage;