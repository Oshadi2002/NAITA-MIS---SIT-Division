import { create } from 'zustand';
import { apiRequest, buildUrl } from './queryClient';
import { type User, type SeminarRequest, type Notification, type RequestStatus, type Role } from '@shared/schema';

export type { User, SeminarRequest, Notification, RequestStatus, Role };

// Add interface for PendingCoordinator
interface PendingCoordinator {
  id: number;
  full_name: string;
  email: string;
  university: string;
  faculty: string;
  department: string;
  designation: string;
  phone_number: string;
  submitted_at: string;
  status: string;
  invite_id?: string;
}

// Add interface for PendingStaff
interface PendingStaff {
  id: number;
  invite_type: 'ASSESSOR' | 'INSPECTOR';
  full_name: string;
  initials_name: string;
  email: string;
  phone_number: string;
  province: string;
  district: string;
  qualification: string;
  payment_details: any;
  assessment_fields: string[];
  is_also_assessor: boolean;
  assessor_data: any;
  submitted_at: string;
  status: string;
  invite_id?: string;
}

// Add interface for API responses
interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  email_sent?: boolean;
  user?: User;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  requests: SeminarRequest[];
  notifications: Notification[];
  pendingCoordinators: PendingCoordinator[];
  pendingStaff: PendingStaff[];
  isLoading: boolean;
  error: string | null; // Add error state

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (id: number, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteUser: (id: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateUser: (id: number, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;

  // Coordinator Actions
  fetchPendingCoordinators: () => Promise<void>;
  updatePendingCoordinator: (id: number, data: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  createInvite: (email: string) => Promise<{ success: boolean; link?: string; message?: string }>;
  approvePending: (id: number, username: string, password: string) => Promise<{ success: boolean; data?: any; error?: string; emailSent?: boolean; message?: string }>;
  rejectPending: (id: number, note: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Staff Actions
  fetchPendingStaff: () => Promise<void>;
  updatePendingStaff: (id: number, data: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  createStaffInvite: (email: string, invite_type: 'ASSESSOR' | 'INSPECTOR') => Promise<{ success: boolean; link?: string; message?: string }>;
  approveStaffPending: (id: number) => Promise<{ success: boolean; emailSent?: boolean; error?: string; user?: User; message?: string }>;
  rejectStaffPending: (id: number, note: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Request Actions
  fetchRequests: () => Promise<void>;
  createRequest: (data: Partial<SeminarRequest>) => Promise<{ success: boolean; message?: string }>;
  updateRequestStatus: (id: number, status: RequestStatus, note?: string) => Promise<{ success: boolean; message?: string }>;
  assignInspector: (requestId: number, inspectorId: number) => Promise<{ success: boolean; message?: string }>;
  setFinalDate: (requestId: number, date: string) => Promise<{ success: boolean; message?: string }>;
  completeRequest: (requestId: number, message: string) => Promise<{ success: boolean; message?: string }>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<{ success: boolean; message?: string }>;

  // Clear error
  clearError: () => void;
}

// Interface for creating users
interface CreateUserData {
  name: string;
  username?: string;
  email: string;
  role: string;
  password: string;
  university?: string;
  faculty?: string;
  department?: string;
  designation?: string;
  phone_number?: string;
}

export const useStore = create<AppState>()((set, get) => ({
  currentUser: null,
  users: [],
  requests: [],
  notifications: [],
  pendingCoordinators: [],
  pendingStaff: [],
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      const savedUserStr = localStorage.getItem('naita_user');
      let fallbackUser = null;
      if (savedUserStr && savedUserStr !== 'undefined' && savedUserStr !== 'null') {
        try {
          fallbackUser = JSON.parse(savedUserStr);
        } catch (e) {
          localStorage.removeItem('naita_user');
        }
      }

      const res = await fetch(buildUrl('/api/auth/user/'), {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const text = await res.text();
        try {
          if (!text || text.trim() === '' || text.trim() === 'null') {
            if (!fallbackUser) localStorage.removeItem('naita_user');
            set({ currentUser: fallbackUser, error: null, isLoading: false });
            return;
          }
          const user = JSON.parse(text);
          if (user) {
            localStorage.setItem('naita_user', JSON.stringify(user));
            set({ currentUser: user, error: null });

            const promises = [get().fetchRequests(), get().fetchNotifications()];
            if (user.role === 'ADMIN') {
              promises.push(get().fetchUsers(), get().fetchPendingCoordinators(), get().fetchPendingStaff());
            }
            await Promise.all(promises).catch(() => {});
          } else {
            set({ currentUser: fallbackUser, error: null });
          }
        } catch (parseError) {
          set({ currentUser: fallbackUser, error: null });
        }
      } else {
        set({ currentUser: fallbackUser, error: null });
      }
    } catch (e) {
      console.error("Initialization failed", e);
      const savedUserStr = localStorage.getItem('naita_user');
      if (savedUserStr) {
        set({ currentUser: JSON.parse(savedUserStr), error: null });
      } else {
        set({ error: "Network error during initialization" });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    try {
      const res = await apiRequest('POST', '/api/auth/login/', credentials);
      const user = await res.json();
      localStorage.setItem('naita_user', JSON.stringify(user));
      set({ currentUser: user, error: null });
      
      const promises = [get().fetchRequests(), get().fetchNotifications()];
      if (user.role === 'ADMIN') {
        promises.push(get().fetchUsers(), get().fetchPendingCoordinators(), get().fetchPendingStaff());
      }
      await Promise.all(promises).catch(() => {});
      return true;
    } catch (e: any) {
      console.error("Login failed", e);
      set({ error: e.message || "Login failed" });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiRequest('POST', '/api/auth/logout/').catch(() => {});
      localStorage.removeItem('naita_user');
      set({
        currentUser: null,
        requests: [],
        notifications: [],
        users: [],
        pendingCoordinators: [],
        pendingStaff: [],
        error: null
      });
    } catch (e: any) {
      console.error("Logout failed", e);
      localStorage.removeItem('naita_user');
      set({ currentUser: null, error: e.message || "Logout failed" });
    }
  },

  fetchUsers: async () => {
    try {
      const res = await fetch(buildUrl('/api/management/users/'), {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const users = Array.isArray(data) ? data : (data.results || []);
        set({ users, error: null });
      } else if (res.status === 403) {
        set({ users: [], error: "Permission denied to fetch users" });
      } else {
        set({ users: [], error: `Failed to fetch users: ${res.status}` });
      }
    } catch (e: any) {
      console.error("Fetch users failed", e);
      set({ users: [], error: e.message || "Failed to fetch users" });
    }
  },

  // ─── Coordinator Approval Actions ─────────────────────────
  createInvite: async (email) => {
    try {
      const res = await apiRequest('POST', '/api/coordinator-invites/create_invite/', { email });
      const data = await res.json();
      if (res.ok) {
        return { success: true, link: data.link, message: data.email_sent ? "Invite sent via email." : "Invite created successfully." };
      }
      return { success: false, message: data.message || "Failed to create invite." };
    } catch (e: any) {
      console.error("Create invite failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  createStaffInvite: async (email, invite_type) => {
    try {
      const res = await apiRequest('POST', '/api/staff-invites/create_invite/', { email, invite_type });
      const data = await res.json();
      if (res.ok) {
        return { success: true, link: data.link, message: data.email_sent ? "Invite sent via email." : "Invite created successfully." };
      }
      return { success: false, message: data.message || "Failed to create invite." };
    } catch (e: any) {
      console.error("Create staff invite failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  fetchPendingStaff: async () => {
    try {
      const res = await fetch(buildUrl('/api/staff-invites/list_pending/'), {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const pendingStaff = Array.isArray(data) ? data : (data.results || []);
        set({ pendingStaff, error: null });
      } else if (res.status === 403) {
        set({ pendingStaff: [], error: "Permission denied to fetch pending staff" });
      } else {
        set({ pendingStaff: [], error: `Failed to fetch pending staff: ${res.status}` });
      }
    } catch (e: any) {
      console.error("Fetch pending staff failed", e);
      set({ pendingStaff: [], error: e.message || "Failed to fetch pending staff" });
    }
  },

  updatePendingStaff: async (id, payload) => {
    try {
      const res = await apiRequest('PATCH', `/api/staff-invites/${id}/update_staff_pending/`, payload);
      const data = await res.json();
      if (res.ok) {
        await get().fetchPendingStaff();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || "Failed to update pending staff" };
      }
    } catch (e: any) {
      console.error("Update pending staff failed", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  approveStaffPending: async (id) => {
    try {
      const res = await apiRequest('POST', `/api/staff-invites/${id}/approve_pending/`);
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchPendingStaff();
        await get().fetchUsers();

        return {
          success: true,
          user: data.user,
          emailSent: data.email_sent || false,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to approve staff registration"
        };
      }
    } catch (e: any) {
      console.error("Approve staff pending failed", e);
      return {
        success: false,
        error: e.message || "Network error during staff approval"
      };
    }
  },

  rejectStaffPending: async (id, note) => {
    try {
      const res = await apiRequest('POST', `/api/staff-invites/${id}/reject_pending/`, {
        note
      });

      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchPendingStaff();

        return {
          success: true,
          message: data.message || "Staff registration rejected successfully"
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to reject staff registration"
        };
      }
    } catch (e: any) {
      console.error("Reject staff pending failed", e);
      return {
        success: false,
        error: e.message || "Network error during staff rejection"
      };
    }
  },

  fetchPendingCoordinators: async () => {
    try {
      const res = await fetch(buildUrl('/api/coordinator-invites/list_pending/'), {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const pendingCoordinators = Array.isArray(data) ? data : (data.results || []);
        set({ pendingCoordinators, error: null });
      } else if (res.status === 403) {
        set({ pendingCoordinators: [], error: "Permission denied to fetch pending coordinators" });
      } else {
        set({ pendingCoordinators: [], error: `Failed to fetch pending coordinators: ${res.status}` });
      }
    } catch (e: any) {
      console.error("Fetch pending coordinators failed", e);
      set({ pendingCoordinators: [], error: e.message || "Failed to fetch pending coordinators" });
    }
  },

  updatePendingCoordinator: async (id, payload) => {
    try {
      const res = await apiRequest('PATCH', `/api/coordinator-invites/${id}/update_pending/`, payload);
      const data = await res.json();
      if (res.ok) {
        await get().fetchPendingCoordinators();
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || "Failed to update pending coordinator" };
      }
    } catch (e: any) {
      console.error("Update pending coordinator failed", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  approvePending: async (id, username, password) => {
    try {
      const res = await apiRequest('POST', `/api/coordinator-invites/${id}/approve_pending/`, {
        username,
        password
      });

      const data: ApiResponse = await res.json();

      if (res.ok) {
        // Refresh pending list after approval
        await get().fetchPendingCoordinators();
        // Refresh users list to show new coordinator
        await get().fetchUsers();

        return {
          success: true,
          data: data.user || data,
          emailSent: data.email_sent || false,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to approve coordinator"
        };
      }
    } catch (e: any) {
      console.error("Approve pending failed", e);
      return {
        success: false,
        error: e.message || "Network error during approval"
      };
    }
  },

  rejectPending: async (id, note) => {
    try {
      const res = await apiRequest('POST', `/api/coordinator-invites/${id}/reject_pending/`, {
        note
      });

      const data: ApiResponse = await res.json();

      if (res.ok) {
        // Refresh pending list after rejection
        await get().fetchPendingCoordinators();

        return {
          success: true,
          message: data.message || "Coordinator rejected successfully"
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to reject coordinator"
        };
      }
    } catch (e: any) {
      console.error("Reject pending failed", e);
      return {
        success: false,
        error: e.message || "Network error during rejection"
      };
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await apiRequest('PATCH', `/api/management/${id}/update_user/`, data);
      const resData = await res.json();
      if (res.ok) {
        await get().fetchUsers();
        return { success: true, data: resData };
      }
      return { success: false, error: resData.message || "Failed to update user." };
    } catch (e: any) {
      console.error("Update user failed", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  createUser: async (data) => {
    try {
      const res = await apiRequest('POST', '/api/management/create_user/', data);
      const responseData: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchUsers();
        return { success: true, message: responseData.message || "User created successfully" };
      } else {
        return { success: false, message: responseData.message || "Failed to create user" };
      }
    } catch (e: any) {
      console.error("Create user failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  resetPassword: async (id, password) => {
    try {
      const res = await apiRequest('POST', `/api/management/${id}/reset_password/`, { password });
      const data: ApiResponse = await res.json();

      if (res.ok) {
        return { success: true, message: data.message || "Password reset successfully" };
      } else {
        return { success: false, message: data.message || "Failed to reset password" };
      }
    } catch (e: any) {
      console.error("Reset password failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await apiRequest('DELETE', `/api/management/${id}/delete_user/`);
      
      if (res.status === 204) {
        await get().fetchUsers();
        return { success: true, message: "User deleted successfully" };
      }

      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchUsers();
        return { success: true, message: data.message || "User deleted successfully" };
      } else {
        return { success: false, message: data.message || "Failed to delete user" };
      }
    } catch (e: any) {
      console.error("Delete user failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  fetchRequests: async () => {
    try {
      const res = await fetch(buildUrl('/api/requests/'), {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const requests = Array.isArray(data) ? data : (data.results || []);
        set({ requests, error: null });
      } else {
        set({ requests: [], error: `Failed to fetch requests: ${res.status}` });
      }
    } catch (e: any) {
      console.error("Fetch requests failed", e);
      set({ requests: [], error: e.message || "Failed to fetch requests" });
    }
  },

  createRequest: async (data) => {
    try {
      const res = await apiRequest('POST', '/api/requests/', data);
      const responseData: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchRequests();
        return { success: true, message: responseData.message || "Request created successfully" };
      } else {
        return { success: false, message: responseData.message || "Failed to create request" };
      }
    } catch (e: any) {
      console.error("Create request failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  updateRequestStatus: async (id, status, note) => {
    try {
      const res = await apiRequest('PATCH', `/api/requests/${id}/status/`, { status, note });
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchRequests();
        return { success: true, message: data.message || "Status updated successfully" };
      } else {
        return { success: false, message: data.message || "Failed to update status" };
      }
    } catch (e: any) {
      console.error("Update status failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  assignInspector: async (requestId, inspectorId) => {
    try {
      const res = await apiRequest('POST', `/api/requests/${requestId}/assign/`, { inspectorId });
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchRequests();
        return { success: true, message: data.message || "Inspector assigned successfully" };
      } else {
        return { success: false, message: data.message || "Failed to assign inspector" };
      }
    } catch (e: any) {
      console.error("Assign inspector failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  setFinalDate: async (requestId, date) => {
    try {
      const res = await apiRequest('PATCH', `/api/requests/${requestId}/date/`, { date });
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchRequests();
        return { success: true, message: data.message || "Date set successfully" };
      } else {
        return { success: false, message: data.message || "Failed to set date" };
      }
    } catch (e: any) {
      console.error("Set date failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  completeRequest: async (requestId, message) => {
    try {
      const res = await apiRequest('POST', `/api/requests/${requestId}/complete/`, { message });
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchRequests();
        return { success: true, message: data.message || "Request completed successfully" };
      } else {
        return { success: false, message: data.message || "Failed to complete request" };
      }
    } catch (e: any) {
      console.error("Complete request failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch(buildUrl('/api/notifications/'), {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const notifications = Array.isArray(data) ? data : (data.results || []);
        set({ notifications, error: null });
      } else {
        set({ notifications: [], error: `Failed to fetch notifications: ${res.status}` });
      }
    } catch (e: any) {
      console.error("Fetch notifications failed", e);
      set({ notifications: [], error: e.message || "Failed to fetch notifications" });
    }
  },

  markRead: async (id) => {
    try {
      const res = await apiRequest('POST', `/api/notifications/${id}/read/`);
      const data: ApiResponse = await res.json();

      if (res.ok) {
        await get().fetchNotifications();
        return { success: true, message: data.message || "Notification marked as read" };
      } else {
        return { success: false, message: data.message || "Failed to mark as read" };
      }
    } catch (e: any) {
      console.error("Mark read failed", e);
      return { success: false, message: e.message || "Network error" };
    }
  },
}));