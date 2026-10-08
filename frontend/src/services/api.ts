import axios from 'axios';
import type {
  User, Child, Story, StoryListItem, StoryRequest,
  AssessmentSubmit, AssessmentResult, ChildProgressReport,
  TeacherDashboardResponse, StoryAssignment, StoryAssignmentCreate
} from '../types';

// Use VITE_BACKEND_URL from Vercel binding in production, fallback to /api for local dev
const baseURL = import.meta.env.VITE_BACKEND_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; name: string; password: string; role?: 'parent' | 'teacher' }) =>
    api.post<User>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; token_type: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
};

export const childrenApi = {
  create: (data: { name: string; age: number; grade?: number }) =>
    api.post<Child>('/children', data),
  list: () => api.get<Child[]>('/children'),
  get: (id: number) => api.get<Child>(`/children/${id}`),
  update: (id: number, data: Partial<{ name: string; age: number; grade?: number }>) =>
    api.patch<Child>(`/children/${id}`, data),
  delete: (id: number) => api.delete(`/children/${id}`),
};

export const storiesApi = {
  generate: (data: StoryRequest) => api.post<Story>('/stories/generate', data),
  list: (childId: number) => api.get<StoryListItem[]>(`/stories?child_id=${childId}`),
  get: (id: number) => api.get<Story>(`/stories/${id}`),
  complete: (id: number) => api.post(`/stories/${id}/complete`),
  getQuestions: (id: number) => api.get<any[]>(`/stories/${id}/questions`),
  assess: (id: number, data: AssessmentSubmit) => api.post<AssessmentResult>(`/stories/${id}/assess`, data),
};

export const reportsApi = {
  childReport: (childId: number) => api.get<ChildProgressReport>(`/reports/child/${childId}`),
  teacherDashboard: () => api.get<TeacherDashboardResponse>('/reports/teacher/dashboard'),
};

export const assignmentsApi = {
  create: (data: StoryAssignmentCreate) => api.post<StoryAssignment>('/assignments', data),
  list: () => api.get<StoryAssignment[]>('/assignments'),
};

export default api;