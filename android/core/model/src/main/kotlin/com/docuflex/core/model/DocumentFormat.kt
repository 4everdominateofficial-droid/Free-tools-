package com.docuflex.core.model

import android.net.Uri

/**
 * Supported and recognized document formats in DocuFlex.
 * Note: Never claim a format is rendered until tested.
 */
enum class DocumentFormat(
    val extension: String,
    val defaultMimeType: String,
    val internalRenderingSupported: Boolean,
    val displayName: String
) {
    // Native internal rendering supported
    PDF("pdf", "application/pdf", true, "Portable Document Format"),
    PNG("png", "image/png", true, "PNG Image"),
    JPEG("jpg", "image/jpeg", true, "JPEG Image"),
    WEBP("webp", "image/webp", true, "WebP Image"),
    TXT("txt", "text/plain", true, "Plain Text"),
    CSV("csv", "text/csv", true, "Comma-Separated Values"),
    HTML("html", "text/html", true, "Sanitized HTML Preview"),

    // Office formats: Offline text-level extraction only if safe/tested; complex binary fallback to external app
    DOCX("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", false, "Microsoft Word (DOCX)"),
    XLSX("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", false, "Microsoft Excel (XLSX)"),
    PPTX("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", false, "Microsoft PowerPoint (PPTX)"),
    DOC("doc", "application/msword", false, "Legacy Word (DOC)"),
    PPT("ppt", "application/vnd.ms-powerpoint", false, "Legacy PowerPoint (PPT)"),
    XLS("xls", "application/vnd.ms-excel", false, "Legacy Excel (XLS)"),

    // Unknown/unsupported
    UNKNOWN("", "application/octet-stream", false, "Unknown Document")
}
