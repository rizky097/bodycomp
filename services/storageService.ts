import { BodyMetrics, UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

export const generateDummyData = (): BodyMetrics[] => {
  const entries: BodyMetrics[] = [];
  const today = new Date();
  
  // Generate 14 weeks of data (approx 3.5 months)
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7)); // Weekly intervals
    
    // Progress factor: 0 = current (best), 1 = start (worst)
    // We want i=0 to be factor 0, i=13 to be factor 1
    const factor = i / 13; 
    
    // Add some random noise
    const noise = (scale: number) => (Math.random() - 0.5) * scale;
    
    // Simulate a weight loss journey: Start ~85kg -> End ~76kg
    const weight = 76 + (9 * factor) + noise(0.8);
    
    // Muscle gain: Start ~31kg -> End ~34kg
    const muscle = 34 - (3 * factor) + noise(0.4);
    
    // Body Fat loss: Start ~28% -> End ~18%
    const fatPct = 18 + (10 * factor) + noise(0.6);
    
    // Calculated fields
    const fatMass = weight * (fatPct / 100);
    const bmi = weight / ((1.75) * (1.75)); // Assuming 175cm height
    
    const entry: BodyMetrics = {
        id: uuidv4(),
        date: date.toISOString(),
        weight: parseFloat(weight.toFixed(1)),
        skeletalMuscle: parseFloat(muscle.toFixed(1)),
        bodyFatPercent: parseFloat(fatPct.toFixed(1)),
        fatMass: parseFloat(fatMass.toFixed(1)),
        bmi: parseFloat(bmi.toFixed(1)),
        visceralFat: Math.round(10 - (4 * (1 - factor))), // 10 -> 6
        basalMetabolism: Math.round(1750 - (50 * factor)), // Slightly drops as weight drops
        healthScore: Math.round(88 - (18 * factor) + noise(2)), // 70 -> 88
    };
    
    entries.push(entry);
  }
  
  // Sort by date descending
  const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveEntries(sorted);
  return sorted;
};

export const exportData = () => {
  const entries = loadEntries();
  const profile = loadUserProfile();
  const data = {
    version: 1,
    timestamp: new Date().toISOString(),
    profile,
    entries
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bodycomp_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<BodyMetrics[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!json.entries || !Array.isArray(json.entries)) {
          throw new Error("Invalid data format");
        }
        
        // Save
        if (json.profile) {
            saveUserProfile(json.profile);
        }
        saveEntries(json.entries);
        resolve(json.entries);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};