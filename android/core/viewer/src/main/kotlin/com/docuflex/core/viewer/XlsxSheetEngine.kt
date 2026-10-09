package com.docuflex.core.viewer

import android.content.Context
import android.net.Uri
import com.docuflex.core.security.SafeXmlParser
import com.docuflex.core.security.ZipSecurityValidator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

sealed class XlsxPreviewResult {
    data class Success(val rows: List<List<String>>, val isTruncated: Boolean) : XlsxPreviewResult()
    data class EncryptedOfficeFile(val message: String = "Password-protected or encrypted Excel spreadsheet detected.") : XlsxPreviewResult()
    data class FallbackRequired(val reason: String) : XlsxPreviewResult()
}

/**
 * Basic offline sheet extractor for XLSX.
 * Parses sharedStrings.xml and worksheet xml safely.
 */
class XlsxSheetEngine(private val context: Context) {

    companion object {
        const val MAX_ROWS = 1000
        const val MAX_COLS = 30
        const val MAX_STRINGS = 3000
    }

    suspend fun extractSheet(uri: Uri): XlsxPreviewResult = withContext(Dispatchers.IO) {
        try {
            // Validate ZIP safety
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val validation = ZipSecurityValidator.inspectZipStream(stream)
                if (validation is ZipSecurityValidator.ValidationResult.Rejected) {
                    return@withContext XlsxPreviewResult.FallbackRequired("Zip inspection failed: ${validation.reason}")
                }
            } ?: return@withContext XlsxPreviewResult.FallbackRequired("Cannot open stream")

            var sharedStringsBytes: ByteArray? = null
            var sheet1Bytes: ByteArray? = null

            // Read relevant xml entries in-memory (bounded size)
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val zipIn = ZipInputStream(stream)
                var entry: ZipEntry? = zipIn.nextEntry

                while (entry != null) {
                    if (entry.name == "xl/sharedStrings.xml") {
                        sharedStringsBytes = readEntryBytes(zipIn, 2 * 1024 * 1024)
                    } else if (entry.name == "xl/worksheets/sheet1.xml") {
                        sheet1Bytes = readEntryBytes(zipIn, 4 * 1024 * 1024)
                    } else if (entry.name.contains("EncryptedPackage")) {
                        return@withContext XlsxPreviewResult.EncryptedOfficeFile()
                    }
                    entry = zipIn.nextEntry
                }
            }

            if (sheet1Bytes == null) {
                return@withContext XlsxPreviewResult.FallbackRequired("Could not find sheet1.xml in workbook.")
            }

            // Parse shared strings pool
            val stringPool = mutableListOf<String>()
            if (sharedStringsBytes != null) {
                val parser = SafeXmlParser.createSafePullParser(ByteArrayInputStream(sharedStringsBytes))
                var event = parser.eventType
                var inTextTag = false

                while (event != XmlPullParser.END_DOCUMENT && stringPool.size < MAX_STRINGS) {
                    when (event) {
                        XmlPullParser.START_TAG -> if (parser.name == "t") inTextTag = true
                        XmlPullParser.TEXT -> if (inTextTag && parser.text != null) stringPool.add(parser.text)
                        XmlPullParser.END_TAG -> if (parser.name == "t") inTextTag = false
                    }
                    event = parser.next()
                }
            }

            // Parse sheet rows
            val rows = mutableListOf<List<String>>()
            val sheetParser = SafeXmlParser.createSafePullParser(ByteArrayInputStream(sheet1Bytes))
            var event = sheetParser.eventType
            val currentRow = mutableListOf<String>()
            var isStringRef = false
            var isTruncated = false

            while (event != XmlPullParser.END_DOCUMENT) {
                when (event) {
                    XmlPullParser.START_TAG -> {
                        when (sheetParser.name) {
                            "row" -> currentRow.clear()
                            "c" -> {
                                val typeAttr = sheetParser.getAttributeValue(null, "t")
                                isStringRef = (typeAttr == "s")
                            }
                        }
                    }
                    XmlPullParser.TEXT -> {
                        val text = sheetParser.text
                        if (text != null && text.isNotBlank()) {
                            if (isStringRef) {
                                val idx = text.toIntOrNull()
                                if (idx != null && idx in stringPool.indices) {
                                    currentRow.add(stringPool[idx])
                                } else {
                                    currentRow.add(text)
                                }
                            } else {
                                currentRow.add(text)
                            }
                        }
                    }
                    XmlPullParser.END_TAG -> {
                        if (sheetParser.name == "row") {
                            if (currentRow.isNotEmpty()) {
                                rows.add(currentRow.take(MAX_COLS))
                            }
                            if (rows.size >= MAX_ROWS) {
                                isTruncated = true
                                break
                            }
                        }
                    }
                }
                event = sheetParser.next()
            }

            if (rows.isEmpty()) {
                return@withContext XlsxPreviewResult.FallbackRequired("No cells found in primary worksheet.")
            }

            XlsxPreviewResult.Success(rows, isTruncated)
        } catch (e: Exception) {
            XlsxPreviewResult.FallbackRequired("XLSX parsing error: ${e.message}")
        }
    }

    private fun readEntryBytes(stream: ZipInputStream, maxLimit: Int): ByteArray {
        val out = ByteArrayOutputStream()
        val buffer = ByteArray(4096)
        var total = 0
        var read = stream.read(buffer)
        while (read != -1) {
            out.write(buffer, 0, read)
            total += read
            if (total > maxLimit) break
            read = stream.read(buffer)
        }
        return out.toByteArray()
    }
}
