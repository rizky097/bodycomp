import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, LayoutDashboard, History, Trophy, Leaf, Moon, Sun, User } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BodyMetrics, METRICS_CONFIG, UserProfile } from './types';
import * as Storage from './services/storageService';
import MetricCard from './components/MetricCard';
import MetricDetailView from './components/MetricDetailView';
import AddEntryModal from './components/AddEntryModal';
import HistoryTable from './components/HistoryTable';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [entries, setEntries] = useState<BodyMetrics[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BodyMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'goals' | 'settings'>('dashboard');
  const [selectedMetric, setSelectedMetric] = useState<keyof BodyMetrics | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(Storage.loadUserProfile());
  
  // Navigation & Scroll State
  const previousTabRef = useRef<'dashboard' | 'history' | 'goals'>('dashboard');
  const scrollPositionRef = useRef(0);
  
  // Chart filter state
  const [timeRange, setTimeRange] = useState<string>('3M');

  // Toggle Theme
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Load entries
    const loaded = Storage.loadEntries();
    setEntries(loaded);
  }, []);

  // Scroll Management
  useEffect(() => {
    // Scroll to top when switching main tabs
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (selectedMetric) {
        // When entering detail view, scroll to top
        window.scrollTo(0, 0);
    } else if (activeTab === 'dashboard') {
        // When exiting detail view back to dashboard, restore scroll
        // Only restore if we are actually going back to dashboard, not switching tabs
        window.scrollTo(0, scrollPositionRef.current);
    }
  }, [selectedMetric, activeTab]);

  const handleNavClick = (tab: 'dashboard' | 'history' | 'goals') => {
    previousTabRef.current = tab;
    setActiveTab(tab);
    setSelectedMetric(null);
  };

  const handleProfileClick = () => {
    if (activeTab === 'settings') {
        // Toggle off: Go back to previous tab
        setActiveTab(previousTabRef.current);
    } else {
        // Toggle on: Go to settings
        setActiveTab('settings');
        setSelectedMetric(null);
    }
  };

  const handleMetricSelect = (key: keyof BodyMetrics) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedMetric(key);
  };

  const handleSaveEntry = (entry: BodyMetrics) => {
    // If editing, update. If new, add.
    if (editingEntry) {
        const updated = Storage.updateEntry(entry);
        setEntries(updated);
    } else {
        const updated = Storage.addEntry(entry);
        setEntries(updated);
    }
  };

  const handleDeleteEntry = (id: string) => {
    const updated = Storage.deleteEntry(id);
    setEntries(updated);
  };

  const handleProfileSave = (profile: UserProfile) => {
      setUserProfile(profile);
      setActiveTab(previousTabRef.current);
  };

  const latestEntry = entries[0];
  const previousEntry = entries[1];

  // Determine current chart metric settings based on user profile
  // Force fallback to 'weight' if 'basalMetabolism' is selected, as requested to be hidden from dashboard
  const rawChartMetricKey = userProfile.preferredChartMetric || 'weight';
  const chartMetricKey = rawChartMetricKey === 'basalMetabolism' ? 'weight' : rawChartMetricKey;
  const chartConfig = METRICS_CONFIG[chartMetricKey];

  // Prepare chart data based on timeRange
  const chartData = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    let windowSize = 1; // Default to no smoothing (1 point)

    switch(timeRange) {
        case '1M': 
            cutoff.setMonth(now.getMonth() - 1); 
            windowSize = 1;
            break;
        case '3M': 
            cutoff.setMonth(now.getMonth() - 3); 
            windowSize = 7; // Weekly rolling average
            break;
        case '6M': 
            cutoff.setMonth(now.getMonth() - 6); 
            windowSize = 10; // Smoother
            break;
        case '1Y':
            cutoff.setFullYear(now.getFullYear() - 1);
            windowSize = 14; // Even smoother (2 weeks approx)
            break;
        case 'ALL':
            cutoff = new Date(0);
            windowSize = 14;
            break;
        default: 
            cutoff.setMonth(now.getMonth() - 3);
            windowSize = 7;
    }

    // Filter and sort oldest to newest for chart and smoothing
    const sortedData = entries
        .filter(e => new Date(e.date) >= cutoff)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Apply Rolling Average Smoothing
    const smoothedData = sortedData.map((entry, index, arr) => {
        if (windowSize <= 1) return entry;
        
        // Dynamic window adjustment for start of array
        const start = Math.max(0, index - windowSize + 1);
        const windowSlice = arr.slice(start, index + 1);
        
        if (windowSlice.length === 0) return entry;

        const sum = windowSlice.reduce((acc, curr) => acc + (curr[chartMetricKey] as number), 0);
        const avg = sum / windowSlice.length;
        
        return {
            ...entry,
            [chartMetricKey]: parseFloat(avg.toFixed(2)) // Override metric with smoothed value
        };
    });

    return smoothedData.map(e => ({
      ...e,
      formattedDate: new Date(e.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
    }));
  }, [entries, timeRange, chartMetricKey]);

  // Metric Groups - Reordered as requested
  // Row 1: Weight, Muscle
  // Row 2: Fat %, Fat Mass
  const primaryMetricKeys = ['weight', 'skeletalMuscle', 'bodyFatPercent', 'fatMass'];
  const secondaryMetricKeys = ['bmi', 'healthScore', 'visceralFat', 'basalMetabolism'];

  return (
    <div className="min-h-screen pb-24 md:pb-10 font-sans selection:bg-orange-500/30 bg-background text-text transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
                <div className="bg-white text-black p-1.5 rounded-lg">
                    <Leaf className="w-5 h-5 fill-black" />
                </div>
                <h1 className="text-xl font-bold italic tracking-tight text-gray-900 dark:text-white">
                BodyComp
                </h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
                {['Dashboard', 'History', 'Goals'].map((item) => (
                    <button 
                        key={item}
                        onClick={() => handleNavClick(item.toLowerCase() as any)}
                        className={`text-sm font-medium transition-colors ${activeTab === item.toLowerCase() ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        {item}
                    </button>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowAddModal(true)}
                className="hidden md:flex items-center gap-2 bg-zinc-900 dark:bg-zinc-800 text-white dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors border border-transparent dark:border-zinc-700"
              >
                <Plus className="w-4 h-4" />
                Log Data
              </button>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1 hidden md:block"></div>
              
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={handleProfileClick}
                className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-all ${activeTab === 'settings' ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-black bg-orange-100 dark:bg-orange-900/30' : 'bg-zinc-200 dark:bg-zinc-700 hover:ring-2 hover:ring-gray-300 dark:hover:ring-zinc-600'}`}
                aria-label="Profile"
              >
                <User className={`w-5 h-5 ${activeTab === 'settings' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Detail View */}
        {selectedMetric ? (
            <MetricDetailView 
                metricKey={selectedMetric}
                config={METRICS_CONFIG[selectedMetric]}
                entries={entries}
                userProfile={userProfile}
                onBack={() => setSelectedMetric(null)}
            />
        ) : (
            <>
                {/* Title Section (Dashboard Only) */}
                {activeTab === 'dashboard' && (
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div>
                          <span className="text-xs font-bold text-orange-500 tracking-wider uppercase mb-1 block">Analytics</span>
                          <h2 className="text-3xl font-medium text-gray-900 dark:text-white tracking-tight">Health Overview</h2>
                      </div>
                      {latestEntry && (
                          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                                  Last sync: {new Date(latestEntry.date).toLocaleDateString()}
                              </span>
                          </div>
                      )}
                  </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full mb-6 ring-1 ring-orange-500/20">
                            <Leaf className="w-12 h-12 text-orange-600 dark:text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to BodyComp</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                            Start your health journey by logging your first body composition scan. We'll track your progress, analyze trends, and help you reach your goals.
                        </p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Log First Entry
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100">
                        {/* Primary Metrics Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {primaryMetricKeys.map(key => (
                              <MetricCard 
                                key={key}
                                config={METRICS_CONFIG[key]} 
                                value={latestEntry[key as keyof BodyMetrics] as number} 
                                previousValue={previousEntry?.[key as keyof BodyMetrics] as number}
                                onClick={() => handleMetricSelect(key as keyof BodyMetrics)}
                                userProfile={userProfile}
                              />
                            ))}
                        </div>

                        {/* Chart Section - Full Width */}
                        <div className="bg-card border border-border p-8 rounded-xl shadow-sm flex flex-col transition-colors duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{chartConfig.label} Trend</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {timeRange === 'All' ? 'All time' : `Past ${timeRange} history`}
                                    </p>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                                    {['1M', '3M', '6M', '1Y'].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setTimeRange(p)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === p ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fixed Height Container for Chart */}
                            <div className="h-[350px] w-[calc(100%+24px)] -ml-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f3f4f6"} />
                                        <XAxis 
                                            dataKey="formattedDate" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 12, fill: isDarkMode ? '#71717a' : '#9ca3af'}} 
                                            tickMargin={12}
                                        />
                                        <YAxis 
                                            domain={['auto', 'auto']} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 12, fill: isDarkMode ? '#71717a' : '#9ca3af'}} 
                                            width={48}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                                                borderColor: isDarkMode ? '#27272a' : '#e5e7eb', 
                                                borderRadius: '8px',
                                                color: isDarkMode ? '#fff' : '#000'
                                            }}
                                            itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                                            formatter={(value: number) => [value.toFixed(1) + ' ' + chartConfig.unit, chartConfig.label]}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={chartMetricKey} 
                                            stroke={chartConfig.color} 
                                            strokeWidth={2}
                                            fill="url(#chartGradient)"
                                            activeDot={{ r: 6, fill: chartConfig.color, stroke: isDarkMode ? '#09090b' : '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Secondary Metrics Breakdown */}
                        {entries.length > 0 && latestEntry && (
                        <div className="pt-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Body Composition Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {secondaryMetricKeys.map(key => (
                                  <MetricCard 
                                    key={key}
                                    config={METRICS_CONFIG[key]} 
                                    value={latestEntry[key as keyof BodyMetrics] as number} 
                                    previousValue={previousEntry?.[key as keyof BodyMetrics] as number}
                                    onClick={() => handleMetricSelect(key as keyof BodyMetrics)} 
                                    userProfile={userProfile}
                                  />
                                ))}
                            </div>
                        </div>
                        )}
                    </div>
                  )
                )}

                {activeTab === 'history' && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                         <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">History Log</h2>
                                <p className="text-gray-500 dark:text-gray-400">All recorded measurements</p>
                            </div>
                        </div>
                        <HistoryTable 
                            entries={entries} 
                            onSelect={(entry) => setEditingEntry(entry)} 
                            onDelete={handleDeleteEntry}
                        />
                    </div>
                )}
                
                {activeTab === 'goals' && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center py-20 bg-card rounded-xl border border-border">
                        <Trophy className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Goal Tracking</h2>
                        <p className="text-gray-500 dark:text-gray-400">Detailed goal setting and progress tracking coming soon.</p>
                    </div>
                )}
                
                {activeTab === 'settings' && (
                    <SettingsView onSave={handleProfileSave} onCancel={() => handleNavClick(previousTabRef.current)} />
                )}
            </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 mt-12 border-t border-border transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-zinc-500 gap-4">
            <p>&copy; 2026 BodyComp Inc.</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">Data Privacy</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">Export Data</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">Terms</a>
            </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 px-6 py-3 flex justify-between items-center pb-safe transition-colors duration-300">
         <button 
            onClick={() => handleNavClick('dashboard')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
         >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
         </button>
         
         <button 
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center justify-center -mt-8"
         >
            <div className="bg-gray-900 dark:bg-white text-white dark:text-black w-14 h-14 rounded-full shadow-lg flex items-center justify-center">
                <Plus className="w-6 h-6" />
            </div>
         </button>

         <button 
            onClick={() => handleNavClick('history')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
         >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-medium">History</span>
         </button>
      </div>

      {/* Modals */}
      {(showAddModal || editingEntry) && (
        <AddEntryModal 
            onClose={() => {
                setShowAddModal(false);
                setEditingEntry(null);
            }} 
            onSave={handleSaveEntry}
            onDelete={editingEntry ? handleDeleteEntry : undefined}
            initialData={editingEntry}
        />
      )}
    </div>
  );
};

export default App;