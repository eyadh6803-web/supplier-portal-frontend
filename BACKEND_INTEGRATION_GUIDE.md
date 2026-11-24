# PROCURA — Backend Integration & Handoff Guide

This frontend is architected so your backend team can plug in real REST APIs without touching UI components. All TypeScript data contracts live in `src/types/procurement.ts`, and all HTTP calls live in `src/services/procuraApi.ts` and `src/services/apiClient.ts`.

---

## 1. Quick Start: Connecting to the Live Backend

1. Create a `.env.local` (or `.env`) file in the project root based on `.env.example`:

```env
VITE_USE_LIVE_API="true"
VITE_API_BASE_URL="http://localhost:4000/api/v1"
```

2. Restart the Vite dev server or rebuild (`npm run build`).
   - When `VITE_USE_LIVE_API="true"`, the app automatically:
     - Disables local fallback data.
     - Sends real `fetch` requests to `VITE_API_BASE_URL`.
     - Injects `Authorization: Bearer <token>` from `localStorage.getItem('procura_jwt_token')`.
     - Hydrates `/auth/me`, `/requests`, `/quotations`, `/audit-logs`, and `/suppliers` on startup.

---

## 2. Required Backend REST Endpoints

### A. Authentication
| Method | Endpoint | Request Body | Response (`200 OK`) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `{ "email": string, "password": string }` | `{ "user": User, "token": string }` | Frontend stores `token` in `localStorage` (`procura_jwt_token`). |
| `GET` | `/auth/me` | — (Bearer JWT) | `User` | Hydrates session on page reload. Return `401` if expired. |
| `POST` | `/auth/logout` | — (Bearer JWT) | `204 No Content` | Optional server token invalidation; frontend clears local JWT. |

### B. Purchase Requests
| Method | Endpoint | Request Body | Response | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/requests` | — | `PurchaseRequest[]` | `requester` (own only), `officer`, `manager`, `supplier` (invited only) |
| `POST` | `/requests` | `CreateRequestPayload` | `201 Created` (`PurchaseRequest`) | `requester` |
| `PATCH` | `/requests/:id/status` | `{ "status": RequestStatus, "reason"?: string }` | `200 OK` (`PurchaseRequest`) | `requester` (`Draft -> Submitted`), `officer` (`-> PendingApproval`), `manager` (`Approved` / `Rejected`) |
| `DELETE` | `/requests/:id` | — | `204 No Content` | `requester` (only when `status === 'Draft'`) |
| `POST` | `/requests/:id/invite` | `{ "supplierIds": string[] }` | `200 OK` (`PurchaseRequest`) | `officer` |

### C. Suppliers
| Method | Endpoint | Request Body | Response | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/suppliers` | — | `Supplier[]` | Used by the Officer Invitation Modal. |

### D. Quotations, PDF Upload & AI Extraction
| Method | Endpoint | Request Body | Response | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/quotations` | Query `?requestId=` (optional) | `SupplierOffer[]` | Returns extracted & reviewed quotation records. |
| `POST` | `/quotations/upload` | `multipart/form-data`: `requestId`, `supplierId`, `file` (`.pdf`) | `201 Created` (`SupplierOffer`) | **Do not set `Content-Type` header manually**; browser sets multipart boundary. Backend should store PDF (S3/GCS/disk), return `fileUrl`, and trigger OCR/AI extraction. |
| `POST` | `/quotations/:id/retry-extraction` | — | `200 OK` (`SupplierOffer`) | Re-runs AI extraction if initial parse failed. |
| `PUT` | `/quotations/:id/verify` | `VerifyOfferPayload` | `200 OK` (`SupplierOffer`) | Saves human-verified fields and marks `reviewed: true`. |

### E. Audit Log
| Method | Endpoint | Request Body | Response | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/audit-logs` | — | `AuditLogEntry[]` | Backend should automatically append audit entries on every mutating request above. |

---

## 3. Core Security Rules for the Backend Team

1. **Hide Internal Budgets from Suppliers**: When `GET /requests` is called by a user with `role === 'supplier'`, mask or omit `estimatedBudget` (or set to `0`) server-side before returning JSON, and only return requests where their `supplierId` is in `invitedSupplierIds`.
2. **Enforce Role-Based Access Control (RBAC) Server-Side**:
   - Only `requester` can create/delete drafts and submit requests.
   - Only `officer` can invite suppliers, verify AI extractions, and send for approval.
   - Only `manager` can transition a request from `PendingApproval` to `Approved` or `Rejected` (require non-empty `reason` on `Rejected`).
   - Only `supplier` can upload PDF quotations to requests they were invited to.
3. **CORS & File Serving**:
   - Allow the frontend origin in CORS headers and allow `Authorization` + `Content-Type` headers.
   - For PDF preview in `PdfPreviewModal.tsx`, return a signed or CORS-friendly `fileUrl` on each `SupplierOffer` so the `<iframe src={offer.fileUrl}>` renders cleanly without `X-Frame-Options: DENY`.
4. **Standard Error Format**: Return JSON `{ "message": "Human readable error" }` with HTTP `4xx`/`5xx`. `apiClient.ts` automatically surfaces `errPayload.message` in the UI toast/error banner and clears the JWT on `401`.
