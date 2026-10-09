package com.docuflex.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.docuflex.core.data.DocumentRepository
import com.docuflex.core.data.UserPreferencesRepository
import com.docuflex.core.model.DocumentFormat
import com.docuflex.core.security.BiometricAuthManager
import com.docuflex.core.theme.DocuFlexTheme
import com.docuflex.feature.favorites.FavoritesScreen
import com.docuflex.feature.favorites.FavoritesViewModel
import com.docuflex.feature.home.HomeScreen
import com.docuflex.feature.home.HomeViewModel
import com.docuflex.feature.legal.*
import com.docuflex.feature.recents.RecentFilesScreen
import com.docuflex.feature.recents.RecentFilesViewModel
import com.docuflex.feature.settings.SettingsScreen
import com.docuflex.feature.viewer.DocumentViewerScreen
import com.docuflex.feature.viewer.DocumentViewerViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

sealed class Screen(val route: String, val label: String, val selectedIcon: androidx.compose.ui.graphics.vector.ImageVector, val unselectedIcon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Home : Screen("home", "Home", Icons.Filled.Home, Icons.Outlined.Home)
    object Recents : Screen("recents", "Recent", Icons.Filled.History, Icons.Outlined.History)
    object Favorites : Screen("favorites", "Favorites", Icons.Filled.Star, Icons.Outlined.StarBorder)
    object Settings : Screen("settings", "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
}

class MainActivity : FragmentActivity() {

    private val homeViewModel: HomeViewModel by viewModels()
    private val recentsViewModel: RecentFilesViewModel by viewModels()
    private val favoritesViewModel: FavoritesViewModel by viewModels()
    private val viewerViewModel: DocumentViewerViewModel by viewModels()

    private lateinit var biometricAuthManager: BiometricAuthManager
    private lateinit var preferencesRepository: UserPreferencesRepository
    private lateinit var documentRepository: DocumentRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        biometricAuthManager = BiometricAuthManager(this)
        preferencesRepository = UserPreferencesRepository(this)
        documentRepository = DocumentRepository(this)

        lifecycleScopeLaunch()

        // Handle external launch intent (ACTION_VIEW / ACTION_SEND) safely
        handleIncomingIntent(intent)

        setContent {
            DocuFlexTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentDestination = navBackStackEntry?.destination?.route

                    val bottomBarScreens = listOf(
                        Screen.Home,
                        Screen.Recents,
                        Screen.Favorites,
                        Screen.Settings
                    )
                    val showBottomBar = currentDestination in bottomBarScreens.map { it.route }

                    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                        val isExpanded = maxWidth >= 600.dp

                        if (isExpanded && showBottomBar) {
                            // Adaptive Tablet / Foldable layout with NavigationRail
                            Row(modifier = Modifier.fillMaxSize()) {
                                NavigationRail {
                                    bottomBarScreens.forEach { screen ->
                                        val isSelected = currentDestination == screen.route
                                        NavigationRailItem(
                                            selected = isSelected,
                                            onClick = {
                                                navController.navigate(screen.route) {
                                                    popUpTo(navController.graph.findStartDestination().id) {
                                                        saveState = true
                                                    }
                                                    launchSingleTop = true
                                                    restoreState = true
                                                }
                                            },
                                            icon = {
                                                Icon(
                                                    if (isSelected) screen.selectedIcon else screen.unselectedIcon,
                                                    contentDescription = screen.label
                                                )
                                            },
                                            label = { Text(screen.label) }
                                        )
                                    }
                                }
                                Box(modifier = Modifier.weight(1f)) {
                                    AppNavigationHost(navController)
                                }
                            }
                        } else {
                            // Standard Phone layout with NavigationBar
                            Scaffold(
                                bottomBar = {
                                    if (showBottomBar) {
                                        NavigationBar {
                                            bottomBarScreens.forEach { screen ->
                                                val isSelected = currentDestination == screen.route
                                                NavigationBarItem(
                                                    selected = isSelected,
                                                    onClick = {
                                                        navController.navigate(screen.route) {
                                                            popUpTo(navController.graph.findStartDestination().id) {
                                                                saveState = true
                                                            }
                                                            launchSingleTop = true
                                                            restoreState = true
                                                        }
                                                    },
                                                    icon = {
                                                        Icon(
                                                            if (isSelected) screen.selectedIcon else screen.unselectedIcon,
                                                            contentDescription = screen.label
                                                        )
                                                    },
                                                    label = { Text(screen.label) }
                                                )
                                            }
                                        }
                                    }
                                }
                            ) { paddingValues ->
                                Box(modifier = Modifier.padding(paddingValues)) {
                                    AppNavigationHost(navController)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun lifecycleScopeLaunch() {
        // Enforce FLAG_SECURE from preferences
        androidx.lifecycle.lifecycleScope.launch {
            preferencesRepository.flagSecureEnabled.collect { isSecure ->
                updateFlagSecure(isSecure)
            }
        }
    }

    @Composable
    private fun AppNavigationHost(navController: androidx.navigation.NavHostController) {
        val coroutineScope = rememberCoroutineScope()
        val isFlagSecure by preferencesRepository.flagSecureEnabled.collectAsState(initial = true)
        val isBiometric by preferencesRepository.biometricLockEnabled.collectAsState(initial = false)
        val isHistory by preferencesRepository.saveHistoryEnabled.collectAsState(initial = true)

        NavHost(navController = navController, startDestination = Screen.Home.route) {
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = homeViewModel,
                    onNavigateToViewer = { uri, format ->
                        coroutineScope.launch {
                            documentRepository.recordDocumentAccess(uri, uri.lastPathSegment ?: "Document", format, 0L)
                        }
                        navController.navigate("viewer/${Uri.encode(uri.toString())}/${format.name}")
                    },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onNavigateToLegal = { navController.navigate("legal/privacy") }
                )
            }

            composable(Screen.Recents.route) {
                RecentFilesScreen(
                    viewModel = recentsViewModel,
                    onNavigateToViewer = { uri, format ->
                        navController.navigate("viewer/${Uri.encode(uri.toString())}/${format.name}")
                    }
                )
            }

            composable(Screen.Favorites.route) {
                FavoritesScreen(
                    viewModel = favoritesViewModel,
                    onNavigateToViewer = { uri, format ->
                        navController.navigate("viewer/${Uri.encode(uri.toString())}/${format.name}")
                    }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    isFlagSecureEnabled = isFlagSecure,
                    onToggleFlagSecure = { enabled ->
                        coroutineScope.launch {
                            preferencesRepository.setFlagSecureEnabled(enabled)
                            updateFlagSecure(enabled)
                        }
                    },
                    isBiometricLockEnabled = isBiometric,
                    onToggleBiometricLock = { enabled ->
                        coroutineScope.launch {
                            preferencesRepository.setBiometricLockEnabled(enabled)
                        }
                    },
                    isHistoryEnabled = isHistory,
                    onToggleHistory = { enabled ->
                        coroutineScope.launch {
                            preferencesRepository.setSaveHistoryEnabled(enabled)
                        }
                    },
                    onClearHistory = {
                        coroutineScope.launch {
                            documentRepository.clearRecentHistory()
                        }
                    },
                    onClearFavorites = {
                        coroutineScope.launch {
                            documentRepository.clearFavorites()
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            composable("viewer/{uri}/{format}") { backStackEntry ->
                val rawUri = backStackEntry.arguments?.getString("uri") ?: ""
                val formatName = backStackEntry.arguments?.getString("format") ?: "UNKNOWN"
                val uri = Uri.parse(Uri.decode(rawUri))
                val format = try {
                    DocumentFormat.valueOf(formatName)
                } catch (_: Exception) {
                    DocumentFormat.UNKNOWN
                }
                val fileName = uri.lastPathSegment ?: "Document"

                DocumentViewerScreen(
                    title = fileName,
                    uri = uri,
                    format = format,
                    viewModel = viewerViewModel,
                    onBack = { navController.popBackStack() }
                )
            }

            // Dedicated Separate Legal Screens
            composable("legal/privacy") {
                PrivacyPolicyScreen(onBack = { navController.popBackStack() })
            }
            composable("legal/terms") {
                TermsAndConditionsScreen(onBack = { navController.popBackStack() })
            }
            composable("legal/security") {
                SecuritySafetyScreen(onBack = { navController.popBackStack() })
            }
            composable("legal/licenses") {
                OpenSourceLicensesScreen(onBack = { navController.popBackStack() })
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(incomingIntent: Intent?) {
        if (incomingIntent == null) return

        val uri = when (incomingIntent.action) {
            Intent.ACTION_VIEW -> incomingIntent.data
            Intent.ACTION_SEND -> incomingIntent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            else -> null
        }

        if (uri != null) {
            homeViewModel.onDocumentPicked(uri) { _, _ ->
                // Navigated safely via Compose state
            }
        }
    }

    private fun updateFlagSecure(enable: Boolean) {
        if (enable) {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
