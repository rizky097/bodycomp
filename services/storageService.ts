import { BodyMetrics, UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'body_comp_tracker_data_v1';
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

export const seedDummyData = (): BodyMetrics[] => {
    const entries: BodyMetrics[] = [];
    const now = new Date();
    
    // Generate 52 weeks (1 year) of data
    // Simulating a "Cut & Recomp" journey:
    // Weight: 85kg -> 76kg
    // Muscle: 33kg -> 36kg
    // Body Fat: 25% -> 15%
    
    for (let i = 0; i < 52; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7)); // One entry per week
        
        // Progress factor: 1.0 (now) down to 0.0 (52 weeks ago)
        // Inverting for calculation: 0 (now) to 1 (start)
        const t = i / 51; 
        
        // Start values (t=1) -> End values (t=0)
        
        // Weight: Starts high, drops
        const baseWeight = 76 + (9 * t); // 76 + 9 = 85 start
        const weightNoise = (Math.random() - 0.5) * 1.2;
        const weight = parseFloat((baseWeight + weightNoise).toFixed(1));

        // Muscle: Starts lower, increases
        const baseMuscle = 36 - (3 * t); // 36 - 3 = 33 start
        const muscleNoise = (Math.random() - 0.5) * 0.4;
        const skeletalMuscle = parseFloat((baseMuscle + muscleNoise).toFixed(1));

        // Body Fat %: Starts high, drops significantly
        const baseFatPercent = 15 + (10 * t); // 15 + 10 = 25 start
        const fatNoise = (Math.random() - 0.5) * 0.8;
        const bodyFatPercent = parseFloat((baseFatPercent + fatNoise).toFixed(1));
        
        // Derived Fat Mass
        const fatMass = parseFloat((weight * (bodyFatPercent / 100)).toFixed(1));
        
        // BMI
        const bmi = parseFloat((weight / (1.78 * 1.78)).toFixed(1)); // Assuming 1.78m height

        entries.push({
            id: uuidv4(),
            date: date.toISOString(),
            weight,
            skeletalMuscle,
            fatMass,
            bmi,
            bodyFatPercent,
            visceralFat: Math.max(4, Math.round(10 - (4 * (1-t)))), // Drops from ~10 to ~6
            basalMetabolism: Math.round(1650 + (weight * 5)),
            healthScore: Math.min(96, Math.round(70 + (25 * (1-t)))), // Improves from 70 to 95
        });
    }
    
    // Sort descending by date (newest first)
    const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveEntries(sorted);
    return sorted;
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