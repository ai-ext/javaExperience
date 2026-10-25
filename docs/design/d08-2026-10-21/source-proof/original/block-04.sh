java -version
./gradlew --version
git switch -c feat/ci-lab
./gradlew --no-daemon clean test bootJar
