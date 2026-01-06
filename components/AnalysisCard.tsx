import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const AnalysisCard: React.FC = () => {
  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-bold text-orange-500 tracking-wider uppercase">Analysis</h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 flex-grow">
        Your metabolic rate seems to have stabilized. The combination of increased protein intake and resistance training is showing positive correlation with muscle retention during this cut.
      </p>
      
      <button className="flex items-center text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors group">
        View detailed report 
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default AnalysisCard;