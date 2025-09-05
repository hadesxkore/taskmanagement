// API Configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://taskmanager-backend-ux77.onrender.com')
).replace(/\/$/, '');

export const API_ENDPOINTS = {
  // User endpoints
  LOGIN: `${API_BASE_URL}/api/users/login`,
  REGISTER: `${API_BASE_URL}/api/users/register`,
  PROFILE: `${API_BASE_URL}/api/users/profile`,
  
  // Task endpoints
  TASKS: `${API_BASE_URL}/api/tasks`,
  GROUP_TASKS: `${API_BASE_URL}/api/tasks/group`,
  REORDER: `${API_BASE_URL}/api/tasks/reorder`,
  DASHBOARD_STATS: `${API_BASE_URL}/api/tasks/dashboard/stats`,
  
  // File endpoints
  UPLOAD: `${API_BASE_URL}/api/tasks/upload`,
  DOWNLOAD: `${API_BASE_URL}/api/tasks/download`,
};

export default API_BASE_URL;
