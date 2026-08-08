package com.hybridengine.terminal

import android.graphics.Color

/**
 * High-performance ANSI Color and SGR (Select Graphic Rendition) parser.
 * Converts raw command strings containing terminal control sequences into 
 * a series of styled spans with explicit Color and Typeface properties.
 */
class AnsiColorParser {

    data class StyledSpan(val text: String, val color: Int, val isBold: Boolean, val isBlink: Boolean = false)

    private enum class State {
        NORMAL, ESC, CSI
    }

    /**
     * Parses a raw terminal string containing ANSI SGR escape sequences.
     * Maps standard foreground, bright, and reset commands to hex-color paints.
     */
    fun parse(text: String): List<StyledSpan> {
        val result = mutableListOf<StyledSpan>()
        var activeColor = Color.parseColor("#E0E0E0") // Default warm white
        var activeBold = false
        var activeBlink = false

        var state = State.NORMAL
        val csiBuffer = StringBuilder()
        val currentText = StringBuilder()

        fun flushText() {
            if (currentText.isNotEmpty()) {
                result.add(StyledSpan(currentText.toString(), activeColor, activeBold, activeBlink))
                currentText.setLength(0)
            }
        }

        var i = 0
        while (i < text.length) {
            val c = text[i]
            when (state) {
                State.NORMAL -> {
                    if (c == '\u001b') {
                        state = State.ESC
                    } else {
                        currentText.append(c)
                    }
                }
                State.ESC -> {
                    if (c == '[') {
                        state = State.CSI
                        csiBuffer.setLength(0)
                    } else {
                        currentText.append('\u001b')
                        currentText.append(c)
                        state = State.NORMAL
                    }
                }
                State.CSI -> {
                    if (c in 'a'..'z' || c in 'A'..'Z') {
                        if (c == 'm') {
                            flushText()
                            val params = csiBuffer.toString()
                            val parts = params.split(";")
                            for (part in parts) {
                                val code = part.toIntOrNull() ?: 0
                                when (code) {
                                    0 -> { // Reset all attributes
                                        activeColor = Color.parseColor("#E0E0E0")
                                        activeBold = false
                                        activeBlink = false
                                    }
                                    1 -> { // Bold/increased intensity
                                        activeBold = true
                                    }
                                    5 -> { // Blink: slow
                                        activeBlink = true
                                    }
                                    22 -> { // Normal color/intensity (not bold)
                                        activeBold = false
                                    }
                                    25 -> { // Blink off
                                        activeBlink = false
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
                                    39 -> activeColor = Color.parseColor("#E0E0E0") // Default foreground color
                                    
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
                        state = State.NORMAL
                    } else {
                        csiBuffer.append(c)
                    }
                }
            }
            i++
        }
        flushText()
        return result
    }
}
