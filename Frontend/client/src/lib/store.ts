import { create } from 'zustand';
import { apiRequest } from './queryClient';
import { type User, type SeminarRequest, type Notification, type RequestStatus, type Role } from '@shared/schema';

export type { User, SeminarRequest, Notification, RequestStatus, Role };

// --- Types ---

interface AppState {
  currentUser: User | null;
  users: User[];
  requests: SeminarRequest[];
  notifications: Notification[];
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createUser: (data: { name: string, email: string, role: string, password: string, university?: string, faculty?: string, department?: string, phone_number?: string }) => Promise<void>;
  resetPassword: (id: number, password: string) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;

  // Request Actions
  fetchRequests: () => Promise<void>;
  createRequest: (data: Partial<SeminarRequest>) => Promise<void>;
  updateRequestStatus: (id: number, status: RequestStatus, note?: string) => Promise<void>;
  assignInspector: (requestId: number, inspectorId: number) => Promise<void>;
  setFinalDate: (requestId: number, date: string) => Promise<void>;
  completeRequest: (requestId: number, message: string) => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  currentUser: null,
  users: [],
  requests: [],
  notifications: [],
  isLoading: true,

  initialize: async () => {
    try {
      const res = await fetch('/api/auth/user/', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const user = JSON.parse(text);
          set({ currentUser: user });
          await Promise.all([
            get().fetchRequests(),
            get().fetchNotifications()
          ]);
          if (user.role === 'ADMIN') {
            await Promise.all([
              get().fetchUsers(),
            ]);
          }
        } catch (parseError) {
          console.error("Failed to parse user JSON. Response prefix:", text.substring(0, 50));
          throw parseError;
        }
      }
    } catch (e) {
      console.error("Initialization failed", e);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    try {
      const res = await apiRequest('POST', '/api/auth/login/', credentials);
      const user = await res.json();
      set({ currentUser: user });
      await get().initialize();
      return true;
    } catch (e) {
      return false;
    }
  },

  logout: async () => {
    await apiRequest('POST', '/api/auth/logout/');
    set({ currentUser: null, requests: [], notifications: [], users: [] });
  },

  fetchUsers: async () => {
    const res = await fetch('/api/management/users/', {
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    if (res.ok) {
      set({ users: await res.json() });
    }
  },

  createUser: async (data) => {
    await apiRequest('POST', '/api/management/create_user/', data);
    await get().fetchUsers();
  },

  resetPassword: async (id, password) => {
    await apiRequest('POST', `/api/management/${id}/reset_password/`, { password });
  },

  deleteUser: async (id) => {
    await apiRequest('DELETE', `/api/management/${id}/delete_user/`);
    await get().fetchUsers();
  },

  fetchRequests: async () => {
    const res = await fetch('/api/requests/', {
      credentials: 'include'
    });
    if (res.ok) {
      set({ requests: await res.json() });
    }
  },

  createRequest: async (data) => {
    await apiRequest('POST', '/api/requests/', data);
    await get().fetchRequests();
  },

  updateRequestStatus: async (id, status, note) => {
    await apiRequest('PATCH', `/api/requests/${id}/status/`, { status, note });
    await get().fetchRequests();
  },

  assignInspector: async (requestId, inspectorId) => {
    await apiRequest('POST', `/api/requests/${requestId}/assign/`, { inspectorId });
    await get().fetchRequests();
  },

  setFinalDate: async (requestId, date) => {
    await apiRequest('PATCH', `/api/requests/${requestId}/date/`, { date });
    await get().fetchRequests();
  },

  completeRequest: async (requestId, message) => {
    await apiRequest('POST', `/api/requests/${requestId}/complete/`, { message });
    await get().fetchRequests();
  },

  fetchNotifications: async () => {
    const res = await fetch('/api/notifications/', {
      credentials: 'include'
    });
    if (res.ok) {
      set({ notifications: await res.json() });
    }
  },

  markRead: async (id) => {
    await apiRequest('POST', `/api/notifications/${id}/read/`);
    await get().fetchNotifications();
  },
}));
