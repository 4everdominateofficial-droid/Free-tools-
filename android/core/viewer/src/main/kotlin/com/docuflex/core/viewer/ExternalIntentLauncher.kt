package com.docuflex.core.viewer

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.docuflex.core.model.DocumentFormat

/**
 * Handles safe delegation to external viewer applications.
 * Adheres strictly to security rules:
 * - Grants READ_URI_PERMISSION flag only.
 * - Catches ActivityNotFoundException gracefully.
 * - Does not leak raw file system paths.
 */
object ExternalIntentLauncher {

    sealed class LaunchResult {
        object Success : LaunchResult()
        data class NoAppInstalled(val format: DocumentFormat) : LaunchResult()
        data class SecurityError(val message: String) : LaunchResult()
    }

    fun openInExternalApp(context: Context, uri: Uri, mimeType: String, format: DocumentFormat): LaunchResult {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            val chooser = Intent.createChooser(intent, "Open with compatible app").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
            LaunchResult.Success
        } catch (e: ActivityNotFoundException) {
            LaunchResult.NoAppInstalled(format)
        } catch (e: SecurityException) {
            LaunchResult.SecurityError("Access denied when granting URI permission: ${e.message}")
        }
    }
}
