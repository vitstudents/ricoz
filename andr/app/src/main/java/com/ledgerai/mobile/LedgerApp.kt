package com.ledgerai.mobile

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

class LedgerApp : Application() {

    companion object {
        lateinit var instance: LedgerApp
            private set
        
        lateinit var okHttpClient: OkHttpClient
            private set

        const val CHANNEL_ANOMALIES_ID = "channel_financial_anomalies"
        const val CHANNEL_CLOSING_ID = "channel_financial_close"
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        setupHttpClient()
        createNotificationChannels()
    }

    private fun setupHttpClient() {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        okHttpClient = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val anomalyChannel = NotificationChannel(
                CHANNEL_ANOMALIES_ID,
                getString(R.string.channel_anomalies_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.channel_anomalies_desc)
                enableVibration(true)
            }

            val closeChannel = NotificationChannel(
                CHANNEL_CLOSING_ID,
                "Month-End Close Alerts",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications for trial balance verification and journal approvals"
            }

            notificationManager.createNotificationChannel(anomalyChannel)
            notificationManager.createNotificationChannel(closeChannel)
        }
    }
}
