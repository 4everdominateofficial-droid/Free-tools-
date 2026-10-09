package com.docuflex.app

import android.app.Application
import android.os.StrictMode
import com.docuflex.core.security.TempFileManager

class DocuFlexApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // Privacy rule: Purge all transient cache files on application startup
        TempFileManager(this).clearTransientCache()

        // Build rule: StrictMode in debug builds to catch thread violations & leaks
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            StrictMode.setThreadPolicy(
                StrictMode.ThreadPolicy.Builder()
                    .detectDiskReads()
                    .detectDiskWrites()
                    .detectNetwork() // Redundant safety net: DocuFlex has no network
                    .penaltyLog()
                    .build()
            )
            StrictMode.setVmPolicy(
                StrictMode.VmPolicy.Builder()
                    .detectLeakedSqlLiteObjects()
                    .detectLeakedClosableObjects()
                    .penaltyLog()
                    .build()
            )
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        if (level >= TRIM_MEMORY_MODERATE) {
            TempFileManager(this).clearTransientCache()
        }
    }
}
