package com.docuflex.core.viewer

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.regex.Pattern

/**
 * Hardened HTML Engine.
 * Converts local HTML files to sanitized, readable text representation.
 * Strict rules:
 * - JavaScript execution strictly disabled.
 * - All remote network requests (http/https) blocked.
 * - Local file access blocked.
 * - Removes script tags, iframe tags, object tags, and tracking pixels.
 */
class SafeHtmlEngine(private val context: Context) {

    data class SanitizedHtmlContent(
        val title: String,
        val sanitizedBody: String,
        val strippedThreatCount: Int,
        val isSanitized: Boolean = true
    )

    private val scriptPattern = Pattern.compile("(?i)<script.*?>.*?</script>", Pattern.DOTALL)
    private val iframePattern = Pattern.compile("(?i)<iframe.*?>.*?</iframe>", Pattern.DOTALL)
    private val stylePattern = Pattern.compile("(?i)<style.*?>.*?</style>", Pattern.DOTALL)
    private val eventHandlerPattern = Pattern.compile("(?i)\\s+on[a-z]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)")
    private val javascriptUrlPattern = Pattern.compile("(?i)href\\s*=\\s*[\"']javascript:[^\"']*[\"']")

    suspend fun sanitizeAndLoad(uri: Uri): Result<SanitizedHtmlContent> = withContext(Dispatchers.IO) {
        try {
            val rawHtml = StringBuilder()
            context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).use { reader ->
                    var line: String? = reader.readLine()
                    var totalChars = 0
                    while (line != null && totalChars < 500_000) {
                        rawHtml.append(line).append("\n")
                        totalChars += line.length
                        line = reader.readLine()
                    }
                }
            } ?: return@withContext Result.failure(Exception("Cannot open HTML stream"))

            var content = rawHtml.toString()
            var threatCount = 0

            // Count and remove <script> tags
            val scriptMatcher = scriptPattern.matcher(content)
            while (scriptMatcher.find()) {
                threatCount++
            }
            content = scriptMatcher.replaceAll("")

            // Remove <iframe> tags
            val iframeMatcher = iframePattern.matcher(content)
            while (iframeMatcher.find()) {
                threatCount++
            }
            content = iframeMatcher.replaceAll("")

            // Remove <style> tags for clean reading
            content = stylePattern.matcher(content).replaceAll("")

            // Remove inline event handlers (e.g. onload, onerror)
            val handlerMatcher = eventHandlerPattern.matcher(content)
            while (handlerMatcher.find()) {
                threatCount++
            }
            content = handlerMatcher.replaceAll("")

            // Remove javascript: URLs
            content = javascriptUrlPattern.replaceAll("href=\"#blocked-js\"")

            // Strip remaining HTML tags for clean text layout
            val titleMatch = Regex("(?i)<title>(.*?)</title>").find(content)
            val docTitle = titleMatch?.groups?.get(1)?.value?.trim() ?: "HTML Document"

            // Replace common layout tags with clean newlines
            val readableText = content
                .replace("(?i)<br\\s*/?>".toRegex(), "\n")
                .replace("(?i)</p>".toRegex(), "\n\n")
                .replace("(?i)</li>".toRegex(), "\n")
                .replace("(?i)<h[1-6][^>]*>".toRegex(), "\n\n### ")
                .replace("(?i)</h[1-6]>".toRegex(), "\n")
                .replace("<[^>]+>".toRegex(), "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .trim()

            Result.success(
                SanitizedHtmlContent(
                    title = docTitle,
                    sanitizedBody = readableText,
                    strippedThreatCount = threatCount
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
