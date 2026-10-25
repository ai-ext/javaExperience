./gradlew bootRun

curl -i -X POST http://localhost:8080/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"배포 점검"}'

curl -i http://localhost:8080/api/v1/tasks/00000000-0000-0000-0000-000000000000
curl -i http://localhost:8080/v3/api-docs
