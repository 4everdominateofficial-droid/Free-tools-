package com.docuflex.core.model

/**
 * Result of comprehensive pre-viewing security validation.
 * Verifies magic bytes, size limits, encrypted status, and corruption.
 */
sealed class FileValidationResult {
    data class Valid(
        val detectedFormat: DocumentFormat,
        val sizeBytes: Long,
        val isPasswordProtected: Boolean = false
    ) : FileValidationResult()

    sealed class Invalid(val userMessage: String, val technicalDetail: String) : FileValidationResult() {
        class CorruptedFile(msg: String = "This file appears to be corrupted or truncated and cannot be opened safely.") :
            Invalid(msg, "Invalid header or unexpected EOF")

        class EncryptedUnsupported(msg: String = "Password-protected or encrypted file. Platform renderer cannot decrypt this file.") :
            Invalid(msg, "PDF/Office password protection flag detected")

        class OversizedFile(sizeMb: Double, maxMb: Double) :
            Invalid(
                "File size (${String.format("%.1f", sizeMb)} MB) exceeds safe offline limit of ${maxMb.toInt()} MB to prevent OutOfMemory crashes.",
                "Exceeded memory threshold"
            )

        class EmptyFile(msg: String = "File is empty (0 bytes).") :
            Invalid(msg, "Content length is zero")

        class SuspiciousZipAnomaly(msg: String = "Archive rejected: suspicious compression ratio or nested entry count (potential zip bomb).") :
            Invalid(msg, "ZipBomb threshold exceeded")

        class ZipSlipPathTraversal(msg: String = "Archive rejected: contains unsafe path traversal ('../') in entry names.") :
            Invalid(msg, "ZipSlip attempt detected")

        class UnsupportedFormat(msg: String = "This document format is not supported for offline rendering.") :
            Invalid(msg, "No matching magic bytes or safe parser")

        class StaleOrRevokedUri(msg: String = "Cannot access file. Permission may have been revoked or file was moved/deleted.") :
            Invalid(msg, "SecurityException or null ContentResolver descriptor")
    }
}
