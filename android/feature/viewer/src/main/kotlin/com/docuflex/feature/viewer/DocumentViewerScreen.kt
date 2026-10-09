package com.docuflex.feature.viewer

import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.viewer.ExternalIntentLauncher

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentViewerScreen(
    title: String,
    uri: Uri,
    format: DocumentFormat,
    viewModel: DocumentViewerViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val viewState by viewModel.viewState.collectAsState()
    var showInfoDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uri) {
        viewModel.loadDocument(uri, format)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back to home")
                    }
                },
                actions = {
                    IconButton(
                        onClick = { showInfoDialog = true },
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(Icons.Default.Info, contentDescription = "Document information")
                    }
                }
            )
        },
        bottomBar = {
            if (viewState is ViewState.PdfView) {
                val pdfState = viewState as ViewState.PdfView
                BottomAppBar(
                    actions = {
                        IconButton(
                            onClick = viewModel::previousPdfPage,
                            enabled = pdfState.currentPageIndex > 0,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Page")
                        }

                        Text(
                            text = "Page ${pdfState.currentPageIndex + 1} of ${pdfState.totalPages}",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )

                        IconButton(
                            onClick = viewModel::nextPdfPage,
                            enabled = pdfState.currentPageIndex < pdfState.totalPages - 1,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Next Page")
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = viewState) {
                is ViewState.Loading -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Securely validating and parsing...", style = MaterialTheme.typography.bodyMedium)
                    }
                }

                is ViewState.PdfView -> {
                    state.currentBitmap?.let { bmp ->
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                bitmap = bmp.asImageBitmap(),
                                contentDescription = "PDF Page ${state.currentPageIndex + 1}",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .verticalScroll(rememberScrollState()),
                                contentScale = ContentScale.FillWidth
                            )
                        }
                    } ?: run {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Page unavailable")
                        }
                    }
                }

                is ViewState.ImageView -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            bitmap = state.bitmap.asImageBitmap(),
                            contentDescription = "Document image preview",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit
                        )
                    }
                }

                is ViewState.TextView -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        if (state.isTruncated) {
                            item {
                                Text(
                                    text = "Showing first 10,000 lines (truncated for offline memory safety)",
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                            }
                        }
                        items(state.lines) { line ->
                            Text(
                                text = line,
                                style = MaterialTheme.typography.bodyMedium,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                is ViewState.CsvView -> {
                    val horizontalScroll = rememberScrollState()
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .horizontalScroll(horizontalScroll)
                    ) {
                        // Headers
                        Row(modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant)) {
                            state.headers.forEach { header ->
                                Text(
                                    text = header,
                                    style = MaterialTheme.typography.titleSmall,
                                    modifier = Modifier
                                        .width(140.dp)
                                        .padding(8.dp)
                                )
                            }
                        }
                        Divider()
                        // Rows
                        LazyColumn(modifier = Modifier.fillMaxSize()) {
                            items(state.rows) { row ->
                                Row {
                                    row.forEach { cell ->
                                        Text(
                                            text = cell,
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier
                                                .width(140.dp)
                                                .padding(8.dp)
                                        )
                                    }
                                }
                                Divider()
                            }
                        }
                    }
                }

                is ViewState.HtmlView -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.secondaryContainer
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "🛡️ Safe Offline HTML Preview",
                                    style = MaterialTheme.typography.labelLarge
                                )
                                Text(
                                    text = "JavaScript disabled. External network calls blocked. Stripped ${state.blockedThreats} potentially unsafe elements.",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = state.title,
                            style = MaterialTheme.typography.headlineSmall
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = state.body,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                is ViewState.ExternalFallback -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            Icons.Default.OpenInNew,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "External Application Required",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = state.reason,
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                ExternalIntentLauncher.openInExternalApp(
                                    context,
                                    state.uri,
                                    state.format.defaultMimeType,
                                    state.format
                                )
                            },
                            modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                        ) {
                            Icon(Icons.Default.Launch, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Open in Compatible App")
                        }
                    }
                }

                is ViewState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            Icons.Default.ErrorOutline,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Cannot Display File", style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = state.message,
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                ViewState.Idle -> {}
            }
        }
    }

    if (showInfoDialog) {
        AlertDialog(
            onDismissRequest = { showInfoDialog = false },
            title = { Text("Document Info") },
            text = {
                Column {
                    Text("Name: $title")
                    Text("Format: ${format.displayName}")
                    Text("Rendering: ${if (format.internalRenderingSupported) "Native Offline Engine" else "Delegated External App"}")
                    Text("Network State: 100% Offline (No Internet Permission)")
                }
            },
            confirmButton = {
                TextButton(onClick = { showInfoDialog = false }) {
                    Text("Close")
                }
            }
        )
    }
}
