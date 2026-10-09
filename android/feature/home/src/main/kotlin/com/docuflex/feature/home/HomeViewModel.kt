package com.docuflex.feature.home

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.docuflex.core.model.DocumentFilter
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem
import com.docuflex.core.model.FileValidationResult
import com.docuflex.core.security.SafValidator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val recentDocuments: List<DocumentItem> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: DocumentFilter = DocumentFilter.ALL,
    val isLoading: Boolean = false,
    val validationError: String? = null
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val safValidator = SafValidator(application)
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun updateSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun selectFilter(filter: DocumentFilter) {
        _uiState.value = _uiState.value.copy(activeFilter = filter)
    }

    fun clearValidationError() {
        _uiState.value = _uiState.value.copy(validationError = null)
    }

    fun onDocumentPicked(uri: Uri, onValidDocument: (Uri, DocumentFormat) -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, validationError = null)

            when (val result = safValidator.validateUri(uri)) {
                is FileValidationResult.Valid -> {
                    val newItem = DocumentItem(
                        uri = uri,
                        displayName = uri.lastPathSegment ?: "Document",
                        format = result.detectedFormat,
                        sizeBytes = result.sizeBytes
                    )
                    val updatedList = listOf(newItem) + _uiState.value.recentDocuments.filter { it.uri != uri }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        recentDocuments = updatedList
                    )
                    onValidDocument(uri, result.detectedFormat)
                }
                is FileValidationResult.Invalid -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        validationError = result.userMessage
                    )
                }
            }
        }
    }

    fun removeDocument(item: DocumentItem) {
        _uiState.value = _uiState.value.copy(
            recentDocuments = _uiState.value.recentDocuments.filter { it.uri != item.uri }
        )
    }

    fun toggleFavorite(item: DocumentItem) {
        _uiState.value = _uiState.value.copy(
            recentDocuments = _uiState.value.recentDocuments.map {
                if (it.uri == item.uri) it.copy(isFavorite = !it.isFavorite) else it
            }
        )
    }

    fun clearRecentHistory() {
        _uiState.value = _uiState.value.copy(recentDocuments = emptyList())
    }
}
