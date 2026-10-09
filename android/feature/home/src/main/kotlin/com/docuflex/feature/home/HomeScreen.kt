package com.docuflex.feature.home

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.docuflex.core.model.DocumentFilter
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigateToViewer: (Uri, DocumentFormat) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToLegal: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    // SAF Document Picker Launcher
    val documentPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let {
            viewModel.onDocumentPicked(it, onNavigateToViewer)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("DocuFlex") },
                actions = {
                    IconButton(
                        onClick = onNavigateToLegal,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            Icons.Default.Security,
                            contentDescription = "Safety and Legal Policies"
                        )
                    }
                    IconButton(
                        onClick = onNavigateToSettings,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = "App Settings"
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    // Open Storage Access Framework with MIME wildcard
                    documentPickerLauncher.launch(arrayOf("*/*"))
                },
                icon = { Icon(Icons.Default.FolderOpen, contentDescription = null) },
                text = { Text("Open Document") },
                modifier = Modifier
                    .heightIn(min = 48.dp)
                    .semantics { contentDescription = "Open Document with Storage Access Framework" }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = viewModel::updateSearchQuery,
                placeholder = { Text("Search recent documents...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search Icon") },
                trailingIcon = {
                    if (uiState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear search")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .defaultMinSize(minHeight = 48.dp)
            )

            // Format Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(DocumentFilter.values()) { filter ->
                    FilterChip(
                        selected = uiState.activeFilter == filter,
                        onClick = { viewModel.selectFilter(filter) },
                        label = { Text(filter.label) },
                        modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                    )
                }
            }

            // Error banner if security validation failed
            uiState.validationError?.let { error ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Security Alert",
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = viewModel::clearValidationError) {
                            Icon(Icons.Default.Close, contentDescription = "Dismiss error")
                        }
                    }
                }
            }

            // Document List or Empty State
            val filteredDocs = uiState.recentDocuments.filter { doc ->
                val matchesQuery = doc.displayName.contains(uiState.searchQuery, ignoreCase = true)
                val matchesFilter = when (uiState.activeFilter) {
                    DocumentFilter.ALL -> true
                    DocumentFilter.PDF -> doc.format == DocumentFormat.PDF
                    DocumentFilter.IMAGES -> doc.format in listOf(DocumentFormat.PNG, DocumentFormat.JPEG, DocumentFormat.WEBP)
                    DocumentFilter.TEXT -> doc.format in listOf(DocumentFormat.TXT, DocumentFormat.CSV)
                    DocumentFilter.OFFICE -> doc.format in listOf(DocumentFormat.DOCX, DocumentFormat.XLSX, DocumentFormat.PPTX, DocumentFormat.DOC)
                    DocumentFilter.HTML -> doc.format == DocumentFormat.HTML
                }
                matchesQuery && matchesFilter
            }

            if (filteredDocs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Description,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (uiState.searchQuery.isNotEmpty()) "No matching documents found" else "No recent documents",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tap 'Open Document' to pick files securely via Storage Access Framework.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredDocs, key = { it.uri.toString() }) { doc ->
                        DocumentRowItem(
                            item = doc,
                            onClick = { onNavigateToViewer(doc.uri, doc.format) },
                            onToggleFavorite = { viewModel.toggleFavorite(doc) },
                            onRemove = { viewModel.removeDocument(doc) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentRowItem(
    item: DocumentItem,
    onClick: () -> Unit,
    onToggleFavorite: () -> Unit,
    onRemove: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val icon = when (item.format) {
                DocumentFormat.PDF -> Icons.Default.PictureAsPdf
                DocumentFormat.PNG, DocumentFormat.JPEG, DocumentFormat.WEBP -> Icons.Default.Image
                DocumentFormat.TXT, DocumentFormat.HTML -> Icons.Default.Article
                DocumentFormat.CSV -> Icons.Default.TableChart
                else -> Icons.Default.InsertDriveFile
            }

            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(36.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.displayName,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${item.format.displayName} • ${item.sizeBytes / 1024} KB",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            IconButton(onClick = onToggleFavorite, modifier = Modifier.size(48.dp)) {
                Icon(
                    if (item.isFavorite) Icons.Default.Star else Icons.Default.StarBorder,
                    contentDescription = if (item.isFavorite) "Remove from favorites" else "Add to favorites",
                    tint = if (item.isFavorite) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                )
            }

            IconButton(onClick = onRemove, modifier = Modifier.size(48.dp)) {
                Icon(
                    Icons.Default.DeleteOutline,
                    contentDescription = "Remove from recent list",
                    tint = MaterialTheme.colorScheme.outline
                )
            }
        }
    }
}
