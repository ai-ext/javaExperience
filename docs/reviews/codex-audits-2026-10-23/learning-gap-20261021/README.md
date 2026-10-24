# javaExperience 학습 공백 감사

확인일: **2026-10-21 KST**.

**결론: 개념 자료를 대량으로 새로 만드는 것보다, 현재 학습자의 코드에서 출발해 Service·관계·트랜잭션을 스스로 설계하는 중간 과제를 연결하는 일이 우선이다.** IoC/DI와 JPA·트랜잭션 설명, 여러 실행 실험은 이미 존재한다. 이를 없는 것으로 취급하면 기존 작업을 중복하게 된다.

개념 **27개**, 기능 구현 **18개**, 합계 **45개 주제를 각각 파일로 검토**했다. 공식 근거 **35개**를 별도로 대조했고, 학습자 코드 두 버전과 좋아요 정답 코드를 일회용 MySQL에서 실행했다. 모든 판단은 자료의 커버리지·정확성·실습 연결에 대한 것이다. 사용자의 연차나 개인 실력을 점수로 매기지 않았다.

## 읽는 순서

1. 이 보고서: 무엇이 충분하고 무엇을 먼저 보완할지.
2. $USER_HOME/research/javaexperience-learning-gap-audit-20261021/COVERAGE.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/COVERAGE.md`): 45개 항목 전체와 개별 파일.
3. $USER_HOME/research/javaexperience-learning-gap-audit-20261021/IMPLEMENTATION-ROADMAP.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/IMPLEMENTATION-ROADMAP.md`): 실제로 추가할 과제와 합격 조건.
4. $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md`): 공식 기술 근거·버전·한계.

각 개별 감사 파일에는 검사 기준, 읽은 파일·라인, 이미 있는 내용, 부족한 연결, 추가할 과제, 기대 상태, 한계가 있다.

## 현재 코드 버전을 구분해야 한다

감사 시작 시 main과 개념/CRUD/공통 원본의 추가 worktree 3개가 있었다. 도중에 다른 작업이 만든 `$WORKTREE_ROOT/common-learning-foundation`이 추가됐다. 이 새 기반의 학습자 소스도 읽고 실행해 결과를 갱신했다.

- **초기 main**: DTO→Entity→save는 이미 구현돼 있었다. `Boolean heart`의 null 언박싱으로 저장 후 목록 변환이 실패했다.
- **새 common 기반**: 태그 `@OneToMany`와 `TagsEntity`, 태그 저장 로직이 이미 추가됐고 `heart`가 primitive `boolean`이어서 앞의 null 원인은 해소됐다.
- 따라서 “Service가 전부 비어 있다”, “관계 매핑을 전혀 하지 않았다”, “현재 모든 버전의 목록이 null로 실패한다”는 결론은 사용하지 않는다.
- 새 기반의 문서·시나리오 원문과 snapshot은 검토한 기존 작업 중 하나와 동일했다. 학습자 소스는 달라 별도 재검증했다.

기준 파일·SHA와 추가 대조:

- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/baseline.json (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/baseline.json`)
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json`)

## 이미 있는 내용을 인정한 판정

| 영역 | 이미 있는 것 | 남는 일 |
|---|---|---|
| IoC·DI·Bean | P12/S01과 레슨에 생성자 주입, 후보 선택, scope, 생명주기 설명 | 본인 Controller/Service/Repository를 대상으로 조립·오류 진단 |
| singleton·AOP | 요청 상태 공유 위험과 self-invocation 실패 비교 | 별도 새 개념 문서보다 기존 실험 연결 |
| EntityManager·영속 상태 | S09의 persist/merge/flush/clear 등 추가 실험 | 주입된 EM 프록시와 실제 요청/tx별 컨텍스트의 구분 |
| flush·commit·rollback | S08/S09/W11의 원자성·전파·상태 전후 실험 | 게시글/태그/좋아요의 실패 지점으로 옮기는 과제 |
| readOnly | H2 JDBC, MySQL DML, Hibernate 변경 감지의 서로 다른 관찰 | annotation import와 환경별 결과를 한 판단표로 연결 |
| 1:N/FK 주인 | P20/E4에 주인·inverse-only 실패·helper 설명과 관측 | 현재 태그 모델과 공유 태그 N:M의 업무 차이를 결정 |
| CRUD Service | 최신 functional 화면에 5개 Service 과제와 상태 비교 | 제공된 helper/Repository를 점차 걷어 내 직접 설계 |
| 테스트 | mock/JPA/Testcontainers/실제 HTTP의 차이와 함정 | 실제 checkout에서 실행 가능한 진입점, 학습자 기능 테스트 |

기존 실행기록은 이번에 새로 실행한 결과와 구분했다. 학습 모델/H2 실험이 있다는 사실을 학습자 게시판/MySQL 구현이 완성됐다는 뜻으로 해석하지 않았다.

## 우선 보완할 공백

### 1. DTO에서 Service 설계로 넘어가는 중간 단계

현재 학습자 코드는 DTO 필드로 Entity를 만들고 저장한다. 완성된 시나리오는 게시판·회원·태그·권한·발행 상태·응답까지 처리한다. 둘 사이에 다음 과정을 직접 써 보는 과제가 부족하다.

1. 각 입력의 출처: 요청, 인증 사용자, 기존 DB, 서버 생성값.
2. 어떤 행을 먼저 조회하고 없으면 무엇을 반환할지.
3. 형식 검증과 업무 거절을 어디에 둘지.
4. 어느 객체의 상태를 어떤 메서드로 바꿀지.
5. 여러 쓰기를 어느 한 트랜잭션으로 묶을지.
6. 성공·실패 후 DB 행과 응답이 각각 무엇이어야 할지.

필요한 것은 긴 정답 추가가 아니라 **설계표 → 의사코드 → 작은 구현 → 실패 시험 → 다른 기능으로 전이**다. I01/I02/I03/I14/I15에 구체 과제와 합격 조건을 남겼다.

### 2. 어노테이션 암기에서 데이터 모델 결정으로

최신 코드의 태그 1:N은 유효한 매핑 방식일 수 있다. 그러나 “글에 종속된 태그 문자열”과 “여러 글이 공유하는 태그 엔티티”는 다른 요구다.

- 종속 값/행이면 소유·삭제 수명을 정의한다.
- 공유 태그이면 `tag`와 `post_tag`를 분리하고 기존 이름 재사용·유일 제약·경쟁을 다룬다.
- `mappedBy`, FK 주인, cascade, orphanRemoval은 그 업무 결정을 구현하는 수단이다.

좋아요도 Boolean 하나를 고치는 과제에서 끝내면 안 된다. 회원 A/B가 같은 글을 좋아요하고 A만 취소하는 전후 상태를 관계 행으로 모델링해야 한다. I08/I10/I12/I16에 연결했다.

### 3. 트랜잭션을 본인의 코드에서 관찰하는 과제

현재 학습자 Service는 `jakarta.transaction.Transactional`을 사용한다. 이 선택 자체는 잘못이 아니며 실제 rollback도 확인했다. 하지만 여기에 Spring annotation의 `readOnly`나 `rollbackFor`를 그대로 추가할 수는 없다.

“어노테이션 이름”보다 완전한 import, 프록시 호출, 전파, 예외 종류, flush 시점, 새 연결의 관찰을 함께 확인해야 한다. C09~C16 및 I02/I09에 환경별 합격 조건을 남겼다.

### 4. 테스트의 통과 범위

학습자 프로젝트의 기존 테스트는 `/hello` 한 건이다. 전체 컨텍스트가 뜨고 이 테스트가 통과해도 태그 있는 생성, 응답 DTO 변환, 중복 좋아요, 실패 원복이 맞다는 증거는 없다.

또한 V01/V03/V04 등에서 안내하는 저장소 내 `practice/starter`가 검토한 checkout들에 없다. 외부 연구 폴더의 프로젝트/보강 fixture가 실행된 기록은 있지만, 새로 받은 학습자가 같은 명령으로 시작할 경로가 명확하지 않다. 이 문제는 C21/C22/C23에 각각 기록했다.

## 먼저 고칠 기술 설명과 재현 가능한 충돌

| 항목 | 확인한 문제 | 판정 근거 |
|---|---|---|
| P20 Entity 치트시트 | `final·무인자 생성자 금지`는 무인자 생성자 요구와 반대 | 원문 318행 + Jakarta Persistence3.2 |
| P20 DTO 원문 | package-private enum을 다른 패키지 DTO에서 사용하는 컴파일 차단점 | 최신 보강은 교정 fixture를 이미 설명하지만 원문과 실행 경로가 갈림 |
| E1 계층 설명 | 저장소가 Service를 호출한다는 이유만으로 반드시 기동 실패라고 설명 | 설계 방향과 실제 순환 의존 그래프를 혼동 |
| 좋아요 TransactionTemplate | 항상 새 트랜잭션이라고 설명 | 기본 REQUIRED + 이번 외부 tx rollback 실측 |
| 좋아요 동시 테스트 주석 | 테스트 @Transactional이 모든 worker에 공유된다고 설명 | Spring thread-bound 계약과 다름 |
| 파생 DELETE 반환값 | native SQL 삭제 영향행수와 같은 의미처럼 읽힘 | Spring Data JPA4.1.1 구현은 대상 목록 크기 반환 |
| `INSERT IGNORE` | 0행 결과를 기존 좋아요 존재로만 단정 | MySQL은 중복 외 일부 오류도 warning으로 처리 |
| 최신 태그 Entity/seed | `tag.title` INSERT와 기존 `tag.name NOT NULL` 충돌 | 이번 일회용 MySQL에서 실제 실패·rollback 확인 |
| 최신 DTO 조회 경계 | HTTP 요청 밖의 Entity→DTO에서 LAZY 컬렉션 접근 실패 | 이번 실제 `LazyInitializationException` |
| 오류 응답 | 짧은 제목에 HTTP200/본문401, 광범위 IllegalArgumentException→404 | 실제 HTTP 계층 관찰 + 최신 handler 코드 |

이는 모두 같은 종류의 버그가 아니다. 문장 오류, 재현 경로 문제, 선언된 DB와 학습자 코드의 불일치, 아직 필요한 업무 정책을 구별했다.

## 이번 실행 결과

| 실행 범위 | 결과 |
|---|---|
| 초기 main 복사본 | 기존1 + 관찰6 통과. null NPE·HTTP/본문 상태 차이도 **재현 성공** |
| 최신 common 복사본 | 기존1 + 관찰4 통과. 태그 스키마 충돌·OSIV 밖 LAZY 예외도 **재현 성공** |
| 4-2 원본 동시 PUT | 기존 테스트2 통과 |
| 동일회원5 동시 DELETE, 20라운드 | 총100 Service 호출 정상 반환. 매번 관계행0·count0 |
| 4-2 외부 tx 안에서 좋아요 후 예외 | 관계행0·count0. 기존 tx 참여 확인 |

**관찰 테스트가 통과했다는 것은 전체 기능이 정상이라는 뜻이 아니다.** 예상한 문제를 재현하는 테스트도 통과로 집계된다. 좋아요 동시 DELETE 숫자 깨짐은 이번에 재현되지 않았으므로 결함으로 단정하지 않았다.

실행 근거:

- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md`)
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/02-LIKE-CONCURRENCY.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/02-LIKE-CONCURRENCY.md`)
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md`)

## 범위와 한계

- “3~6년차”에 대응하는 공인 필수 목록은 사용하지 않았다. Java/Spring/JPA/SQL을 사용해 이 프로젝트의 업무를 독립적으로 설계·구현·검증하는 역량을 기준으로 했다.
- 45개 주제 감사는 이 요청의 핵심 개념과 기능 경로를 다룬다. 모든 배포·클라우드·메시징 기술 또는 저장소의 134개 공부자료 전부를 개별 완주 검증했다는 뜻이 아니다. 이벤트/outbox 등은 기본 업무 다음 단계로 분리했다.
- 이번 목표는 공백의 분석·검증과 항목별 기록이다. 제안한 보완 과제와 정답 코드를 제품에 구현하거나 학습자의 코드를 대신 완성하지 않았다.
- 실제 학습자가 정답 없이 과제를 해결하는지 관찰한 것은 아니다. 파일별 합격 기준으로 후속 수행평가를 할 수 있다.
- 새 화면의 브라우저/모바일/UI 사용성 시험은 하지 않았다. 생성 HTML과 보강 소스는 정적으로 대조했다.
- 모든 runtime은 원본의 별도 복사본과 일회용 DB를 사용했다. 실제 개발 DB의 스키마·정상 여부는 미확인이다.
- 원본 저장소·학습 코드·진행 중인 worktree를 수정하거나 merge/push하지 않았다. 다른 작업의 동시 변경은 시각과 해시로 구분했다.
