package com.ledgerai.mobile.util

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.ledgerai.mobile.LedgerApp
import com.ledgerai.mobile.MainActivity
import com.ledgerai.mobile.R

object NotificationHelper {

    fun showAnomalyAlert(context: Context, anomalyId: String, title: String, message: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("target_tab", "anomalies")
            putExtra("anomaly_id", anomalyId)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            anomalyId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, LedgerApp.CHANNEL_ANOMALIES_ID)
            .setSmallIcon(R.drawable.ic_alert)
            .setContentTitle("🚨 High-Risk Financial Anomaly")
            .setContentText("$title: $message")
            .setStyle(NotificationCompat.BigTextStyle().bigText("$title: $message\nTap to inspect and confirm or dismiss."))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(anomalyId.hashCode(), notification)
        } catch (e: SecurityException) {
            // Android 13+ POST_NOTIFICATIONS permission not granted yet
        }
    }
}
