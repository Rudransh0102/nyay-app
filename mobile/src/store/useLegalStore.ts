import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LegalDocument } from '../api/endpoints';

interface LegalState {
  documents:   LegalDocument[];
  featured:    LegalDocument[];
  bookmarks:   LegalDocument[];
  currentDoc:  LegalDocument | null;
  isLoading:   boolean;
  isSearching: boolean;
  searchQuery: string;
  searchResults: LegalDocument[];
  totalResults:  number;
  currentPage:   number;
  filters: {
    type?: string;
    part?: string;
  };
  error: string | null;

  setDocuments:    (docs: LegalDocument[], total: number, page: number) => void;
  setFeatured:     (docs: LegalDocument[]) => void;
  setCurrentDoc:   (doc: LegalDocument | null) => void;
  setBookmarks:    (docs: LegalDocument[]) => void;
  toggleBookmark:  (doc: LegalDocument) => void;
  setSearchQuery:  (q: string) => void;
  setSearchResults:(results: LegalDocument[], total: number) => void;
  setFilters:      (filters: Partial<LegalState['filters']>) => void;
  setLoading:      (loading: boolean) => void;
  setSearching:    (searching: boolean) => void;
  setError:        (err: string | null) => void;
  reset:           () => void;
}

export const useLegalStore = create<LegalState>()(
  persist(
    (set, get) => ({
      documents:     [],
      featured:      [],
      bookmarks:     [],
      currentDoc:    null,
      isLoading:     false,
      isSearching:   false,
      searchQuery:   '',
      searchResults: [],
      totalResults:  0,
      currentPage:   1,
      filters:       {},
      error:         null,

      setDocuments:    (docs, total, page) => set({ documents: docs, totalResults: total, currentPage: page }),
      setFeatured:     (docs) => set({ featured: docs }),
      setCurrentDoc:   (doc)  => set({ currentDoc: doc }),
      setBookmarks:    (docs) => set({ bookmarks: docs }),
      toggleBookmark(doc) {
        const existing = get().bookmarks.find((b) => b.id === doc.id);
        if (existing) {
          set({ bookmarks: get().bookmarks.filter((b) => b.id !== doc.id) });
        } else {
          set({ bookmarks: [...get().bookmarks, { ...doc, bookmarked: true }] });
        }
      },
      setSearchQuery:   (q)              => set({ searchQuery: q }),
      setSearchResults: (results, total) => set({ searchResults: results, totalResults: total }),
      setFilters:       (filters)        => set({ filters: { ...get().filters, ...filters } }),
      setLoading:       (loading)        => set({ isLoading: loading }),
      setSearching:     (searching)      => set({ isSearching: searching }),
      setError:         (err)            => set({ error: err }),
      reset:            ()               => set({ documents: [], searchResults: [], currentPage: 1, searchQuery: '', filters: {} }),
    }),
    {
      name: 'nyay-legal-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist bookmarks — everything else is fetched fresh
      partialize: (state) => ({
        bookmarks: state.bookmarks,
      }),
    },
  ),
);
