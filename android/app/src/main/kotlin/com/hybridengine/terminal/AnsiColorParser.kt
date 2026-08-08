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
        var activeColor = TerminalConfig.getTextColor() // Default foreground color
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
                                        activeColor = TerminalConfig.getTextColor()
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
                                    30, 31, 32, 33, 34, 35, 36, 37, 39,
                                    90, 91, 92, 93, 94, 95, 96, 97 -> {
                                        activeColor = TerminalConfig.getAnsiColor(code)
                                    }
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
