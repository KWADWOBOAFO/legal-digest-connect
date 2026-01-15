const DRAFTS_STORAGE_KEY = "legal-matter-drafts";
const CLEANUP_KEY = "drafts-last-cleanup";
const EXPIRY_DAYS = 60;

export interface Draft {
  id: string;
  title: string;
  description: string;
  practiceArea: string;
  createdAt: string;
  updatedAt: string;
}

export const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getDrafts = (): Draft[] => {
  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse drafts");
  }
  return [];
};

export const saveDraft = (draft: Omit<Draft, "id" | "createdAt" | "updatedAt">): Draft => {
  const drafts = getDrafts();
  const newDraft: Draft = {
    ...draft,
    id: generateDraftId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  drafts.unshift(newDraft);
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  return newDraft;
};

export const updateDraft = (id: string, updates: Partial<Omit<Draft, "id" | "createdAt">>): Draft | null => {
  const drafts = getDrafts();
  const index = drafts.findIndex((d) => d.id === id);
  if (index === -1) return null;

  drafts[index] = {
    ...drafts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  return drafts[index];
};

export const deleteDraft = (id: string): boolean => {
  const drafts = getDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  if (filtered.length === drafts.length) return false;
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const getDraftById = (id: string): Draft | null => {
  const drafts = getDrafts();
  return drafts.find((d) => d.id === id) || null;
};

export const duplicateDraft = (id: string): Draft | null => {
  const original = getDraftById(id);
  if (!original) return null;

  const duplicated: Draft = {
    id: generateDraftId(),
    title: `${original.title} (Copy)`,
    description: original.description,
    practiceArea: original.practiceArea,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const drafts = getDrafts();
  const originalIndex = drafts.findIndex((d) => d.id === id);
  // Insert after the original
  drafts.splice(originalIndex + 1, 0, duplicated);
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  return duplicated;
};

export const isDraftExpiring = (draft: Draft, daysThreshold = 30): boolean => {
  const updatedAt = new Date(draft.updatedAt);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays >= daysThreshold;
};

export const getDraftAge = (draft: Draft): number => {
  const updatedAt = new Date(draft.updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
};

export const hasDrafts = (): boolean => {
  return getDrafts().length > 0;
};

export const getMostRecentDraft = (): Draft | null => {
  const drafts = getDrafts();
  return drafts.length > 0 ? drafts[0] : null;
};

// Cleanup expired drafts older than 60 days
export const cleanupExpiredDrafts = (): number => {
  const drafts = getDrafts();
  const now = new Date();
  
  const validDrafts = drafts.filter((draft) => {
    const updatedAt = new Date(draft.updatedAt);
    const diffInDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays < EXPIRY_DAYS;
  });

  const removedCount = drafts.length - validDrafts.length;
  
  if (removedCount > 0) {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(validDrafts));
  }
  
  return removedCount;
};

// Run cleanup once per day
export const runStartupCleanup = (): { cleaned: boolean; removedCount: number } => {
  const lastCleanup = localStorage.getItem(CLEANUP_KEY);
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (lastCleanup === today) {
    return { cleaned: false, removedCount: 0 };
  }

  const removedCount = cleanupExpiredDrafts();
  localStorage.setItem(CLEANUP_KEY, today);
  
  return { cleaned: true, removedCount };
};

// Migration function for old single-draft format
export const migrateOldDraft = (): void => {
  const OLD_KEY = "legal-matter-draft";
  const oldDraft = localStorage.getItem(OLD_KEY);
  if (oldDraft) {
    try {
      const parsed = JSON.parse(oldDraft);
      if (parsed.title || parsed.description || parsed.practiceArea) {
        const drafts = getDrafts();
        const migratedDraft: Draft = {
          id: generateDraftId(),
          title: parsed.title || "",
          description: parsed.description || "",
          practiceArea: parsed.practiceArea || "",
          createdAt: parsed.savedAt || new Date().toISOString(),
          updatedAt: parsed.savedAt || new Date().toISOString(),
        };
        drafts.unshift(migratedDraft);
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
      }
      localStorage.removeItem(OLD_KEY);
    } catch (e) {
      console.error("Failed to migrate old draft");
    }
  }
};
