import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { Category, Priority } from '../../types';

export default function IncidentForm() {
  const token = useAuthStore((state) => state.token);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [priority, setPriority] = useState<Priority>('standard');
  
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to ensure token is attached
  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const handleClassify = async () => {
    if (!title || !description) {
      setError('Please provide a title and description before auto-classifying.');
      return;
    }
    setError(null);
    setIsClassifying(true);

    try {
      const response = await axios.post(
        'http://localhost:3000/api/ai/classify',
        {
          title,
          description,
          latitude: 0,
          longitude: 0,
        },
        getHeaders()
      );

      const { category: aiCategory, priority: aiPriority, rationale } = response.data;
      
      if (aiCategory) setCategory(aiCategory as Category);
      if (aiPriority) setPriority(aiPriority as Priority);
      if (rationale) setAiRationale(rationale);
      
    } catch (err: any) {
      console.error(err);
      setError('AI Classification failed. Please try again or manually classify.');
    } finally {
      setIsClassifying(false);
    }
  };

  const submitIncident = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await axios.post(
        'http://localhost:3000/api/incidents',
        {
          title,
          description,
          category,
          priority,
          latitude: 0,
          longitude: 0,
        },
        getHeaders()
      );
      
      setSuccess('Incident reported successfully!');
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('standard');
      setAiRationale(null);
      setDuplicateWarning(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // If we've already shown the warning and the user submits again, it acts as an override
    if (duplicateWarning) {
      await submitIncident();
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Duplicate check
      const duplicateRes = await axios.post(
        'http://localhost:3000/api/ai/detect-duplicate',
        {
          description,
          latitude: 0,
          longitude: 0,
          category,
          nearbyIncidents: [], // Mocking nearby incidents for testing
        },
        getHeaders()
      );

      const { score } = duplicateRes.data;

      // 2. Halt submission if AI score is high
      if (score > 0.75) {
        setDuplicateWarning(true);
        setIsSubmitting(false);
        return; 
      }

      // 3. Submit immediately if no duplicate found
      await submitIncident();
      
    } catch (err: any) {
      console.error(err);
      setError('Duplicate check failed. Check backend connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Report a New Incident</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {duplicateWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-amber-900">Possible Duplicate Detected!</h4>
            <p className="text-sm mt-1">We found a very similar incident recently reported in this area. Are you sure you want to submit?</p>
          </div>
          <button 
            onClick={() => submitIncident()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded shadow-sm whitespace-nowrap transition-colors"
          >
            Submit Anyway
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Incident Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="E.g., Huge pothole on 5th Avenue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Please provide details about the location and severity..."
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleClassify}
              disabled={isClassifying || !title || !description}
              className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClassifying ? 'Analyzing...' : '✨ Auto-Classify with AI'}
            </button>
          </div>
        </div>

        {aiRationale && (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-sm text-indigo-800">
              <span className="font-bold">AI Rationale:</span> {aiRationale}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="road_damage">Road Damage</option>
              <option value="flooding">Flooding</option>
              <option value="power_outage">Power Outage</option>
              <option value="water_issue">Water Issue</option>
              <option value="garbage">Garbage</option>
              <option value="street_light">Street Light</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting || isClassifying || duplicateWarning}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : duplicateWarning ? 'Review Warning Above' : 'Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
