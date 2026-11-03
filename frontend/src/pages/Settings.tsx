import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Layers, 
  Shield, 
  History, 
  RotateCcw, 
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { BankAccount, Category, AuditLog } from '../types';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'currencies' | 'categories' | 'audit'>('accounts');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, cats, currs, logs] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getCurrencies(),
        api.getAuditLogs(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setCurrencies(currs);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetData = async () => {
    if (!confirm('This will reset and re-seed the synthetic dataset with 1,000+ realistic multi-currency transactions. Proceed?')) {
      return;
    }
    try {
      setIsResetting(true);
      await api.seedDatabase(true);
      setResetMessage('Synthetic financial dataset reset successfully!');
      await loadData();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Organization Settings & Ledger Controls</h1>
          <p className="text-sm text-slate-400">Manage bank connections, currency conversion tables, chart of accounts, and security audit trails.</p>
        </div>

        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Re-seeding 1,000+ Transactions...' : 'Reset & Re-seed Synthetic Dataset'}
        </button>
      </div>

      {resetMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'accounts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Bank Accounts ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'currencies' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Currencies & FX Rates</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Accounting Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: BANK ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Bank Name</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Bank Balance</th>
                <th className="py-3 px-4">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-semibold text-white">{acc.account_name}</td>
                  <td className="py-3 px-4 text-slate-400">{acc.bank_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{acc.account_number}</td>
                  <td className="py-3 px-4 font-bold text-cyan-400">{acc.currency}</td>
                  <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                    {acc.currency} {Number(acc.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Connected API
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: CURRENCIES & FX RATES */}
      {activeTab === 'currencies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Supported Functional Currencies</h3>
              <p className="text-xs text-slate-400">Baseline rates used for foreign exchange conversions and ASC 830 calculations.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
              Base: USD ($1.0000)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {currencies.map((c) => (
              <div key={c.currency} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">{c.currency}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                    {c.rate_to_usd.toFixed(4)} USD
                  </span>
                </div>
                <p className="text-xs text-slate-400">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNTING CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">GL Account Code</th>
                <th className="py-3 px-4">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">{cat.code}</td>
                  <td className="py-3 px-4 font-medium text-white">{cat.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      cat.type === 'revenue' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {cat.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{cat.default_account_code}</td>
                  <td className="py-3 px-4 text-slate-400">Standard GAAP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Immutable Security & Accounting Audit Log</h3>
            <p className="text-xs text-slate-400">All financial modifications, reconciliations, overrides, and journal approvals are logged.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 text-indigo-300 font-sans">{log.user_email || 'System Agent'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-sans">{log.entity_type}</td>
                  <td className="py-3 px-4 font-sans text-slate-300 max-w-md truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

