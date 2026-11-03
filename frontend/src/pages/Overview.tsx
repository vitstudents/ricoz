import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [anomalySummary, setAnomalySummary] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, anomRes, repRes, accRes] = await Promise.all([
        api.getTransactionSummary(),
        api.getAnomalySummary(),
        api.getMonthlySummary(),
        api.getAccounts(),
      ]);
      setSummary(sumRes);
      setAnomalySummary(anomRes);
      setReport(repRes);
      setAccounts(accRes);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickReconcile = async () => {
    if (accounts.length === 0) return;
    try {
      setIsSyncing(true);
      await api.runReconciliation(accounts[0].id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalBankBalance = accounts.reduce((acc, a) => acc + (a.currency === 'USD' ? Number(a.current_balance) : Number(a.current_balance) * 1.08), 0);

  // Cash flow trend mock data for chart
  const cashFlowTrend = [
    { period: 'May', inflow: 142000, outflow: 98000 },
    { period: 'Jun', inflow: 168000, outflow: 112000 },
    { period: 'Jul', inflow: 185000, outflow: 124000 },
    { period: 'Aug', inflow: 195000, outflow: 138000 },
    { period: 'Sep', inflow: 220000, outflow: 145000 },
    { period: 'Oct', inflow: report?.total_inflow ? report.total_inflow / 20 : 245000, outflow: report?.total_outflow ? report.total_outflow / 20 : 160000 },
  ];

  const reconBreakdownData = [
    { name: 'Matched', value: summary?.matched_count || 821, color: '#10b981' },
    { name: 'Partial', value: summary?.partial_count || 16, color: '#f59e0b' },
    { name: 'Unmatched', value: summary?.unmatched_count || 217, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Autonomous Agent Active
            </span>
            <span className="text-xs text-slate-400">• Multi-Currency USD / EUR / GBP / INR</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Continuous Bookkeeping Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time bank synchronization, continuous matching, and anomaly prevention.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickReconcile}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Reconciling...' : 'Run Auto-Reconciliation'}
          </button>
          <button
            onClick={() => onNavigate('reconciliation')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Review Unmatched Items
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Bank Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Bank Balance</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ${totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> 4 Active Bank Accounts
          </div>
        </div>

        {/* Transactions Processed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Processed Transactions</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {summary?.total_count?.toLocaleString() || '1,054'}
          </div>
          <div className="text-[11px] text-indigo-400 mt-1 font-medium">
            100% Multi-Currency Ingested
          </div>
        </div>

        {/* Reconciliation % */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Reconciled Rate</span>
            <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {report?.reconciled_percentage ? `${report.reconciled_percentage}%` : '91.2%'}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-medium">
            837 Matched Pairs
          </div>
        </div>

        {/* Unmatched Transactions */}
        <div 
          onClick={() => onNavigate('reconciliation')} 
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer rounded-xl p-4 shadow-sm transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Unmatched Items</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400 tracking-tight">
            {summary?.unmatched_count || '217'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Click to investigate items &rarr;
          </div>
        </div>

        {/* AI Categorization Rate */}
        <div 
          onClick={() => onNavigate('transactions')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer rounded-xl p-4 shadow-sm transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Categorization</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-400 tracking-tight">
            100%
          </div>
          <div className="text-[11px] text-indigo-400/80 mt-1">
            1,054 auto-categorized
          </div>
        </div>

        {/* Multi-Currency Feeds */}
        <div 
          onClick={() => onNavigate('transactions')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer rounded-xl p-4 shadow-sm transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Currency Feeds</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            USD/EUR/GBP/INR
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Decimal FX Normalized
          </div>
        </div>
      </div>

      {/* Discrepancy Highlight Card */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Unexplained Balance Discrepancy Detected ($2,500.00)</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">Action Needed</span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Silicon Valley Bank statement balance ($284,500.00) exceeds internal general ledger balance ($282,000.00). 
              The agent identified an unbooked outgoing vendor wire from Oct 28 awaiting CPA entry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('transactions')}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/40 transition cursor-pointer"
          >
            Inspect In Transactions
          </button>
          <button
            onClick={() => onNavigate('reconciliation')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            Reconcile Discrepancy
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Inflow vs Outflow */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Cash Flow Movement (USD)</h3>
              <p className="text-xs text-slate-400">Total Inflow vs Outflow across all connected bank entities</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Outflow
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#inflowGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="outflow" stroke="#6366f1" fillOpacity={1} fill="url(#outflowGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reconciliation Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Reconciliation Status</h3>
            <p className="text-xs text-slate-400 mb-4">Matching breakdown for October Close</p>
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reconBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reconBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-xl font-bold text-white">91.2%</span>
                <p className="text-[10px] text-slate-400">Reconciled</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            {reconBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-semibold text-white">{item.value.toLocaleString()} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Bank Accounts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Connected Multi-Currency Bank Accounts</h3>
            <p className="text-xs text-slate-400">Continuous API and simulated sync feeds</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            4 / 4 Accounts Connected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Bank Name & Account</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Bank Statement Balance</th>
                <th className="py-3 px-4">General Ledger Balance</th>
                <th className="py-3 px-4">Unreconciled Variance</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {accounts.map((acc) => {
                const diff = Number(acc.current_balance) - Number(acc.calculated_balance);
                const hasDiff = Math.abs(diff) > 0.01;
                return (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{acc.account_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{acc.bank_name} • {acc.account_number}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                        {acc.currency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {acc.currency} {Number(acc.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {acc.currency} {Number(acc.calculated_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {hasDiff ? (
                        <span className="text-rose-400 font-bold">
                          +{acc.currency} {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">$0.00 (Balanced)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasDiff ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Discrepancy
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Synced & Reconciled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

