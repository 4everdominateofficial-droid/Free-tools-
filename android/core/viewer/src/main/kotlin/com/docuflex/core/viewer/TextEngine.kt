package com.docuflex.core.viewer

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * High-performance, streaming Plain Text loader with safety caps on line count.
 */
class TextEngine(private val context: Context) {

    companion object {
        const val MAX_LINES = 10_000
        const val MAX_CHARS_TOTAL = 500_000
    }

    data class TextLoadResult(
        val lines: List<String>,
        val isTruncated: Boolean,
        val totalLineCount: Int,
        val encoding: String = "UTF-8"
    )

    suspend fun loadText(uri: Uri): Result<TextLoadResult> = withContext(Dispatchers.IO) {
        try {
            val lines = mutableListOf<String>()
            var charsRead = 0
            var truncated = false

            context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).use { reader ->
                    var line: String? = reader.readLine()
                    while (line != null) {
                        lines.add(line)
                        charsRead += line.length

                        if (lines.size >= MAX_LINES || charsRead >= MAX_CHARS_TOTAL) {
                            truncated = true
                            break
                        }
                        line = reader.readLine()
                    }
                }
            } ?: return@withContext Result.failure(Exception("Unable to open stream"))

            Result.success(
                TextLoadResult(
                    lines = lines,
                    isTruncated = truncated,
                    totalLineCount = lines.size
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
