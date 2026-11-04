import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { AnomalyAlert } from '../types';
import { api } from '../services/api';

export const Anomalies: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('open');

  // Selected Alert for Resolution
  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'false_positive'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertList, sum] = await Promise.all([
        api.getAnomalies(selectedStatus || undefined, selectedSeverity || undefined),
        api.getAnomalySummary(),
      ]);
      setAlerts(alertList);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSeverity, selectedStatus]);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      await api.runAnomalyDetection();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !resolutionNotes) return;
    try {
      setIsSavingResolution(true);
      const updated = await api.resolveAnomaly(selectedAlert.id, resolutionStatus, resolutionNotes);
      setAlerts(alerts.map(a => a.id === updated.id ? updated : a));
      setSelectedAlert(null);
      setResolutionNotes('');
      await api.getAnomalySummary().then(setSummary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingResolution(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Isolation Forest & Z-Score Heuristics
            </span>
            <span className="text-xs text-slate-400">• Anti-Fraud & Compliance Gate</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Anomaly & Duplicate Payment Prevention</h1>
          <p className="text-sm text-slate-400">Autonomous pattern detection flags unusual wire volumes, duplicates within 72h, and off-hour spikes.</p>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning Entire Ledger...' : 'Run Anomaly Scan'}
        </button>
      </div>

      {/* Severity Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Open Alerts</div>
          <div className="text-2xl font-bold text-white mt-1">{summary?.total_open || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requiring CPA investigation</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Critical Priority Outliers</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{summary?.critical || 0}</div>
          <div className="text-[11px] text-rose-400/70 mt-0.5">Z-score &gt; 3.0 / Wire anomalies</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">High Severity / Duplicate Risks</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary?.high || 0}</div>
          <div className="text-[11px] text-amber-400/70 mt-0.5">Same vendor within 72 hrs</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Weekend & Off-Hour Transfers</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{summary?.medium || 0}</div>
          <div className="text-[11px] text-indigo-400/70 mt-0.5">Weekend high-value outflows</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStatus('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === 'open' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Open Alerts
          </button>
          <button
            onClick={() => setSelectedStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === 'resolved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved History
          </button>
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedStatus === '' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Statuses
          </button>
        </div>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Severity Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading anomalies...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="font-semibold text-white">No Flagged Anomalies Found</h3>
            <p className="text-xs text-slate-500 mt-1">All processed transactions conform to statistical baseline patterns.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">Score: {(Number(alert.score) * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    alert.status === 'open' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}>
                    Status: {alert.status.replace(/_/g, ' ')}
                  </span>
                  {alert.status === 'open' && (
                    <button
                      onClick={() => { setSelectedAlert(alert); setResolutionNotes(''); }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                    >
                      Investigate & Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Explanation Text */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300 mb-0.5">Agent Diagnostic Explanation:</div>
                  <p>{alert.explanation}</p>
                </div>
              </div>

              {/* Resolution Notes if Resolved */}
              {alert.resolution_notes && (
                <div className="text-xs text-slate-400 pl-2 border-l-2 border-emerald-500/50">
                  <span className="font-semibold text-emerald-400">Resolution Note: </span>
                  {alert.resolution_notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Investigate & Resolve Anomaly</h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>Type: <strong className="text-white">{selectedAlert.alert_type}</strong></div>
              <div>Severity: <strong className="text-rose-400">{selectedAlert.severity}</strong></div>
              <div>Diagnostic: {selectedAlert.explanation}</div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Action Outcome</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="resolved"
                      checked={resolutionStatus === 'resolved'}
                      onChange={() => setResolutionStatus('resolved')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Mark as Verified & Resolved
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="false_positive"
                      checked={resolutionStatus === 'false_positive'}
                      onChange={() => setResolutionStatus('false_positive')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Mark as False Positive
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Accountant Resolution Notes (Auditable)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Verified with VP Finance that the $98,500 wire is for pre-approved server equipment purchase PO-9482."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResolution || !resolutionNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {isSavingResolution ? 'Submitting...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

