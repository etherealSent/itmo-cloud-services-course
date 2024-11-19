// Top-level build file where you can add configuration options common to all sub-projects/modules.
import com.github.benmanes.gradle.versions.updates.DependencyUpdatesTask
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.jetbrains.kotlin.android) apply false
    alias(libs.plugins.github.ben.manes.versions) apply false
}

buildscript {
//    repositories {
//        // Use 'gradle install' to install latest
//        mavenLocal()
//        gradlePluginPortal()
//    }

    dependencies {
        classpath("com.github.ben-manes:gradle-versions-plugin:+")
    }
}

apply(plugin = "com.github.ben-manes.versions")

//repositories {
//    mavenCentral()
//}


configurations {
    register("bom")
    register("upToDate")
    register("exceedLatest")
    register("platform")
    register("upgradesFound")
    register("upgradesFound2")
    register("unresolvable")
    register("unresolvable2")
}

fun String.isNonStable(): Boolean {
    val stableKeyword = listOf("RELEASE", "FINAL", "GA").any { uppercase().contains(it) }
    val regex = "^[0-9,.v-]+(-r)?$".toRegex()
    val isStable = stableKeyword || regex.matches(this)
    return isStable.not()
}

tasks.withType<DependencyUpdatesTask> {

    // Example 1: reject all non stable versions
    rejectVersionIf {
        candidate.version.isNonStable()
    }

    // Example 2: disallow release candidates as upgradable versions from stable versions
    rejectVersionIf {
        candidate.version.isNonStable() && !currentVersion.isNonStable()
    }

    // Example 3: using the full syntax
    resolutionStrategy {
        componentSelection {
            all {
                if (candidate.version.isNonStable() && !currentVersion.isNonStable()) {
                    reject("Release candidate")
                }
            }
        }
    }

    // optional parameters
    checkForGradleUpdate = true
    outputFormatter = "json"
    outputDir = "build/dependencyUpdates"
    reportfileName = "report"
}