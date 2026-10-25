docker run --name d10-postgres \
  -e POSTGRES_PASSWORD=localpass -e POSTGRES_DB=shop \
  -p 5432:5432 -d postgres:18

docker run --name d10-mysql \
  -e MYSQL_ROOT_PASSWORD=localpass -e MYSQL_DATABASE=shop \
  -p 3306:3306 -d mysql:8.4

docker ps --filter name=d10-
