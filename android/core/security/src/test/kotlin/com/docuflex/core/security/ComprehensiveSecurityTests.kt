package com.docuflex.core.security

import com.docuflex.core.model.DocumentFormat
import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ComprehensiveSecurityTests {

    @Test
    fun testMagicBytesDetectionForValidFormats() {
        val pdfHeader = "%PDF-1.7\nSample".toByteArray(Charsets.ISO_8859_1)
        assertEquals(DocumentFormat.PDF, MagicBytesDetector.detectFormat(pdfHeader, "pdf"))

        val pngHeader = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00)
        assertEquals(DocumentFormat.PNG, MagicBytesDetector.detectFormat(pngHeader, "png"))

        val jpegHeader = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xE0.toByte())
        assertEquals(DocumentFormat.JPEG, MagicBytesDetector.detectFormat(jpegHeader, "jpg"))

        val zipHeader = byteArrayOf(0x50, 0x4B, 0x03, 0x04)
        assertEquals(DocumentFormat.DOCX, MagicBytesDetector.detectFormat(zipHeader, "docx"))
        assertEquals(DocumentFormat.XLSX, MagicBytesDetector.detectFormat(zipHeader, "xlsx"))
        assertEquals(DocumentFormat.PPTX, MagicBytesDetector.detectFormat(zipHeader, "pptx"))
    }

    @Test
    fun testExecutableSignaturesRejectedEvenWithDocumentExtension() {
        // DOS MZ Header
        val mzHeader = byteArrayOf(0x4D, 0x5A, 0x90.toByte(), 0x00)
        assertEquals(DocumentFormat.UNKNOWN, MagicBytesDetector.detectFormat(mzHeader, "pdf"))

        // Linux ELF Header
        val elfHeader = byteArrayOf(0x7F, 0x45, 0x4C, 0x46)
        assertEquals(DocumentFormat.UNKNOWN, MagicBytesDetector.detectFormat(elfHeader, "docx"))

        // Android DEX Header
        val dexHeader = byteArrayOf(0x64, 0x65, 0x78, 0x0A)
        assertEquals(DocumentFormat.UNKNOWN, MagicBytesDetector.detectFormat(dexHeader, "txt"))
    }

    @Test
    fun testZipSlipPathTraversalBlocked() {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zos ->
            zos.putNextEntry(ZipEntry("../../system/etc/payload.sh"))
            zos.write("malicious payload".toByteArray())
            zos.closeEntry()
        }

        val result = ZipSecurityValidator.inspectZipStream(ByteArrayInputStream(out.toByteArray()))
        assertTrue("ZipSlip path traversal must be rejected", result is ZipSecurityValidator.ValidationResult.Rejected)
        val reason = (result as ZipSecurityValidator.ValidationResult.Rejected).reason
        assertTrue(reason.contains("Zip-Slip"))
    }

    @Test
    fun testZipBombExpansionRatioBlocked() {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zos ->
            val entry = ZipEntry("huge_sparse.txt")
            entry.compressedSize = 10L // artificially small compressed size reported
            zos.putNextEntry(entry)
            // write 2000 bytes uncompressed (200:1 ratio > 100:1 limit)
            zos.write(ByteArray(2000) { 'A'.code.toByte() })
            zos.closeEntry()
        }

        val result = ZipSecurityValidator.inspectZipStream(ByteArrayInputStream(out.toByteArray()))
        assertTrue("Excessive expansion ratio must be rejected", result is ZipSecurityValidator.ValidationResult.Rejected)
    }

    @Test
    fun testZipEntryCountLimitEnforced() {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zos ->
            for (i in 0..2005) {
                zos.putNextEntry(ZipEntry("doc_$i.txt"))
                zos.write("sample".toByteArray())
                zos.closeEntry()
            }
        }

        val result = ZipSecurityValidator.inspectZipStream(ByteArrayInputStream(out.toByteArray()))
        assertTrue("Entry count above 2000 must be rejected", result is ZipSecurityValidator.ValidationResult.Rejected)
    }

    @Test
    fun testSafeXmlParserDisallowsExternalEntities() {
        val factory = SafeXmlParser.createSecureDocumentBuilderFactory()
        assertTrue("Disallow doctype decl feature must be supported or disabled", factory.isExpandEntityReferences.not())
    }
}
