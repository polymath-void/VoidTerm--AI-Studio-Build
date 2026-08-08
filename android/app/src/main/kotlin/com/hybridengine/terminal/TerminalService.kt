package com.hybridengine.terminal

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

class TerminalService : Service() {

    companion object {
        const val CHANNEL_ID = "voidterm_service_channel"
        const val NOTIFICATION_ID = 9182
        const val ACTION_SHUTDOWN = "com.hybridengine.terminal.ACTION_SHUTDOWN"

        @Volatile
        var vmProvisioner: AvfVmProvisioner? = null
            private set

        @Volatile
        var broker: Broker? = null
            private set

        @Volatile
        var isRunning = false
            private set
            
        @Volatile
        var bootStatus = "not_started" // "booting", "online", "failed", "offline"
            private set

        @Volatile
        var bootMessage = ""
            private set

        @Volatile
        var onStatusChanged: (() -> Unit)? = null
    }

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Booting terminal environment..."))
        
        Log.i("VoidTermService", "TerminalService created. Provisioning AVF VM and Rust Broker...")
        
        val provisioner = AvfVmProvisioner(this)
        vmProvisioner = provisioner
        bootStatus = "booting"
        bootMessage = "\u001b[36m⚡ System: Booting AVF MicroVM sandbox...\u001b[0m"
        onStatusChanged?.invoke()

        provisioner.bootVmAsync { success ->
            val b = Broker(provisioner)
            broker = b
            b.start()

            if (success) {
                bootStatus = "online"
                val fd = provisioner.getVsockFd()
                if (fd != -1) {
                    b.attachVsockFd(fd)
                    bootMessage = "\u001b[32m✅ System: Guest Linux VM is online (CID 3) [Direct SELinux Bypass Active].\u001b[0m"
                } else {
                    bootMessage = "\u001b[32m✅ System: Guest Linux VM is online (CID 3).\u001b[0m"
                }
                updateNotification("Guest Linux VM is online.")
            } else {
                bootStatus = "failed"
                bootMessage = "\u001b[33m⚠️ System: AVF hypervisor unavailable. Standing up host shell.\u001b[0m"
                updateNotification("Host shell terminal active.")
            }
            onStatusChanged?.invoke()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null && intent.action == ACTION_SHUTDOWN) {
            Log.i("VoidTermService", "Received ACTION_SHUTDOWN intent. Gracefully stopping VM and Service...")
            shutdownGracefully()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun shutdownGracefully() {
        bootStatus = "offline"
        bootMessage = "\u001b[31m❌ System: Terminal environment has been shut down.\u001b[0m"
        onStatusChanged?.invoke()

        try {
            vmProvisioner?.stopVm()
        } catch (e: Exception) {
            Log.e("VoidTermService", "Failed to stop VM on service destroy: ${e.message}")
        }
        
        stopForeground(true)
        stopSelf()
        isRunning = false
        vmProvisioner = null
        broker = null
    }

    override fun onDestroy() {
        super.onDestroy()
        shutdownGracefully()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VoidTerm Terminal Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps VoidTerm VM and IPC daemon active in background"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val mainPendingIntent = PendingIntent.getActivity(
            this, 0, mainIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val shutdownIntent = Intent(this, TerminalService::class.java).apply {
            action = ACTION_SHUTDOWN
        }
        val shutdownPendingIntent = PendingIntent.getService(
            this, 1, shutdownIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VoidTerm Shell Terminal")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.sym_def_app_icon)
            .setContentIntent(mainPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Shutdown VM", shutdownPendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(contentText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(contentText))
    }
}
