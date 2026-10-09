package com.docuflex.feature.favorites

import android.net.Uri
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.docuflex.core.model.DocumentFilter
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.model.DocumentItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FavoritesScreen(
    viewModel: FavoritesViewModel,
    onNavigateToViewer: (Uri, DocumentFormat) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Favorites") }
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
                placeholder = { Text("Search favorite documents…") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                trailingIcon = {
                    if (uiState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear")
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

            // Stale URI Alert Dialog
            uiState.staleUriAlert?.let { (item, reason) ->
                AlertDialog(
                    onDismissRequest = viewModel::dismissStaleAlert,
                    icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                    title = { Text("Cannot Open Favorite") },
                    text = {
                        Column {
                            Text("File: ${item.displayName}", style = MaterialTheme.typography.titleSmall)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(reason, style = MaterialTheme.typography.bodyMedium)
                        }
                    },
                    confirmButton = {
                        Button(onClick = { viewModel.removeFavorite(item); viewModel.dismissStaleAlert() }) {
                            Text("Remove from Favorites")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = viewModel::dismissStaleAlert) {
                            Text("Close")
                        }
                    }
                )
            }

            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                return@Scaffold
            }

            val filtered = uiState.favorites.filter { doc ->
                val matchesSearch = doc.displayName.contains(uiState.searchQuery, ignoreCase = true)
                val matchesFilter = when (uiState.activeFilter) {
                    DocumentFilter.ALL -> true
                    DocumentFilter.PDF -> doc.format == DocumentFormat.PDF
                    DocumentFilter.IMAGES -> doc.format in listOf(DocumentFormat.PNG, DocumentFormat.JPEG, DocumentFormat.WEBP)
                    DocumentFilter.TEXT -> doc.format in listOf(DocumentFormat.TXT, DocumentFormat.CSV)
                    DocumentFilter.OFFICE -> doc.format in listOf(DocumentFormat.DOCX, DocumentFormat.XLSX, DocumentFormat.PPTX, DocumentFormat.DOC)
                    DocumentFilter.HTML -> doc.format == DocumentFormat.HTML
                }
                matchesSearch && matchesFilter
            }

            if (filtered.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.StarBorder,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (uiState.searchQuery.isNotEmpty()) "No matching favorites" else "No starred documents",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Star frequently viewed documents to pin them here.",
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
                    items(filtered, key = { it.uri.toString() }) { doc ->
                        ElevatedCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewModel.onDocumentClicked(doc, onNavigateToViewer) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    when (doc.format) {
                                        DocumentFormat.PDF -> Icons.Default.PictureAsPdf
                                        DocumentFormat.PNG, DocumentFormat.JPEG, DocumentFormat.WEBP -> Icons.Default.Image
                                        DocumentFormat.CSV -> Icons.Default.TableChart
                                        else -> Icons.Default.Article
                                    },
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(36.dp)
                                )

                                Spacer(modifier = Modifier.width(16.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = doc.displayName,
                                        style = MaterialTheme.typography.titleSmall,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${doc.format.displayName} • ${doc.sizeBytes / 1024} KB",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                IconButton(
                                    onClick = { viewModel.removeFavorite(doc) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Star,
                                        contentDescription = "Unstar",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
