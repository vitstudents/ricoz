export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
}

export interface BankAccount {
  id: string;
  organization_id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  currency: string;
  current_balance: number;
  calculated_balance: number;
  last_synced_at?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
  default_account_code: string;
}

export interface Transaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  clean_description?: string;
  merchant_name?: string;
  reference_number?: string;
  currency: string;
  amount: number;
  original_amount: number;
  base_amount: number;
  exchange_rate: number;
  category_id?: string;
  ai_category_id?: string;
  ai_confidence: number;
  category_status: string;
  status: 'unmatched' | 'matched' | 'partial_match' | 'manual_matched';
  is_recurring: boolean;
  category?: Category;
  ai_category?: Category;
}

export interface ReconciliationRecord {
  id: string;
  bank_account_id: string;
  period_start: string;
  period_end: string;
  statement_ending_balance: number;
  book_ending_balance: number;
  difference: number;
  status: string;
  reconciled_count: number;
  unmatched_count: number;
  partial_count: number;
  discrepancy_explanation?: string;
  created_at: string;
}

export interface ReconciliationMatch {
  id: string;
  match_type: string;
  match_confidence: number;
  amount_difference: number;
  date_difference_days: number;
  notes?: string;
  matched_at: string;
  bank_transaction?: {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    reference_number?: string;
  };
  internal_ledger?: {
    id: string;
    date: string;
    description: string;
    amount: number;
    account_name?: string;
  };
}

export interface AnomalyAlert {
  id: string;
  transaction_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  explanation: string;
  status: 'open' | 'under_investigation' | 'resolved' | 'false_positive';
  resolution_notes?: string;
  created_at: string;
  transaction?: Transaction;
}

export interface JournalEntryLine {
  id: string;
  account_code: string;
  account_name: string;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
  base_debit: number;
  base_credit: number;
  exchange_rate: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  period: string;
  description: string;
  reference_type: string;
  total_debit: number;
  total_credit: number;
  currency: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'posted';
  rejection_reason?: string;
  created_at: string;
  lines: JournalEntryLine[];
}

export interface AuditLog {
  id: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

