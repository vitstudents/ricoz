package com.ledgerai.mobile.data.model

import com.google.gson.annotations.SerializedName

data class KpiSummary(
    val unreconciledCount: Int,
    val openAnomaliesCount: Int,
    val pendingJournalsCount: Int,
    val totalTransactionsCount: Int,
    val gaapComplianceRate: Double,
    val totalCashBalanceUsd: Double
)

data class Transaction(
    val id: String,
    @SerializedName("account_id") val accountId: String? = null,
    val date: String,
    val description: String,
    val amount: Double,
    val currency: String,
    @SerializedName("amount_usd") val amountUsd: Double? = null,
    @SerializedName("exchange_rate") val exchangeRate: Double? = 1.0,
    @SerializedName("category_id") val categoryId: String? = null,
    @SerializedName("category_name") val categoryName: String? = "General Operating",
    @SerializedName("gl_account_code") val glAccountCode: String? = "6000",
    @SerializedName("is_reconciled") val isReconciled: Boolean = false,
    @SerializedName("confidence_score") val confidenceScore: Double? = 0.95
)

data class AnomalyAlert(
    val id: String,
    @SerializedName("transaction_id") val transactionId: String,
    @SerializedName("anomaly_type") val anomalyType: String, // duplicate, amount_spike, gaap_violation
    val severity: String, // high, medium, low
    val description: String,
    val status: String, // open, dismissed, resolved
    @SerializedName("detected_at") val detectedAt: String? = null,
    val amount: Double? = 0.0,
    val currency: String? = "USD"
)

data class ReconciliationMatch(
    val id: String,
    @SerializedName("bank_transaction_id") val bankTxId: String,
    @SerializedName("match_type") val matchType: String, // one_to_one, one_to_many
    @SerializedName("confidence_score") val confidenceScore: Double,
    val status: String, // suggested, approved, rejected
    val description: String? = null,
    val amount: Double? = null,
    val currency: String? = "USD"
)

data class JournalEntry(
    val id: String,
    @SerializedName("entry_number") val entryNumber: String,
    val date: String,
    val description: String,
    val status: String, // draft, pending_review, posted
    @SerializedName("total_amount") val totalAmount: Double,
    val lines: List<JournalEntryLine> = emptyList()
)

data class JournalEntryLine(
    val id: String,
    @SerializedName("account_code") val accountCode: String,
    @SerializedName("account_name") val accountName: String,
    val debit: Double,
    val credit: Double
)

data class ChatMessage(
    val role: String, // user, assistant, system
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)
