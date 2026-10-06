# P23. Redis 연결과 사용 실무

> Redis는 키-값 저장소이면서 String·Hash·List·Set·Sorted Set의 원자적 연산을 제공한다.
> Spring Boot에서는 Lettuce 기반 자동 구성을 받고, 애플리케이션은 serializer와 TTL까지 명시해야 한다.
> 기본 운영 규칙은 네임스페이스 키·TTL·SCAN·관측이며, 캐시와 최종 원장은 분리한다.

## 1. 한 줄로 말하면

Redis는 메모리 중심의 key-value/data-structure 서버다. 캐시·세션·카운터·간단한 큐·랭킹처럼 빠른 조회와 자료형 연산이 필요한 곳에 쓴다. Spring Boot의 `spring-boot-starter-data-redis`는 Spring Data Redis와 클라이언트를 자동 구성하며 기본 클라이언트는 Lettuce다. Redis는 주문·결제의 최종 원장을 대체하는 저장소가 아니라, 데이터의 수명·복구·일관성 정책을 함께 설계해야 하는 별도 컴포넌트다.

## 2. 당장 알아야 할 것

### 2.1 용도와 자료형

| 용도 | 자료형 | 키 예 | 규칙 |
|---|---|---|---|
| 캐시 | String(JSON) | `app:cache:user:42` | TTL·원본·무효화 |
| 세션 | Hash + TTL | `spring:session:sessions:<id>` | Spring Session |
| 카운터 | String | `app:counter:post:42` | `INCR`·만료 |
| 멤버십 | Set | `app:tag:java` | 유일 멤버 |
| 큐 | List | `app:queue:email` | 실패·재처리 |
| 랭킹 | Sorted Set | `app:ranking:2026` | score·동점 규칙 |

캐시는 DB에서 재생성할 수 있어야 한다. 세션은 여러 인스턴스가 공유한다. 중요한 데이터는 장애·복구를 먼저 검토한다.

### 2.2 의존성과 설정

~~~kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.session:spring-session-data-redis")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
~~~

Boot BOM이 관리하므로 starter 버전은 쓰지 않는다. Maven에서도 Boot parent/BOM 아래 같은 artifactId를 추가한다. Spring Data Redis reference의 stable 표기는 4.1.1이다.

~~~yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
      connect-timeout: 2s
      timeout: 1s
      ssl.enabled: false
  cache.type: redis
  session:
    store-type: redis
    timeout: 30m
~~~

Boot 문서 기준 기본 대상은 `localhost:6379`다. `spring.data.redis.url`을 지정하면 host·port·username·password보다 URL이 우선한다. 운영 TLS는 `spring.data.redis.ssl.enabled=true`와 필요 시 SSL bundle을 사용한다. password는 환경 변수/secret으로 주입하고 Git에 저장하지 않는다.

### 2.3 두 template과 직렬화

문자열·숫자·CLI로 확인할 값을 다루면 `StringRedisTemplate`이 단순하다.

~~~java
redis.opsForValue().set("app:counter:login", "1", Duration.ofMinutes(10));
String value = redis.opsForValue().get("app:counter:login");
redis.opsForValue().increment("app:counter:login");
~~~

객체를 넣는 `RedisTemplate<String,Object>`는 key/value와 Hash key/value serializer를 모두 명시한다.

~~~java
@Bean
RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory,
                                              ObjectMapper mapper) {
    var t = new RedisTemplate<String, Object>();
    var key = new StringRedisSerializer();
    var json = new GenericJackson2JsonRedisSerializer(mapper);
    t.setConnectionFactory(factory);
    t.setKeySerializer(key);
    t.setHashKeySerializer(key);
    t.setValueSerializer(json);
    t.setHashValueSerializer(json);
    t.afterPropertiesSet();
    return t;
}
~~~

일반 `RedisTemplate`의 JDK serialization은 클래스·serialVersionUID에 결합되고 CLI에서 JSON으로 보이지 않는다. JSON serializer로 바꿔도 DTO 구조 변경과 타입 정보 문제는 남으므로 캐시 키 버전·무효화를 둔다. `redis-cli GET`이 깨져 보이는 것은 바이너리 serializer라면 정상이다.

### 2.4 TTL과 자료형 API

TTL은 값이 아니라 키에 붙는다. `set(k,v)`와 `expire(k)`를 별도로 호출하면 중간 장애로 영구 키가 남으므로 가능한 한 함께 지정한다.

~~~java
redis.opsForValue().set("app:cache:user:42", json, Duration.ofMinutes(5));
redis.opsForHash().put("app:user:42", "name", "Kim");
redis.opsForList().rightPush("app:queue:email", "mail-100");
redis.opsForSet().add("app:tag:java", "redis", "spring");
redis.opsForZSet().add("app:ranking:2026", "user-42", 98.5);
~~~

Hash는 필드 부분 수정, List는 삽입 순서, Set은 중복 제거, Sorted Set은 score 정렬에 사용한다. 같은 키에 서로 다른 자료형 명령을 호출하면 `WRONGTYPE`이 난다.

## 3. 따라 하기

### 3.1 Redis를 Docker로 띄우기

루트의 `compose.yaml`:

~~~yaml
services:
  redis:
    image: redis:7.4-alpine
    container_name: p23-redis
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
    command: ["redis-server", "--appendonly", "yes"]
volumes:
  redis-data:
~~~

~~~bash
docker compose up -d
docker compose ps
docker exec -it p23-redis redis-cli PING
~~~

확인 방법: running과 `PONG`을 확인한다. `docker compose down -v`는 볼륨 데이터까지 지우므로 실습 종료 때만 실행한다.

### 3.2 Boot 4.1/Java 25 프로젝트

`build.gradle.kts`:

~~~kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}
group = "example"
version = "0.0.1-SNAPSHOT"
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
repositories { mavenCentral() }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.session:spring-session-data-redis")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
~~~

`src/main/resources/application.yml`:

~~~yaml
spring:
  application.name: p23-redis
  data.redis:
    host: localhost
    port: 6379
    database: 0
    connect-timeout: 2s
    timeout: 1s
  cache.type: redis
server.port: 8080
~~~

`src/main/java/example/redis/RedisConfig.java`:

~~~java
package example.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

@Configuration
public class RedisConfig {
    @Bean
    RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory f,
                                                 ObjectMapper mapper) {
        var t = new RedisTemplate<String, Object>();
        var s = new StringRedisSerializer();
        var j = new GenericJackson2JsonRedisSerializer(mapper);
        t.setConnectionFactory(f); t.setKeySerializer(s);
        t.setHashKeySerializer(s); t.setValueSerializer(j);
        t.setHashValueSerializer(j); t.afterPropertiesSet();
        return t;
    }
}
~~~

`src/main/java/example/redis/RedisDemoController.java`:

~~~java
package example.redis;

import java.time.Duration;
import java.util.Map;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/redis")
public class RedisDemoController {
    private final StringRedisTemplate redis;
    public RedisDemoController(StringRedisTemplate redis) { this.redis = redis; }

    @PostMapping("/counter/{id}")
    public Map<String, Long> count(@PathVariable String id) {
        String k = "app:counter:" + id;
        Long n = redis.opsForValue().increment(k);
        if (n != null && n == 1L) redis.expire(k, Duration.ofHours(1));
        return Map.of("value", n == null ? 0L : n);
    }

    @PostMapping("/ranking/{season}/{user}")
    public Map<String, Boolean> score(@PathVariable String season,
                                      @PathVariable String user,
                                      @RequestParam double score) {
        Boolean ok = redis.opsForZSet().add("app:ranking:" + season, user, score);
        return Map.of("updated", Boolean.TRUE.equals(ok));
    }

    @GetMapping("/ranking/{season}")
    public Object ranking(@PathVariable String season) {
        return redis.opsForZSet().reverseRangeWithScores(
            "app:ranking:" + season, 0, 9);
    }
}
~~~

실행·확인:

~~~bash
./gradlew bootRun
curl -X POST http://localhost:8080/redis/counter/login
curl -X POST 'http://localhost:8080/redis/ranking/2026/u1?score=98.5'
curl http://localhost:8080/redis/ranking/2026
docker exec p23-redis redis-cli GET app:counter:login
docker exec p23-redis redis-cli TTL app:counter:login
docker exec p23-redis redis-cli ZRANGE app:ranking:2026 0 -1 WITHSCORES
~~~

확인 방법: 첫 카운터 응답은 `{"value":1}`, 다음 응답은 증가값이고 TTL은 양수다. 랭킹은 `ZRANGE`에서 멤버와 score를 확인한다. 앱도 Compose 컨테이너라면 Redis host는 `localhost`가 아니라 `redis`다.

위 Spring Boot 예제는 문서용 전체 코드이며 이 작업에서는 실행하지 않았다(미실행).

### 3.3 캐시별 TTL과 접두사

`src/main/java/example/redis/CacheConfig.java`:

~~~java
package example.redis;

import java.time.Duration;
import org.springframework.cache.*;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.cache.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.*;
import org.springframework.data.redis.serializer.RedisSerializationContext;

@Configuration
public class CacheConfig {
    @Bean
    CacheManager cacheManager(RedisConnectionFactory f) {
        var json = new GenericJackson2JsonRedisSerializer();
        var base = RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(json))
            .computePrefixWith(n -> "app:cache:" + n + "::");
        return RedisCacheManager.builder(f).cacheDefaults(base)
            .withCacheConfiguration("users",
                base.entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("ranking",
                base.entryTtl(Duration.ofSeconds(30))).build();
    }
}
~~~

서비스의 조회 메서드에는 `@Cacheable(cacheNames="users", key="#id")`, 변경 메서드에는 `@CacheEvict(cacheNames="users", key="#id")`를 붙인다. 확인은 `docker exec p23-redis redis-cli --scan --pattern 'app:cache:*'`와 `TTL`로 한다. `@Cacheable`은 proxy 호출 경계가 필요하므로 self-invocation은 피한다.

캐시 설정 예제는 Boot 4.1 기준으로 작성했으며 이 작업에서는 실행하지 않았다(미실행).

### 3.4 Spring Session

`spring-session-data-redis`와 `spring.session.store-type=redis`면 HTTP 세션을 Redis에 저장한다. `spring.session.timeout` 뒤 만료되며 여러 앱 인스턴스가 공유한다. 세션을 만든 뒤 `redis-cli --scan --pattern 'spring:session:*'`와 TTL을 확인한다. 인증·권한은 S12/S13 소유 주제다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `opsForValue().set` | 값 저장 | `set(k,v,Duration)` | TTL을 함께 |
| `increment` | 원자 카운터 | `increment("app:count")` | 만료 정책 |
| `opsForHash` | 필드 레코드 | `put(k,f,v)` | 키 TTL |
| `opsForList` | 큐 | `rightPush(k,v)` | 재처리 |
| `opsForSet` | 유일 집합 | `add(k,m)` | 크기 제한 |
| `opsForZSet` | 랭킹 | `add(k,m,score)` | 동점 |
| `getExpire` | TTL 확인 | `getExpire(k)` | -1은 없음 |
| `SCAN` | 점진 키 검색 | `SCAN 0 MATCH app:*` | cursor 반복 |
| `INFO` | 서버 관측 | `INFO memory` | 운영 권한 |
| `MONITOR` | 명령 디버깅 | `redis-cli MONITOR` | 상시 금지 |

키는 `서비스:환경:도메인:식별자` 네임스페이스를 사용한다. 캐시 구조 변경은 `v2` 접두사로 분리할 수 있다. 값이 아니라 키에 TTL이 붙는다. 운영 코드에서는 `KEYS` 대신 `SCAN`을 사용한다.

## 5. 자주 나는 에러와 해결

1. **`Unable to connect to Redis` / `Connection refused` →** Redis가 꺼졌거나 컨테이너 안 앱이 `localhost`를 가리킨다. `docker compose ps`, `docker compose logs redis`를 확인하고 Compose 네트워크에서는 host를 `redis`로 바꾼다.
2. **`NOAUTH Authentication required.` →** Redis가 password/ACL을 요구하는데 Boot 설정이 없거나 다르다. 실제 정책을 확인하고 `spring.data.redis.password`를 secret으로 주입한다.
3. **`SerializationException` →** 저장·읽기 serializer 또는 DTO 구조가 달라졌다. 캐시를 삭제하거나 v2 키로 전환하고 같은 serializer로 재생성한다.
4. **`ClassCastException` →** 한 키에 다른 DTO·자료형을 저장했다. 키별 값 계약을 고정하고 String template과 객체 template이 키를 공유하지 않게 한다.
5. **`WRONGTYPE Operation against a key holding the wrong kind of value` →** Hash에 String 명령을 호출했다. `TYPE key`로 확인하고 자료형별 키를 분리한다.
6. **`UnrecognizedPropertyException` →** 이전 JSON이 새 DTO 필드와 맞지 않는다. 호환성을 판단하고 `app:cache:v2:`로 전환하거나 해당 캐시를 지운다.
7. **`KEYS app:*` 뒤 지연 →** `KEYS`는 큰 keyspace를 한 번에 순회한다. `SCAN 0 MATCH app:* COUNT 100`을 cursor 0까지 반복한다.

## 6. 한 단계 더

template은 연결 관리·직렬화와 자료형별 Operations view를 제공한다. Redis 서버는 바이트와 자료형 계약만 알므로 키·serializer·TTL을 함께 관리한다. `SCAN`은 작업을 나누지만 변경 중 스냅샷을 보장하지 않는다. `INFO`는 memory·stats·clients·keyspace를 관찰하고, `MONITOR`는 짧은 디버깅에만 쓴다.

캐시 전략·일관성·DB 마이그레이션은 S11, 재고 차감·분산 락 동시성은 P18, 인증·권한은 S12/S13을 참조한다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. 왜 Lettuce를 기본값으로 쓰는가?

Boot가 Lettuce와 Spring Data Redis를 자동 구성해 connection factory와 template을 주기 때문이다. 특별한 요구가 없으면 기본값을 쓰고 TLS·풀링이 필요할 때 설정을 확장한다.

꼬리질문: 컨테이너 안 `localhost`는 Redis인가? 아니다. 자기 컨테이너이므로 Compose 서비스명 `redis`를 사용한다.

### Q2. 두 template은 어떻게 선택하는가?

문자열·숫자·CLI 확인 값은 `StringRedisTemplate`, DTO 객체는 serializer를 명시한 `RedisTemplate`을 쓴다. 두 template이 같은 키를 공유하지 않게 한다.

꼬리질문: CLI에서 깨진 값은 손상인가? 바이너리 serializer라면 정상이다.

### Q3. JSON serializer면 문제가 끝나는가?

아니다. JSON도 타입 메타데이터와 DTO 구조 변경에 의존한다. 허용 타입을 제한하고 키 버전과 무효화를 사용한다.

꼬리질문: 역직렬화 실패 시? 재생성 가능한 캐시라면 삭제 후 원본에서 만든다.

### Q4. KEYS 대신 SCAN인 이유는?

`KEYS`는 O(N) 결과를 한 번에 반환해 큰 DB에서 지연을 만든다. `SCAN`은 cursor로 나누지만 변경 중 중복·누락 가능성이 있다.

꼬리질문: COUNT가 정확한 개수인가? 아니다. 반환량 힌트다.

### Q5. @Cacheable과 template의 구분은?

메서드 결과 캐시는 `@Cacheable`/CacheManager, 카운터·랭킹·Hash 수정은 template operations를 쓴다. self-invocation은 proxy를 우회할 수 있다.

꼬리질문: 변경 뒤 캐시는? `@CacheEvict` 또는 새 버전 접두사로 무효화한다.

### Q6. get 후 Java에서 카운터를 증가하면 왜 위험한가?

동시 요청이 같은 값을 읽어 lost update가 생긴다. `increment`는 Redis 명령으로 증가한다. 여러 키의 강한 원자성이 필요하면 script 등 별도 설계가 필요하다.

꼬리질문: increment와 expire를 이어 호출하면 전체 원자적인가? 아니다. 두 명령이며 강한 보장이 필요하면 서버 script를 검토한다.

### Q7. MONITOR를 상시 사용하지 않는 이유는?

모든 명령을 스트리밍해 성능 부담과 정보 노출 위험이 있다. 재현 구간에서 잠시 쓰고, 평상시는 INFO와 메트릭을 본다.

꼬리질문: INFO에서 먼저 볼 곳은? memory·stats·clients·keyspace다.

## 8. 참고문헌

- Spring Data Redis Reference — https://docs.spring.io/spring-data/redis/reference/ — Redis 연결과 기본 개념.
- Working with Objects through RedisTemplate — https://docs.spring.io/spring-data/redis/reference/redis/template.html — template·직렬화·Operations view.
- Spring Boot Working with NoSQL Technologies — https://docs.spring.io/spring-boot/reference/data/nosql.html — Lettuce 기본, `spring.data.redis.*`, SSL.
- Spring Boot Caching — https://docs.spring.io/spring-boot/reference/io/caching.html — `@Cacheable`·CacheManager·Redis 캐시.
- Redis data types — https://redis.io/docs/latest/develop/data-types/ — String·Hash·List·Set·Sorted Set.
- SCAN — https://redis.io/docs/latest/commands/scan/ — cursor 순회와 제한.
- KEYS — https://redis.io/docs/latest/commands/keys/ — O(N) 및 운영 경고.
- INFO — https://redis.io/docs/latest/commands/info/ — 서버·메모리·통계.
- MONITOR — https://redis.io/docs/latest/commands/monitor/ — 명령 스트림과 비용.
- Redis Configurations :: Spring Session — https://docs.spring.io/spring-session/reference/configuration/redis.html — Redis 세션 구성.
