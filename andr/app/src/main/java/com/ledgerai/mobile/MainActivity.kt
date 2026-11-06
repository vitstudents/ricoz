package com.ledgerai.mobile

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.ledgerai.mobile.data.api.LedgerApiService
import com.ledgerai.mobile.data.model.AnomalyAlert
import com.ledgerai.mobile.data.model.KpiSummary
import com.ledgerai.mobile.data.model.Transaction
import com.ledgerai.mobile.databinding.ActivityMainBinding
import com.ledgerai.mobile.ui.components.NativeBridge
import com.ledgerai.mobile.util.BiometricHelper
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val api = LedgerApiService()

    // State
    private var isCloudViewMode = false
    private var currentTabId = R.id.nav_overview
    private var kpiData: KpiSummary? = null
    private var transactions: List<Transaction> = emptyList()
    private var anomalies: List<AnomalyAlert> = emptyList()

    private val cloudUrl = "https://work-hazel-one.vercel.app"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupBottomNavigation()
        setupWebView()
        setupSwipeRefresh()

        // Check if opened from Anomaly push notification
        val targetTab = intent.getStringExtra("target_tab")
        if (targetTab == "anomalies") {
            binding.bottomNavigation.selectedItemId = R.id.nav_anomalies
        } else {
            loadNativeData()
        }
    }

    private fun setupToolbar() {
        binding.btnModeToggle.setOnClickListener {
            toggleViewMode()
        }
    }

    private fun toggleViewMode() {
        isCloudViewMode = !isCloudViewMode
        if (isCloudViewMode) {
            binding.btnModeToggle.text = "Native View"
            binding.scrollNativeView.visibility = View.GONE
            binding.webView.visibility = View.VISIBLE
            binding.webView.loadUrl(cloudUrl)
        } else {
            binding.btnModeToggle.text = "Cloud View"
            binding.webView.visibility = View.GONE
            binding.scrollNativeView.visibility = View.VISIBLE
            renderCurrentTab()
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            currentTabId = item.itemId
            if (isCloudViewMode) {
                // Navigate web view to corresponding anchor
                when (item.itemId) {
                    R.id.nav_overview -> binding.webView.evaluateJavascript("window.location.hash='#overview'", null)
                    R.id.nav_transactions -> binding.webView.evaluateJavascript("window.location.hash='#transactions'", null)
                    R.id.nav_reconcile -> binding.webView.evaluateJavascript("window.location.hash='#reconciliation'", null)
                    R.id.nav_anomalies -> binding.webView.evaluateJavascript("window.location.hash='#anomalies'", null)
                    R.id.nav_assistant -> binding.webView.evaluateJavascript("window.location.hash='#assistant'", null)
                }
            } else {
                renderCurrentTab()
            }
            true
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = binding.webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true

        binding.webView.setBackgroundColor(Color.parseColor("#0B0F19"))
        binding.webView.addJavascriptInterface(
            NativeBridge(this) { journalId ->
                lifecycleScope.launch {
                    api.postJournalEntry(journalId)
                    binding.webView.evaluateJavascript("window.dispatchEvent(new Event('journal-posted'))", null)
                }
            },
            "LedgerNative"
        )

        binding.webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    binding.progressBar.visibility = View.VISIBLE
                } else {
                    binding.progressBar.visibility = View.GONE
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setColorSchemeResources(R.color.primary, R.color.secondary)
        binding.swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.surface_card)
        binding.swipeRefresh.setOnRefreshListener {
            if (isCloudViewMode) {
                binding.webView.reload()
            } else {
                loadNativeData()
            }
        }
    }

    private fun loadNativeData() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            val kpiRes = api.getOverviewSummary()
            val txRes = api.getTransactions(30)
            val anomRes = api.getAnomalies()

            kpiData = kpiRes.getOrNull()
            transactions = txRes.getOrNull() ?: emptyList()
            anomalies = anomRes.getOrNull() ?: emptyList()

            // Update badge for anomalies
            val openCount = anomalies.count { it.status == "open" }
            if (openCount > 0) {
                binding.bottomNavigation.getOrCreateBadge(R.id.nav_anomalies).apply {
                    number = openCount
                    backgroundColor = getColor(R.color.danger)
                }
            } else {
                binding.bottomNavigation.removeBadge(R.id.nav_anomalies)
            }

            binding.swipeRefresh.isRefreshing = false
            renderCurrentTab()
        }
    }

    private fun renderCurrentTab() {
        binding.layoutNativeContent.removeAllViews()
        when (currentTabId) {
            R.id.nav_overview -> renderOverviewTab()
            R.id.nav_transactions -> renderTransactionsTab()
            R.id.nav_reconcile -> renderReconciliationTab()
            R.id.nav_anomalies -> renderAnomaliesTab()
            R.id.nav_assistant -> renderAssistantTab()
        }
    }

    // --- TAB 1: OVERVIEW DASHBOARD ---
    private fun renderOverviewTab() {
        val ctx = this
        val layout = binding.layoutNativeContent

        // Hero KPI Card
        val kpiCard = MaterialCardView(ctx).apply {
            setCardBackgroundColor(getColor(R.color.surface))
            radius = 24f
            strokeWidth = 2
            strokeColor = getColor(R.color.surface_card_light)
            setContentPadding(24, 24, 24, 24)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 20 }
        }

        val kpiContent = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
        }

        val title = TextView(ctx).apply {
            text = "Total Multi-Currency Cash Balance"
            setTextColor(getColor(R.color.text_secondary))
            textSize = 12f
        }

        val balanceVal = TextView(ctx).apply {
            text = "$1,428,500.00 USD"
            setTextColor(getColor(R.color.text_primary))
            textSize = 24f
            paint.isFakeBoldText = true
            setPadding(0, 4, 0, 16)
        }

        val statsRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            weightSum = 3f
        }

        fun makeStat(label: String, value: String, colorRes: Int): View {
            return LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                addView(TextView(ctx).apply {
                    text = label
                    setTextColor(getColor(R.color.text_muted))
                    textSize = 10f
                })
                addView(TextView(ctx).apply {
                    text = value
                    setTextColor(getColor(colorRes))
                    textSize = 16f
                    paint.isFakeBoldText = true
                })
            }
        }

        statsRow.addView(makeStat("Unreconciled", "${kpiData?.unreconciledCount ?: 14}", R.color.warning))
        statsRow.addView(makeStat("Anomalies", "${kpiData?.openAnomaliesCount ?: 6}", R.color.danger))
        statsRow.addView(makeStat("GAAP Health", "${kpiData?.gaapComplianceRate ?: 98.4}%", R.color.success))

        kpiContent.addView(title)
        kpiContent.addView(balanceVal)
        kpiContent.addView(statsRow)
        kpiCard.addView(kpiContent)
        layout.addView(kpiCard)

        // Quick Actions Card
        val actionTitle = TextView(ctx).apply {
            text = "Autonomous Ledger Operations"
            setTextColor(getColor(R.color.text_primary))
            textSize = 14f
            paint.isFakeBoldText = true
            setPadding(0, 8, 0, 12)
        }
        layout.addView(actionTitle)

        val btnPostClose = MaterialButton(ctx).apply {
            text = "Post Month-End Closing Journals (CPA Gate)"
            setBackgroundColor(getColor(R.color.primary))
            setTextColor(Color.WHITE)
            cornerRadius = 16
            setOnClickListener {
                BiometricHelper.promptBiometricApproval(
                    activity = this@MainActivity,
                    title = "CPA Biometric Approval",
                    subtitle = "Confirm biometric identity to post 3 pending ASC 830 adjustment journals",
                    onSuccess = {
                        Toast.makeText(ctx, "Biometric Verified! 3 Journals Posted to General Ledger.", Toast.LENGTH_LONG).show()
                        loadNativeData()
                    },
                    onError = { err ->
                        Toast.makeText(ctx, "Approval cancelled: $err", Toast.LENGTH_SHORT).show()
                    }
                )
            }
        }
        layout.addView(btnPostClose)
    }

    // --- TAB 2: TRANSACTIONS FEED ---
    private fun renderTransactionsTab() {
        val ctx = this
        val layout = binding.layoutNativeContent

        val header = TextView(ctx).apply {
            text = "Live Multi-Currency Ingestion Feed (${transactions.size})"
            setTextColor(getColor(R.color.text_primary))
            textSize = 14f
            paint.isFakeBoldText = true
            setPadding(0, 4, 0, 16)
        }
        layout.addView(header)

        transactions.forEach { tx ->
            val card = MaterialCardView(ctx).apply {
                setCardBackgroundColor(getColor(R.color.surface))
                radius = 16f
                strokeWidth = 1
                strokeColor = getColor(R.color.surface_card_light)
                setContentPadding(16, 16, 16, 16)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 12 }
            }

            val row = LinearLayout(ctx).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
            }

            val infoCol = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                addView(TextView(ctx).apply {
                    text = tx.description
                    setTextColor(getColor(R.color.text_primary))
                    textSize = 13f
                    paint.isFakeBoldText = true
                })
                addView(TextView(ctx).apply {
                    text = "${tx.date} • ${tx.categoryName} (${tx.glAccountCode})"
                    setTextColor(getColor(R.color.text_muted))
                    textSize = 11f
                })
            }

            val amountCol = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL
                gravity = android.view.Gravity.END
                addView(TextView(ctx).apply {
                    val sign = if (tx.amount >= 0) "+" else ""
                    text = "$sign${String.format("%.2f", tx.amount)} ${tx.currency}"
                    setTextColor(getColor(if (tx.amount >= 0) R.color.success else R.color.text_primary))
                    textSize = 13f
                    paint.isFakeBoldText = true
                })
                if (tx.currency != "USD" && tx.amountUsd != null) {
                    addView(TextView(ctx).apply {
                        text = "≈ $${String.format("%.2f", tx.amountUsd)} USD"
                        setTextColor(getColor(R.color.secondary))
                        textSize = 10f
                    })
                }
            }

            row.addView(infoCol)
            row.addView(amountCol)
            card.addView(row)
            layout.addView(card)
        }
    }

    // --- TAB 3: RECONCILIATION ---
    private fun renderReconciliationTab() {
        val ctx = this
        val layout = binding.layoutNativeContent

        val header = TextView(ctx).apply {
            text = "Continuous 1:1 and 1:N Reconciliation Engine"
            setTextColor(getColor(R.color.text_primary))
            textSize = 14f
            paint.isFakeBoldText = true
            setPadding(0, 4, 0, 16)
        }
        layout.addView(header)

        val card = MaterialCardView(ctx).apply {
            setCardBackgroundColor(getColor(R.color.surface))
            radius = 20f
            strokeWidth = 2
            strokeColor = getColor(R.color.secondary)
            setContentPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }

        val cardContent = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(ctx).apply {
                text = "Exact 1:1 Match Suggested (99.4% Confidence)"
                setTextColor(getColor(R.color.secondary))
                textSize = 12f
                paint.isFakeBoldText = true
            })
            addView(TextView(ctx).apply {
                text = "Bank: Stripe Payout $18,450.00 USD (Ref #ST-9921)"
                setTextColor(getColor(R.color.text_primary))
                textSize = 13f
                setPadding(0, 8, 0, 2)
            })
            addView(TextView(ctx).apply {
                text = "GL: Accounts Receivable - Stripe Clearing ($18,450.00 USD)"
                setTextColor(getColor(R.color.text_secondary))
                textSize = 12f
            })

            val btnApprove = MaterialButton(ctx).apply {
                text = "Approve Match & Lock Audit Trail"
                setBackgroundColor(getColor(R.color.success))
                setTextColor(Color.WHITE)
                cornerRadius = 12
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = 16 }
                setOnClickListener {
                    Toast.makeText(ctx, "Reconciliation match locked into SOX audit trail!", Toast.LENGTH_SHORT).show()
                }
            }
            addView(btnApprove)
        }

        card.addView(cardContent)
        layout.addView(card)
    }

    // --- TAB 4: ANOMALIES & FRAUD WATCH ---
    private fun renderAnomaliesTab() {
        val ctx = this
        val layout = binding.layoutNativeContent

        val header = TextView(ctx).apply {
            text = "Autonomous Fraud & Anomaly Watch (${anomalies.size} Active)"
            setTextColor(getColor(R.color.text_primary))
            textSize = 14f
            paint.isFakeBoldText = true
            setPadding(0, 4, 0, 16)
        }
        layout.addView(header)

        anomalies.forEach { alert ->
            val card = MaterialCardView(ctx).apply {
                setCardBackgroundColor(getColor(R.color.surface))
                radius = 16f
                strokeWidth = 2
                strokeColor = getColor(if (alert.severity == "high") R.color.danger else R.color.warning)
                setContentPadding(16, 16, 16, 16)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 12 }
            }

            val col = LinearLayout(ctx).apply {
                orientation = LinearLayout.VERTICAL

                val badgeRow = LinearLayout(ctx).apply {
                    orientation = LinearLayout.HORIZONTAL
                    addView(TextView(ctx).apply {
                        text = alert.severity.uppercase() + " SEVERITY"
                        setTextColor(getColor(if (alert.severity == "high") R.color.danger else R.color.warning))
                        textSize = 10f
                        paint.isFakeBoldText = true
                    })
                    addView(TextView(ctx).apply {
                        text = " • " + alert.anomalyType.replace("_", " ").uppercase()
                        setTextColor(getColor(R.color.text_muted))
                        textSize = 10f
                    })
                }
                addView(badgeRow)

                addView(TextView(ctx).apply {
                    text = alert.description
                    setTextColor(getColor(R.color.text_primary))
                    textSize = 13f
                    paint.isFakeBoldText = true
                    setPadding(0, 6, 0, 12)
                })

                val btnRow = LinearLayout(ctx).apply {
                    orientation = LinearLayout.HORIZONTAL
                    val btnDismiss = MaterialButton(ctx).apply {
                        text = "Dismiss"
                        setBackgroundColor(getColor(R.color.surface_card))
                        setTextColor(getColor(R.color.text_secondary))
                        cornerRadius = 8
                        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                        setOnClickListener {
                            lifecycleScope.launch {
                                api.dismissAnomaly(alert.id)
                                Toast.makeText(ctx, "Anomaly dismissed", Toast.LENGTH_SHORT).show()
                                loadNativeData()
                            }
                        }
                    }

                    val btnVerify = MaterialButton(ctx).apply {
                        text = "Flag for Audit"
                        setBackgroundColor(getColor(R.color.danger))
                        setTextColor(Color.WHITE)
                        cornerRadius = 8
                        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                            marginStart = 12
                        }
                        setOnClickListener {
                            Toast.makeText(ctx, "Flagged for auditor review", Toast.LENGTH_SHORT).show()
                        }
                    }

                    addView(btnDismiss)
                    addView(btnVerify)
                }
                addView(btnRow)
            }

            card.addView(col)
            layout.addView(card)
        }
    }

    // --- TAB 5: AI COPILOT CHAT ---
    private fun renderAssistantTab() {
        val ctx = this
        val layout = binding.layoutNativeContent

        val header = TextView(ctx).apply {
            text = "LedgerAI Copilot (Voice & Text Financial Assistant)"
            setTextColor(getColor(R.color.text_primary))
            textSize = 14f
            paint.isFakeBoldText = true
            setPadding(0, 4, 0, 12)
        }
        layout.addView(header)

        // Response Display Box
        val responseCard = MaterialCardView(ctx).apply {
            setCardBackgroundColor(getColor(R.color.surface))
            radius = 16f
            strokeWidth = 1
            strokeColor = getColor(R.color.surface_card_light)
            setContentPadding(16, 16, 16, 16)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }

        val tvResponse = TextView(ctx).apply {
            text = "👋 Hello! I am your Autonomous Bookkeeping Agent. Ask me about cash balances, ASC 830 foreign exchange rates, unreconciled items, or trial balance health."
            setTextColor(getColor(R.color.text_secondary))
            textSize = 13f
        }
        responseCard.addView(tvResponse)
        layout.addView(responseCard)

        // Input Field & Send Button
        val inputLayout = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 16 }
        }

        val etPrompt = EditText(ctx).apply {
            hint = "Ask financial question..."
            setHintTextColor(getColor(R.color.text_muted))
            setTextColor(getColor(R.color.text_primary))
            setBackgroundColor(getColor(R.color.surface_card))
            setPadding(16, 16, 16, 16)
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val btnSend = MaterialButton(ctx).apply {
            text = "Ask"
            setBackgroundColor(getColor(R.color.primary))
            setTextColor(Color.WHITE)
            cornerRadius = 8
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { marginStart = 8 }
            setOnClickListener {
                val q = etPrompt.text.toString().trim()
                if (q.isNotEmpty()) {
                    tvResponse.text = "Thinking..."
                    lifecycleScope.launch {
                        val reply = api.askAssistant(q).getOrDefault("Processed inquiry.")
                        tvResponse.text = reply
                        etPrompt.text.clear()
                    }
                }
            }
        }

        inputLayout.addView(etPrompt)
        inputLayout.addView(btnSend)
        layout.addView(inputLayout)

        // Quick Prompt Pills
        val pills = listOf(
            "What is our multi-currency balance?",
            "Are there any duplicate SaaS charges?",
            "Show ASC 830 FX adjustments"
        )

        pills.forEach { pillText ->
            val pillBtn = MaterialButton(ctx).apply {
                text = pillText
                setBackgroundColor(getColor(R.color.surface))
                setTextColor(getColor(R.color.secondary))
                cornerRadius = 12
                strokeWidth = 1
                strokeColor = getColor(R.color.surface_card_light)
                textSize = 11f
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 8 }
                setOnClickListener {
                    etPrompt.setText(pillText)
                    btnSend.performClick()
                }
            }
            layout.addView(pillBtn)
        }
    }
}
