package com.docuflex.core.model

import android.net.Uri

/**
 * Minimal metadata representation of a document.
 * In accordance with privacy & security rules:
 * - NO document content is persisted.
 * - NO full file paths or private identifiers are stored in logs or persistence.
 * - Stores only SAF persistable URI, user-facing display name, format and last accessed timestamp.
 */
data class DocumentItem(
    val uri: Uri,
    val displayName: String,
    val format: DocumentFormat,
    val sizeBytes: Long = 0L,
    val lastAccessedTimestamp: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false,
    val isStale: Boolean = false
)

enum class DocumentFilter(val label: String) {
    ALL("All Files"),
    PDF("PDF"),
    IMAGES("Images"),
    TEXT("Text & CSV"),
    OFFICE("Office"),
    HTML("Web / HTML")
}
