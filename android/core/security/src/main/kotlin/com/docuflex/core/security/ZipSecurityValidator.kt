package com.docuflex.core.security

import java.io.File
import java.io.InputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

/**
 * Security defense for ZIP-based formats (DOCX, XLSX, PPTX, EPUB).
 * Protects against:
 * 1. ZipSlip: Path traversal vulnerability (e.g., "../../system/file")
 * 2. Zip Bomb: Enormous expansion ratio causing OutOfMemory or disk exhaustion
 * 3. Archive recursion / excessive entry count
 */
object ZipSecurityValidator {

    const val MAX_ENTRIES = 2000
    const val MAX_TOTAL_DECOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024L // 50MB
    const val MAX_RATIO = 100 // Uncompressed size cannot exceed 100x compressed size
    const val BUFFER_SIZE = 4096

    sealed class ValidationResult {
        object Safe : ValidationResult()
        data class Rejected(val reason: String) : ValidationResult()
    }

    /**
     * Inspects a ZIP stream safely without writing unverified files to disk.
     */
    fun inspectZipStream(inputStream: InputStream): ValidationResult {
        var totalEntries = 0
        var totalBytesRead = 0L

        try {
            val zipStream = ZipInputStream(inputStream)
            var entry: ZipEntry? = zipStream.nextEntry

            while (entry != null) {
                totalEntries++
                if (totalEntries > MAX_ENTRIES) {
                    return ValidationResult.Rejected("Exceeded maximum safe zip entry count ($MAX_ENTRIES entries).")
                }

                // 1. Zip-Slip Path Traversal Protection
                val name = entry.name
                if (name.contains("..") || name.startsWith("/") || name.startsWith("\\")) {
                    return ValidationResult.Rejected("Zip-Slip detected: invalid entry name '$name'")
                }

                // 2. Measure actual decompressed content
                val buffer = ByteArray(BUFFER_SIZE)
                var bytesRead: Int
                var entryBytesRead = 0L

                while (zipStream.read(buffer, 0, BUFFER_SIZE).also { bytesRead = it } != -1) {
                    entryBytesRead += bytesRead
                    totalBytesRead += bytesRead

                    if (totalBytesRead > MAX_TOTAL_DECOMPRESSED_SIZE_BYTES) {
                        return ValidationResult.Rejected("Decompressed payload exceeds maximum size limit (50 MB).")
                    }

                    // Ratio check if compressed size is reported
                    val compressedSize = entry.compressedSize
                    if (compressedSize > 0 && entryBytesRead > compressedSize * MAX_RATIO) {
                        return ValidationResult.Rejected("Suspicious compression ratio (> 100:1). Potential zip bomb aborted.")
                    }
                }

                zipStream.closeEntry()
                entry = zipStream.nextEntry
            }
        } catch (e: Exception) {
            return ValidationResult.Rejected("Malformed ZIP archive: ${e.message}")
        }

        return ValidationResult.Safe
    }

    /**
     * Verifies that a target destination file does not escape the destination folder.
     */
    fun isSafePath(destinationDir: File, entry: ZipEntry): Boolean {
        val destFile = File(destinationDir, entry.name)
        val canonicalDestDirPath = destinationDir.canonicalPath
        val canonicalDestFilePath = destFile.canonicalPath
        return canonicalDestFilePath.startsWith(canonicalDestDirPath + File.separator)
    }
}
