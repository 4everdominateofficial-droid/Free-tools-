package com.docuflex.core.security

import android.content.Context
import android.util.Log
import java.io.File

/**
 * Manages transient document files strictly stored inside app-private cache directory.
 * Rules:
 * 1. Cleaned on app startup.
 * 2. Cleaned on document viewer exit / lifecycle onStop.
 * 3. Cleaned automatically on low-memory triggers.
 * 4. Transparently disclosed in Privacy Policy.
 */
class TempFileManager(private val context: Context) {

    private val tempDir: File by lazy {
        File(context.cacheDir, "docuflex_transient_cache").apply {
            if (!exists()) mkdirs()
        }
    }

    /**
     * Purges all cached document slices from private storage.
     */
    fun clearTransientCache() {
        try {
            if (tempDir.exists()) {
                tempDir.listFiles()?.forEach { file ->
                    file.delete()
                }
            }
        } catch (e: Exception) {
            // Never crash during cache eviction
        }
    }

    /**
     * Creates a scoped, temporary file for reading.
     */
    fun createTempDocumentFile(prefix: String, suffix: String): File {
        return File.createTempFile("doc_${prefix}_", suffix, tempDir).apply {
            deleteOnExit()
        }
    }

    /**
     * Deletes a specific temporary file immediately when viewing is finished.
     */
    fun releaseTempFile(file: File?) {
        try {
            if (file != null && file.exists() && file.parentFile == tempDir) {
                file.delete()
            }
        } catch (_: Exception) {
        }
    }
}
