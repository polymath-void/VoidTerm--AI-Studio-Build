package com.hybridengine.terminal

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.util.Log
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var terminalSurface: TerminalSurfaceView
    private var broker: Broker? = null
    private lateinit var commandInput: EditText
    private lateinit var btnSend: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 1. Initialize Views
        terminalSurface = findViewById(R.id.terminal_surface)
        commandInput = findViewById(R.id.command_input)
        btnSend = findViewById(R.id.btn_send)

        // 2. Start/Connect to Foreground Service
        terminalSurface.appendOutput("\u001b[36m⚡ System: Initializing background services...\u001b[0m")
        val serviceIntent = Intent(this, TerminalService::class.java)
        if (!TerminalService.isRunning) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        }

        TerminalService.onStatusChanged = {
            runOnUiThread {
                syncServiceState()
            }
        }

        syncServiceState()

        // 3. Request Storage Permissions safely
        try {
            requestStoragePermissions()
        } catch (e: Exception) {
            Log.w("VoidTerm", "Storage permission request error: ${e.message}")
        }

        // 4. Setup Input Listeners
        btnSend.setOnClickListener {
            dispatchCommand()
        }

        val fabSettings = findViewById<com.google.android.material.floatingactionbutton.FloatingActionButton>(R.id.fab_settings)
        fabSettings.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

        commandInput.setOnEditorActionListener { _, actionId, event ->
            if (actionId == EditorInfo.IME_ACTION_SEND || 
                (event != null && event.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)) {
                dispatchCommand()
                true
            } else {
                false
            }
        }
    }

    private fun syncServiceState() {
        val currentBroker = TerminalService.broker
        if (currentBroker != null) {
            this.broker = currentBroker
            Broker.activeView = terminalSurface
        }
    }

    override fun onResume() {
        super.onResume()
        if (::terminalSurface.isInitialized) {
            terminalSurface.updateConfig()
        }
        syncServiceState()
    }

    override fun onPause() {
        super.onPause()
        Broker.activeView = null
    }

    override fun onDestroy() {
        super.onDestroy()
        TerminalService.onStatusChanged = null
        Broker.activeView = null
    }

    private fun requestStoragePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                        data = Uri.fromParts("package", packageName, null)
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    try {
                        val fallbackIntent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
                        startActivity(fallbackIntent)
                    } catch (ex: Exception) {
                        Log.w("VoidTerm", "Could not launch manage storage intent: ${ex.message}")
                    }
                }
            }
        }
    }

    private fun dispatchCommand() {
        val command = commandInput.text.toString().trim()
        if (command.isNotEmpty()) {
            // Echo the command to the screen visually
            terminalSurface.appendOutput("\n\u001b[35muser@voidterm:~$\u001b[0m $command")
            
            val currentBroker = broker
            if (currentBroker != null) {
                // Push the command down through the broker
                currentBroker.send(command)
            } else {
                terminalSurface.appendOutput("\u001b[33m⚠️ System: Hypervisor is currently provisioning. Please wait.\u001b[0m")
            }
            
            // Clear the input field
            commandInput.text.clear()
        }
    }
}
