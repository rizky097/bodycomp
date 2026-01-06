import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Camera, Check, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { BodyMetrics, METRICS_CONFIG } from '../types';
import { extractMetricsFromImage } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface AddEntryModalProps {
  onClose: () => void;
  onSave: (entry: BodyMetrics) => void;
  onDelete?: (id: string) => void;
  initialData?: BodyMetrics | null;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ onClose, onSave, onDelete, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Use strings for inputs to prevent parsing issues while typing (e.g. trailing decimal points)
  const [formData, setFormData] = useState<Record<string, string>>({
    date: new Date().toISOString().split('T')[0],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      const stringData: Record<string, string> = {};
      
      // Handle date
      if (initialData.date) {
        stringData.date = initialData.date.split('T')[0];
      }

      // Handle numerical metrics
      Object.keys(METRICS_CONFIG).forEach((key) => {
        const val = initialData[key as keyof BodyMetrics];
        if (val !== undefined && val !== null) {
            stringData[key] = String(val);
        }
      });
      
      setFormData(prev => ({ ...prev, ...stringData }));
      setStep('verify');
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const extracted = await extractMetricsFromImage(base64String);
          
          // Convert extracted numbers to strings for the form
          const extractedStrings: Record<string, string> = {};
          if (extracted.date) extractedStrings.date = extracted.date.split('T')[0];
          
          Object.keys(METRICS_CONFIG).forEach((key) => {
             const val = extracted[key as keyof BodyMetrics];
             if (typeof val === 'number') {
                 extractedStrings[key] = String(val);
             }
          });

          setFormData(prev => ({
            ...prev,
            ...extractedStrings
          }));
          setStep('verify');
        } catch (err) {
            console.error(err);
            alert("Failed to analyze image. Please try again or enter manually.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const adjustValue = (key: string, delta: number) => {
    setFormData(prev => {
      const currentVal = parseFloat(prev[key] || '0');
      const newVal = parseFloat((currentVal + delta).toFixed(1));
      return {
        ...prev,
        [key]: String(Math.max(0, newVal))
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse strings back to numbers for saving
    const entry: BodyMetrics = {
      id: initialData?.id || uuidv4(),
      date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      weight: parseFloat(formData.weight || '0'),
      skeletalMuscle: parseFloat(formData.skeletalMuscle || '0'),
      fatMass: parseFloat(formData.fatMass || '0'),
      bmi: parseFloat(formData.bmi || '0'),
      bodyFatPercent: parseFloat(formData.bodyFatPercent || '0'),
      visceralFat: parseFloat(formData.visceralFat || '0'),
      basalMetabolism: parseFloat(formData.basalMetabolism || '0'),
      healthScore: parseFloat(formData.healthScore || '0'),
    };
    
    onSave(entry);
    onClose();
  };

  const handleDeleteClick = () => {
      if (!initialData || !onDelete) return;

      if (deleteConfirm) {
          onDelete(initialData.id);
          onClose();
      } else {
          setDeleteConfirm(true);
          // Reset confirm state after 3 seconds if not clicked
          setTimeout(() => setDeleteConfirm(false), 3000);
      }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-zinc-800">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'Edit Entry' : (step === 'upload' ? 'New Entry' : 'Verify Data')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-colors group"
              >
                <div className="w-16 h-16 bg-orange-100 dark:bg-zinc-800 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Upload Receipt Photo</h3>
                <p className="text-gray-500 dark:text-zinc-500 text-sm">AI will extract the data automatically</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-500">Or enter manually</span>
                </div>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Skip to Manual Entry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.values(METRICS_CONFIG).map((config) => (
                  <div key={config.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      {config.label} <span className="text-gray-400 text-xs">({config.unit})</span>
                    </label>
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => adjustValue(config.key, -0.1)}
                            className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-l-xl border-r border-gray-200 dark:border-zinc-700 transition-colors z-10"
                            tabIndex={-1}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <input
                            type="number"
                            step="0.1"
                            value={formData[config.key] ?? ''}
                            onChange={(e) => handleInputChange(config.key, e.target.value)}
                            className="w-full p-3 px-12 text-center rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 dark:text-white bg-white dark:bg-zinc-800 [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0.0"
                            style={{ MozAppearance: 'textfield' }}
                        />
                        <button 
                            type="button"
                            onClick={() => adjustValue(config.key, 0.1)}
                            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-r-xl border-l border-gray-200 dark:border-zinc-700 transition-colors z-10"
                            tabIndex={-1}
                        >
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className={`px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                            deleteConfirm 
                            ? 'bg-red-600 text-white hover:bg-red-700 w-32' 
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                        }`}
                    >
                        {deleteConfirm ? (
                            <span className="text-xs font-bold animate-pulse">Confirm?</span>
                        ) : (
                            <Trash2 className="w-5 h-5" />
                        )}
                    </button>
                )}
                <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    {initialData ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;