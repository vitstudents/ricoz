import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CheckCheck, 
  ShieldAlert, 
  BookOpen, 
  Bot, 
  BarChart3, 
  Settings as SettingsIcon,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAnomaliesCount?: number;
  pendingJournalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openAnomaliesCount = 0,
  pendingJournalsCount = 0
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCheck },
    { 
      id: 'anomalies', 
      label: 'Anomaly Detection', 
      icon: ShieldAlert, 
      badge: openAnomaliesCount > 0 ? openAnomaliesCount : undefined,
      badgeColor: 'bg-rose-500'
    },
    { 
      id: 'journals', 
      label: 'Journal Entries', 
      icon: BookOpen, 
      badge: pendingJournalsCount > 0 ? pendingJournalsCount : undefined,
      badgeColor: 'bg-amber-500'
    },
    { id: 'assistant', label: 'AI Finance Assistant', icon: Bot, isAi: true },
    { id: 'reports', label: 'Reports & Close', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg tracking-tight flex items-center gap-1.5">
              Ledger<span className="text-cyan-400">AI</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Agent</span>
            </div>
            <p className="text-xs text-slate-400">Continuous Bookkeeper</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              {item.isAi && !isActive && (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Organization and Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs border border-slate-600">
            SJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Sarah Jenkins, CPA</p>
            <p className="text-[11px] text-slate-400 truncate">Acme Global Tech Inc.</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Agent Online
          </span>
          <span className="text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

