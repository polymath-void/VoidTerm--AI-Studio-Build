package com.hybridengine.terminal

import android.util.Log

class Broker(private val terminalView: TerminalSurfaceView) {
    
    private var isNativeLoaded = false

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
                terminalView.appendOutput("🚀 VoidTerm Shell Terminal v0.1.0-alpha")
                terminalView.appendOutput("📡 Hybrid Term Broker: Native Tokio multiplexer active.")
            } catch (e: Throwable) {
                Log.e("VoidTerm", "Failed to start native daemon", e)
                terminalView.appendOutput("⚠️ Native daemon start failed: ${e.message}")
            }
        } else {
            terminalView.appendOutput("🚀 VoidTerm Shell Terminal v0.1.0-alpha")
            terminalView.appendOutput("📡 Standalone Terminal Mode (Native Broker pending).")
            terminalView.appendOutput("Type commands below to interact.")
        }
    }

    fun send(command: String) {
        if (isNativeLoaded) {
            try {
                sendCommand(command)
            } catch (e: Throwable) {
                Log.e("VoidTerm", "Error sending command", e)
                terminalView.appendOutput("⚠️ Error executing command: ${e.message}")
            }
        } else {
            terminalView.appendOutput("Executed: $command")
        }
    }

    private external fun startDaemon()
    private external fun sendCommand(command: String)

    fun onTerminalOutput(output: String) {
        terminalView.appendOutput(output)
    }
}
