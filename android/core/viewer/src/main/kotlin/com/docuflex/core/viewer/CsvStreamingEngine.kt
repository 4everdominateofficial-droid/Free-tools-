package com.docuflex.core.viewer

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Streaming CSV table parser with row and column caps.
 * Avoids loading millions of cells into memory.
 */
class CsvStreamingEngine(private val context: Context) {

    companion object {
        const val MAX_ROWS = 2000
        const val MAX_COLUMNS = 60
    }

    data class CsvTable(
        val headers: List<String>,
        val rows: List<List<String>>,
        val totalRowsParsed: Int,
        val isTruncated: Boolean
    )

    suspend fun parseCsv(uri: Uri): Result<CsvTable> = withContext(Dispatchers.IO) {
        try {
            val allRows = mutableListOf<List<String>>()
            var isTruncated = false

            context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).use { reader ->
                    var line = reader.readLine()
                    var rowCount = 0

                    while (line != null) {
                        val parsedCells = parseCsvLine(line).take(MAX_COLUMNS)
                        allRows.add(parsedCells)
                        rowCount++

                        if (rowCount >= MAX_ROWS) {
                            isTruncated = true
                            break
                        }
                        line = reader.readLine()
                    }
                }
            } ?: return@withContext Result.failure(Exception("Cannot open CSV stream"))

            if (allRows.isEmpty()) {
                return@withContext Result.success(CsvTable(emptyList(), emptyList(), 0, false))
            }

            val headers = allRows.first()
            val dataRows = if (allRows.size > 1) allRows.subList(1, allRows.size) else emptyList()

            Result.success(
                CsvTable(
                    headers = headers,
                    rows = dataRows,
                    totalRowsParsed = allRows.size,
                    isTruncated = isTruncated
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * RFC 4180 compliant lightweight single-line CSV cell tokenizer.
     * Correctly handles quoted commas.
     */
    private fun parseCsvLine(line: String): List<String> {
        val cells = mutableListOf<String>()
        val sb = java.lang.StringBuilder()
        var inQuotes = false
        var i = 0

        while (i < line.length) {
            val c = line[i]
            when {
                c == '\"' -> {
                    if (inQuotes && i + 1 < line.length && line[i + 1] == '\"') {
                        sb.append('\"')
                        i++ // skip escaped quote
                    } else {
                        inQuotes = !inQuotes
                    }
                }
                c == ',' && !inQuotes -> {
                    cells.add(sb.toString().trim())
                    sb.setLength(0)
                }
                else -> {
                    sb.append(c)
                }
            }
            i++
        }
        cells.add(sb.toString().trim())
        return cells
    }
}
