import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.docuflex"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.docuflex"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            // Read from local.properties or environment variables; build still works if missing
            val localPropsFile = rootProject.file("local.properties")
            val localProps = Properties()
            if (localPropsFile.exists()) {
                localPropsFile.inputStream().use { localProps.load(it) }
            }

            val storeFilePath = System.getenv("DOCUFLEX_KEYSTORE_PATH") ?: localProps.getProperty("RELEASE_STORE_FILE")
            val storePass = System.getenv("DOCUFLEX_KEYSTORE_PASSWORD") ?: localProps.getProperty("RELEASE_STORE_PASSWORD")
            val keyAl = System.getenv("DOCUFLEX_KEY_ALIAS") ?: localProps.getProperty("RELEASE_KEY_ALIAS")
            val keyPass = System.getenv("DOCUFLEX_KEY_PASSWORD") ?: localProps.getProperty("RELEASE_KEY_PASSWORD")

            if (storeFilePath != null && file(storeFilePath).exists()) {
                storeFile = file(storeFilePath)
                storePassword = storePass
                keyAlias = keyAl
                keyPassword = keyPass
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            isDebuggable = false
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

// Fails the build if the INTERNET permission appears in the source manifest.
// Note: this checks the source manifest only, not the merged one.
tasks.register("verifyNoInternetPermission") {
    description = "Checks the app source manifest for the INTERNET permission."
    group = "verification"
    doLast {
        val content = file("src/main/AndroidManifest.xml").readText()
        if (content.contains("android.permission.INTERNET", ignoreCase = true)) {
            throw GradleException("android.permission.INTERNET found in manifest!")
        }
        println("No INTERNET permission in source manifest.")
    }
}

dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:security"))
    implementation(project(":core:data"))
    implementation(project(":core:theme"))
    implementation(project(":core:viewer"))
    implementation(project(":feature:home"))
    implementation(project(":feature:recents"))
    implementation(project(":feature:favorites"))
    implementation(project(":feature:viewer"))
    implementation(project(":feature:settings"))
    implementation(project(":feature:legal"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material3.windowsizeclass)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.datastore.preferences)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
}
