export type Language = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light';

export type UserRole = 'requester' | 'officer' | 'manager' | 'supplier';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'OffersReceived'
  | 'Compared'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected';

export type ExtractionStatus = 'Processing' | 'Completed' | 'Failed';

export type ScreenId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11;

export type ComparisonPriority = 'balanced' | 'price' | 'delivery' | 'warranty';

export interface User {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: UserRole;
  department?: string;
  departmentAr?: string;
  supplierId?: string;
  companyName?: string;
  companyNameAr?: string;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  rating: number;
  location: string;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  quantity: number;
  estimatedBudget: number;
  reason: string;
  reasonAr: string;
  deliveryDate: string;
  requesterId: string;
  requesterName: string;
  requesterNameAr: string;
  status: RequestStatus;
  createdDate: string;
  invitedSupplierIds: string[];
}

export interface SupplierOffer {
  id: string;
  requestId: string;
  supplierId: string;
  supplierName: string;
  fileName: string;
  fileUrl?: string;
  uploadedAt: string;
  extractionStatus: ExtractionStatus;
  reviewed: boolean;
  totalPrice: number;
  currency: string;
  deliveryDays: number;
  paymentTerms: string;
  warrantyMonths: number;
  notes: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userAr: string;
  action: string;
  actionAr: string;
  requestId: string;
  details: string;
  detailsAr: string;
}

// ============================================================================
// API REQUEST / RESPONSE CONTRACTS FOR BACKEND INTEGRATION
// ============================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User | null;
  token: string;
}

export interface CreateRequestPayload {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  quantity: number;
  estimatedBudget: number;
  reason: string;
  reasonAr?: string;
  deliveryDate?: string;
  status: Extract<RequestStatus, 'Draft' | 'Submitted'>;
}

export interface UpdateRequestStatusPayload {
  status: RequestStatus;
  reason?: string;
}

export interface InviteSuppliersPayload {
  supplierIds: string[];
}

export interface VerifyOfferPayload {
  supplierName: string;
  totalPrice: number;
  currency: string;
  deliveryDays: number;
  paymentTerms: string;
  warrantyMonths: number;
  notes: string;
}

export interface ToastMessage {
  msg: string;
  type: 'success' | 'error';
}
