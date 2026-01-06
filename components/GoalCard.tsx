import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GoalCardProps {
  label: string;
  currentValue: number;
  targetValue: number;
  startValue?: number;
  unit: string;
}

const GoalCard: React.FC<GoalCardProps> = ({ label, currentValue, targetValue, startValue, unit }) => {
  const remaining = Math.abs(currentValue - targetValue);
  let isGoalMet = false;
  let progress = 0;
  
  if (startValue !== undefined) {
      const totalDist = targetValue - startValue;
      const currentDist = currentValue - startValue;
      
      // Check for "Maintain" goal (Start ~= Target)
      if (Math.abs(totalDist) < 0.05) {
          isGoalMet = remaining < 0.5; // Close enough to target
          progress = isGoalMet ? 100 : 0;
      } else {
          // Standard progress calculation
          const ratio = currentDist / totalDist;
          progress = Math.min(100, Math.max(0, ratio * 100));

          // Check met condition based on direction
          if (totalDist > 0) {
              // Gain
              if (currentValue >= targetValue) isGoalMet = true;
          } else {
              // Lose
              if (currentValue <= targetValue) isGoalMet = true;
          }
      }
  } else {
      // Fallback if no start value provided: binary check
      isGoalMet = Math.abs(currentValue - targetValue) < 0.1;
      progress = isGoalMet ? 100 : 0;
  }
  
  if (isGoalMet) progress = 100;

  const data = [
    { name: 'Progress', value: progress },
    { name: 'Remaining', value: 100 - progress },
  ];

  const chartColor = isGoalMet ? '#10b981' : '#f97316'; // Emerald if met, Orange if pending

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label} Goal</h3>
        <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{targetValue.toFixed(1)}</span>
            <span className="text-xs text-gray-500">{unit}</span>
        </div>
        <p className={`text-xs ${isGoalMet ? 'text-emerald-500 font-medium' : 'text-gray-400 dark:text-zinc-500'}`}>
            {isGoalMet ? 'Goal met!' : `${remaining.toFixed(1)}${unit} to go`}
        </p>
      </div>
      
      <div className="w-14 h-14 relative">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={26}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                >
                    <Cell fill={chartColor} /> 
                    <Cell fill="#27272a" />
                </Pie>
            </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[10px] font-bold ${isGoalMet ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                {Math.round(progress)}%
            </span>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;