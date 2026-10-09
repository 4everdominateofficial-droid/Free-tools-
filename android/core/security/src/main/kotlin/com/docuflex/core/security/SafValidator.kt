package com.docuflex.core.security

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.FileValidationResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream

/**
 * Storage Access Framework (SAF) validator.
 * - Adheres strictly to SAF without broad storage permissions (READ_EXTERNAL_STORAGE is avoided).
 * - Treats all incoming URIs as untrusted.
 * - Validates file descriptor, size boundaries, and detects password-protected PDFs.
 */
class SafValidator(private val context: Context) {

    companion object {
        const val MAX_SAFE_FILE_SIZE_BYTES = 50 * 1024 * 1024L // 50MB safe offline boundary
        const val HEADER_PROBE_SIZE = 4096
    }

    suspend fun validateUri(uri: Uri): FileValidationResult = withContext(Dispatchers.IO) {
        val contentResolver = context.contentResolver

        // 1. Resolve metadata (display name and size)
        var displayName = "Document"
        var reportedSize = 0L

        try {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        displayName = cursor.getString(nameIndex) ?: "Document"
                    }
                    val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (sizeIndex != -1) {
                        reportedSize = cursor.getLong(sizeIndex)
                    }
                }
            }
        } catch (e: SecurityException) {
            return@withContext FileValidationResult.Invalid.StaleOrRevokedUri(
                "Access denied or permission revoked for this file."
            )
        } catch (e: Exception) {
            // Non-critical if cursor metadata query fails; fallback to stream length
        }

        // 2. Open stream safely
        val headerBytes = ByteArray(HEADER_PROBE_SIZE)
        var bytesRead = 0
        var totalStreamSize = 0L

        try {
            contentResolver.openInputStream(uri)?.use { stream ->
                bytesRead = stream.read(headerBytes, 0, HEADER_PROBE_SIZE)
                if (bytesRead <= 0) {
                    return@withContext FileValidationResult.Invalid.EmptyFile()
                }

                // If reportedSize was 0, estimate stream size
                totalStreamSize = if (reportedSize > 0) reportedSize else bytesRead.toLong()
            } ?: return@withContext FileValidationResult.Invalid.StaleOrRevokedUri()
        } catch (e: SecurityException) {
            return@withContext FileValidationResult.Invalid.StaleOrRevokedUri()
        } catch (e: Exception) {
            return@withContext FileValidationResult.Invalid.CorruptedFile("Failed to open file stream: ${e.localizedMessage}")
        }

        // 3. Enforce maximum file size
        if (totalStreamSize > MAX_SAFE_FILE_SIZE_BYTES) {
            val sizeMb = totalStreamSize / (1024.0 * 1024.0)
            val maxMb = MAX_SAFE_FILE_SIZE_BYTES / (1024.0 * 1024.0)
            return@withContext FileValidationResult.Invalid.OversizedFile(sizeMb, maxMb)
        }

        // 4. Extract extension hint
        val extensionHint = displayName.substringAfterLast('.', "").lowercase()

        // 5. Detect format via magic bytes
        val validSlice = if (bytesRead > 0) headerBytes.copyOf(bytesRead) else headerBytes
        val detectedFormat = MagicBytesDetector.detectFormat(validSlice, extensionHint)

        if (detectedFormat == DocumentFormat.UNKNOWN) {
            return@withContext FileValidationResult.Invalid.UnsupportedFormat(
                "The file '$displayName' format is unsupported or the header does not match expected document specifications."
            )
        }

        // 6. Detect password-protected / encrypted PDF
        if (detectedFormat == DocumentFormat.PDF) {
            val isEncrypted = checkIfPdfIsEncrypted(uri, contentResolver)
            if (isEncrypted) {
                return@withContext FileValidationResult.Invalid.EncryptedUnsupported(
                    "This PDF is password-protected or encrypted. The native Android PdfRenderer cannot decrypt files without an external viewer."
                )
            }
        }

        return@withContext FileValidationResult.Valid(
            detectedFormat = detectedFormat,
            sizeBytes = totalStreamSize
        )
    }

    /**
     * Inspects PDF structure for /Encrypt dictionary entry without loading entire document into memory.
     */
    private fun checkIfPdfIsEncrypted(uri: Uri, contentResolver: ContentResolver): Boolean {
        try {
            contentResolver.openInputStream(uri)?.use { stream ->
                val buffer = ByteArray(8192)
                var read: Int
                var tailScan = ""

                // Read first 8KB
                read = stream.read(buffer)
                if (read > 0) {
                    val headScan = String(buffer, 0, read, Charsets.ISO_8859_1)
                    if (headScan.contains("/Encrypt")) return true
                }

                // Check towards end of stream (where trailer usually resides)
                // Skip safely if stream allows
                val skipped = stream.skip(MAX_SAFE_FILE_SIZE_BYTES)
                read = stream.read(buffer)
                if (read > 0) {
                    tailScan = String(buffer, 0, read, Charsets.ISO_8859_1)
                    if (tailScan.contains("/Encrypt")) return true
                }
            }
        } catch (_: Exception) {
            // Ignore scan failure, let PdfRenderer open attempt catch it safely
        }
        return false
    }
}
