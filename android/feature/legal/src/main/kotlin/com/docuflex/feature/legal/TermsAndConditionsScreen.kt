package com.docuflex.feature.legal

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TermsAndConditionsScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Terms & Conditions") },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Terms & Conditions", style = MaterialTheme.typography.headlineSmall)

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("1. Scope & Intended Use", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "DocuFlex is strictly a viewer utility. It does not provide document editing, conversion, or file generation. You are solely responsible for maintaining your own document backups.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("2. Format Rendering Limitations", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Internal rendering is provided for standard PDF, TXT, CSV, PNG, JPEG, WEBP, sanitized HTML, and basic text/sheet preview for DOCX/XLSX. Password-protected PDFs and complex Office files (DOC, PPT, PPTX) require external compatible viewers. DocuFlex makes no warranty of uninterrupted operation or pixel-perfect layout fidelity across all proprietary binary formats.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("3. Consumer Rights & Mandatory Law", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Nothing in these terms excludes, restricts or modifies any mandatory statutory consumer rights under applicable local laws that cannot be lawfully excluded.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}
