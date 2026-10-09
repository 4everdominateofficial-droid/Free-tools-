package com.docuflex.core.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem
import android.net.Uri

/**
 * Minimal Room Entity for storing document references.
 * Strictly complies with privacy requirements:
 * - NO document contents are stored.
 * - NO raw filesystem paths are stored.
 * - Stores only scoped SAF content URI, display name, format enum, size, timestamp, and favorite flag.
 */
@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey val uriString: String,
    val displayName: String,
    val format: String,
    val sizeBytes: Long,
    val lastAccessedTimestamp: Long,
    val isFavorite: Boolean
) {
    fun toDocumentItem(isStale: Boolean = false): DocumentItem {
        val detectedFormat = try {
            DocumentFormat.valueOf(format)
        } catch (_: Exception) {
            DocumentFormat.UNKNOWN
        }
        return DocumentItem(
            uri = Uri.parse(uriString),
            displayName = displayName,
            format = detectedFormat,
            sizeBytes = sizeBytes,
            lastAccessedTimestamp = lastAccessedTimestamp,
            isFavorite = isFavorite,
            isStale = isStale
        )
    }

    companion object {
        fun fromDocumentItem(item: DocumentItem): DocumentEntity {
            return DocumentEntity(
                uriString = item.uri.toString(),
                displayName = item.displayName,
                format = item.format.name,
                sizeBytes = item.sizeBytes,
                lastAccessedTimestamp = item.lastAccessedTimestamp,
                isFavorite = item.isFavorite
            )
        }
    }
}
