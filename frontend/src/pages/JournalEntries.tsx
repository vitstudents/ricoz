import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileText,
  Clock,
  RefreshCw
} from 'lucide-react';
import { JournalEntry } from '../types';
import { api } from '../services/api';

export const JournalEntries: React.FC = () => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFx, setIsGeneratingFx] = useState(false);

  // Rejection modal
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const data = await api.getJournals();
      setJournals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await api.generateJournal('2026-10');
      await loadJournals();
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFx = async () => {
    try {
      setIsGeneratingFx(true);
      await api.generateFxJournal('2026-10');
      await loadJournals();
    } catch (err: any) {
      alert(`FX generation error: ${err.message}`);
    } finally {
      setIsGeneratingFx(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const updated = await api.actionJournal(id, 'approve');
      setJournals(journals.map(j => j.id === updated.id ? updated : j));
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRejectId || !rejectionReason) return;
    try {
      setIsRejecting(true);
      const updated = await api.actionJournal(selectedRejectId, 'reject', rejectionReason);
      setJournals(journals.map(j => j.id === updated.id ? updated : j));
      setSelectedRejectId(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Generation Triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Double-Entry Bookkeeping Gate
            </span>
            <span className="text-xs text-slate-400">• Strict Debits = Credits Enforcement</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Month-End Journal Entries</h1>
          <p className="text-sm text-slate-400">Autonomous draft journal entry preparation. Unapproved entries are NEVER posted to live books.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateFx}
            disabled={isGeneratingFx}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {isGeneratingFx ? 'Calculating FX...' : 'Generate FX Revaluation'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Drafting Close Entry...' : 'Generate Reconciled Month-End Entry'}
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading journal entries...</div>
        ) : journals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
            <h3 className="font-semibold text-white">No Journal Entries Drafted Yet</h3>
            <p className="text-xs text-slate-500 mt-1">Click "Generate Reconciled Month-End Entry" above to prepare draft double-entry books.</p>
          </div>
        ) : (
          journals.map((entry) => {
            const isApproved = entry.status === 'approved';
            const isRejected = entry.status === 'rejected';
            const isDraft = entry.status === 'draft';
            const isBalanced = Math.abs(Number(entry.total_debit) - Number(entry.total_credit)) < 0.0001;

            return (
              <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Entry Top Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-white text-base">{entry.entry_number}</span>
                      <span className="text-xs text-slate-400">Period: {entry.period}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        isRejected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">{entry.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={api.exportJournalUrl(entry.id)}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Export NetSuite/QuickBooks CSV
                    </a>

                    {isDraft && (
                      <>
                        <button
                          onClick={() => { setSelectedRejectId(entry.id); setRejectionReason(''); }}
                          className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" /> Approve for Posting
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Double-Entry Balancing Verification Pill */}
                <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Double-Entry Balanced: Total Debits == Total Credits
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                        <XCircle className="w-4 h-4" /> Out of Balance!
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-slate-300 flex items-center gap-4">
                    <span>Total Debits: <strong className="text-white">${Number(entry.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                    <span>Total Credits: <strong className="text-white">${Number(entry.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  </div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/40 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-5">Account Code</th>
                        <th className="py-2.5 px-5">Account Name</th>
                        <th className="py-2.5 px-5">Memo / Description</th>
                        <th className="py-2.5 px-5 text-right">Debit ($)</th>
                        <th className="py-2.5 px-5 text-right">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                      {entry.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-5 font-bold text-indigo-300">{l.account_code}</td>
                          <td className="py-2.5 px-5 text-white font-sans font-medium">{l.account_name}</td>
                          <td className="py-2.5 px-5 text-slate-400 font-sans">{l.description || '—'}</td>
                          <td className="py-2.5 px-5 text-right text-emerald-400 font-semibold">
                            {Number(l.debit) > 0 ? `$${Number(l.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-2.5 px-5 text-right text-cyan-400 font-semibold">
                            {Number(l.credit) > 0 ? `$${Number(l.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rejection Note if present */}
                {entry.rejection_reason && (
                  <div className="p-4 bg-rose-950/20 border-t border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span><strong>Accountant Rejection Note:</strong> {entry.rejection_reason}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {selectedRejectId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Reject Draft Journal Entry</h3>
            <p className="text-xs text-slate-400">Specify the reason for rejecting this entry so the agent can record the audit note.</p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                placeholder="e.g. Need to reallocate $5,000 from General Software to Infrastructure R&D."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRejectId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectionReason}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

