package com.docuflex.core.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DocumentDao {

    @Query("SELECT * FROM documents ORDER BY lastAccessedTimestamp DESC")
    fun getAllRecent(): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE isFavorite = 1 ORDER BY lastAccessedTimestamp DESC")
    fun getFavorites(): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE uriString = :uriString LIMIT 1")
    suspend fun getDocumentByUri(uriString: String): DocumentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(document: DocumentEntity)

    @Query("UPDATE documents SET isFavorite = :isFavorite WHERE uriString = :uriString")
    suspend fun updateFavorite(uriString: String, isFavorite: Boolean)

    @Query("DELETE FROM documents WHERE uriString = :uriString")
    suspend fun deleteByUri(uriString: String)

    @Query("DELETE FROM documents WHERE isFavorite = 0")
    suspend fun clearRecentHistory()

    @Query("UPDATE documents SET isFavorite = 0")
    suspend fun clearAllFavorites()

    @Query("DELETE FROM documents")
    suspend fun clearAll()
}
