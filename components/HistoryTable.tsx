import React, { useState } from 'react';
import { BodyMetrics } from '../types';
import { ChevronRight, Trash2 } from 'lucide-react';

interface HistoryTableProps {
  entries: BodyMetrics[];
  onSelect: (entry: BodyMetrics) => void;
  onDelete: (id: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ entries, onSelect, onDelete }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (deleteId === id) {
          onDelete(id);
          setDeleteId(null);
      } else {
          setDeleteId(id);
          setTimeout(() => setDeleteId(null), 3000);
      }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <p className="text-gray-400 dark:text-zinc-500">No entries recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div 
            key={entry.id} 
            onClick={() => onSelect(entry)}
            className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center justify-between hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 flex flex-col items-center justify-center min-w-[4rem] border border-gray-100 dark:border-zinc-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">
                        {new Date(entry.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                        {new Date(entry.date).getDate()}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{entry.weight} kg</span>
                        <div className="w-1 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{entry.bodyFatPercent}% Body Fat</span>
                     </div>
                     <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500">
                        <span>Muscle: {entry.skeletalMuscle}kg</span>
                        <span>•</span>
                        <span>BMI: {entry.bmi}</span>
                        <span>•</span>
                        <span>Score: {entry.healthScore}</span>
                     </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={(e) => handleDeleteClick(e, entry.id)}
                    className={`p-2 rounded-full transition-all ${
                        deleteId === entry.id 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'text-gray-300 dark:text-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-500 dark:hover:text-red-400'
                    }`}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors" />
            </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTable;