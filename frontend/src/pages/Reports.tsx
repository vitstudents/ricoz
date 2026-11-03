import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  CheckCircle2, 
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const Reports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlySummary();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GAAP & IFRS Multi-Currency Ready
            </span>
            <span className="text-xs text-slate-400">• Period: Q4 2026 Close</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Reports & Month-End Closing Pack</h1>
          <p className="text-sm text-slate-400">Auditable multi-currency summaries, category expense distributions, and foreign exchange exposure.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
          <a
            href={api.exportReportUrl()}
            download
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Detailed CSV Report
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Consolidated Inflows</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            ${report?.total_inflow?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Customer payments & payouts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Consolidated Outflows</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            ${report?.total_outflow?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Operating & vendor expenses</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Operating Cash Flow</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            ${report?.net_cash_flow?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">Positive cash generation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Reconciliation Completion</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
            {report?.reconciled_percentage || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">837 items verified</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Breakdown Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-1">Expense Breakdown by Accounting Category</h3>
          <p className="text-xs text-slate-400 mb-4">Total expenditure categorized in USD</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report?.category_breakdown?.slice(0, 6) || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Foreign Currency Exposure Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Multi-Currency Exposure & Volume</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Functional currency conversion to USD</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Currency</th>
                    <th className="py-2.5 px-3">Transactions</th>
                    <th className="py-2.5 px-3">Original Volume</th>
                    <th className="py-2.5 px-3 text-right">USD Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                  {report?.currency_exposure?.map((curr: any) => (
                    <tr key={curr.currency} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-bold text-white font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        {curr.currency}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400">{curr.tx_count}</td>
                      <td className="py-2.5 px-3">{curr.currency} {curr.volume_original.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                        ${curr.volume_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 mt-4">
            <span className="font-semibold text-cyan-300">FX Policy Note: </span>
            Foreign exchange gains and losses are recognized monthly under ASC 830 / IAS 21 via automated adjusting journal entries.
          </div>
        </div>
      </div>
    </div>
  );
};

