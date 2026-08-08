package com.hybridengine.terminal

import android.util.Log

class Broker(private val vmProvisioner: AvfVmProvisioner) {
    
    private var isNativeLoaded = false

    companion object {
        @Volatile
        var activeView: TerminalSurfaceView? = null
            set(value) {
                field = value
                if (value != null) {
                    // Flush history to newly bound active view
                    synchronized(outputHistory) {
                        for (line in outputHistory) {
                            value.appendOutput(line)
                        }
                    }
                }
            }

        private val outputHistory = ArrayList<String>()

        fun appendToHistoryAndRender(text: String) {
            synchronized(outputHistory) {
                outputHistory.add(text)
                if (outputHistory.size > 1000) {
                    outputHistory.removeAt(0)
                }
            }
            activeView?.appendOutput(text)
        }

        fun clearHistory() {
            synchronized(outputHistory) {
                outputHistory.clear()
            }
        }
    }

    init {
        try {
            System.loadLibrary("hybrid_term_broker")
            isNativeLoaded = true
            Log.i("VoidTerm", "libhybrid_term_broker.so loaded successfully.")
        } catch (e: UnsatisfiedLinkError) {
            Log.e("VoidTerm", "libhybrid_term_broker.so not found or failed to load", e)
        } catch (e: Exception) {
            Log.e("VoidTerm", "Unexpected error loading native library", e)
        }
    }

    fun start() {
        if (isNativeLoaded) {
            try {
                startDaemon()
                appendToHistoryAndRender("🚀 VoidTerm Shell Terminal v0.1.0-alpha\n")
                appendToHistoryAndRender("📡 Hybrid Term Broker: Native Tokio multiplexer active.\n")
            } catch (e: Throwable) {
                Log.e("VoidTerm", "Failed to start native daemon", e)
                appendToHistoryAndRender("⚠️ Native daemon start failed: ${e.message}\n")
            }
        } else {
            appendToHistoryAndRender("🚀 VoidTerm Shell Terminal v0.1.0-alpha\n")
            appendToHistoryAndRender("📡 Standalone Terminal Mode (Native Broker pending).\n")
            appendToHistoryAndRender("Type commands below to interact.\n")
        }
    }

    fun send(command: String) {
        if (isNativeLoaded) {
            try {
                val trimmed = command.trim()
                if (trimmed.startsWith("vm ")) {
                    // Dynamically open vsock connection from Kotlin to bypass SELinux
                    val fd = vmProvisioner.connectVsockNow(8000)
                    if (fd != -1) {
                        Log.i("VoidTerm", "Dynamic SELinux Bypass: Passing vsock FD $fd to native Broker")
                        attachVsockFd(fd)
                    } else {
                        Log.e("VoidTerm", "Dynamic SELinux Bypass Failed: Could not get vsock FD from VM")
                    }
                }
                sendCommand(command)
            } catch (e: Throwable) {
                Log.e("VoidTerm", "Error sending command", e)
                appendToHistoryAndRender("⚠️ Error executing command: ${e.message}\n")
            }
        } else {
            appendToHistoryAndRender("Executed: $command\n")
        }
    }

    private external fun startDaemon()
    private external fun sendCommand(command: String)
    external fun attachVsockFd(fd: Int)

    fun onTerminalOutput(output: String) {
        appendToHistoryAndRender(output)
    }
}
