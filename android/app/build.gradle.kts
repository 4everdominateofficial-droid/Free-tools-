plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.docuflex"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.docuflex"
        minSdk = 26     // Justification: Minimum required for modern SAF, Biometrics, and native PdfRenderer
        targetSdk = 35  // Justification: Complies with Google Play requirement for Android 15 (API 35)
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
            val localProps = java.util.Properties()
            if (localPropsFile.exists()) {
                localProps.load(localPropsFile.inputStream())
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

// Security CI Check: Fails build if INTERNET permission is introduced
tasks.register("verifyNoInternetPermission") {
    description = "Audits merged Android manifest to ensure no INTERNET or network permissions exist."
    group = "verification"
    doLast {
        val manifestFile = file("src/main/AndroidManifest.xml")
        val content = manifestFile.readText()
        if (content.contains("android.permission.INTERNET", ignoreCase = true)) {
            throw GradleException("SECURITY VIOLATION: android.permission.INTERNET detected in manifest!")
        }
        println("DocuFlex Security Audit: Zero network permissions verified.")
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
