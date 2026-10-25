   git diff --check
   ./gradlew clean build
   find build/libs -maxdepth 1 -type f -name '*.jar' -print
   git status --short
