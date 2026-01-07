import React from 'react';
import { ArrowUp, ArrowDown, Scale, Dumbbell, Droplet, Activity } from 'lucide-react';
import { MetricConfig, UserProfile } from '../types';

interface MetricCardProps {
  config: MetricConfig;
  value?: number;
  previousValue?: number;
  onClick?: () => void;
  userProfile?: UserProfile;
}

const MetricCard: React.FC<MetricCardProps> = ({ config, value, previousValue, onClick, userProfile }) => {
  const hasValue = value !== undefined && value !== null;
  const hasPrevious = previousValue !== undefined && previousValue !== null;
  
  const diff = (hasValue && hasPrevious) ? (value! - previousValue!) : 0;
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isZero = diff === 0;
  
  let isInverseMetric = ['fatMass', 'bodyFatPercent', 'visceralFat', 'bmi'].includes(config.key);
  
  // If we have profile data, we can be smarter about weight
  if (config.key === 'weight' && userProfile) {
      if (userProfile.weightGoal === 'lose') {
          isInverseMetric = true;
      } else {
          isInverseMetric = false;
      }
  } else if (config.key === 'weight') {
      // Default to inverse (lose) if no profile provided
      isInverseMetric = true; 
  }
  
  // Determine Trend Color
  let trendColor = 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400';
  let Icon = ArrowUp;

  if (isPositive) {
    trendColor = isInverseMetric 
      ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
    Icon = ArrowUp;
  }
  if (isNegative) {
    trendColor = isInverseMetric 
      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
      : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400';
    Icon = ArrowDown;
  }
  
  // Icon Mapping
  const getIcon = () => {
      switch(config.key) {
          case 'weight': return <Scale className="w-4 h-4" />;
          case 'skeletalMuscle': return <Dumbbell className="w-4 h-4" />;
          case 'fatMass': return <Droplet className="w-4 h-4" />;
          case 'healthScore': return <Activity className="w-4 h-4" />;
          default: return <Activity className="w-4 h-4" />;
      }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-card border border-border p-5 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between h-full`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{config.label}</h3>
        <div className="text-gray-400 dark:text-zinc-500">
            {getIcon()}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {hasValue ? value!.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '--'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{config.unit}</span>
        </div>

        {config.key === 'healthScore' ? (
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 mb-1">
                <div 
                    className="bg-orange-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(value || 0, 100)}%` }}
                ></div>
            </div>
        ) : (
            (hasValue && hasPrevious) ? (
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${trendColor}`}>
                        {!isZero && <Icon className="w-3 h-3" />}
                        <span>{Math.abs(diff).toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">vs last scan</span>
                </div>
            ) : (
                <div className="h-6"></div> // Spacer to keep card height consistent
            )
        )}
      </div>
    </div>
  );
};

export default MetricCard;