import { DEFAULT_PORTAL_PROFILES, REGISTERED_SUPPLIERS } from '../data/mockData';
import {
  AuditLogEntry,
  CreateRequestPayload,
  LoginResponse,
  PurchaseRequest,
  RequestStatus,
  Supplier,
  SupplierOffer,
  User,
  VerifyOfferPayload
} from '../types/procurement';
import { API_CONFIG, JWT_STORAGE_KEY, apiRequest } from './apiClient';

export const ProcuraApiService = {
  isLive(): boolean {
    return API_CONFIG.USE_LIVE_API;
  },

  // POST /auth/login
  async login(email: string, password: string): Promise<LoginResponse> {
    if (!API_CONFIG.USE_LIVE_API) {
      const matched =
        DEFAULT_PORTAL_PROFILES.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ||
        null;
      return { user: matched, token: 'local-session-token' };
    }

    const raw = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (raw?.token) {
      localStorage.setItem(JWT_STORAGE_KEY, raw.token);
    }

    const user: User | null = raw?.user || (raw?.token ? {
      id: raw.id || `USR-${Date.now()}`,
      name: raw.name || email.split('@')[0],
      nameAr: raw.name || email.split('@')[0],
      email: email.trim(),
      role: (raw.role || 'requester') as any,
      department: 'Operations',
      departmentAr: 'العمليات'
    } : null);

    return { user, token: raw?.token || '' };
  },

  // POST /auth/register
  async register(payload: {
    name: string;
    nameAr?: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    departmentAr?: string;
  }): Promise<LoginResponse> {
    if (!API_CONFIG.USE_LIVE_API) {
      const mockUser: User = {
        id: `USR-${Date.now()}`,
        name: payload.name,
        nameAr: payload.nameAr || payload.name,
        email: payload.email,
        role: payload.role as any,
        department: payload.department || 'Operations',
        departmentAr: payload.departmentAr || 'العمليات'
      };
      return { user: mockUser, token: 'local-session-token' };
    }

    const raw = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role
      })
    });

    if (raw?.token) {
      localStorage.setItem(JWT_STORAGE_KEY, raw.token);
    }

    const user: User | null = raw?.user || (raw?.token ? {
      id: raw.id || `USR-${Date.now()}`,
      name: raw.name || payload.name,
      nameAr: raw.name || payload.name,
      email: payload.email,
      role: (raw.role || payload.role) as any,
      department: payload.department || 'Operations',
      departmentAr: payload.departmentAr || 'العمليات'
    } : null);

    return { user, token: raw?.token || '' };
  },
  // GET /auth/me (Hydrates current session when JWT exists in localStorage)
  async getCurrentSession(): Promise<User | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (!token) return null;
    return apiRequest<User>('/auth/me');
  },

  // POST /auth/logout
  async logout(): Promise<void> {
    if (API_CONFIG.USE_LIVE_API) {
      await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);
    }
    localStorage.removeItem(JWT_STORAGE_KEY);
  },

  // GET /requests
  async fetchRequests(): Promise<PurchaseRequest[] | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<PurchaseRequest[]>('/requests');
  },

  // POST /requests
  async createRequest(payload: CreateRequestPayload): Promise<PurchaseRequest | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<PurchaseRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // DELETE /requests/:id (Draft deletion)
  async deleteRequest(requestId: string): Promise<void> {
    if (!API_CONFIG.USE_LIVE_API) return;
    await apiRequest<void>(`/requests/${requestId}`, { method: 'DELETE' });
  },

  // PATCH /requests/:id/status
  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    reason = ''
  ): Promise<PurchaseRequest | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<PurchaseRequest>(`/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  },

  // GET /suppliers
  async fetchSuppliers(): Promise<Supplier[]> {
    if (!API_CONFIG.USE_LIVE_API) return REGISTERED_SUPPLIERS;
    return apiRequest<Supplier[]>('/suppliers');
  },

  // POST /requests/:id/invite
  async inviteSuppliers(requestId: string, supplierIds: string[]): Promise<PurchaseRequest | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<PurchaseRequest>(`/requests/${requestId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ supplierIds })
    });
  },

  // GET /quotations (optionally filtered by requestId)
  async fetchQuotations(requestId?: string): Promise<SupplierOffer[] | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : '';
    return apiRequest<SupplierOffer[]>(`/quotations${query}`);
  },

  // POST /quotations/upload (Multipart FormData for real PDF upload & AI extraction)
  async uploadQuotationPdf(
    requestId: string,
    supplierId: string,
    file: File
  ): Promise<SupplierOffer | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('supplierId', supplierId);
    formData.append('file', file);
    return apiRequest<SupplierOffer>('/quotations/upload', {
      method: 'POST',
      body: formData
    });
  },

  // POST /quotations/:id/retry-extraction
  async retryAiExtraction(offerId: string): Promise<SupplierOffer | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<SupplierOffer>(`/quotations/${offerId}/retry-extraction`, {
      method: 'POST'
    });
  },

  // PUT /quotations/:id/verify (Save & Approve AI Extraction)
  async verifyAiExtraction(
    offerId: string,
    verifiedFields: VerifyOfferPayload
  ): Promise<SupplierOffer | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<SupplierOffer>(`/quotations/${offerId}/verify`, {
      method: 'PUT',
      body: JSON.stringify(verifiedFields)
    });
  },

  // GET /audit-logs
  async fetchAuditLogs(): Promise<AuditLogEntry[] | null> {
    if (!API_CONFIG.USE_LIVE_API) return null;
    return apiRequest<AuditLogEntry[]>('/audit-logs');
  }
};
