########################################################################
#
# Duplicates libs.versions.toml into each sample from master copy.
#
# Example: To run build over all projects run:
#     ./scripts/duplicate_version_config.sh
#
########################################################################

set -xe

cp scripts/libs.versions.toml lab3/CiCdApplication/gradle/libs.versions.toml

cp scripts/toml-updater-config.gradle lab3/CiCdApplication/buildscripts/toml-updater-config.gradle

cp scripts/init.gradle.kts lab3/CiCdApplication/buildscripts/init.gradle.kts