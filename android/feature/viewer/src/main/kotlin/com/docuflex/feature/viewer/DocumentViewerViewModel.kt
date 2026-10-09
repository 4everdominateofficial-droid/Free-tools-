package com.docuflex.feature.viewer

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.viewer.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ViewState {
    object Idle : ViewState()
    object Loading : ViewState()
    data class PdfView(
        val currentPageIndex: Int,
        val totalPages: Int,
        val currentBitmap: Bitmap?,
        val zoomScale: Float = 1.0f
    ) : ViewState()
    data class ImageView(val bitmap: Bitmap, val width: Int, val height: Int) : ViewState()
    data class TextView(val lines: List<String>, val isTruncated: Boolean, val encoding: String) : ViewState()
    data class CsvView(val headers: List<String>, val rows: List<List<String>>, val isTruncated: Boolean) : ViewState()
    data class HtmlView(val title: String, val body: String, val blockedThreats: Int) : ViewState()
    data class ExternalFallback(val format: DocumentFormat, val uri: Uri, val reason: String) : ViewState()
    data class Error(val message: String, val canRetry: Boolean = false) : ViewState()
}

class DocumentViewerViewModel(
    application: Application,
    private val savedStateHandle: SavedStateHandle
) : AndroidViewModel(application) {

    private val pdfEngine = PdfRendererEngine(application)
    private val textEngine = TextEngine(application)
    private val csvEngine = CsvStreamingEngine(application)
    private val imageEngine = ImageEngine(application)
    private val htmlEngine = SafeHtmlEngine(application)
    private val docxEngine = DocxTextEngine(application)
    private val xlsxEngine = XlsxSheetEngine(application)

    private val _viewState = MutableStateFlow<ViewState>(ViewState.Idle)
    val viewState: StateFlow<ViewState> = _viewState.asStateFlow()

    private var currentUri: Uri? = null
    private var currentFormat: DocumentFormat = DocumentFormat.UNKNOWN

    fun loadDocument(uri: Uri, format: DocumentFormat) {
        currentUri = uri
        currentFormat = format
        _viewState.value = ViewState.Loading

        viewModelScope.launch {
            when (format) {
                DocumentFormat.PDF -> loadPdf(uri)
                DocumentFormat.PNG, DocumentFormat.JPEG, DocumentFormat.WEBP -> loadImage(uri)
                DocumentFormat.TXT -> loadText(uri)
                DocumentFormat.CSV -> loadCsv(uri)
                DocumentFormat.HTML -> loadHtml(uri)
                DocumentFormat.DOCX -> loadDocx(uri)
                DocumentFormat.XLSX -> loadXlsx(uri)
                DocumentFormat.PPT, DocumentFormat.PPTX, DocumentFormat.DOC, DocumentFormat.XLS -> {
                    _viewState.value = ViewState.ExternalFallback(
                        format = format,
                        uri = uri,
                        reason = "Viewing presentation and legacy binary Office files offline requires an external compatible app. Tap below to launch."
                    )
                }
                DocumentFormat.UNKNOWN -> {
                    _viewState.value = ViewState.ExternalFallback(
                        format = format,
                        uri = uri,
                        reason = "This format is unrecognized or has unsupported binary specifications."
                    )
                }
            }
        }
    }

    private suspend fun loadDocx(uri: Uri) {
        when (val res = docxEngine.extractText(uri)) {
            is DocxPreviewResult.Success -> {
                _viewState.value = ViewState.TextView(res.paragraphs, res.isTruncated, "DOCX (Offline Text Preview)")
            }
            is DocxPreviewResult.EncryptedOfficeFile -> {
                _viewState.value = ViewState.ExternalFallback(
                    format = DocumentFormat.DOCX,
                    uri = uri,
                    reason = res.message
                )
            }
            is DocxPreviewResult.FallbackRequired -> {
                _viewState.value = ViewState.ExternalFallback(
                    format = DocumentFormat.DOCX,
                    uri = uri,
                    reason = res.reason
                )
            }
        }
    }

    private suspend fun loadXlsx(uri: Uri) {
        when (val res = xlsxEngine.extractSheet(uri)) {
            is XlsxPreviewResult.Success -> {
                val headers = res.rows.firstOrNull() ?: emptyList()
                val dataRows = if (res.rows.size > 1) res.rows.subList(1, res.rows.size) else emptyList()
                _viewState.value = ViewState.CsvView(headers, dataRows, res.isTruncated)
            }
            is XlsxPreviewResult.EncryptedOfficeFile -> {
                _viewState.value = ViewState.ExternalFallback(
                    format = DocumentFormat.XLSX,
                    uri = uri,
                    reason = res.message
                )
            }
            is XlsxPreviewResult.FallbackRequired -> {
                _viewState.value = ViewState.ExternalFallback(
                    format = DocumentFormat.XLSX,
                    uri = uri,
                    reason = res.reason
                )
            }
        }
    }

    private suspend fun loadPdf(uri: Uri) {
        val openResult = pdfEngine.open(uri)
        openResult.fold(
            onSuccess = { totalPages ->
                if (totalPages > 0) {
                    renderPdfPage(0, totalPages)
                } else {
                    _viewState.value = ViewState.Error("PDF contains 0 pages.")
                }
            },
            onFailure = { err ->
                if (err is SecurityException) {
                    _viewState.value = ViewState.ExternalFallback(
                        format = DocumentFormat.PDF,
                        uri = uri,
                        reason = "This PDF is encrypted / password-protected. The native Android viewer cannot decrypt this file."
                    )
                } else {
                    _viewState.value = ViewState.Error("Failed to open PDF: ${err.localizedMessage}")
                }
            }
        )
    }

    fun nextPdfPage() {
        val current = _viewState.value as? ViewState.PdfView ?: return
        if (current.currentPageIndex < current.totalPages - 1) {
            renderPdfPage(current.currentPageIndex + 1, current.totalPages)
        }
    }

    fun previousPdfPage() {
        val current = _viewState.value as? ViewState.PdfView ?: return
        if (current.currentPageIndex > 0) {
            renderPdfPage(current.currentPageIndex - 1, current.totalPages)
        }
    }

    private fun renderPdfPage(pageIndex: Int, totalPages: Int) {
        viewModelScope.launch {
            val renderResult = pdfEngine.renderPage(pageIndex, 1080, 1920)
            renderResult.fold(
                onSuccess = { bitmap ->
                    _viewState.value = ViewState.PdfView(
                        currentPageIndex = pageIndex,
                        totalPages = totalPages,
                        currentBitmap = bitmap
                    )
                },
                onFailure = { err ->
                    _viewState.value = ViewState.Error("Page render failed: ${err.localizedMessage}")
                }
            )
        }
    }

    private suspend fun loadImage(uri: Uri) {
        imageEngine.loadImage(uri).fold(
            onSuccess = { result ->
                _viewState.value = ViewState.ImageView(result.bitmap, result.originalWidth, result.originalHeight)
            },
            onFailure = { err ->
                _viewState.value = ViewState.Error("Failed to decode image: ${err.localizedMessage}")
            }
        )
    }

    private suspend fun loadText(uri: Uri) {
        textEngine.loadText(uri).fold(
            onSuccess = { result ->
                _viewState.value = ViewState.TextView(result.lines, result.isTruncated, result.encoding)
            },
            onFailure = { err ->
                _viewState.value = ViewState.Error("Failed to load text: ${err.localizedMessage}")
            }
        )
    }

    private suspend fun loadCsv(uri: Uri) {
        csvEngine.parseCsv(uri).fold(
            onSuccess = { table ->
                _viewState.value = ViewState.CsvView(table.headers, table.rows, table.isTruncated)
            },
            onFailure = { err ->
                _viewState.value = ViewState.Error("Failed to parse CSV: ${err.localizedMessage}")
            }
        )
    }

    private suspend fun loadHtml(uri: Uri) {
        htmlEngine.sanitizeAndLoad(uri).fold(
            onSuccess = { content ->
                _viewState.value = ViewState.HtmlView(content.title, content.sanitizedBody, content.strippedThreatCount)
            },
            onFailure = { err ->
                _viewState.value = ViewState.Error("Failed to process HTML: ${err.localizedMessage}")
            }
        )
    }

    override fun onCleared() {
        super.onCleared()
        pdfEngine.close()
    }
}
