import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { Transactions } from './pages/Transactions';
import { Reconciliation } from './pages/Reconciliation';
import { Building2, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Fixed Left Sidebar (45% Scope) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Sticky Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Acme Global Technologies Inc.</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>USD Functional Currency</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 1 Milestone (45% Scope Active)</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
              CPA
            </div>
          </div>
        </header>

        {/* Page Content Body - 45% Scope Only */}
        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'overview' && <Overview onNavigate={setCurrentTab} />}
          {currentTab === 'transactions' && <Transactions />}
          {currentTab === 'reconciliation' && <Reconciliation />}
        </main>
      </div>
    </div>
  );
}

export default App;
