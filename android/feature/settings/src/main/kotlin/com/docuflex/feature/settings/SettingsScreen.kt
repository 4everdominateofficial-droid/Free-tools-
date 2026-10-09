package com.docuflex.feature.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    isFlagSecureEnabled: Boolean,
    onToggleFlagSecure: (Boolean) -> Unit,
    isBiometricLockEnabled: Boolean,
    onToggleBiometricLock: (Boolean) -> Unit,
    isHistoryEnabled: Boolean,
    onToggleHistory: (Boolean) -> Unit,
    onClearHistory: () -> Unit,
    onClearFavorites: () -> Unit,
    onBack: () -> Unit
) {
    var showClearHistoryDialog by remember { mutableStateOf(false) }
    var showClearFavoritesDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings & Privacy") },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Security Hardening",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Screen & Thumbnail Protection", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Applies WindowManager.FLAG_SECURE to block screen captures and mask recent task thumbnails.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = isFlagSecureEnabled,
                                onCheckedChange = onToggleFlagSecure,
                                modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                            )
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Biometric / Device Credential Lock", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Require biometric authentication or device PIN to view documents.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = isBiometricLockEnabled,
                                onCheckedChange = onToggleBiometricLock,
                                modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                            )
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Local Data Management",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Record Recent Files", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Keep minimal local references (URI, display name, timestamp). No document bodies are stored.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = isHistoryEnabled,
                                onCheckedChange = onToggleHistory,
                                modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                            )
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        OutlinedButton(
                            onClick = { showClearHistoryDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 48.dp)
                        ) {
                            Icon(Icons.Default.DeleteSweep, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Clear Recent History")
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedButton(
                            onClick = { showClearFavoritesDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 48.dp)
                        ) {
                            Icon(Icons.Default.StarOutline, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Clear Favorites")
                        }
                    }
                }
            }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Device Security Limits", style = MaterialTheme.typography.titleSmall)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "DocuFlex enforces strict local isolation and zero network permissions. However, if your device is rooted or compromised, other elevated applications or operating system hooks could potentially access screen memory or temporary cache slices.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (showClearHistoryDialog) {
        AlertDialog(
            onDismissRequest = { showClearHistoryDialog = false },
            title = { Text("Clear Recent History?") },
            text = { Text("This will permanently remove all recent document references from local memory.") },
            confirmButton = {
                TextButton(onClick = {
                    onClearHistory()
                    showClearHistoryDialog = false
                }) {
                    Text("Clear")
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearHistoryDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showClearFavoritesDialog) {
        AlertDialog(
            onDismissRequest = { showClearFavoritesDialog = false },
            title = { Text("Clear Favorites?") },
            text = { Text("This will remove all starred documents.") },
            confirmButton = {
                TextButton(onClick = {
                    onClearFavorites()
                    showClearFavoritesDialog = false
                }) {
                    Text("Clear")
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearFavoritesDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
