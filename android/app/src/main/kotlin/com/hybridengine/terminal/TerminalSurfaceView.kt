package com.hybridengine.terminal

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.util.AttributeSet
import android.util.Log
import android.view.SurfaceHolder
import android.view.SurfaceView

class TerminalSurfaceView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : SurfaceView(context, attrs, defStyleAttr), SurfaceHolder.Callback, Runnable {

    private var drawingThread: Thread? = null
    @Volatile
    private var isRunning = false

    // Inner class representing a row of character cells, supporting custom colors and styles
    class TerminalLine {
        private val chars = StringBuilder()
        private val colors = mutableListOf<Int>()
        private val bolds = mutableListOf<Boolean>()

        fun clear() {
            chars.setLength(0)
            colors.clear()
            bolds.clear()
        }

        fun setChar(col: Int, char: Char, color: Int, bold: Boolean) {
            while (chars.length <= col) {
                chars.append(' ')
                colors.add(Color.parseColor("#E0E0E0"))
                bolds.add(false)
            }
            chars.setCharAt(col, char)
            colors[col] = color
            bolds[col] = bold
        }

        fun getSpans(): List<StyledSpan> {
            val result = mutableListOf<StyledSpan>()
            if (chars.isEmpty()) return result

            var currentText = StringBuilder()
            var currentColor = colors[0]
            var currentBold = bolds[0]

            for (i in 0 until chars.length) {
                val c = chars[i]
                val color = colors[i]
                val bold = bolds[i]

                if (color != currentColor || bold != currentBold) {
                    result.add(StyledSpan(currentText.toString(), currentColor, currentBold))
                    currentText = StringBuilder()
                    currentColor = color
                    currentBold = bold
                }
                currentText.append(c)
            }
            if (currentText.isNotEmpty()) {
                result.add(StyledSpan(currentText.toString(), currentColor, currentBold))
            }
            return result
        }
    }

    data class StyledSpan(val text: String, val color: Int, val isBold: Boolean)

    // Bound buffer of terminal lines
    private val linesBuffer = mutableListOf<TerminalLine>()
    private var cursorCol = 0

    // Active ANSI formatting state
    private var activeColor = Color.parseColor("#E0E0E0")
    private var activeBold = false

    private enum class AnsiState {
        NORMAL, ESC, CSI
    }
    private var ansiState = AnsiState.NORMAL
    private val csiBuffer = StringBuilder()

    // Minimalist, hardware-native typography configuration
    private val textPaint = Paint().apply {
        textSize = 42f
        typeface = Typeface.MONOSPACE
        isAntiAlias = true
    }

    private val backgroundPaint = Paint().apply {
        color = Color.parseColor("#0A0A0A") // Deep true black
    }

    private var blinkState = true
    private var lastBlinkTime = 0L

    init {
        holder.addCallback(this)
        // Initialize first line
        linesBuffer.add(TerminalLine())
        updateConfig()
    }

    fun updateConfig() {
        try {
            TerminalConfig.load(context)
            val density = resources.displayMetrics.density
            textPaint.textSize = TerminalConfig.fontSizeSp * density
            backgroundPaint.color = TerminalConfig.getBackgroundColor()
            activeColor = TerminalConfig.getTextColor()
        } catch (e: Exception) {
            Log.e("VoidTerm", "Failed to load terminal config: ${e.message}")
        }
    }

    // Safely append and parse streaming terminal output (ANSI SGR codes, \b, \r)
    fun appendOutput(text: String) {
        synchronized(this) {
            var i = 0
            while (i < text.length) {
                val c = text[i]
                when (ansiState) {
                    AnsiState.NORMAL -> {
                        when (c) {
                            '\u001b' -> {
                                ansiState = AnsiState.ESC
                            }
                            '\n' -> {
                                addNewLine()
                            }
                            '\r' -> {
                                cursorCol = 0
                            }
                            '\b' -> {
                                if (cursorCol > 0) {
                                    cursorCol--
                                }
                            }
                            else -> {
                                val line = getOrCreateActiveLine()
                                line.setChar(cursorCol, c, activeColor, activeBold)
                                cursorCol++
                            }
                        }
                    }
                    AnsiState.ESC -> {
                        if (c == '[') {
                            ansiState = AnsiState.CSI
                            csiBuffer.setLength(0)
                        } else {
                            ansiState = AnsiState.NORMAL
                        }
                    }
                    AnsiState.CSI -> {
                        if (c in 'a'..'z' || c in 'A'..'Z') {
                            handleCsiSequence(c, csiBuffer.toString())
                            ansiState = AnsiState.NORMAL
                        } else {
                            csiBuffer.append(c)
                        }
                    }
                }
                i++
            }
        }
    }

    private fun getOrCreateActiveLine(): TerminalLine {
        if (linesBuffer.isEmpty()) {
            linesBuffer.add(TerminalLine())
        }
        return linesBuffer.last()
    }

    private fun addNewLine() {
        linesBuffer.add(TerminalLine())
        cursorCol = 0
        if (linesBuffer.size > 500) {
            linesBuffer.removeAt(0)
        }
    }

    private fun handleCsiSequence(command: Char, params: String) {
        if (command == 'm') {
            val parts = params.split(";")
            for (part in parts) {
                val code = part.toIntOrNull() ?: 0
                when (code) {
                    0 -> {
                        activeColor = Color.parseColor("#E0E0E0")
                        activeBold = false
                    }
                    1 -> {
                        activeBold = true
                    }
                    // Material-neutral sophisticated standard terminal colors
                    30 -> activeColor = Color.parseColor("#1C1C1C") // Black
                    31 -> activeColor = Color.parseColor("#E57373") // Red
                    32 -> activeColor = Color.parseColor("#81C784") // Green
                    33 -> activeColor = Color.parseColor("#FFD54F") // Yellow
                    34 -> activeColor = Color.parseColor("#64B5F6") // Blue
                    35 -> activeColor = Color.parseColor("#BA68C8") // Magenta
                    36 -> activeColor = Color.parseColor("#4DD0E1") // Cyan
                    37 -> activeColor = Color.parseColor("#E0E0E0") // White
                    
                    // High-intensity bright variants
                    90 -> activeColor = Color.parseColor("#757575") // Bright Black (Gray)
                    91 -> activeColor = Color.parseColor("#FF8A80") // Bright Red
                    92 -> activeColor = Color.parseColor("#B9F6CA") // Bright Green
                    93 -> activeColor = Color.parseColor("#FFE082") // Bright Yellow
                    94 -> activeColor = Color.parseColor("#82B1FF") // Bright Blue
                    95 -> activeColor = Color.parseColor("#F8BBD0") // Bright Magenta
                    96 -> activeColor = Color.parseColor("#A7FFEB") // Bright Cyan
                    97 -> activeColor = Color.parseColor("#FFFFFF") // Bright White
                }
            }
        }
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        isRunning = true
        drawingThread = Thread(this, "VoidTerm-Renderer").apply { start() }
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        isRunning = false
        try {
            drawingThread?.join(500)
        } catch (e: InterruptedException) {
            Log.w("VoidTerm", "Drawing thread join interrupted")
        }
    }

    override fun run() {
        while (isRunning) {
            if (!holder.surface.isValid) {
                try {
                    Thread.sleep(100) // Deep sleep when backgrounded to conserve CPU & battery
                } catch (_: Exception) {}
                continue
            }

            var canvas: Canvas? = null
            try {
                canvas = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        holder.lockHardwareCanvas()
                    } catch (_: Exception) {
                        holder.lockCanvas()
                    }
                } else {
                    holder.lockCanvas()
                }

                if (canvas != null) {
                    drawTerminal(canvas)
                }
            } catch (e: Exception) {
                Log.e("VoidTerm", "Error drawing frame: ${e.message}")
            } finally {
                if (canvas != null) {
                    try {
                        holder.unlockCanvasAndPost(canvas)
                    } catch (e: Exception) {
                        Log.e("VoidTerm", "Error posting canvas: ${e.message}")
                    }
                }
            }

            try {
                Thread.sleep(16) // Solid ~60fps rendering interval
            } catch (_: Exception) {}
        }
    }

    private fun drawTerminal(canvas: Canvas) {
        // Draw background canvas
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), backgroundPaint)

        synchronized(this) {
            var yOffset = height.toFloat() - 50f
            val textSize = textPaint.textSize

            for (i in linesBuffer.indices.reversed()) {
                if (yOffset < 0) break
                val line = linesBuffer[i]
                val spans = line.getSpans()

                var xOffset = 20f
                for (span in spans) {
                    textPaint.color = span.color
                    textPaint.isFakeBoldText = span.isBold

                    canvas.drawText(span.text, xOffset, yOffset, textPaint)
                    xOffset += textPaint.measureText(span.text)
                }

                // Draw terminal cursor on the latest line
                if (i == linesBuffer.size - 1) {
                    drawCursor(canvas, yOffset, textSize)
                }

                yOffset -= (textSize + 10f)
            }
        }
    }

    private fun drawCursor(canvas: Canvas, yOffset: Float, textSize: Float) {
        if (TerminalConfig.cursorBlink) {
            val now = System.currentTimeMillis()
            if (now - lastBlinkTime > 500) {
                blinkState = !blinkState
                lastBlinkTime = now
            }
            if (!blinkState) return
        }

        val cursorPaint = Paint().apply {
            color = TerminalConfig.getTextColor()
            this.textSize = textPaint.textSize
            this.typeface = textPaint.typeface
        }

        // Measure space width as character width
        val charWidth = textPaint.measureText(" ")
        val cursorLeft = 20f + (cursorCol * charWidth)

        val cursorChar = when (TerminalConfig.cursorStyle) {
            "underline" -> "_"
            "bar" -> "|"
            else -> "█"
        }

        canvas.drawText(cursorChar, cursorLeft, yOffset, cursorPaint)
    }
}
