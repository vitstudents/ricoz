import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Edit2, 
  Download,
  Check,
  X
} from 'lucide-react';
import { Transaction, Category, BankAccount } from '../types';
import { api } from '../services/api';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Selected Transaction for Details / Edit Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // CSV Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAccountForUpload, setSelectedAccountForUpload] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions({
        search: search || undefined,
        currency: currency || undefined,
        status: status || undefined,
        category_id: categoryId || undefined,
        limit: 150
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.getCategories(), api.getAccounts()]).then(([cats, accs]) => {
      setCategories(cats);
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountForUpload(accs[0].id);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, currency, status, categoryId]);

  const handleUpdateCategory = async () => {
    if (!selectedTx || !editCategoryId) return;
    try {
      setIsUpdating(true);
      const updated = await api.updateTransactionCategory(selectedTx.id, editCategoryId);
      setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
      setSelectedTx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedAccountForUpload) return;
    try {
      setIsUploading(true);
      const res = await api.uploadCsv(selectedAccountForUpload, uploadFile);
      setUploadResult(res);
      fetchTransactions();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Currency Transactions</h1>
          <p className="text-sm text-slate-400">Search, filter, and inspect AI-categorized bank transactions across all accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={api.exportReportUrl()}
            download
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <button
            onClick={() => { setShowUploadModal(true); setUploadResult(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Ingest Bank CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Currency Filter */}
          <div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Currencies (USD, EUR, GBP, INR)</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Accounting Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Reconciliation Statuses</option>
              <option value="matched">Matched (Reconciled)</option>
              <option value="partial_match">Partial Match</option>
              <option value="unmatched">Unmatched (Pending)</option>
              <option value="manual_matched">Manually Overridden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Merchant</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Original Amount</th>
                <th className="py-3 px-4">USD Equivalent</th>
                <th className="py-3 px-4">AI Category & Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive = Number(tx.amount) > 0;
                  const confidence = Number(tx.ai_confidence);
                  const isHighConf = confidence >= 0.85;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white truncate max-w-xs">{tx.description}</div>
                        {tx.merchant_name && (
                          <div className="text-xs text-indigo-400">{tx.merchant_name}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {tx.reference_number || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <span className={isPositive ? 'text-emerald-400' : 'text-slate-200'}>
                          {isPositive ? '+' : ''}{tx.currency} {Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        ${Math.abs(Number(tx.base_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {tx.currency !== 'USD' && (
                          <span className="block text-[10px] text-slate-500">Rate: {Number(tx.exchange_rate).toFixed(4)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
                            {tx.category?.name || 'Uncategorized'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            isHighConf ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === 'matched' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Matched
                          </span>
                        )}
                        {tx.status === 'partial_match' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Partial Match
                          </span>
                        )}
                        {tx.status === 'unmatched' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Unmatched
                          </span>
                        )}
                        {tx.status === 'manual_matched' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Manual Match
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setSelectedTx(tx); setEditCategoryId(tx.category_id || ''); }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="Review / Reclassify Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Category / Review Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Review & Classify Transaction</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                <div className="text-slate-400">Description: <span className="text-white font-semibold">{selectedTx.description}</span></div>
                <div className="text-slate-400">Amount: <span className="text-emerald-400 font-semibold">{selectedTx.currency} {selectedTx.amount}</span> (${selectedTx.base_amount} USD)</div>
                <div className="text-slate-400">Current AI Category: <span className="text-indigo-400 font-semibold">{selectedTx.category?.name || 'Uncategorized'}</span> (Confidence: {(Number(selectedTx.ai_confidence)*100).toFixed(0)}%)</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Certified Accounting Category (Learns for Future Imports)
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.type}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Updating this category will mark the transaction as <strong>manual_reviewed</strong> and train the agent's merchant memory.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                {isUpdating ? 'Saving...' : 'Confirm Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Ingestion Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Ingest Bank Transaction CSV</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadResult ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" /> Ingestion Completed Successfully
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Imported: <strong>{uploadResult.imported_count}</strong> new transactions.</p>
                  <p>• Duplicates Prevented: <strong>{uploadResult.duplicate_skipped_count}</strong> records skipped (idempotent hash match).</p>
                  <p>• Account: <strong>{uploadResult.account_name}</strong></p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Destination Bank Account</label>
                  <select
                    value={selectedAccountForUpload}
                    onChange={(e) => setSelectedAccountForUpload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_name} ({a.bank_name} - {a.currency})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Columns: Date, Description, Amount, Reference, Currency</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20"
                  >
                    {isUploading ? 'Processing & Categorizing...' : 'Upload & Categorize'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

