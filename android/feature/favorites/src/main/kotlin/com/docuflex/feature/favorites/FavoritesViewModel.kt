package com.docuflex.feature.favorites

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.docuflex.core.data.DocumentRepository
import com.docuflex.core.data.UriCheckResult
import com.docuflex.core.model.DocumentFilter
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class FavoritesUiState(
    val favorites: List<DocumentItem> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: DocumentFilter = DocumentFilter.ALL,
    val isLoading: Boolean = false,
    val staleUriAlert: Pair<DocumentItem, String>? = null
)

class FavoritesViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = DocumentRepository(application)
    private val _uiState = MutableStateFlow(FavoritesUiState(isLoading = true))
    val uiState: StateFlow<FavoritesUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.favoriteDocuments.collect { list ->
                _uiState.update { it.copy(favorites = list, isLoading = false) }
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectFilter(filter: DocumentFilter) {
        _uiState.update { it.copy(activeFilter = filter) }
    }

    fun removeFavorite(item: DocumentItem) {
        viewModelScope.launch {
            repository.toggleFavorite(item.uri)
        }
    }

    fun dismissStaleAlert() {
        _uiState.update { it.copy(staleUriAlert = null) }
    }

    fun onDocumentClicked(item: DocumentItem, onValidOpen: (Uri, DocumentFormat) -> Unit) {
        when (val check = repository.checkUriValidity(item.uri)) {
            is UriCheckResult.Valid -> {
                onValidOpen(item.uri, item.format)
            }
            is UriCheckResult.StaleOrRevoked -> {
                _uiState.update {
                    it.copy(staleUriAlert = Pair(item, "File moved, deleted or access revoked. (" + check.reason + ")"))
                }
            }
        }
    }
}
