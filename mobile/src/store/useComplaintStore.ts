import { create } from 'zustand';
import type { Complaint, CreateComplaintPayload } from '../api/endpoints';

interface ComplaintState {
  complaints:    Complaint[];
  currentComplaint: Complaint | null;
  isLoading:     boolean;
  isSubmitting:  boolean;
  trackingResult: Complaint | null;
  error:         string | null;

  setComplaints:      (data: Complaint[]) => void;
  setCurrentComplaint:(c: Complaint | null) => void;
  addComplaint:       (c: Complaint) => void;
  setTrackingResult:  (c: Complaint | null) => void;
  setLoading:         (v: boolean) => void;
  setSubmitting:      (v: boolean) => void;
  setError:           (err: string | null) => void;
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints:       [],
  currentComplaint: null,
  isLoading:        false,
  isSubmitting:     false,
  trackingResult:   null,
  error:            null,

  setComplaints:       (data) => set({ complaints: data }),
  setCurrentComplaint: (c)    => set({ currentComplaint: c }),
  addComplaint:        (c)    => set({ complaints: [c, ...get().complaints] }),
  setTrackingResult:   (c)    => set({ trackingResult: c }),
  setLoading:          (v)    => set({ isLoading: v }),
  setSubmitting:       (v)    => set({ isSubmitting: v }),
  setError:            (err)  => set({ error: err }),
}));
