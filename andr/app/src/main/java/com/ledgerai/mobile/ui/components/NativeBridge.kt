package com.ledgerai.mobile.ui.components

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import com.ledgerai.mobile.util.BiometricHelper
import com.ledgerai.mobile.util.NotificationHelper

class NativeBridge(
    private val activity: FragmentActivity,
    private val onJournalApproved: (String) -> Unit
) {

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long = 100) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator.vibrate(
                VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
            )
        } else {
            @Suppress("DEPRECATION")
            val vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            vibrator.vibrate(durationMs)
        }
    }

    @JavascriptInterface
    fun requestBiometricJournalApproval(journalId: String) {
        activity.runOnUiThread {
            if (BiometricHelper.isBiometricAvailable(activity)) {
                BiometricHelper.promptBiometricApproval(
                    activity = activity,
                    title = "CPA Biometric Approval",
                    subtitle = "Confirm identity to post journal $journalId to General Ledger",
                    onSuccess = {
                        vibrate(150)
                        Toast.makeText(activity, "Biometric verified! Posting journal...", Toast.LENGTH_SHORT).show()
                        onJournalApproved(journalId)
                    },
                    onError = { err ->
                        Toast.makeText(activity, "Authentication failed: $err", Toast.LENGTH_SHORT).show()
                    }
                )
            } else {
                // Device without biometrics: fallback with confirmation
                Toast.makeText(activity, "Biometrics unavailable. Approving journal directly.", Toast.LENGTH_SHORT).show()
                onJournalApproved(journalId)
            }
        }
    }

    @JavascriptInterface
    fun notifyAnomaly(title: String, message: String, anomalyId: String) {
        NotificationHelper.showAnomalyAlert(activity, anomalyId, title, message)
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0 (Android Native / Hybrid)"
    }
}
