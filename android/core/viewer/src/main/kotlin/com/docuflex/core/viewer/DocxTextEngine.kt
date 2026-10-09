package com.docuflex.core.viewer

import android.content.Context
import android.net.Uri
import com.docuflex.core.security.SafeXmlParser
import com.docuflex.core.security.ZipSecurityValidator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import java.io.InputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

sealed class DocxPreviewResult {
    data class Success(val paragraphs: List<String>, val isTruncated: Boolean) : DocxPreviewResult()
    data class EncryptedOfficeFile(val message: String = "Password-protected or encrypted Office file detected. Native offline engine cannot decrypt this file.") : DocxPreviewResult()
    data class FallbackRequired(val reason: String) : DocxPreviewResult()
}

/**
 * Text-level offline extractor for DOCX files.
 * Reuses ZipSecurityValidator and SafeXmlParser with strict XXE and zip-bomb protection.
 */
class DocxTextEngine(private val context: Context) {

    companion object {
        const val MAX_PARAGRAPHS = 2000
        const val MAX_CHARS = 300_000
    }

    suspend fun extractText(uri: Uri): DocxPreviewResult = withContext(Dispatchers.IO) {
        try {
            // Step 1: Detect OLE encryption header (Standard Office encrypted package)
            val headerBytes = ByteArray(8)
            context.contentResolver.openInputStream(uri)?.use { stream ->
                stream.read(headerBytes, 0, 8)
            }
            if (isOleEncryptionHeader(headerBytes)) {
                return@withContext DocxPreviewResult.EncryptedOfficeFile()
            }

            // Step 2: Validate ZIP structure
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val validation = ZipSecurityValidator.inspectZipStream(stream)
                if (validation is ZipSecurityValidator.ValidationResult.Rejected) {
                    return@withContext DocxPreviewResult.FallbackRequired(
                        "ZIP archive rejected for security: ${validation.reason}"
                    )
                }
            } ?: return@withContext DocxPreviewResult.FallbackRequired("Cannot open document stream")

            // Step 3: Stream and locate word/document.xml
            val paragraphs = mutableListOf<String>()
            var isTruncated = false
            var totalChars = 0

            context.contentResolver.openInputStream(uri)?.use { stream ->
                val zipIn = ZipInputStream(stream)
                var entry: ZipEntry? = zipIn.nextEntry

                while (entry != null) {
                    if (entry.name == "word/document.xml") {
                        // Parse word/document.xml with SafeXmlParser
                        val parser = SafeXmlParser.createSafePullParser(zipIn)
                        var eventType = parser.eventType
                        val currentParagraph = StringBuilder()

                        while (eventType != XmlPullParser.END_DOCUMENT) {
                            when (eventType) {
                                XmlPullParser.START_TAG -> {
                                    if (parser.name == "p") {
                                        currentParagraph.setLength(0)
                                    }
                                }
                                XmlPullParser.TEXT -> {
                                    val text = parser.text
                                    if (text != null) {
                                        currentParagraph.append(text)
                                        totalChars += text.length
                                    }
                                }
                                XmlPullParser.END_TAG -> {
                                    if (parser.name == "p") {
                                        val pText = currentParagraph.toString().trim()
                                        if (pText.isNotEmpty()) {
                                            paragraphs.add(pText)
                                        }
                                        if (paragraphs.size >= MAX_PARAGRAPHS || totalChars >= MAX_CHARS) {
                                            isTruncated = true
                                            break
                                        }
                                    }
                                }
                            }
                            eventType = parser.next()
                        }
                        break
                    } else if (entry.name.contains("EncryptedPackage")) {
                        return@withContext DocxPreviewResult.EncryptedOfficeFile()
                    }
                    entry = zipIn.nextEntry
                }
            }

            if (paragraphs.isEmpty()) {
                return@withContext DocxPreviewResult.FallbackRequired(
                    "No readable text paragraphs found in word/document.xml. Complex layout may require external app."
                )
            }

            DocxPreviewResult.Success(paragraphs, isTruncated)
        } catch (e: Exception) {
            DocxPreviewResult.FallbackRequired("Offline extraction failed: ${e.message}")
        }
    }

    private fun isOleEncryptionHeader(bytes: ByteArray): Boolean {
        // 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 (Compound File Binary Format used by password-protected Office)
        val ole = byteArrayOf(
            0xD0.toByte(), 0xCF.toByte(), 0x11.toByte(), 0xE0.toByte(),
            0xA1.toByte(), 0xB1.toByte(), 0x1A.toByte(), 0xE1.toByte()
        )
        if (bytes.size < 8) return false
        for (i in 0 until 8) {
            if (bytes[i] != ole[i]) return false
        }
        return true
    }
}
