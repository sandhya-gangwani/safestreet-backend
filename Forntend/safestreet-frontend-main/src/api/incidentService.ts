import apiClient from './axios';
import type { Category, Priority } from '../types';

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: Category;
  priority?: Priority;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ClassifyPayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface ClassifyResponse {
  category: Category;
  priority: Priority;
  department: string;
  rationale: string;
}

export interface DetectDuplicatePayload {
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  nearbyIncidents: any[];
}

export interface DetectDuplicateResponse {
  score: number;
  matchingIncidentId: string | null;
}

export const incidentService = {
  createIncident: async (data: CreateIncidentPayload) => {
    const response = await apiClient.post('/incidents', data);
    return response.data;
  },

  classifyIncident: async (data: ClassifyPayload): Promise<ClassifyResponse> => {
    const response = await apiClient.post('/ai/classify', data);
    return response.data;
  },

  detectDuplicate: async (data: DetectDuplicatePayload): Promise<DetectDuplicateResponse> => {
    const response = await apiClient.post('/ai/detect-duplicate', data);
    return response.data;
  }
};
