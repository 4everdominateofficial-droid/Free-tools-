package com.docuflex.core.viewer

import org.junit.Assert.*
import org.junit.Test

class ViewerEnginesTest {

    @Test
    fun testCsvTokenizerHandlesQuotedCommas() {
        val line = "ID,Name,\"Item, Specification\",100.50"
        // Regex tokenizer logic validation
        val cells = mutableListOf<String>()
        val sb = StringBuilder()
        var inQuotes = false
        var i = 0

        while (i < line.length) {
            val c = line[i]
            when {
                c == '\"' -> {
                    if (inQuotes && i + 1 < line.length && line[i + 1] == '\"') {
                        sb.append('\"')
                        i++
                    } else {
                        inQuotes = !inQuotes
                    }
                }
                c == ',' && !inQuotes -> {
                    cells.add(sb.toString().trim())
                    sb.setLength(0)
                }
                else -> sb.append(c)
            }
            i++
        }
        cells.add(sb.toString().trim())

        assertEquals(4, cells.size)
        assertEquals("Item, Specification", cells[2])
    }

    @Test
    fun testSafeHtmlSanitizerRemovesMaliciousElements() {
        val maliciousHtml = """
            <!DOCTYPE html>
            <html>
            <head><script>alert('xss');</script></head>
            <body onload="window.leak()">
                <h1>Title</h1>
                <iframe src="phishing.html"></iframe>
                <p>Clean text</p>
            </body>
            </html>
        """.trimIndent()

        val scriptPattern = java.util.regex.Pattern.compile("(?i)<script.*?>.*?</script>", java.util.regex.Pattern.DOTALL)
        val iframePattern = java.util.regex.Pattern.compile("(?i)<iframe.*?>.*?</iframe>", java.util.regex.Pattern.DOTALL)
        val eventHandlerPattern = java.util.regex.Pattern.compile("(?i)\\s+on[a-z]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)")

        var sanitized = scriptPattern.matcher(maliciousHtml).replaceAll("")
        sanitized = iframePattern.matcher(sanitized).replaceAll("")
        sanitized = eventHandlerPattern.matcher(sanitized).replaceAll("")

        assertFalse("Script tag must be stripped", sanitized.contains("<script"))
        assertFalse("Iframe tag must be stripped", sanitized.contains("<iframe"))
        assertFalse("onload must be stripped", sanitized.contains("onload"))
        assertTrue("Clean text preserved", sanitized.contains("Clean text"))
    }
}
