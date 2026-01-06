import React, { useState, useEffect } from 'react';
import { UserProfile, METRICS_CONFIG, BodyMetrics } from '../types';
import { Save, Calendar, Ruler, Target, User, Activity, TrendingDown, TrendingUp, BarChart3, AlertTriangle, Trash2 } from 'lucide-react';
import * as Storage from '../services/storageService';

interface SettingsViewProps {
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
  onReset: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onSave, onCancel, onReset }) => {
  // Use string values for form data to handle decimals and empty states correctly during typing
  const [formData, setFormData] = useState({
    height: '',
    birthDate: '',
    targetWeight: '',
    targetBodyFat: '',
    targetBMI: '',
    weightGoal: 'lose' as 'lose' | 'gain',
    preferredChartMetric: 'weight' as keyof BodyMetrics
  });
  
  const [age, setAge] = useState<number>(0);

  useEffect(() => {
    const profile = Storage.loadUserProfile();
    
    // If user previously selected BMR (which is now hidden from dashboard), default to weight
    let chartMetric = profile.preferredChartMetric || 'weight';
    if (chartMetric === 'basalMetabolism') {
        chartMetric = 'weight';
    }

    setFormData({
        height: String(profile.height || ''),
        birthDate: profile.birthDate || '',
        targetWeight: String(profile.targetWeight || ''),
        targetBodyFat: String(profile.targetBodyFat || ''),
        targetBMI: String(profile.targetBMI || ''),
        weightGoal: profile.weightGoal || 'lose',
        preferredChartMetric: chartMetric
    });
  }, []);

  useEffect(() => {
    calculateAge(formData.birthDate);
  }, [formData.birthDate]);

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return;
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setAge(age);
  };

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProfile: UserProfile = {
        height: parseInt(formData.height) || 0,
        birthDate: formData.birthDate,
        targetWeight: parseFloat(formData.targetWeight) || 0,
        targetBodyFat: parseFloat(formData.targetBodyFat) || 0,
        targetBMI: parseFloat(formData.targetBMI) || 0,
        weightGoal: formData.weightGoal,
        preferredChartMetric: formData.preferredChartMetric
    };

    Storage.saveUserProfile(newProfile);
    onSave(newProfile);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-orange-500" />
            Personal Profile
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your physical stats and targets.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Personal Stats Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Birth Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">Age: {age} years</p>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Ruler className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="100"
                    max="250"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="border-t border-border"></div>

          {/* Preferences Section */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Preferences
            </h3>
            
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard Chart Metric</label>
                <div className="relative">
                   <select
                      value={formData.preferredChartMetric}
                      onChange={(e) => handleChange('preferredChartMetric', e.target.value as keyof BodyMetrics)}
                      className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors appearance-none"
                   >
                       {Object.values(METRICS_CONFIG)
                        .filter(m => m.key !== 'basalMetabolism') // Exclude BMR from dashboard chart selector
                        .map((metric) => (
                           <option key={metric.key} value={metric.key}>
                               {metric.label} ({metric.unit})
                           </option>
                       ))}
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                   </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select which metric is displayed on the main dashboard graph.</p>
             </div>
          </div>

           <div className="border-t border-border"></div>

          {/* Targets Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" /> Targets
            </h3>
            
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl mb-4">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight Goal Type</label>
                 <div className="flex gap-4">
                    <button 
                        type="button"
                        onClick={() => handleChange('weightGoal', 'lose')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                            formData.weightGoal === 'lose' 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-md' 
                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'
                        }`}
                    >
                        <TrendingDown className="w-5 h-5" />
                        <span className="font-medium">Lose Weight</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleChange('weightGoal', 'gain')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                            formData.weightGoal === 'gain' 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' 
                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300'
                        }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Gain Muscle/Weight</span>
                    </button>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Weight */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.targetWeight}
                  onChange={(e) => handleChange('targetWeight', e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                />
              </div>

              {/* Target Body Fat */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Body Fat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.targetBodyFat}
                  onChange={(e) => handleChange('targetBodyFat', e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                />
              </div>

               {/* Target BMI */}
               <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target BMI</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.targetBMI}
                  onChange={(e) => handleChange('targetBMI', e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                />
              </div>

            </div>
          </div>

          <div className="border-t border-border"></div>
          
          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                  Permanently delete all recorded metrics and history. This action cannot be undone.
              </p>
              <button
                  type="button"
                  onClick={() => {
                      if(window.confirm('Are you sure you want to delete all data?')) {
                          onReset();
                      }
                  }}
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                  <Trash2 className="w-3 h-3" /> Reset Application Data
              </button>
          </div>

          <div className="border-t border-border"></div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3">
             <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;