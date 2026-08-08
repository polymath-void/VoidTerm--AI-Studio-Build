package com.hybridengine.terminal

import android.content.Context
import android.os.Build
import android.util.Log
import java.io.*
import java.util.zip.GZIPInputStream

class TarEntry(
    val name: String,
    val size: Long,
    val isDirectory: Boolean,
    val isSymbolicLink: Boolean,
    val linkName: String
)

class TarInputStream(private val inputStream: InputStream) : Closeable {
    private val buffer = ByteArray(512)

    fun getNextEntry(): TarEntry? {
        var bytesRead = 0
        while (bytesRead < 512) {
            val r = inputStream.read(buffer, bytesRead, 512 - bytesRead)
            if (r == -1) {
                if (bytesRead == 0) return null
                throw EOFException("Unexpected EOF in TAR header")
            }
            bytesRead += r
        }

        var isAllZeros = true
        for (i in 0 until 512) {
            if (buffer[i] != 0.toByte()) {
                isAllZeros = false
                break
            }
        }
        if (isAllZeros) {
            return null
        }

        var nameLength = 0
        while (nameLength < 100 && buffer[nameLength] != 0.toByte()) {
            nameLength++
        }
        val name = String(buffer, 0, nameLength, Charsets.UTF_8).trim()

        var sizeStr = ""
        for (i in 124 until 136) {
            val b = buffer[i]
            if (b == 0.toByte() || b == ' '.toByte()) continue
            sizeStr += b.toChar()
        }
        val size = try {
            if (sizeStr.isEmpty()) 0L else java.lang.Long.parseLong(sizeStr, 8)
        } catch (e: Exception) {
            0L
        }

        val typeFlag = buffer[156].toChar()
        val isDirectory = typeFlag == '5'
        val isSymbolicLink = typeFlag == '2'

        var linkLength = 0
        while (linkLength < 100 && buffer[157 + linkLength] != 0.toByte()) {
            linkLength++
        }
        val linkName = String(buffer, 157, linkLength, Charsets.UTF_8).trim()

        return TarEntry(name, size, isDirectory, isSymbolicLink, linkName)
    }

    fun readEntryData(outputStream: OutputStream, size: Long) {
        val dataBuffer = ByteArray(4096)
        var remaining = size
        while (remaining > 0) {
            val toRead = minOf(remaining, dataBuffer.size.toLong()).toInt()
            val r = inputStream.read(dataBuffer, 0, toRead)
            if (r == -1) {
                throw EOFException("Unexpected EOF reading TAR entry data")
            }
            outputStream.write(dataBuffer, 0, r)
            remaining -= r
        }

        val remainder = (size % 512).toInt()
        if (remainder > 0) {
            val toSkip = 512 - remainder
            var skipped = 0
            while (skipped < toSkip) {
                val s = inputStream.skip((toSkip - skipped).toLong())
                if (s <= 0) {
                    if (inputStream.read() == -1) {
                        throw EOFException("Unexpected EOF skipping TAR padding")
                    }
                    skipped++
                } else {
                    skipped += s.toInt()
                }
            }
        }
    }

    override fun close() {
        inputStream.close()
    }
}

class OsInstaller(private val context: Context) {

    fun extractDebianRootfs(assetName: String = "debian-bookworm.tar.gz", targetDirName: String = "debian_rootfs"): Boolean {
        val targetDir = File(context.filesDir, targetDirName)
        if (!targetDir.exists()) {
            targetDir.mkdirs()
        }

        Log.i("VoidTerm", "Starting Debian installation from asset '$assetName' to '${targetDir.absolutePath}'...")

        var inputStream: InputStream? = null
        var tarStream: TarInputStream? = null
        try {
            try {
                inputStream = context.assets.open(assetName)
            } catch (e: Exception) {
                Log.e("VoidTerm", "Asset file '$assetName' not found: ${e.message}")
                return false
            }

            val finalStream = if (assetName.endsWith(".gz") || assetName.endsWith(".tgz")) {
                GZIPInputStream(inputStream)
            } else {
                inputStream
            }

            tarStream = TarInputStream(finalStream)
            var entry = tarStream.getNextEntry()
            while (entry != null) {
                val destFile = File(targetDir, entry.name)

                val canonicalDest = destFile.canonicalPath
                val canonicalTarget = targetDir.canonicalPath
                if (!canonicalDest.startsWith(canonicalTarget)) {
                    throw SecurityException("TAR entry tries to write outside target directory: ${entry.name}")
                }

                if (entry.isDirectory) {
                    destFile.mkdirs()
                } else {
                    destFile.parentFile?.let { if (!it.exists()) it.mkdirs() }

                    if (entry.isSymbolicLink) {
                        Log.d("VoidTerm", "Symlink encountered in guest rootfs: ${entry.name} -> ${entry.linkName}")
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            try {
                                if (destFile.exists()) {
                                    destFile.delete()
                                }
                                android.system.Os.symlink(entry.linkName, destFile.absolutePath)
                            } catch (e: Exception) {
                                Log.w("VoidTerm", "Failed to create symlink: ${e.message}")
                            }
                        }
                    } else {
                        FileOutputStream(destFile).use { fos ->
                            tarStream.readEntryData(fos, entry.size)
                        }
                    }
                }
                entry = tarStream.getNextEntry()
            }
            Log.i("VoidTerm", "Debian core installation completed successfully.")
            return true
        } catch (e: Exception) {
            Log.e("VoidTerm", "Debian OS installation failed", e)
            return false
        } finally {
            tarStream?.close()
            inputStream?.close()
        }
    }
}
