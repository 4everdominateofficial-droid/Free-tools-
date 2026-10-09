package com.docuflex.core.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

sealed class UriCheckResult {
    object Valid : UriCheckResult()
    data class StaleOrRevoked(val reason: String) : UriCheckResult()
}

class DocumentRepository(
    private val context: Context,
    private val documentDao: DocumentDao = DocuFlexDatabase.getInstance(context).documentDao(),
    private val preferencesRepository: UserPreferencesRepository = UserPreferencesRepository(context)
) {

    val recentDocuments: Flow<List<DocumentItem>> = documentDao.getAllRecent().map { entities ->
        entities.map { entity ->
            val isStale = isUriStale(Uri.parse(entity.uriString))
            entity.toDocumentItem(isStale = isStale)
        }
    }

    val favoriteDocuments: Flow<List<DocumentItem>> = documentDao.getFavorites().map { entities ->
        entities.map { entity ->
            val isStale = isUriStale(Uri.parse(entity.uriString))
            entity.toDocumentItem(isStale = isStale)
        }
    }

    suspend fun recordDocumentAccess(
        uri: Uri,
        displayName: String,
        format: DocumentFormat,
        sizeBytes: Long
    ) {
        val historyEnabled = preferencesRepository.saveHistoryEnabled.first()
        if (!historyEnabled) {
            // "Settings toggle: Save recent history (off = nothing stored)"
            return
        }

        // Try to take persistable URI permission if available
        try {
            context.contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
        } catch (_: SecurityException) {
            // External intents might not offer persistable grants
        }

        val existing = documentDao.getDocumentByUri(uri.toString())
        val isFav = existing?.isFavorite ?: false

        val entity = DocumentEntity(
            uriString = uri.toString(),
            displayName = displayName,
            format = format.name,
            sizeBytes = sizeBytes,
            lastAccessedTimestamp = System.currentTimeMillis(),
            isFavorite = isFav
        )
        documentDao.upsert(entity)
    }

    suspend fun toggleFavorite(uri: Uri) {
        val entity = documentDao.getDocumentByUri(uri.toString()) ?: return
        documentDao.updateFavorite(uri.toString(), !entity.isFavorite)
    }

    suspend fun removeDocument(uri: Uri) {
        // Release persisted URI permission when entry is removed
        releaseUriPermission(uri)
        documentDao.deleteByUri(uri.toString())
    }

    suspend fun clearRecentHistory() {
        val nonFavorites = documentDao.getAllRecent().first().filter { !it.isFavorite }
        nonFavorites.forEach {
            releaseUriPermission(Uri.parse(it.uriString))
        }
        documentDao.clearRecentHistory()
    }

    suspend fun clearFavorites() {
        documentDao.clearAllFavorites()
    }

    /**
     * Checks if a document URI is still valid and accessible.
     */
    fun checkUriValidity(uri: Uri): UriCheckResult {
        return try {
            val descriptor = context.contentResolver.openFileDescriptor(uri, "r")
            if (descriptor != null) {
                descriptor.close()
                UriCheckResult.Valid
            } else {
                UriCheckResult.StaleOrRevoked("File descriptor returned null. File may have been moved or deleted.")
            }
        } catch (e: SecurityException) {
            UriCheckResult.StaleOrRevoked("Access permission was revoked or expired.")
        } catch (e: Exception) {
            UriCheckResult.StaleOrRevoked("File moved, deleted or access revoked.")
        }
    }

    private fun isUriStale(uri: Uri): Boolean {
        return checkUriValidity(uri) is UriCheckResult.StaleOrRevoked
    }

    private fun releaseUriPermission(uri: Uri) {
        try {
            context.contentResolver.releasePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
        } catch (_: Exception) {
            // Non-critical if permission was never persistable
        }
    }
}
