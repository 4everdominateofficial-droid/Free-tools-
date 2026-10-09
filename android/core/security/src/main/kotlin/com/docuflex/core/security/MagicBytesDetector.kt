package com.docuflex.core.security

import com.docuflex.core.model.DocumentFormat
import java.io.InputStream
import java.util.Locale

/**
 * Validates document content by magic bytes and binary signatures.
 * Security rule: NEVER trust file extension alone. Extension mismatches
 * (e.g., an executable named invoice.pdf) must be intercepted immediately.
 */
object MagicBytesDetector {

    private val PDF_MAGIC = byteArrayOf(0x25, 0x50, 0x44, 0x46) // "%PDF"
    private val PNG_MAGIC = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    private val JPEG_MAGIC = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())
    private val ZIP_MAGIC = byteArrayOf(0x50, 0x4B, 0x03, 0x04) // "PK.."

    // Executable / malicious binary headers to reject immediately
    private val DOS_MZ_MAGIC = byteArrayOf(0x4D, 0x5A) // "MZ" Windows executable / DLL
    private val ELF_MAGIC = byteArrayOf(0x7F, 0x45, 0x4C, 0x46) // ELF Linux/Android executable
    private val DEX_MAGIC = byteArrayOf(0x64, 0x65, 0x78, 0x0A) // Dalvik executable

    /**
     * Inspects the first 1024 bytes of the input stream.
     * Does not consume stream beyond what is read if reset supported.
     */
    fun detectFormat(headerBytes: ByteArray, extensionHint: String): DocumentFormat {
        if (headerBytes.isEmpty()) return DocumentFormat.UNKNOWN

        // 1. Intercept dangerous binary execution headers
        if (startsWith(headerBytes, DOS_MZ_MAGIC) ||
            startsWith(headerBytes, ELF_MAGIC) ||
            startsWith(headerBytes, DEX_MAGIC)
        ) {
            return DocumentFormat.UNKNOWN
        }

        // 2. Check PDF
        if (startsWith(headerBytes, PDF_MAGIC)) {
            return DocumentFormat.PDF
        }

        // 3. Check PNG
        if (startsWith(headerBytes, PNG_MAGIC)) {
            return DocumentFormat.PNG
        }

        // 4. Check JPEG
        if (startsWith(headerBytes, JPEG_MAGIC)) {
            return DocumentFormat.JPEG
        }

        // 5. Check WebP: RIFF....WEBP
        if (headerBytes.size >= 12 &&
            headerBytes[0] == 0x52.toByte() && headerBytes[1] == 0x49.toByte() &&
            headerBytes[2] == 0x46.toByte() && headerBytes[3] == 0x46.toByte() &&
            headerBytes[8] == 0x57.toByte() && headerBytes[9] == 0x45.toByte() &&
            headerBytes[10] == 0x42.toByte() && headerBytes[11] == 0x50.toByte()
        ) {
            return DocumentFormat.WEBP
        }

        // 6. Check ZIP-based OpenXML Office formats (DOCX, XLSX, PPTX)
        if (startsWith(headerBytes, ZIP_MAGIC)) {
            return when (extensionHint.lowercase(Locale.ROOT)) {
                "docx" -> DocumentFormat.DOCX
                "xlsx" -> DocumentFormat.XLSX
                "pptx" -> DocumentFormat.PPTX
                else -> DocumentFormat.UNKNOWN
            }
        }

        // 7. Check HTML preview
        val headerString = String(headerBytes, 0, minOf(headerBytes.size, 512), Charsets.UTF_8).lowercase(Locale.ROOT)
        if (headerString.contains("<!doctype html") || headerString.contains("<html") || headerString.contains("<body")) {
            return DocumentFormat.HTML
        }

        // 8. Text / CSV detection: Verify text printable characters, no null bytes
        var nullByteCount = 0
        for (i in 0 until minOf(headerBytes.size, 256)) {
            if (headerBytes[i] == 0.toByte()) nullByteCount++
        }
        if (nullByteCount == 0) {
            if (extensionHint.equals("csv", ignoreCase = true) ||
                (headerString.contains(",") && headerString.contains("\n"))
            ) {
                return DocumentFormat.CSV
            }
            return DocumentFormat.TXT
        }

        return DocumentFormat.UNKNOWN
    }

    private fun startsWith(array: ByteArray, prefix: ByteArray): Boolean {
        if (array.size < prefix.size) return false
        for (i in prefix.indices) {
            if (array[i] != prefix[i]) return false
        }
        return true
    }
}
