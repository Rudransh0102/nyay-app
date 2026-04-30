import apiClient from './client';

// ─── Generic envelopes ────────────────────────────────────────────────────────
export interface ApiEnvelope<T>   { success: boolean; data: T }
export interface ApiPaginated<T>  { success: boolean; data: T; meta: { total: number; page: number; limit: number; pages: number } }

// ─── Legal ────────────────────────────────────────────────────────────────────
export interface LegalDocument {
  id:              string;
  title:           string;
  type:            'constitution' | 'act' | 'amendment';
  part?:           string;
  article_number?: number;
  section_number?: string;
  article_title?:  string;
  content:         string;
  chapter?:        string;
  chapter_title?:  string;
  language?:       string;
  tags?:           string[];
  bookmarked?:     boolean;
}


export interface SearchParams extends Record<string, unknown> {
  q?:      string;
  type?:   string;
  part?:   string;
  page?:   number;
  limit?:  number;
}

export const legalApi = {
  search:          (params: SearchParams) => apiClient.get<ApiPaginated<LegalDocument[]>>('/legal/search', { params }),
  getById:         (id: string)           => apiClient.get<ApiEnvelope<LegalDocument>>(`/legal/${id}`),
  getConstitution: (params?: { part?: string; page?: number; limit?: number }) =>
                   apiClient.get<ApiPaginated<LegalDocument[]>>('/legal/constitution', { params }),
  getFeatured:     ()                     => apiClient.get<ApiEnvelope<LegalDocument[]>>('/legal/featured'),
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export interface Complaint {
  id:           string;
  title:        string;
  description:  string;
  status:       'pending' | 'in_review' | 'resolved' | 'rejected';
  category:     string;
  tracking_id?: string;
  created_at:   string;
  updated_at:   string;
  attachments?: string[];
}

export interface CreateComplaintPayload {
  title:        string;
  description:  string;
  category:     string;
  attachments?: string[];
}

export const complaintApi = {
  create:  (data: CreateComplaintPayload) => apiClient.post<ApiEnvelope<Complaint>>('/complaints', data),
  getAll:  (params?: { status?: string; page?: number }) => apiClient.get<ApiPaginated<Complaint[]>>('/complaints', { params }),
  getById: (id: string)            => apiClient.get<ApiEnvelope<Complaint>>(`/complaints/${id}`),
  track:   (trackingId: string)    => apiClient.get<ApiEnvelope<Complaint>>(`/complaints/track/${trackingId}`),
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export const bookmarkApi = {
  add:    (legalId: string) => apiClient.post<ApiEnvelope<{ bookmarked: boolean }>>(`/bookmarks/${legalId}`),
  remove: (legalId: string) => apiClient.delete<ApiEnvelope<{ bookmarked: boolean }>>(`/bookmarks/${legalId}`),
  list:   ()                => apiClient.get<ApiEnvelope<LegalDocument[]>>('/bookmarks'),
};
