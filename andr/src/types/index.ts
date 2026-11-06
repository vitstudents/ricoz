export interface KpiSummary {
  unreconciledCount: number;
  openAnomaliesCount: number;
  pendingJournalsCount: number;
  totalTransactionsCount: number;
  gaapComplianceRate: number;
  totalCashUsd: number;
}

export interface Transaction {
  id: string;
  account_id?: string;
  date: string;
  description: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  amount_usd?: number;
  exchange_rate?: number;
  category_name?: string;
  gl_account_code?: string;
  is_reconciled: boolean;
  confidence_score?: number;
}

export interface Anomaly {
  id: string;
  transaction_id: string;
  anomaly_type: 'duplicate' | 'amount_spike' | 'gaap_violation' | 'unusual_vendor';
  severity: 'high' | 'medium' | 'low';
  description: string;
  status: 'open' | 'dismissed' | 'resolved';
  detected_at?: string;
  amount?: number;
  currency?: string;
}

export interface ReconciliationMatch {
  id: string;
  bank_transaction_id: string;
  match_type: 'one_to_one' | 'one_to_many';
  confidence_score: number;
  status: 'suggested' | 'approved' | 'rejected';
  description: string;
  amount: number;
  currency: string;
  gl_account: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  status: 'draft' | 'pending_review' | 'posted';
  total_amount: number;
  currency: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  current_balance: number;
  status: string;
}

export interface CurrencyRate {
  currency: string;
  rate_to_usd: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  details: string;
  created_at: string;
}
