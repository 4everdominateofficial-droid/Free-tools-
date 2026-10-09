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
fun OpenSourceLicensesScreen(onBack: () -> Unit) {
    val realDependencies = listOf(
        Triple("androidx.core:core-ktx", "1.13.1", "Apache License 2.0"),
        Triple("androidx.lifecycle:lifecycle-runtime-ktx", "2.8.2", "Apache License 2.0"),
        Triple("androidx.activity:activity-compose", "1.9.0", "Apache License 2.0"),
        Triple("androidx.compose:compose-bom", "2024.06.00", "Apache License 2.0"),
        Triple("androidx.compose.material3:material3", "1.2.1", "Apache License 2.0"),
        Triple("androidx.compose.material3:material3-window-size-class", "1.2.1", "Apache License 2.0"),
        Triple("androidx.navigation:navigation-compose", "2.7.7", "Apache License 2.0"),
        Triple("androidx.biometric:biometric", "1.2.0-alpha05", "Apache License 2.0"),
        Triple("androidx.room:room-runtime", "2.6.1", "Apache License 2.0"),
        Triple("androidx.room:room-ktx", "2.6.1", "Apache License 2.0"),
        Triple("androidx.datastore:datastore-preferences", "1.1.1", "Apache License 2.0"),
        Triple("org.jetbrains.kotlinx:kotlinx-coroutines-android", "1.8.1", "Apache License 2.0"),
        Triple("junit:junit", "4.13.2", "Eclipse Public License 1.0")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Open Source Licenses") },
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
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("Open Source Licenses", style = MaterialTheme.typography.headlineSmall)
            Text(
                "DocuFlex strictly uses audited, permissively licensed open source libraries. No AGPL/GPL libraries or telemetry SDKs are used.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(4.dp))

            realDependencies.forEach { (coord, version, license) ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(coord, style = MaterialTheme.typography.titleSmall)
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("v$version", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(license, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}
