package com.docuflex.core.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "docuflex_user_preferences")

class UserPreferencesRepository(private val context: Context) {

    private object PreferencesKeys {
        val SAVE_HISTORY_ENABLED = booleanPreferencesKey("save_history_enabled")
        val FLAG_SECURE_ENABLED = booleanPreferencesKey("flag_secure_enabled")
        val BIOMETRIC_LOCK_ENABLED = booleanPreferencesKey("biometric_lock_enabled")
        val SELECTED_LANGUAGE = stringPreferencesKey("selected_language")
    }

    val saveHistoryEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            preferences[PreferencesKeys.SAVE_HISTORY_ENABLED] ?: true
        }

    val flagSecureEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            preferences[PreferencesKeys.FLAG_SECURE_ENABLED] ?: true
        }

    val biometricLockEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            preferences[PreferencesKeys.BIOMETRIC_LOCK_ENABLED] ?: false
        }

    val selectedLanguage: Flow<String> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            preferences[PreferencesKeys.SELECTED_LANGUAGE] ?: "en"
        }

    suspend fun setSaveHistoryEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SAVE_HISTORY_ENABLED] = enabled
        }
    }

    suspend fun setFlagSecureEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.FLAG_SECURE_ENABLED] = enabled
        }
    }

    suspend fun setBiometricLockEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.BIOMETRIC_LOCK_ENABLED] = enabled
        }
    }

    suspend fun setSelectedLanguage(languageCode: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SELECTED_LANGUAGE] = languageCode
        }
    }
}
