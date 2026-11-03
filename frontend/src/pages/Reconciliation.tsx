import React, { useState, useEffect } from 'react';
import { 
  CheckCheck, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  RefreshCw, 
  Split, 
  CheckCircle2, 
  XCircle,
  FileText,
  Filter
} from 'lucide-react';
import { ReconciliationRecord, ReconciliationMatch, BankAccount } from '../types';
import { api } from '../services/api';

export const Reconciliation: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matched' | 'unmatched' | 'records'>('unmatched');
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);

  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [unmatchedData, setUnmatchedData] = useState<{ unmatched_bank_transactions: any[]; unmatched_internal_records: any[] }>({
    unmatched_bank_transactions: [],
    unmatched_internal_records: []
  });
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);

  // Manual Match Selection
  const [selectedBankTxId, setSelectedBankTxId] = useState<string | null>(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, matchData, unmatchData, recs] = await Promise.all([
        api.getAccounts(),
        api.getMatches(),
        api.getUnmatchedItems(),
        api.getReconciliationRecords(),
      ]);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
      setMatches(matchData);
      setUnmatchedData(unmatchData);
      setRecords(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunRecon = async () => {
    if (!selectedAccountId) return;
    try {
      setIsReconciling(true);
      await api.runReconciliation(selectedAccountId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleManualMatchSubmit = async () => {
    if (!selectedBankTxId) return;
    try {
      setIsSubmittingManual(true);
      await api.manualMatch(selectedBankTxId, selectedLedgerId || undefined, manualNote || 'Accountant manual reconciliation');
      setSelectedBankTxId(null);
      setSelectedLedgerId(null);
      setManualNote('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const balanceDiff = currentAccount ? Number(currentAccount.current_balance) - Number(currentAccount.calculated_balance) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Account Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Matching Engine v2.4
            </span>
            <span className="text-xs text-slate-400">• Exact + Fuzzy + Partial Multi-Tier</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Continuous Reconciliation Center</h1>
          <p className="text-sm text-slate-400">Match bank transaction feed with internal general ledger records in real-time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.account_name} ({a.currency})</option>
            ))}
          </select>
          <button
            onClick={handleRunRecon}
            disabled={isReconciling}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Matching...' : 'Run Auto-Match'}
          </button>
        </div>
      </div>

      {/* Account Balance Comparison Header */}
      {currentAccount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Bank Statement Ending Balance</div>
            <div className="text-xl font-bold text-white mt-1">
              {currentAccount.currency} {Number(currentAccount.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">As per live feed from {currentAccount.bank_name}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Internal Book Balance (General Ledger)</div>
            <div className="text-xl font-bold text-white mt-1">
              {currentAccount.currency} {Number(currentAccount.calculated_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">ERP Posted Records</div>
          </div>
          <div className={`border rounded-xl p-4 ${Math.abs(balanceDiff) > 0.01 ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'}`}>
            <div className="text-xs font-semibold uppercase tracking-wider">Unreconciled Difference</div>
            <div className="text-xl font-bold mt-1">
              {Math.abs(balanceDiff) > 0.01 ? (
                <span>{currentAccount.currency} {Math.abs(balanceDiff).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              ) : (
                <span>$0.00 (Balanced)</span>
              )}
            </div>
            <div className="text-[11px] mt-0.5">
              {Math.abs(balanceDiff) > 0.01 ? 'Requires investigation (see Unmatched items below)' : 'Perfect matching achieved'}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs: Unmatched Items (Default for action), Matched Pairs, Recon History */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('unmatched')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'unmatched' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Unmatched Items & Manual Match</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-amber-300 border border-amber-500/30">
            {unmatchedData.unmatched_bank_transactions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'matched' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Reconciled Matches</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-emerald-300 border border-emerald-500/30">
            {matches.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Audit Records & Summaries</span>
        </button>
      </div>

      {/* TAB 1: UNMATCHED ITEMS & MANUAL MATCH INTERFACE */}
      {activeTab === 'unmatched' && (
        <div className="space-y-6">
          {/* Manual Match Action Bar (if an item is clicked) */}
          {selectedBankTxId && (
            <div className="bg-indigo-950/60 border border-indigo-500/50 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-indigo-300">Manual Match Mode Activated</div>
                  <div className="text-xs text-slate-300">
                    Bank Tx: <span className="font-mono font-semibold text-white">{selectedBankTxId.slice(0, 8)}...</span>
                    {selectedLedgerId ? (
                      <span> matched with Ledger: <span className="font-mono font-semibold text-emerald-400">{selectedLedgerId.slice(0, 8)}...</span></span>
                    ) : (
                      <span className="text-amber-300 italic"> (Select an internal record on the right, or confirm direct override)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Accountant note (e.g. pending wire timing difference)"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 w-full md:w-64"
                />
                <button
                  onClick={handleManualMatchSubmit}
                  disabled={isSubmittingManual}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap cursor-pointer"
                >
                  {isSubmittingManual ? 'Saving...' : 'Confirm Match'}
                </button>
                <button
                  onClick={() => { setSelectedBankTxId(null); setSelectedLedgerId(null); }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Unmatched Bank Transactions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Unmatched Bank Transactions ({unmatchedData.unmatched_bank_transactions.length})
                </h3>
                <span className="text-[11px] text-slate-400">Click row to select for manual matching</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {unmatchedData.unmatched_bank_transactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">All bank transactions reconciled!</div>
                ) : (
                  unmatchedData.unmatched_bank_transactions.map((tx) => {
                    const isSelected = selectedBankTxId === tx.id;
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedBankTxId(isSelected ? null : tx.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-900/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-white">{tx.description}</span>
                          <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>{new Date(tx.date).toLocaleDateString()}</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Unmatched Internal Ledger Records */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Unposted Internal Records ({unmatchedData.unmatched_internal_records.length})
                </h3>
                <span className="text-[11px] text-slate-400">Click to pair with selected bank item</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {unmatchedData.unmatched_internal_records.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No unmatched internal records.</div>
                ) : (
                  unmatchedData.unmatched_internal_records.map((l) => {
                    const isSelected = selectedLedgerId === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLedgerId(isSelected ? null : l.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-white">{l.description}</span>
                          <span className="font-mono font-bold text-slate-200">
                            {l.currency} {Math.abs(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>{new Date(l.date).toLocaleDateString()} • {l.account_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {l.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATCHED PAIRS */}
      {activeTab === 'matched' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Automated Reconciliation Matches ({matches.length})</h3>
            <span className="text-xs text-slate-400">Confidence scores & variance tracking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Match Type</th>
                  <th className="py-3 px-4">Bank Transaction</th>
                  <th className="py-3 px-4">Bank Amount</th>
                  <th className="py-3 px-4">Internal Ledger Record</th>
                  <th className="py-3 px-4">Variance / Notes</th>
                  <th className="py-3 px-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matches.slice(0, 100).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                        m.match_type === 'exact' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : m.match_type === 'fuzzy'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : m.match_type === 'partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {m.match_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{m.bank_transaction?.description || 'Bank Item'}</div>
                      <div className="text-[10px] text-slate-400">{m.bank_transaction?.reference_number}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {m.bank_transaction?.currency} {m.bank_transaction?.amount ? Math.abs(m.bank_transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{m.internal_ledger?.description || 'Direct Bank Settlement'}</div>
                      <div className="text-[10px] text-indigo-400">{m.internal_ledger?.account_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {m.notes || (m.amount_difference > 0 ? `Diff: $${m.amount_difference}` : 'Exact 0.00 variance')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {(Number(m.match_confidence) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT RECORDS & SUMMARY REPORTS */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-base">Reconciliation Cycle: {new Date(r.period_start).toLocaleDateString()} to {new Date(r.period_end).toLocaleDateString()}</h4>
                  <p className="text-xs text-slate-400">Run ID: {r.id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {r.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Reconciled Count</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{r.reconciled_count}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Partial Count</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{r.partial_count}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Unmatched Count</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5">{r.unmatched_count}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Calculated Variance</div>
                  <div className="text-base font-bold text-white mt-0.5">${Number(r.difference).toFixed(2)}</div>
                </div>
              </div>

              {r.discrepancy_explanation && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                  <span className="font-semibold text-amber-300">Agent Discrepancy Analysis: </span>
                  {r.discrepancy_explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

