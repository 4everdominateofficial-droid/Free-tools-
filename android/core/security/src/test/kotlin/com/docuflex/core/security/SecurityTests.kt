package com.docuflex.core.security

import com.docuflex.core.model.DocumentFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class SecurityTests {

    @Test
    fun testPdfMagicBytesDetectedCorrectly() {
        val pdfHeader = "%PDF-1.7\n%somebinary".toByteArray(Charsets.ISO_8859_1)
        val format = MagicBytesDetector.detectFormat(pdfHeader, "pdf")
        assertEquals(DocumentFormat.PDF, format)
    }

    @Test
    fun testMaliciousExeRenamedToPdfIsRejected() {
        // DOS MZ executable signature
        val mzHeader = byteArrayOf(0x4D, 0x5A, 0x90.toByte(), 0x00, 0x03, 0x00)
        val format = MagicBytesDetector.detectFormat(mzHeader, "pdf")
        assertEquals(DocumentFormat.UNKNOWN, format)
    }

    @Test
    fun testPngMagicBytesDetectedCorrectly() {
        val pngHeader = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00)
        val format = MagicBytesDetector.detectFormat(pngHeader, "png")
        assertEquals(DocumentFormat.PNG, format)
    }

    @Test
    fun testZipSlipPathTraversalIsBlocked() {
        // Create an in-memory ZIP with a malicious entry containing traversal
        val byteOutput = ByteArrayOutputStream()
        ZipOutputStream(byteOutput).use { zos ->
            val evilEntry = ZipEntry("../../system/etc/malicious.sh")
            zos.putNextEntry(evilEntry)
            zos.write("echo pwned".toByteArray())
            zos.closeEntry()
        }

        val result = ZipSecurityValidator.inspectZipStream(ByteArrayInputStream(byteOutput.toByteArray()))
        assertTrue("ZipSlip must be rejected", result is ZipSecurityValidator.ValidationResult.Rejected)
        val reason = (result as ZipSecurityValidator.ValidationResult.Rejected).reason
        assertTrue(reason.contains("Zip-Slip"))
    }

    @Test
    fun testNormalZipPassesInspection() {
        val byteOutput = ByteArrayOutputStream()
        ZipOutputStream(byteOutput).use { zos ->
            val normalEntry = ZipEntry("word/document.xml")
            zos.putNextEntry(normalEntry)
            zos.write("<document>Hello DocuFlex</document>".toByteArray())
            zos.closeEntry()
        }

        val result = ZipSecurityValidator.inspectZipStream(ByteArrayInputStream(byteOutput.toByteArray()))
        assertTrue("Valid zip structure must pass", result is ZipSecurityValidator.ValidationResult.Safe)
    }
}
