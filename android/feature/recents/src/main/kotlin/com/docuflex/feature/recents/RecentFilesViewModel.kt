package com.docuflex.feature.recents

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

data class RecentsUiState(
    val documents: List<DocumentItem> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: DocumentFilter = DocumentFilter.ALL,
    val isLoading: Boolean = false,
    val staleUriAlert: Pair<DocumentItem, String>? = null,
    val errorMessage: String? = null
)

class RecentFilesViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = DocumentRepository(application)
    private val _uiState = MutableStateFlow(RecentsUiState(isLoading = true))
    val uiState: StateFlow<RecentsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.recentDocuments.collect { list ->
                _uiState.update { it.copy(documents = list, isLoading = false) }
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectFilter(filter: DocumentFilter) {
        _uiState.update { it.copy(activeFilter = filter) }
    }

    fun toggleFavorite(item: DocumentItem) {
        viewModelScope.launch {
            repository.toggleFavorite(item.uri)
        }
    }

    fun removeDocument(item: DocumentItem) {
        viewModelScope.launch {
            repository.removeDocument(item.uri)
            if (_uiState.value.staleUriAlert?.first?.uri == item.uri) {
                _uiState.update { it.copy(staleUriAlert = null) }
            }
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
