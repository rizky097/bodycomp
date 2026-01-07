
export interface BodyMetrics {
  id: string;
  date: string; // ISO String
  weight?: number;
  skeletalMuscle?: number;
  fatMass?: number;
  bmi?: number;
  bodyFatPercent?: number;
  visceralFat?: number;
  basalMetabolism?: number;
  healthScore?: number;
  rawText?: string;
}

export interface UserProfile {
  height: number; // cm
  birthDate: string; // YYYY-MM-DD
  targetWeight: number; // kg
  targetBodyFat: number; // %
  targetBMI: number;
  weightGoal: 'lose' | 'gain';
  preferredChartMetric?: keyof BodyMetrics; // New field
}

export interface MetricConfig {
  key: keyof BodyMetrics;
  label: string;
  unit: string;
  color: string;
  description?: string;
}

export const METRICS_CONFIG: Record<string, MetricConfig> = {
  weight: { key: 'weight', label: 'Weight', unit: 'kg', color: '#3b82f6' },
  skeletalMuscle: { key: 'skeletalMuscle', label: 'Skeletal Muscle', unit: 'kg', color: '#10b981' },
  fatMass: { key: 'fatMass', label: 'Fat Mass', unit: 'kg', color: '#f59e0b' },
  bodyFatPercent: { key: 'bodyFatPercent', label: 'Body Fat', unit: '%', color: '#ef4444' },
  bmi: { key: 'bmi', label: 'BMI', unit: '', color: '#8b5cf6' },
  healthScore: { key: 'healthScore', label: 'Health Score', unit: '/100', color: '#ec4899' },
  visceralFat: { key: 'visceralFat', label: 'Visceral Fat', unit: 'lvl', color: '#6366f1' },
  basalMetabolism: { key: 'basalMetabolism', label: 'BMR', unit: 'kcal', color: '#14b8a6' },
};
