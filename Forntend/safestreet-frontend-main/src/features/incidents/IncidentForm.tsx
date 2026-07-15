import React, { useState } from 'react';
import type { Category, Priority } from '../../types';
import { incidentService } from '../../api/incidentService';

export default function IncidentForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [priority, setPriority] = useState<Priority>('standard');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleClassify = async () => {
    if (!title || !description) {
      alert('Please enter title and description to auto-classify.');
      return;
    }
    
    setIsClassifying(true);
    try {
      // Sending dummy coordinates for the classification API for now
      const result = await incidentService.classifyIncident({
        title,
        description,
        latitude: 0,
        longitude: 0,
      });
      
      if (result.category) setCategory(result.category);
      if (result.priority) setPriority(result.priority);
      
      alert(`AI Classified as ${result.category} (${result.priority})\nRationale: ${result.rationale}`);
    } catch (error) {
      console.error('Failed to classify', error);
      alert('AI Classification failed. Check console for details.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submitting dummy coordinates as a placeholder for Geolocation API
      await incidentService.createIncident({
        title,
        description,
        category,
        priority,
        latitude: 0, 
        longitude: 0,
      });
      alert('Incident reported successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('standard');
    } catch (error) {
      console.error('Failed to report incident', error);
      alert('Failed to report incident. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Report an Incident</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
            placeholder="E.g., Large pothole on Main St"
            required
            minLength={3}
            maxLength={200}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <div className="relative">
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              placeholder="Describe the incident in detail..."
              required
              minLength={10}
              maxLength={2000}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClassify}
                disabled={isClassifying || !description || !title}
                className="text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-md font-medium inline-flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClassifying ? 'Analyzing...' : '✨ Auto-Classify with AI'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Reporting...' : 'Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
