curl -fsS --output /tmp/spring-metrics.txt http://localhost:8080/actuator/prometheus
sed -n '1,20p' /tmp/spring-metrics.txt
docker compose -f ops/compose.yaml up -d
docker compose -f ops/compose.yaml ps
