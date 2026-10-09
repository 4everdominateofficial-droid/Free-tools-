pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "DocuFlex"
include(":app")
include(":core:model")
include(":core:security")
include(":core:data")
include(":core:theme")
include(":core:viewer")
include(":feature:home")
include(":feature:recents")
include(":feature:favorites")
include(":feature:viewer")
include(":feature:settings")
include(":feature:legal")
