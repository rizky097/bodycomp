import { BodyMetrics, UserProfile } from '../types';

// Changed key to ensure fresh start for deployment (ignores previous dummy data)
const STORAGE_KEY = 'body_comp_tracker_data_release_v1';
const PROFILE_KEY = 'body_comp_user_profile_v1';

export const saveEntries = (entries: BodyMetrics[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save entries', e);
  }
};

export const loadEntries = (): BodyMetrics[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load entries', e);
    return [];
  }
};

export const saveUserProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
};

export const loadUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
    // Default profile
    return {
        height: 175,
        birthDate: '1995-01-01',
        targetWeight: 70,
        targetBodyFat: 15,
        targetBMI: 22,
        weightGoal: 'lose',
        preferredChartMetric: 'weight'
    };
  } catch (e) {
    console.error('Failed to load profile', e);
    return {
        height: 175,
        birthDate: '1995-01-01',
        targetWeight: 70,
        targetBodyFat: 15,
        targetBMI: 22,
        weightGoal: 'lose',
        preferredChartMetric: 'weight'
    };
  }
};

export const addEntry = (entry: BodyMetrics): BodyMetrics[] => {
  const current = loadEntries();
  const updated = [entry, ...current].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveEntries(updated);
  return updated;
};

export const updateEntry = (entry: BodyMetrics): BodyMetrics[] => {
  const current = loadEntries();
  const index = current.findIndex(e => e.id === entry.id);
  if (index !== -1) {
    current[index] = entry;
    // Re-sort just in case date changed
    const updated = current.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveEntries(updated);
    return updated;
  }
  return current;
};

export const deleteEntry = (id: string): BodyMetrics[] => {
  const current = loadEntries();
  const updated = current.filter(e => e.id !== id);
  saveEntries(updated);
  return updated;
};

export const clearAllEntries = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear entries', e);
  }
};