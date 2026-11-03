import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CheckCheck, 
  ArrowRightLeft,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab
}) => {
  // Phase 1 (45% Scope) Active Navigation Items
  const activeNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reconciliation', label: 'Reconciliation Center', icon: CheckCheck },
  ];

  // Deferred Phase 2 & 3 Roadmap Items
  const roadmapItems = [
    { label: 'Anomaly Detection', phase: 'Phase 2' },
    { label: 'Journal Entries (Drafts)', phase: 'Phase 2' },
    { label: 'AI Finance Assistant', phase: 'Phase 2' },
    { label: 'Month-End Close Reports', phase: 'Phase 2' },
    { label: 'ERP & Bank Integrations', phase: 'Phase 3' },
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
            </div>
            <p className="text-[11px] font-semibold text-emerald-400">Phase 1 • 45% Scope</p>
          </div>
        </div>
      </div>

      {/* Navigation List - 45% Core Scope */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Phase 1 Core Engine (Active)
          </div>
          <nav className="space-y-1">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Phase 2 / 3 Deferred Roadmap Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Upcoming Milestones</span>
            <span className="text-[10px] text-slate-400">55% Remaining</span>
          </div>
          <div className="space-y-1">
            {roadmapItems.map((item, idx) => (
              <div
                key={idx}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 bg-slate-900/40 border border-slate-800/40"
              >
                <div className="flex items-center space-x-2">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {item.phase}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress & Milestone Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span className="font-semibold">Development Progress</span>
          <span className="font-mono text-cyan-400 font-bold">45% MVP</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500" 
            style={{ width: '45%' }}
          ></div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Focus: Multi-Currency Feeds, AI Categorization & 3-Tier Reconciliation
        </p>
      </div>
    </aside>
  );
};
