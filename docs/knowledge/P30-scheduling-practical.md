# P30. 스케줄링 실무 — @Scheduled부터 서버 여러 대·Quartz·CronJob까지

> 만료·정산·리포트·정리 작업은 요청이 없어도 정해진 시간에 실행되어야 한다.
> @Scheduled는 JVM 안에서 동작하므로 스레드 수와 서버 대수를 먼저 확인한다.
> 중복·누락을 없애려면 멱등성, 작업 상태, 잠금, 재시도와 관측을 조합한다.

## 1. 한 줄로 말하면

스케줄링은 특정 시각 또는 일정 간격으로 작업을 실행하도록 등록하는 기능이다. Spring의 @Scheduled는 애플리케이션 프로세스가 살아 있는 동안 JVM 내부 스케줄러에 작업을 등록한다.

프로세스가 꺼져 있으면 실행되지 않고, 서버가 여러 대면 각 프로세스가 같은 작업을 등록한다. 단순 반복 작업은 @Scheduled가 빠른 출발점이지만, 실행 이력·재처리·분산 조정이 필요해지면 Quartz, Kubernetes CronJob 또는 작업 큐를 선택한다.

## 2. 당장 알아야 할 것

### 2.1 등록과 주기 선택

@EnableScheduling을 켜고 @Scheduled를 Spring 빈의 인자 없는 메서드에 선언한다. new로 만든 객체는 대상이 아니다. 같은 빈을 두 개 만들거나 프로세스를 두 개 띄우면 등록도 각각 생긴다. 전체 파일 예제는 3절을 따른다.

작업에 12초 걸리고 간격이 5초일 때 시작 시각은 다음과 같다.

    fixedRate: 00 시작 ─ 12초 종료/즉시 다음 시작 ─ 24초 종료/즉시 다음 시작
    목표 시각은 00, 05, 10…이다. 실행끼리 겹치지는 않지만 지연 뒤 연속 실행될 수 있다.
    fixedDelay: 00 시작 ─ 12초 종료 ─ 5초 대기 ─ 17초 시작
    직전 실행 완료 시점부터 간격을 잰다.

주기 폴링은 fixedRate, 앞 작업 완료 후 쉬어야 하는 작업은 fixedDelay가 알맞다. cron은 벽시계 시각 기준이다. Spring 기본 lenient cron은 작업 종료 시각으로 다음 실행을 계산하므로 장시간 실행 중 지나간 회차를 건너뛸 수 있다. 누락 구간 재생이 필요하면 대상 기간과 처리 상태를 DB에 기록하거나 영속 스케줄러를 쓴다.

### 2.2 Cron과 시간대

Spring cron은 초 분 시 일 월 요일의 6필드다. Linux crontab은 초 없는 5필드이고 Quartz는 요일 숫자 기준이 다르다. Spring은 SUN=0~SAT=6(7도 SUN), Quartz는 SUN=1~SAT=7이다. L, # 등의 확장도 스케줄러별로 검증한다.

| 표현식 | 뜻 |
|---|---|
| 0 */5 * * * * | 매 5분 |
| 0 0 2 * * * | 매일 02시 |
| 0 30 9 * * MON-FRI | 평일 09:30 |
| 0 0 0 L * * | 매월 말일 자정 |

한국 시각 작업은 zone을 지정한다. 이는 cron 해석에만 적용되고 DB·JSON·시스템 시각을 변경하지 않는다.

예: @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Seoul").
### 2.3 기본 스레드 1개와 설정

Spring Framework ThreadPoolTaskScheduler와 Boot의 spring.task.scheduling.pool.size 기본은 모두 1이다. 한 작업이 블로킹되면 같은 스케줄러의 다른 작업도 밀린다. 다음 두 작업을 같은 빈에 넣어 재현한다(필요한 import: slf4j Logger/LoggerFactory, Spring의 Component/Scheduled).

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.scheduling.annotation.Scheduled;
    import org.springframework.stereotype.Component;

    @Component
    public class SchedulerDemo {
        private static final Logger log = LoggerFactory.getLogger(SchedulerDemo.class);
        @Scheduled(fixedRate = 10_000)
        public void slow() throws InterruptedException {
            log.info("slow start"); Thread.sleep(15_000); log.info("slow end");
        }
        @Scheduled(fixedRate = 5_000)
        public void fast() { log.info("fast tick"); }
    }

독립 작업이 밀리면 DB·외부 API 처리 용량을 확인하고 풀을 늘린다.

    spring:
      task:
        scheduling:
          pool:
            size: 4
          thread-name-prefix: scheduled-
          shutdown:
            await-termination: true
            await-termination-period: 30s

빈으로 구성할 때는 ThreadPoolTaskScheduler를 설정한다(필요한 import: Spring의 Configuration/Bean, ThreadPoolTaskScheduler).

    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

    @Configuration
    public class SchedulingConfig {
        @Bean
        ThreadPoolTaskScheduler taskScheduler() {
            var scheduler = new ThreadPoolTaskScheduler();
            scheduler.setPoolSize(4);
            scheduler.setThreadNamePrefix("scheduled-");
            scheduler.setWaitForTasksToCompleteOnShutdown(true);
            scheduler.setAwaitTerminationSeconds(30);
            return scheduler;
        }
    }

풀을 늘려도 같은 잡의 중복 실행은 막지 않는다. Boot 속성 문서에서 가상 스레드가 활성화된 때 pool.size가 효과 없다고 설명하므로 실제 구현을 확인한다. 기본값과 구현 근거는 참고문헌의 Boot 속성표와 Framework Javadoc을 참조한다.

### 2.4 실패·중복·트랜잭션

반복 작업의 기본 오류 처리기는 예외를 로그로 남기고 다음 반복을 계속한다. 실패 입력 자동 재시도나 누락 회차 복구는 아니다. 재시도는 대상 ID, 시도 횟수, 다음 시각, 오류를 저장하는 업무 로직으로 구현하고 실패 메트릭과 알림을 남긴다.

두 앱 인스턴스는 같은 @Scheduled를 각각 실행한다. 조건부 갱신·유니크 키로 멱등성을 지키고, 겹침을 막아야 하면 공용 DB 잠금(ShedLock), 리더 선출 또는 단일 인스턴스 배포를 선택한다. ShedLock은 다른 노드를 기다리게 하지 않고 skip하며 실행 이력/재생 기능도 없다. lockAtMostFor가 작업보다 짧으면 실행 중 만료되어 중복될 수 있다. Quartz와 CronJob도 멱등성을 대신하지 않는다.

대량 작업은 잡 진입점과 별도 서비스 빈으로 나눈다. 서비스가 키 기반 페이지네이션으로 제한된 청크를 처리하고 각 청크마다 짧게 커밋한다. 마지막 처리 키·상태를 저장하고 실행 건수/시간 상한을 둬 중단과 재실행을 안전하게 한다. 잡 전체에 긴 @Transactional을 걸면 락과 커넥션 점유, 재처리 비용이 커진다.

## 3. 따라 하기

Gradle Kotlin DSL과 Java 25로 주기를 로그에서 확인한다. 이 문서의 Spring 코드 예제는 실행하지 않았다(미실행).

### 1단계: 프로젝트 생성

Spring Initializr에서 Gradle - Kotlin, Java, Boot 4.1.1, Java 25, Spring Boot Starter를 선택한다. 다음 파일을 둔다.

파일 settings.gradle.kts:

    rootProject.name = "scheduling-demo"

파일 build.gradle.kts:

    plugins {
        java
        id("org.springframework.boot") version "4.1.1"
    }

    group = "example"
    version = "0.0.1-SNAPSHOT"

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(25)
        }
    }

    repositories {
        mavenCentral()
    }

    dependencies {
        implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
        implementation("org.springframework.boot:spring-boot-starter")
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

Maven 대응: spring-boot-starter-parent의 버전을 4.1.1로 지정하고 java.version을 25로 둔다. 의존성은 org.springframework.boot:spring-boot-starter를 추가한다. 버전은 부모 BOM이 관리한다.

확인 방법: 프로젝트 루트에서 ./gradlew bootRun을 실행했을 때 빌드가 끝난 뒤 Spring 컨텍스트가 시작되어야 한다. gradlew 래퍼가 없다면 Gradle Wrapper를 생성해 저장소에 포함한다.

### 2단계: 스케줄링과 작업 빈 등록

경로 src/main/java/example/scheduling/SchedulingApplication.java:

    package example.scheduling;

    import org.springframework.boot.SpringApplication;
    import org.springframework.boot.autoconfigure.SpringBootApplication;
    import org.springframework.scheduling.annotation.EnableScheduling;

    @SpringBootApplication
    @EnableScheduling
    public class SchedulingApplication {
        public static void main(String[] args) {
            SpringApplication.run(SchedulingApplication.class, args);
        }
    }

경로 src/main/java/example/scheduling/HousekeepingJob.java:

    package example.scheduling;

    import java.time.Instant;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.scheduling.annotation.Scheduled;
    import org.springframework.stereotype.Component;

    @Component
    public class HousekeepingJob {
        private static final Logger log = LoggerFactory.getLogger(HousekeepingJob.class);

        @Scheduled(fixedDelayString = "PT10S")
        public void fixedDelayExample() {
            log.info("fixed-delay run at {}", Instant.now());
        }

        @Scheduled(cron = "0 */1 * * * *", zone = "Asia/Seoul")
        public void minuteReport() {
            log.info("cron report at {}", Instant.now());
        }
    }

fixedDelayString의 ISO-8601 기간 PT10S는 10초를 뜻한다. 실서비스에서는 간격과 cron을 application.yml로 옮겨 배포 환경에서 조정한다. Instant.now()는 UTC 시각으로 로그에 남으므로 한국 시각 표현이 필요하면 ZonedDateTime.now(ZoneId.of("Asia/Seoul"))를 쓴다.

확인 방법: ./gradlew bootRun 로그에서 10초 간격과 매분 cron 실행을 본다. 앱 종료 시 작업도 멈춘다.

### 3단계: 운영 설정으로 옮기기

경로 src/main/resources/application.yml:

    spring:
      task:
        scheduling:
          pool:
            size: 3
          thread-name-prefix: scheduled-
          shutdown:
            await-termination: true
            await-termination-period: 30s

    jobs:
      cleanup:
        delay: 30s

HousekeepingJob의 fixedDelayExample 메서드를 다음처럼 바꾼다(기존 클래스/import 사용).

    @Scheduled(fixedDelayString = "${jobs.cleanup.delay:PT30S}")
    public void fixedDelayExample() {
        log.info("cleanup run at {}", Instant.now());
    }

한 메서드에는 fixedDelay와 cron 중 하나만 둔다. cron 비활성 값은 -이며, 운영 프로파일에 의도한 주기를 지정한다.

확인 방법: 스레드명과 작업 시각을 본다. 풀 1에서 느린 잡을 실행하면 다른 잡이 밀리고, 풀 3에서는 독립 잡이 진행된다. 중복 방지는 별도다.

### 4단계: 다중 인스턴스 보호 — ShedLock

Gradle에 spring-boot-starter-jdbc와 shedlock-spring, shedlock-provider-jdbc-template을 같은 버전으로 추가하고 JDBC URL/계정 및 DB 드라이버를 설정한다. 현재 ShedLock 버전은 미확인이다. SQL은 PostgreSQL 계열 예시다.

    CREATE TABLE shedlock (
        name       VARCHAR(64)  NOT NULL PRIMARY KEY,
        lock_until TIMESTAMP    NOT NULL,
        locked_at  TIMESTAMP    NOT NULL,
        locked_by  VARCHAR(255) NOT NULL
    );

설정 코드:

    package example.scheduling;

    import javax.sql.DataSource;
    import net.javacrumbs.shedlock.core.LockProvider;
    import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
    import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.jdbc.core.JdbcTemplate;

    @Configuration
    @EnableSchedulerLock(defaultLockAtMostFor = "PT20M")
    public class ClusteredSchedulingConfig {
        @Bean
        LockProvider lockProvider(DataSource dataSource) {
            return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                    .withJdbcTemplate(new JdbcTemplate(dataSource))
                    .usingDbTime()
                    .build()
            );
        }
    }

작업에는 고유한 잠금 이름과 실행 상한을 지정한다. 아래 SettlementService는 기존 업무 서비스 빈이다.

    import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
    import org.springframework.scheduling.annotation.Scheduled;
    import org.springframework.stereotype.Component;

    @Component
    public class DailySettlementJob {
        private final SettlementService settlementService;

        public DailySettlementJob(SettlementService settlementService) {
            this.settlementService = settlementService;
        }

        @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Seoul")
        @SchedulerLock(name = "dailySettlement", lockAtMostFor = "PT20M")
        public void settle() {
            settlementService.runDueSettlement();
        }
    }

@EnableScheduling은 메인 클래스에 이미 있으므로 실제 프로젝트에서는 한 곳에만 선언한다. usingDbTime()은 DB 시간을 잠금 비교에 사용해 각 JVM 시계 차이에 따른 오판 가능성을 줄인다. 작업 최장시간이 20분을 넘지 않는지 확인한다. 더 오래 걸리면 상한과 lease 연장 방식을 검토하고, DB 잠금만으로 외부 시스템의 중복 부작용까지 없어진다고 간주하지 않는다.

확인 방법: JDBC starter·DB 드라이버·공유 datasource와 ShedLock 의존성을 추가한 뒤 두 앱을 같은 DB로 실행한다. 실행 시각에 한 노드만 로그를 남기고 shedlock 행의 lock_until/locked_by가 갱신되는지 확인한다. 의존성 버전은 미확인.

## 4. 치트시트

| 도구/기능 | 용도와 예시 | 주의 |
|---|---|---|
| fixedRate | 시작 간격, fixedRate=60_000 | 장시간 작업은 늦게 이어 실행 |
| fixedDelay | 완료 후 대기, fixedDelayString="PT1M" | 실행 완료 시점부터 잰다 |
| cron + zone | 0 0 2 * * *, Asia/Seoul | Spring은 초 포함 여섯 필드 |
| Boot 풀 | spring.task.scheduling.pool.size=4 | 기본 1, 가상 스레드 모드 확인 |
| ShedLock | @SchedulerLock(name="daily") | skip 동작, 이력/재생 없음 |
| Quartz | JDBC JobStore, 클러스터 | 영속 트리거와 운영 DB 필요 |
| Kubernetes CronJob | schedule, timeZone, concurrencyPolicy=Forbid | 같은 CronJob만 겹침 방지, 정확히 한 번 보장은 아님 |
| Spring Batch / Airflow | Batch는 청크·재시작, Airflow는 DAG 조정 | 각각 실행시점/인프라는 별도 구성 |

기본 추천은 짧고 멱등한 단일 프로세스 작업에 @Scheduled다. 다중 인스턴스에서 겹침만 막으면 ShedLock, 영속 트리거·misfire 복구는 Quartz, 컨테이너 실행은 CronJob을 고른다. 대량 처리엔 Spring Batch를 조합한다.

## 5. 자주 나는 에러와 해결

1. 메서드가 실행되지 않는다 → @EnableScheduling 누락, 빈 미등록, 프로파일/조건 비활성 → 구성·컴포넌트 스캔·cron의 비활성 값(-)을 확인한다.
2. Encountered invalid @Scheduled method → cron 필드 수나 Duration 형식 오류, 메서드 인자 → Spring은 cron 6필드이며 기간은 PT30S 형식으로 지정한다.
3. 두 번 실행된다 → 프로세스 여러 대, 빈 중복, 동일 메서드 반복 등록 → 실행 인스턴스와 빈 목록을 확인하고 멱등성·ShedLock을 적용한다. 프록시 호환 문제를 피하도록 공개 진입 메서드를 권장한다.
4. 다른 작업도 늦는다 → 단일 스케줄러 스레드가 블로킹 작업에 점유 → 실행시간·스레드명을 기록하고 풀/별도 스케줄러를 조정한다.
5. 9시간 차이 → JVM 기본 시간대를 따라감 → cron zone과 로그 ZoneId를 명시하고 DB 시간 정책도 별도 확인한다.
6. 잠금 중 중복 부작용 → datasource 불일치 또는 lockAtMostFor가 작업보다 짧음 → DB 잠금 행과 최장시간을 확인하고 외부 호출에도 멱등키를 둔다.

## 6. 한 단계 더

스케줄러는 시작 시각을 정할 뿐 exactly-once나 업무 성공을 보장하지 않는다. 반복 호출에 안전하도록 멱등키와 조건부 갱신을 두고, 큰 작업은 청크별 트랜잭션과 진행 상태를 기록한다. 실행시간·처리/실패 건수·마지막 성공 시각을 로그·메트릭·알림에 연결한다.

종료 때는 현재 청크에 제한된 시간을 주고, 다음 실행이 이어받을 수 있게 한다. Clock을 서비스에 주입하면 시간 경계 테스트가 결정적이다. 메서드 직접 호출은 잡 로직만 검증하며 예약과 분산 잠금은 통합 검증이 필요하다.

@Async·Batch → S15. 멀티스레드 → W25. 분산 락 → P18. 배포·셧다운 → D06·S19 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. fixedRate와 fixedDelay의 차이는?

fixedRate는 시작 시각 기준, fixedDelay는 완료 후 대기다.
같은 주기 등록은 겹치지 않지만 fixedRate 실행이 밀리면 끝난 직후 다음 회차가 시작할 수 있다.
꼬리질문: fixedDelay 30초, 실행시간 2분이면? 답: 시작 간격은 최소 2분 30초다.

### Q2. Spring cron을 Linux cron에 복사해도 되나?

안 된다. Spring은 초 포함 6필드, Linux는 5필드다.
Quartz는 요일 숫자 규칙도 다르므로 표현식을 다시 검증한다.
꼬리질문: 한국 시간 9시 실행은? 답: zone="Asia/Seoul"을 지정한다.

### Q3. 예외가 난 작업은 자동으로 재시도되나?

아니다. 다음 반복 시각에 메서드가 다시 불릴 뿐 실패 입력 복구는 업무 로직이다.
시도 횟수·다음 시각을 저장해 알리고, 재처리 가능하게 만든다.
꼬리질문: 결제 timeout 결과 불명은? 답: idempotency key와 결과 조정 상태를 저장한다.

### Q4. 기본 풀 크기 1이면 어떤 문제가 있나?

블로킹 작업 하나가 같은 스케줄러의 다른 실행을 지연시킨다.
풀을 늘릴 때 DB와 외부 API의 동시성 한도도 함께 고려한다.
꼬리질문: 풀 크기 증가가 중복 실행을 막나? 답: 아니다.

### Q5. 서버 3대에서 @Scheduled는 어떻게 동작하나?

각 JVM이 일정을 등록해 모든 인스턴스가 실행을 시도한다.
멱등성에 더해 DB 잠금이나 리더 선출이 필요할 수 있다.
꼬리질문: ShedLock이 놓친 회차를 재생하나? 답: 아니다. lock을 못 얻은 실행은 건너뛴다.

### Q6. 대량 작업은 왜 청크 트랜잭션으로 나누나?

락·커넥션 점유와 롤백 범위를 줄인다.
키 기반 진행 위치를 저장하면 중단 뒤 이어서 처리할 수 있다.
꼬리질문: 잡 메서드에 @Transactional을 붙이면 충분한가? 답: 전체가 긴 트랜잭션이 될 수 있으므로 서비스 청크 단위로 나눈다.


## 8. 참고문헌

- Spring Framework Task Execution and Scheduling — https://docs.spring.io/spring-framework/reference/integration/scheduling.html — @Scheduled와 스케줄 활성화.
- Spring Boot Task Execution and Scheduling — https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html — Boot 자동 구성.
- Spring Boot Common Application Properties — https://docs.spring.io/spring-boot/appendix/application-properties/index.html — 풀 기본값 1과 종료 설정.
- CronTrigger Javadoc — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronTrigger.html — cron 실행 기준과 요일 숫자.
- ThreadPoolTaskScheduler Javadoc — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskScheduler.html — 기본 스레드 1개.
- ShedLock README — https://raw.githubusercontent.com/lukas-krecan/ShedLock/master/README.md — 공유 잠금과 skip 동작.
- Kubernetes CronJob — https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/ — 시간대와 동시성 정책.
- Quartz Tutorial Lesson 6 — https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/tutorial-lesson-06.html — JDBC JobStore 클러스터.
