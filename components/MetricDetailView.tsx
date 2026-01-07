import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, Minus, Target, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BodyMetrics, MetricConfig, UserProfile } from '../types';

interface MetricDetailViewProps {
  metricKey: keyof BodyMetrics;
  config: MetricConfig;
  entries: BodyMetrics[];
  userProfile: UserProfile;
  onBack: () => void;
}

const MetricDetailView: React.FC<MetricDetailViewProps> = ({ metricKey, config, entries, userProfile, onBack }) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  const chartData = useMemo(() => {
    return [...entries].reverse().map(e => ({
      date: e.date,
      formattedDate: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: (typeof e[metricKey] === 'number' && Number.isFinite(e[metricKey])) ? (e[metricKey] as number) : null
    }));
  }, [entries, metricKey]);

  // Use the latest available valid value for this metric, skipping any gaps
  const currentVal = entries.find(e => typeof e[metricKey] === 'number' && Number.isFinite(e[metricKey]))?.[metricKey] as number | undefined;
  
  // Find the oldest recorded value in history (going backwards) to calculate start
  const oldestEntry = entries.slice().reverse().find(e => typeof e[metricKey] === 'number' && Number.isFinite(e[metricKey]));
  const oldestVal = oldestEntry ? (oldestEntry[metricKey] as number) : undefined;

  // Target Logic
  let targetValue: number | undefined;
  if (metricKey === 'weight') targetValue = userProfile.targetWeight;
  if (metricKey === 'bodyFatPercent') targetValue = userProfile.targetBodyFat;
  if (metricKey === 'bmi') targetValue = userProfile.targetBMI;

  let progress = 0;
  let remaining = 0;
  let showTarget = false;
  let isGoalMet = false;

  // Determine directionality for colors (Green vs Red arrows in history)
  let isInverseMetric = ['fatMass', 'bodyFatPercent', 'visceralFat', 'bmi'].includes(metricKey);

  if (targetValue !== undefined && oldestVal !== undefined && metricKey !== 'weight') {
      isInverseMetric = targetValue < oldestVal;
  }
  
  if (metricKey === 'weight') {
      isInverseMetric = userProfile.weightGoal === 'lose';
  }

  if (targetValue !== undefined && currentVal !== undefined && oldestVal !== undefined) {
    showTarget = true;
    remaining = Math.abs(currentVal - targetValue);
    
    const totalDist = targetValue - oldestVal;
    const currentDist = currentVal - oldestVal;

    if (Math.abs(totalDist) < 0.05) {
        isGoalMet = remaining < 0.5;
        progress = isGoalMet ? 100 : 0;
    } else {
        const rawProgress = (currentDist / totalDist) * 100;
        progress = Math.min(100, Math.max(0, rawProgress));

        if (totalDist > 0) {
            isGoalMet = currentVal >= targetValue;
        } else {
            isGoalMet = currentVal <= targetValue;
        }
        
        if (isGoalMet) progress = 100;
    }
  }

  const displayHistory = showAllHistory ? entries : entries.slice(0, 5);

  const getDiffElement = (current: number, prev: number) => {
    const diff = current - prev;
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    
    let trendColor = 'text-gray-400';
    if (isPositive) {
        trendColor = isInverseMetric ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400';
    }
    if (isNegative) {
        trendColor = isInverseMetric ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    }

    if (diff === 0) return <span className="text-gray-300 dark:text-zinc-600"><Minus className="w-4 h-4" /></span>;

    return (
      <div className={`flex items-center gap-1 ${trendColor} text-sm font-medium`}>
        {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span>{Math.abs(diff).toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{config.label} Details</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Historical analysis</p>
        </div>
      </div>

      {showTarget && targetValue !== undefined && currentVal !== undefined && (
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Goal Progress
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{currentVal.toFixed(1)}</span>
                            <span className="text-sm text-gray-400">/ {targetValue} {config.unit}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        {isGoalMet ? (
                            <div className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-bold">Reached</span>
                            </div>
                        ) : (
                            <span className="text-orange-500 font-bold text-lg">{Math.round(progress)}%</span>
                        )}
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {isGoalMet ? 'Target achieved!' : `${remaining.toFixed(1)} ${config.unit} to go`}
                        </p>
                    </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3 mt-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
      )}

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">Trend over time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{top: 5, right: 5, bottom: 5, left: 0}}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#71717a'}} 
              />
              <YAxis 
                domain={['auto', 'auto']} 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#71717a'}} 
                width={48}
              />
              <Tooltip 
                contentStyle={{
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--text)'
                }}
                formatter={(value: number) => [value ? value.toFixed(1) + ' ' + config.unit : 'No Data', config.label]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={config.label}
                stroke={config.color} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
                strokeWidth={2}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-zinc-800/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 dark:text-white">History Log</h3>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Showing {displayHistory.length} of {entries.length}
          </span>
        </div>
        <div className="divide-y divide-border">
          {displayHistory.map((entry, index) => {
            const currentValue = entry[metricKey] as number | undefined;
            if (typeof currentValue !== 'number' || !Number.isFinite(currentValue)) {
                 return (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors opacity-50">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                                {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <span className="text-sm text-gray-400 italic">Not Recorded</span>
                    </div>
                 );
            }

            const realIndex = entries.findIndex(e => e.id === entry.id);
            const prevValidEntry = entries.slice(realIndex + 1).find(e => typeof e[metricKey] === 'number' && Number.isFinite(e[metricKey]));
            const prevValue = prevValidEntry ? (prevValidEntry[metricKey] as number) : undefined;

            return (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  {prevValue !== undefined && getDiffElement(currentValue, prevValue)}
                  <span className="font-bold text-lg text-gray-800 dark:text-white w-20 text-right">
                    {currentValue.toFixed(1)} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">{config.unit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {entries.length > 5 && (
            <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full p-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-t border-border"
            >
                {showAllHistory ? "Show Less" : "View All History"}
            </button>
        )}
      </div>
    </div>
  );
};

export default MetricDetailView;