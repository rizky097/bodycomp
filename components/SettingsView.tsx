import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, METRICS_CONFIG, BodyMetrics } from '../types';
import { Save, Calendar, Ruler, User, Activity, BarChart3, AlertTriangle, Trash2, Database, Download, Upload } from 'lucide-react';
import * as Storage from '../services/storageService';

interface SettingsViewProps {
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
  onReset: () => void;
  onGenerateDemo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onSave, onCancel, onReset, onGenerateDemo, onExport, onImport }) => {
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
  const [resetConfirm, setResetConfirm] = useState(false);
  const [demoConfirm, setDemoConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleResetClick = () => {
    if (resetConfirm) {
        onReset();
        setResetConfirm(false);
    } else {
        setResetConfirm(true);
        setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const handleDemoClick = () => {
    if (demoConfirm) {
        onGenerateDemo();
        setDemoConfirm(false);
    } else {
        setDemoConfirm(true);
        setTimeout(() => setDemoConfirm(false), 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onImport(file);
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
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
                      onChange={(e) => handleChange('preferredChartMetric', e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg leading-5 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors appearance-none"
                   >
                       {Object.values(METRICS_CONFIG)
                        .filter(m => m.key !== 'basalMetabolism') // Filter out BMR as requested
                        .map(m => (
                           <option key={m.key} value={m.key}>{m.label}</option>
                       ))}
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                   </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select which metric appears on the main chart.</p>
             </div>
          </div>

          <div className="border-t border-border"></div>

          {/* Targets Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
               <Activity className="w-4 h-4" /> Targets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Weight</label>
                    <input
                        type="number"
                        step="0.1"
                        value={formData.targetWeight}
                        onChange={(e) => handleChange('targetWeight', e.target.value)}
                        className="block w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="kg"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Body Fat</label>
                    <input
                        type="number"
                        step="0.1"
                        value={formData.targetBodyFat}
                        onChange={(e) => handleChange('targetBodyFat', e.target.value)}
                        className="block w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="%"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal BMI</label>
                    <input
                        type="number"
                        step="0.1"
                        value={formData.targetBMI}
                        onChange={(e) => handleChange('targetBMI', e.target.value)}
                        className="block w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="BMI"
                    />
                 </div>
            </div>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Goal</label>
                <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.weightGoal === 'lose' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'}`}>
                        <input 
                            type="radio" 
                            name="weightGoal" 
                            value="lose" 
                            checked={formData.weightGoal === 'lose'}
                            onChange={() => setFormData(prev => ({...prev, weightGoal: 'lose'}))}
                            className="hidden"
                        />
                        Lose Weight
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.weightGoal === 'gain' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'}`}>
                        <input 
                            type="radio" 
                            name="weightGoal" 
                            value="gain" 
                            checked={formData.weightGoal === 'gain'}
                            onChange={() => setFormData(prev => ({...prev, weightGoal: 'gain'}))}
                            className="hidden"
                        />
                        Build Muscle
                    </label>
                </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
             <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
             >
                Cancel
             </button>
             <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
             >
                <Save className="w-4 h-4" />
                Save Changes
             </button>
          </div>
        </form>
      </div>

      {/* Danger / Demo Zone */}
      <div className="mt-8 bg-card border border-red-200 dark:border-red-900/30 rounded-xl overflow-hidden">
         <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                Data Management
            </h3>
            
            {/* Import / Export */}
            <div className="flex flex-col gap-4 mb-6">
                 <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Backup & Restore</h4>
                 <div className="flex gap-4">
                     <button
                        type="button"
                        onClick={onExport}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                     >
                        <Download className="w-4 h-4" />
                        Export Data
                     </button>
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                     >
                        <Upload className="w-4 h-4" />
                        Import Data
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json"
                     />
                 </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-zinc-800 my-6"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                     <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Demo Mode
                     </h4>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        Populate the app with 3 months of realistic sample data to test visualizations.
                        <span className="block mt-1 text-xs text-orange-500">Note: This will overwrite existing data.</span>
                     </p>
                </div>
                 <button
                    type="button"
                    onClick={handleDemoClick}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors min-w-[140px] ${
                        demoConfirm ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 animate-pulse ring-1 ring-orange-500' : ''
                    }`}
                 >
                    <Database className="w-4 h-4" />
                    {demoConfirm ? 'Confirm Demo?' : 'Generate Data'}
                 </button>
            </div>

            <div className="h-px bg-gray-200 dark:bg-zinc-800 my-6"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex-1">
                     <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reset All Data
                     </h4>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently remove all your recorded measurements. This action cannot be undone.
                     </p>
                </div>
                <button
                    type="button"
                    onClick={handleResetClick}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-all min-w-[140px] ${
                        resetConfirm 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                    <Trash2 className="w-4 h-4" />
                    {resetConfirm ? 'Confirm Reset?' : 'Reset Data'}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;