import { authStorage, getAuthHeader, type LoginResponse, type User } from './auth';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams: string = ''
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}${queryParams}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle token refresh for 401 errors
      if (error.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        try {
          await refreshToken();
          // Retry the original request with new token
          return apiRequest(endpoint, options, queryParams);
        } catch {
          // Refresh failed, redirect to login
          authStorage.clear();
          window.location.href = '/login';
          throw error;
        }
      }
      
      // Handle specific login errors
      if (endpoint === '/auth/login' && error.status === 401) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please check your username and password.",
        });
      } else {
        // Determine appropriate error title based on context
        let errorTitle = "Error";
        const errorLower = error.message.toLowerCase();
        
        if (error.status === 403) {
          errorTitle = "Access Denied";
        } else if (error.status === 404) {
          errorTitle = "Not Found";
        } else if (error.status === 409 || errorLower.includes('conflict') || errorLower.includes('already') || errorLower.includes('duty roster') || errorLower.includes('scheduled')) {
          errorTitle = "Assignment Conflict";
        } else if (error.status === 400) {
          errorTitle = "Invalid Request";
        } else if (error.status >= 500) {
          errorTitle = "Server Error";
        }
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: error.message,
        });
      }
      throw error;
    }
    
    toast({
      variant: "destructive",
      title: "Connection Error",
      description: "Unable to connect to the server. Please check your internet connection.",
    });
    throw error;
  }
}

// Auth API
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  authStorage.setTokens(data.access_token, data.refresh_token);
  
  // Fetch user profile based on role
  let userProfile: User;
  if (data.role === 'admin') {
    // For admin, we'll need to implement a profile endpoint or use a placeholder
    userProfile = {
      id: 'admin-' + Date.now(),
      username: username,
      role: 'admin' as const,
      created_at: new Date().toISOString()
    };
  } else {
    userProfile = await apiRequest<User>('/worker/profile');
  }
  
  authStorage.setUser(userProfile);
  return data;
};

export const refreshToken = async (): Promise<{access_token: string}> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const data = await apiRequest<{access_token: string}>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  
  authStorage.setTokens(data.access_token, refreshToken);
  return data;
};


// Admin APIs
export const getWorkers = (): Promise<any[]> => apiRequest('/admin/workers/');
export const addWorker = (username: string, password: string, phone: string) => 
  apiRequest(`/admin/workers/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&phone_number=${encodeURIComponent(phone)}`, { 
    method: 'POST',
  });
export const removeWorker = (username: string) => apiRequest(`/admin/workers/${username}`, { method: 'DELETE' });
export const updateWorkerStatus = (username: string, status: string) => 
  apiRequest(`/admin/workers/${username}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });

export const getTasks = (): Promise<any[]> => apiRequest('/admin/tasks/');
export const createTask = (templateId: string, assignedTo: string) => 
  apiRequest(`/admin/tasks/?template_id=${encodeURIComponent(templateId)}&assigned_to=${encodeURIComponent(assignedTo)}`, { method: 'POST' });
export const updateTaskStatus = (taskId: string, status: string) => 
  apiRequest(`/admin/tasks/${taskId}?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
export const resetTaskStatus = (taskId: string, reason: string) => 
  apiRequest(`/admin/tasks/${taskId}/reset-task-status?reason=${encodeURIComponent(reason)}`, { method: 'POST' });
export const deleteTask = (taskId: string) => apiRequest(`/admin/tasks/${taskId}`, { method: 'DELETE' });

// Buildings API
export interface Building {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export const getBuildings = (): Promise<Building[]> => apiRequest('/buildings/');
export const createBuilding = (name: string) => 
  apiRequest(`/buildings/?name=${encodeURIComponent(name)}`, { method: 'POST' });
export const updateBuilding = (buildingId: string, name: string) => 
  apiRequest(`/buildings/${buildingId}?name=${encodeURIComponent(name)}`, { method: 'PATCH' });
export const deleteBuilding = (buildingId: string) => 
  apiRequest(`/buildings/${buildingId}`, { method: 'DELETE' });

// Facilities API
export interface Facility {
  id: string;
  name: string;
  building_id: string;
  building_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const getFacilities = (): Promise<Facility[]> => apiRequest('/facilities/');
export const createFacility = (name: string, buildingId: string) => 
  apiRequest(`/facilities/?name=${encodeURIComponent(name)}&building_id=${encodeURIComponent(buildingId)}`, { method: 'POST' });
export const updateFacility = (facilityId: string, name: string) => 
  apiRequest(`/facilities/${facilityId}?name=${encodeURIComponent(name)}`, { method: 'PATCH' });
export const deleteFacility = (facilityId: string) => 
  apiRequest(`/facilities/${facilityId}`, { method: 'DELETE' });

// Task Templates API
export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  task_type: 'recurring' | 'one_off_short';
  facility_id?: string;
  facility?: {
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const getTaskTemplates = (): Promise<TaskTemplate[]> => apiRequest('/task_template/task-templates/');
export const createTaskTemplate = (template: {title: string, description: string, task_type: string, facility_id: string}) => 
  apiRequest('/task_template/task-templates/', { 
    method: 'POST',
    body: JSON.stringify(template)
  });
export const getTaskTemplate = (templateId: string): Promise<TaskTemplate> => 
  apiRequest(`/task_template/task-templates/${templateId}`);
export const updateTaskTemplate = (templateId: string, template: {title?: string, description?: string, facility_id?: string}) => 
  apiRequest(`/task_template/task-templates/${templateId}`, { 
    method: 'PATCH',
    body: JSON.stringify(template)
  });
export const deleteTaskTemplate = (templateId: string) => 
  apiRequest(`/task_template/task-templates/${templateId}`, { method: 'DELETE' });

// Duty Roster API
export interface DutyRoster {
  id: string;
  template_id: string;
  worker_name: string;
  start_time: string;
  days: string[];
  active: boolean;
}

export interface DutyRosterCreate {
  template_id: string;
  worker_name: string;
  start_time: string;
  days: string[];
}

export interface DutyRosterUpdate {
  start_time?: string;
  active?: boolean;
  days?: string[];
}

export const getDutyRosters = (): Promise<DutyRoster[]> => apiRequest('/duty_roster/');
export const getDutyRoster = (rosterId: string): Promise<DutyRoster> => 
  apiRequest(`/duty_roster/${rosterId}`);
export const createDutyRoster = (roster: DutyRosterCreate) => 
  apiRequest('/duty_roster/', { 
    method: 'POST',
    body: JSON.stringify(roster)
  });
export const updateDutyRoster = (rosterId: string, update: DutyRosterUpdate) => 
  apiRequest(`/duty_roster/${rosterId}`, { 
    method: 'PATCH',
    body: JSON.stringify(update)
  });
export const deleteDutyRoster = (rosterId: string) => 
  apiRequest(`/duty_roster/${rosterId}`, { method: 'DELETE' });

export const getAdminComplaints = (): Promise<any[]> => apiRequest('/admin/complaints/');
export const updateComplaintStatus = (complaintId: string, status: string) => 
  apiRequest(`/admin/complaints/${complaintId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });

// Worker APIs
export const getWorkerTasks = (): Promise<any[]> => apiRequest('/worker/tasks');
export const getWorkerProfile = (): Promise<User> => apiRequest('/worker/profile');
export const acknowledgeTask = (taskId: string) => apiRequest(`/worker/tasks/${taskId}/acknowledge`, { method: 'PATCH' });

export const uploadTaskEvidence = async (taskId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  return fetch(`${API_BASE_URL}/worker/tasks/${taskId}/evidence`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  });
};

export const updateWorkerPassword = (password: string) => 
  apiRequest(`/worker/profile/password?password=${encodeURIComponent(password)}`, { method: 'PATCH' });

export const submitWorkerComplaint = (description: string) => 
  apiRequest(`/worker/complaints?description=${encodeURIComponent(description)}`, { method: 'POST' });

export const getWorkerComplaints = (): Promise<any[]> => apiRequest('/worker/complaints');

export const getWorkerComplaintCount = async (): Promise<number> => {
  try {
    const complaints = await getWorkerComplaints();
    return complaints.length;
  } catch (error) {
    console.error('Failed to get worker complaint count:', error);
    return 0;
  }
};

// Public Complaints API
export const getComplaints = (): Promise<any[]> => apiRequest('/complaints/');

export const createComplaint = async (description: string, category: string, location?: string, file?: File) => {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('category', category);
  if (location) formData.append('location', location);
  if (file) formData.append('file', file);
  
  return fetch(`${API_BASE_URL}/complaints/`, {
    method: 'POST',
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Submit failed');
    return response.json();
  });
};

// Audit API
export const getAuditLogs = (): Promise<any[]> => apiRequest('/admin/audit-logs/');