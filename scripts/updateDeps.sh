set -xe

./lab3/CiCdApplication/gradlew -p ./lab3/CiCdApplication versionCatalogUpdate 

cp lab3/CiCdApplication/gradle/libs.versions.toml scripts/libs.versions.toml
./scripts/duplicate_version_config.sh