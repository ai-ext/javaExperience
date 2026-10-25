java -version
./gradlew --version
./gradlew bootRun

# 두 번째 터미널
curl -v --connect-timeout 2 http://127.0.0.1:8080/probe
