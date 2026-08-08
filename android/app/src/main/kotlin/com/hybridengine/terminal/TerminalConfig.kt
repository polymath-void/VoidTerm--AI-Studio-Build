package com.hybridengine.terminal

import android.content.Context
import android.graphics.Color
import androidx.preference.PreferenceManager

object TerminalConfig {
    var themeName = "default"
    var cursorStyle = "block"
    var cursorBlink = true
    var fontSizeSp = 16f

    fun load(context: Context) {
        val prefs = PreferenceManager.getDefaultSharedPreferences(context)
        themeName = prefs.getString("theme", "default") ?: "default"
        cursorStyle = prefs.getString("cursor_style", "block") ?: "block"
        cursorBlink = prefs.getBoolean("cursor_blink", true)
        val fontSizeStr = prefs.getString("font_size", "16") ?: "16"
        fontSizeSp = fontSizeStr.toFloatOrNull() ?: 16f
    }

    fun getBackgroundColor(): Int {
        return when (themeName) {
            "dracula" -> Color.parseColor("#282A36")
            "nord" -> Color.parseColor("#2E3440")
            "monokai" -> Color.parseColor("#272822")
            else -> Color.parseColor("#0A0A0A") // Default deep true black
        }
    }

    fun getTextColor(): Int {
        return when (themeName) {
            "dracula" -> Color.parseColor("#F8F8F2")
            "nord" -> Color.parseColor("#D8DEE9")
            "monokai" -> Color.parseColor("#F8F8F2")
            else -> Color.parseColor("#E0E0E0") // Default off-white
        }
    }

    fun getAnsiColor(code: Int): Int {
        val defaultColor = when (code) {
            30 -> "#1C1C1C" // Black
            31 -> "#E57373" // Red
            32 -> "#81C784" // Green
            33 -> "#FFD54F" // Yellow
            34 -> "#64B5F6" // Blue
            35 -> "#BA68C8" // Magenta
            36 -> "#4DD0E1" // Cyan
            37, 39 -> "#E0E0E0" // White / Default
            90 -> "#757575" // Bright Black (Gray)
            91 -> "#FF8A80" // Bright Red
            92 -> "#B9F6CA" // Bright Green
            93 -> "#FFE082" // Bright Yellow
            94 -> "#82B1FF" // Bright Blue
            95 -> "#F8BBD0" // Bright Magenta
            96 -> "#A7FFEB" // Bright Cyan
            97 -> "#FFFFFF" // Bright White
            else -> "#E0E0E0"
        }

        val draculaColor = when (code) {
            30 -> "#21222C"
            31 -> "#FF5555"
            32 -> "#50FA7B"
            33 -> "#F1FA8C"
            34 -> "#BD93F9"
            35 -> "#FF79C6"
            36 -> "#8BE9FD"
            37, 39 -> "#F8F8F2"
            90 -> "#6272A4"
            91 -> "#FF6E6E"
            92 -> "#69FF94"
            93 -> "#FFFFA5"
            94 -> "#D6ACFF"
            95 -> "#FF92DF"
            96 -> "#A4FFFF"
            97 -> "#FFFFFF"
            else -> "#F8F8F2"
        }

        val nordColor = when (code) {
            30 -> "#3B4252"
            31 -> "#BF616A"
            32 -> "#A3BE8C"
            33 -> "#EBCB8B"
            34 -> "#81A1C1"
            35 -> "#B48EAD"
            36 -> "#88C0D0"
            37, 39 -> "#D8DEE9"
            90 -> "#4C566A"
            91 -> "#D08770"
            92 -> "#8FBCBB"
            93 -> "#EBCB8B"
            94 -> "#88C0D0"
            95 -> "#B48EAD"
            96 -> "#8FBCBB"
            97 -> "#ECEFF4"
            else -> "#D8DEE9"
        }

        val monokaiColor = when (code) {
            30 -> "#1E1F1C"
            31 -> "#F92672"
            32 -> "#A6E22E"
            33 -> "#FD971F"
            34 -> "#66D9EF"
            35 -> "#AE81FF"
            36 -> "#A1EFE4"
            37, 39 -> "#F8F8F2"
            90 -> "#75715E"
            91 -> "#F92672"
            92 -> "#A6E22E"
            93 -> "#E6DB74"
            94 -> "#66D9EF"
            95 -> "#AE81FF"
            96 -> "#A1EFE4"
            97 -> "#F8F8F2"
            else -> "#F8F8F2"
        }

        val hex = when (themeName) {
            "dracula" -> draculaColor
            "nord" -> nordColor
            "monokai" -> monokaiColor
            else -> defaultColor
        }
        return Color.parseColor(hex)
    }
}
