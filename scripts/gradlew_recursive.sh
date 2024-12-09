########################################################################
#
# Allows running of ./gradlew commands across all projects in
# folders of the current directory.
#
# Example: To run build over all projects run:
#     ./scripts/gradlew_recursive.sh build
#
########################################################################

set -xe

# Crawl all gradlew files which indicate an Android project
# You may edit this if your repo has a different project structure
for GRADLEW in `find . -name "gradlew"` ; do
    SAMPLE=$(dirname "${GRADLEW}")
    bash "$GRADLEW" -p "$SAMPLE" --stacktrace $@
done