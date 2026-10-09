package com.docuflex.feature.legal

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

enum class LegalTab(val label: String) {
    PRIVACY("Privacy Policy"),
    TERMS("Terms & Conditions"),
    SECURITY("Security & Safety"),
    LICENSES("Open Source")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LegalHubScreen(onBack: () -> Unit) {
    var selectedTab by remember { mutableStateOf(LegalTab.PRIVACY) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Legal & Security") },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            ScrollableTabRow(
                selectedTabIndex = selectedTab.ordinal,
                modifier = Modifier.fillMaxWidth()
            ) {
                LegalTab.values().forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab.label) },
                        modifier = Modifier.defaultMinSize(minHeight = 48.dp)
                    )
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                when (selectedTab) {
                    LegalTab.PRIVACY -> item { PrivacyPolicyContent() }
                    LegalTab.TERMS -> item { TermsAndConditionsContent() }
                    LegalTab.SECURITY -> item { SecurityAndSafetyContent() }
                    LegalTab.LICENSES -> item { OpenSourceLicensesContent() }
                }
            }
        }
    }
}

@Composable
fun PrivacyPolicyContent() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Privacy Policy", style = MaterialTheme.typography.headlineSmall)
        Text("Effective Date: October 2026 • DocuFlex v1.0.0", style = MaterialTheme.typography.labelMedium)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("1. Zero Data Collection", style = MaterialTheme.typography.titleMedium)
                Text(
                    "DocuFlex is completely offline. The application does not contain android.permission.INTERNET. No personal information, document content, device identifiers, or analytics are ever transmitted off this device.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("2. Local Metadata Storage", style = MaterialTheme.typography.titleMedium)
                Text(
                    "To support the Recent Files and Favorites list, minimal references (SAF content URI, user-facing display name, file size, timestamp) are stored locally in private application storage. You can purge this at any time in Settings.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("3. Transient Memory & Cache Files", style = MaterialTheme.typography.titleMedium)
                Text(
                    "When rendering complex documents, temporary slices may be cached in the app-private cache directory (cacheDir). These files are automatically deleted upon document close, app launch, and low-memory triggers. System backups (allowBackup=false) are disabled.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("4. Developer Contact", style = MaterialTheme.typography.titleMedium)
                Text("For open source inquiries or bug reports: contact@docuflex-project.internal", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun TermsAndConditionsContent() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Terms & Conditions", style = MaterialTheme.typography.headlineSmall)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("1. Scope & Intended Use", style = MaterialTheme.typography.titleMedium)
                Text(
                    "DocuFlex is strictly a viewer utility. It does not provide document editing, conversion, or file generation. You are responsible for maintaining your own file backups.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("2. Format Rendering Limitations", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Internal rendering is provided for standard PDF, TXT, CSV, PNG, JPEG, WEBP, and sanitized HTML. Password-protected PDFs and complex Office files (DOC, DOCX, PPT, PPTX, XLS, XLSX) require external compatible viewers. DocuFlex makes no warranty of pixel-perfect fidelity.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("3. Consumer Rights & Mandatory Law", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Nothing in these terms excludes, restricts or modifies any mandatory statutory consumer rights under applicable local laws that cannot be lawfully excluded.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
fun SecurityAndSafetyContent() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Security & Safety Architecture", style = MaterialTheme.typography.headlineSmall)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("1. Storage Access Framework (SAF)", style = MaterialTheme.typography.titleMedium)
                Text(
                    "DocuFlex does not request broad external storage permissions (READ_EXTERNAL_STORAGE). Files are accessed strictly through explicit user selection via ACTION_OPEN_DOCUMENT.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("2. Content Validation & Defenses", style = MaterialTheme.typography.titleMedium)
                Text(
                    "• Magic bytes inspection prevents file extension deception.\n• ZipSlip path traversal and Zip Bomb expansion ratio limits are enforced.\n• XML external entities (XXE) and DTDs are disabled.\n• HTML execution disables JavaScript and blocks network fetches.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("3. No Antivirus / Malware Claims", style = MaterialTheme.typography.titleMedium)
                Text(
                    "DocuFlex isolates viewing and enforces defensive parsing, but is NOT an antivirus engine. It cannot detect zero-day binary exploits inside documents. Always ensure documents from unknown sources are vetted.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
fun OpenSourceLicensesContent() {
    val licenses = listOf(
        "AndroidX Core KTX" to "Apache License 2.0 (Google LLC)",
        "Jetpack Compose UI & Material 3" to "Apache License 2.0 (Google LLC)",
        "Kotlinx Coroutines" to "Apache License 2.0 (JetBrains s.r.o.)",
        "AndroidX Biometric" to "Apache License 2.0 (Google LLC)",
        "AndroidX DataStore Preferences" to "Apache License 2.0 (Google LLC)"
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Open Source Licenses", style = MaterialTheme.typography.headlineSmall)
        Text("DocuFlex uses exclusively permissive open-source libraries (Apache 2.0).", style = MaterialTheme.typography.bodySmall)

        licenses.forEach { (lib, license) ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(lib, style = MaterialTheme.typography.titleSmall)
                    Text(license, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
