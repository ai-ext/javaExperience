./gradlew clean bootJar
docker build -t d07-demo:local .
docker run --rm -p 8080:8080 d07-demo:local
curl -i http://localhost:8080/health
