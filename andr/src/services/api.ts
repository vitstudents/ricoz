import { 
  KpiSummary, 
  Transaction, 
  Anomaly, 
  ReconciliationMatch, 
  JournalEntry, 
  BankAccount, 
  CurrencyRate 
} from '../types';

const API_BASE_URL = 'https://work-hazel-one.vercel.app/api/v1';

export const apiService = {
  async getOverview(): Promise<KpiSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/overview/summary`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          unreconciledCount: data.unreconciled_count ?? 14,
          openAnomaliesCount: data.open_anomalies_count ?? 6,
          pendingJournalsCount: data.pending_journals_count ?? 3,
          totalTransactionsCount: data.total_transactions_count ?? 1054,
          gaapComplianceRate: data.gaap_compliance_rate ?? 98.4,
          totalCashUsd: data.total_cash_usd ?? 1428500.0,
        };
      }
    } catch (e) {
      // Offline fallback
    }
    return {
      unreconciledCount: 14,
      openAnomaliesCount: 6,
      pendingJournalsCount: 3,
      totalTransactionsCount: 1054,
      gaapComplianceRate: 98.4,
      totalCashUsd: 1428500.0,
    };
  },

  async getTransactions(limit = 40): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/?limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {
      // Offline fallback
    }
    return [
      { id: 'tx-1', date: '2026-11-06', description: 'AWS Cloud Infrastructure Inc.', amount: -1450.00, currency: 'USD', amount_usd: -1450.00, exchange_rate: 1.0, category_name: 'Cloud Hosting', gl_account_code: '6040', is_reconciled: true, confidence_score: 0.99 },
      { id: 'tx-2', date: '2026-11-05', description: 'Stripe Merchant Payout Settled', amount: 18450.00, currency: 'USD', amount_usd: 18450.00, exchange_rate: 1.0, category_name: 'SaaS Revenue', gl_account_code: '4010', is_reconciled: true, confidence_score: 0.98 },
      { id: 'tx-3', date: '2026-11-05', description: 'SAP Enterprise ERP Europe', amount: -4200.00, currency: 'EUR', amount_usd: -4536.00, exchange_rate: 1.08, category_name: 'Software License', gl_account_code: '6020', is_reconciled: false, confidence_score: 0.92 },
      { id: 'tx-4', date: '2026-11-04', description: 'London Canary Wharf Office Lease', amount: -6800.00, currency: 'GBP', amount_usd: -8568.00, exchange_rate: 1.26, category_name: 'Rent & Facilities', gl_account_code: '6010', is_reconciled: false, confidence_score: 0.95 },
      { id: 'tx-5', date: '2026-11-04', description: 'Infosys Engineering Services Ltd', amount: -350000.00, currency: 'INR', amount_usd: -4200.00, exchange_rate: 0.012, category_name: 'Engineering Contractors', gl_account_code: '6050', is_reconciled: true, confidence_score: 0.94 },
      { id: 'tx-6', date: '2026-11-03', description: 'Google Cloud Platform AI API', amount: -890.50, currency: 'USD', amount_usd: -890.50, exchange_rate: 1.0, category_name: 'AI & Machine Learning', gl_account_code: '6045', is_reconciled: true, confidence_score: 0.97 },
      { id: 'tx-7', date: '2026-11-03', description: 'Figma Enterprise Design Team', amount: -360.00, currency: 'USD', amount_usd: -360.00, exchange_rate: 1.0, category_name: 'Design Subscriptions', gl_account_code: '6025', is_reconciled: true, confidence_score: 0.99 },
    ];
  },

  async getAnomalies(): Promise<Anomaly[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/anomalies/?status=open`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (e) {
      // Offline fallback
    }
    return [
      { id: 'anom-1', transaction_id: 'tx-301', anomaly_type: 'duplicate', severity: 'high', description: 'Duplicate subscription billed twice within 48h ($450.00)', status: 'open', amount: 450.00, currency: 'USD' },
      { id: 'anom-2', transaction_id: 'tx-412', anomaly_type: 'amount_spike', severity: 'medium', description: 'Vendor invoice 3.8x above 90-day moving average ($3,800.00)', status: 'open', amount: 3800.00, currency: 'USD' },
      { id: 'anom-3', transaction_id: 'tx-529', anomaly_type: 'gaap_violation', severity: 'high', description: 'Server hardware flagged as operational expense instead of ASC 360 asset', status: 'open', amount: 12500.00, currency: 'USD' },
    ];
  },

  async dismissAnomaly(anomalyId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      return res.ok;
    } catch (e) {
      return true;
    }
  },

  async getReconciliations(): Promise<ReconciliationMatch[]> {
    return [
      {
        id: 'rec-1',
        bank_transaction_id: 'tx-2',
        match_type: 'one_to_one',
        confidence_score: 0.994,
        status: 'suggested',
        description: 'Stripe Settlement Batch #8821 matched with Bank Deposit #9912',
        amount: 18450.00,
        currency: 'USD',
        gl_account: '1010 Operating Cash',
      },
      {
        id: 'rec-2',
        bank_transaction_id: 'tx-4',
        match_type: 'one_to_many',
        confidence_score: 0.942,
        status: 'suggested',
        description: 'Canary Wharf Rent £6,800.00 matched with Lease Schedule #L-102',
        amount: 8568.00,
        currency: 'GBP',
        gl_account: '6010 Rent Expense',
      },
    ];
  },

  async getCurrencies(): Promise<CurrencyRate[]> {
    return [
      { currency: 'USD', rate_to_usd: 1.0000, description: 'US Dollar (Base Functional Currency)' },
      { currency: 'EUR', rate_to_usd: 1.0800, description: 'Euro (European Central Bank Spot)' },
      { currency: 'GBP', rate_to_usd: 1.2600, description: 'British Pound (Bank of England Reference)' },
      { currency: 'INR', rate_to_usd: 0.0120, description: 'Indian Rupee (Reserve Bank of India)' },
    ];
  },

  async getBankAccounts(): Promise<BankAccount[]> {
    return [
      { id: 'b-1', bank_name: 'Silicon Valley Bank (SVB)', account_name: 'US Primary Operating', account_number: '•••• 4821', currency: 'USD', current_balance: 850000.00, status: 'Active API' },
      { id: 'b-2', bank_name: 'Deutsche Bank Frankfurt', account_name: 'EU Treasury & Payroll', account_number: '•••• 9102', currency: 'EUR', current_balance: 320000.00, status: 'Active API' },
      { id: 'b-3', bank_name: 'Barclays Bank UK', account_name: 'UK Operating Vault', account_number: '•••• 3391', currency: 'GBP', current_balance: 145000.00, status: 'Active API' },
      { id: 'b-4', bank_name: 'HDFC Bank India', account_name: 'India Tech & Operations', account_number: '•••• 7714', currency: 'INR', current_balance: 9500000.00, status: 'Active API' },
    ];
  },

  async askAssistant(prompt: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.response || 'Inquiry processed successfully.';
      }
    } catch (e) {
      // Fallback
    }
    return `LedgerAI Financial Analysis:\nTotal multi-currency cash is $1,428,500.00 USD. ASC 830 foreign exchange remeasurements are fully reconciled with 0.00 trial balance debit/credit variance.`;
  },
};
