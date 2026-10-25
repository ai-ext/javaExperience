# task7 · S09 독립 감사

판정은 **needs_completion**이다. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`에서 원문304줄 전문·현재9질문/31상태·probe/JSON·현재HTML을 대조했다. 기존 부분 보강의 관측/환경 표시는 대체로 일치하지만 원문 전체 완료는 아니다.

원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md
원문 SHA256: `23e3a001a2afbad0e4234795d9566645e25fffd5ab9f06a82b8f27b8c550d05e`

## spec 검토

의미 단위47개: partial 26, covered 9, unrun 9, missing 3. 수치는 학습 완료율이 아니다. 범위가 제한된 covered도 fresh DB/브라우저 인증을 뜻하지 않는다.

원문4Java파일은 추출 원문과 정확히 일치하고 generated 검사도 기존 원문/역할 화면 보존을 통과했다. 버전표·실무 가이드·안티패턴·Q&A는 HTML에 보존됐지만 상당 부분이 원문 접기 안에만 있고 주제/단계로 풀리지 않았다. 원래 VERIFICATION도 부분 implemented/verified 아님을 명시하므로 이것을 구현 오류로 바꾸어 부르지 않는다.

| 원문 | 연결 stage | 판정·공백 |
|---|---|---|
| L1–17 제목·요약·장애 동기 | cache-find-again, flush-flush, service-closed-lazy, lock-b-failure | partial · 원문 N+1 1+100+100, 전역 EAGER 비용, OSIV 경계·관계 주인/FK를 묶는 시작 장면은 없다. 기존 역할 개요는 s09-legacy 접기 안에 있다. |
| L19–26 JPA·Hibernate·EntityManager 구분 | 없음 | partial · 새 주제 선택에는 역할/엔티티 규약·1차/2차 캐시 구분 장면이 없고 핵심 역할은 legacy 접기 안이다. |
| L27–27 flush 정의 | flush-change, flush-flush, flush-commit, flush-rollback | covered · 범위: 추가 assigned-ID ProbePost native Hibernate/H2. |
| L28–29 관계 주인과 proxy 기본 개념 | service-source-add, service-closed-lazy | partial · owner FK와 mappedBy 반대편만 고친 경우 대조, proxy와 EntityManager 관계 설명은 별도 장면이 없다. |
| L30–30 OSIV 용어와 요청 수명 | 없음 | unrun · 요청 범위 EM와 transaction 수명, 응답 직렬화 SQL·DTO 경계 장면/실행이 필요하다. |
| L31–31 낙관적·비관적 락 개요 | lock-reads, lock-a-commit, lock-b-failure | partial · 비관적 락·경합/대기·교착·선택 기준 장면 및 실행은 없다. |
| L33–42 네 가지 엔티티 상태와 merge 반환 | cache-new, cache-persist, merge-detached, merge-copied, merge-returned-change, remove-scheduled, remove-flushed | covered · 범위: 추가 ProbePost; 모든 persistence-context 종류의 일반 인증은 아니다. |
| L44–50 cascade·orphanRemoval·DB ON DELETE CASCADE | service-source-add | partial · removeLine 고아 삭제, 공유 참조 REMOVE 금지, ORM cascade와 DB cascade 비교 장면·실행이 없다. |
| L51–53 LAZY/EAGER 기본값과 proxy 제약 | fetch-batch, service-closed-lazy | partial · ManyToOne/OneToOne 기본 EAGER·명시 LAZY, final/생성자/bytecode enhancement 제약을 설명하는 장면은 없다. |
| L55–74 find·동일성·dirty checking·동기화 흐름 | cache-find, cache-find-again, flush-change, flush-flush, flush-commit, flush-rollback | covered · 추가 fixture 범위에서 covered; fresh Java/DB 실행 아님. |
| L76–76 AUTO flush 및 IDENTITY 예외 | auto-changed, auto-unrelated, auto-overlap, cache-persist | partial · IDENTITY persist 즉시 INSERT 시점과 assigned-ID 쓰기지연을 나란히 검증한 장면은 없다. 원문 모델 seed SQL은 별도 단계로 보존되지 않았다. |
| L78–82 관계 주인·양방향 helper·enum | service-source-add | partial · 주인만/반대편만/양쪽 변경의 FK 값 대조, orphanRemoval/공유 REMOVE/식별자 불변·EnumType.STRING은 미보강이다. |
| L84–86 N+1 원인·전역 EAGER 회피 | fetch-batch | partial · 원문 모델의 실제 1+N 대조군은 없다. 기존 가정 시뮬레이션을 실측 N+1이라고 표시하지 않는다. |
| L88–88 fetch join·행 증폭 | fetch-join, pagination-api, pagination-memory, pagination-hql, pagination-root | covered · 컬렉션 제한의 정답 판정이나 권고로 승격하지 않는 범위에서 covered. |
| L89–90 EntityGraph·batch fetch | fetch-graph, fetch-batch | covered · 모든 graph/배치 크기/DB에서 동일 SQL 수를 보장하지 않는다. |
| L91–91 DTO projection 선택 | 없음 | missing · 선택할 칼럼·반환 DTO·SQL 범위 비교가 필요하다. |
| L93–95 OSIV 기본값·서비스 DTO 경계 | service-closed-lazy | unrun · 단순 EM close 실험을 OSIV 검증으로 간주하지 않는다. on/off·DTO 해결 흐름 보강 필요. |
| L97–99 예제 환경과 미실행 표시 | service-source-add, fetch-join | partial · Spring 빈/프록시와 Java25/Boot 앱 실행은 미검증; 원문 미실행 문구는 원문 보존 상태다. |
| L101–146 예제1 PurchaseOrder·OrderLine 매핑 | fetch-batch, service-source-add | partial · FK owner 반대편 실패 대조, removeLine orphan SQL, cascade 전파 범위별 결과는 없다. |
| L148–177 예제2 영속 상태 변경과 flush | service-source-add, flush-flush, flush-rollback | partial · 직접 service 실험은 자식 추가이며 scalar dirty UPDATE는 추가 ProbePost다. Spring @Transactional 프록시 종료 커밋 실행으로 일반화할 수 없다. |
| L179–204 예제3 원문 fetch join | fetch-join | covered · readOnly 프록시를 실행한 결과가 아닌 수동 transaction 범위다. |
| L206–206 예제3 후속 페이지/graph 선택 | fetch-graph, pagination-api, pagination-root | partial · 권장 부모ID 페이지→상세 조회와 batch 기반 실제 부모 페이지 해결 예제는 없다. |
| L208–217 버전별 변화·BOM·migration | 없음 | unrun · Hibernate6→7/7.4 API·DDL·JSON·DB별 차이, BOM 업그레이드 diff는 재실행/검증되지 않았다. 현재 웹 검증도 수행하지 않았다. |
| L219–222 가이드 새 persist·managed 변경 | cache-persist, flush-change, flush-flush | covered · assigned-ID fixture 범위. |
| L223–224 가이드 DTO·컬렉션 페이지 설계 | fetch-join, pagination-api | partial · 트랜잭션 안 DTO, ID 페이지 후 상세 조회를 적용한 결과 장면은 없다. |
| L225–225 가이드 cascade/helper | service-source-add | partial · 생명주기 판단과 제한된 cascade/orphan 삭제 범위 비교가 없다. |
| L226–226 가이드 낙관적 락과 재시도 | lock-b-failure | partial · 충돌률/재시도·재조회 정책을 선택하는 장면은 없다. |
| L227–227 가이드 비관적 락 | 없음 | unrun · PESSIMISTIC_WRITE·잠금 순서/timeout·대기/교착 검토와 근거가 필요하다. |
| L228–228 가이드 OSIV false·DTO | 없음 | unrun · false 설정과 서비스 DTO 완성 구조를 구체화할 후속 장면 필요. |
| L229–229 가이드 운영 DDL 마이그레이션 | 없음 | missing · ddl-auto와 Flyway/Liquibase 선택·DDL diff/데이터 변경 검토 장면이 필요하다. |
| L230–230 가이드 Hibernate 업그레이드 | 없음 | unrun · BOM·migration guide·대표 SQL/DDL diff를 비교할 검증이 없다. |
| L232–235 안티패턴 N+1·flush | fetch-batch, flush-flush, flush-rollback | partial · 전역 EAGER 비용·SQL 통계 진단 및 커밋 이후 외부 메시지 처리 장면은 없다. |
| L236–237 안티패턴 관계 주인·공유 REMOVE | service-source-add | partial · 반대편만 변경한 FK 실패 및 공유 엔티티 cascade 삭제 위험 대조가 없다. |
| L238–238 안티패턴 OSIV | 없음 | unrun · 응답 단계 추가 SQL/연결 점유·DTO 해결은 실행되지 않았다. |
| L239–239 안티패턴 detached merge | merge-detached, merge-copied, merge-returned-change | partial · 부분 DTO 통째 merge로 누락 필드 덮어쓰기 위험 대조는 없다. |
| L240–240 안티패턴 collection pagination | pagination-api, pagination-memory, pagination-hql, pagination-root | partial · 부모 ID 페이지/batch 해결 장면이 없고 정확성 검증 대신 관측 일치만 PASS다. |
| L241–241 안티패턴 낙관적 충돌 API 처리 | lock-b-failure | partial · HTTP500/409·재조회·재시도 처리는 미실행이며 장면 없다. |
| L242–242 안티패턴 자동 DDL | 없음 | missing · 운영 migration 적용 전후·데이터 변환/검토 대조 장면 없음. |
| L244–250 Q1 1차 캐시 | cache-find, cache-find-again | covered · 공유 캐시와 혼동하지 않도록 note 보존. |
| L252–256 Q2 dirty checking·flush·제약 오류 | flush-change, flush-flush, auto-overlap | partial · 제약 위반이 persist/flush/commit 어느 시점에서 나는지 실패 사례는 없다. |
| L258–262 Q3 FK 주인 | service-source-add | partial · 반대편만 바꾼 FK 대조값/SQL은 없다. |
| L264–268 Q5 LAZY/N+1·대응 | fetch-batch, fetch-join, fetch-graph, pagination-api | partial · 실측 1+N 대조군/단일값 페이지/부모ID 해결 경로는 없다. |
| L270–274 Q6 OSIV/DTO | service-closed-lazy | unrun · 서비스 DTO 및 OSIV 열린 요청의 transaction 이후 조회를 검증해야 한다. |
| L276–280 Q7 merge와 managed 수정 | merge-copied, merge-returned-change, flush-change | covered · 부분 DTO 덮어쓰기 위험은 원문/별도 범위 공백에 기록했다. |
| L282–286 Q8 낙관/비관 선택 | lock-reads, lock-b-failure | partial · 비관적 락 비용/선택·업무 시간·충돌률/재시도 기준 비교는 없다. |
| L288–292 Q9 Hibernate7 업그레이드 | 없음 | unrun · API/DDL/DB 대표쿼리·7.0과7.4 가이드 대조 실행 없음. |
| L294–304 참고문헌 | 없음 | partial · 이번 감사는 웹/외부CLI를 실행하지 않아 URL 내용·현재 버전 최신성은 재검증하지 않았다. |

## quality 진단

spec 미승인 후 진단만 수행했다. quality 승인을 부여하지 않는다. 현재 구현의 critical/important는 발견하지 못했고 minor1건을 확인했다. 전체 문서 공백은 위 coverage와 후속 작업에 별도로 기록했다.

**S09-Q01 · minor** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:1055. fetch-join의2줄 code에 active `[0,2,3]`이 남아2·3은 무시되고 HQL 주석 줄1은 강조되지 않는다. controller의55줄은 유효 i만 표시하며 새 test:s09는 이 오류를 검출하지 못했다. 의도한 줄로 인덱스를 고치고 모든 active의 범위를 검증한다. 확인: Node로 stage별 `0 <= i < code.split("\n").length`, 이어 test:s09와 메인의 강조 표시 확인.

기술 대조에서 확인한 경계:

- EntityManager API/영속성컨텍스트/Hibernate loadedState를 구분하고 application-managed EM 수명을 transaction 수명과 같다고 일반화하지 않는다.
- assigned-ID ProbePost persist0SQL과 원문 IDENTITY를 note로 분리한다. 원문 IDENTITY의 삽입시점 대조 자체는 공백이다.
- new/managed/detached/removed와 contains/Entry 상태를 나누며 merge 원본/반환객체값·version2를 historical JSON과 대조했다.
- flush 뒤 동일transaction JDBC 새값/독립 READ_COMMITTED observer 옛값, commit 뒤 새값, 별도 rollback DB옛값·Java getter 새값이 일치한다. 닫힌 EM의 false/no-entry는 helper 기본값으로 한정한다.
- 원문 @BatchSize32를 유지한1+1은 실제1+N 재현이 아니다. legacy N+1은 예상값으로 분리한다. fetch SQL1·부모3/자식6과 별도JDBC6행을 wire계측으로 표시하지 않는다.
- 원문 서비스는 수동 transaction의 직접 Java 호출이다. Spring readOnly/프록시·OSIV·HTTP 결과로 승격하지 않는다.
- 추가 pagination max1의 부모3 관측은 일치만 확인하며 원인/수정버전/권장 hint/속도 개선은 미확인으로 유지한다.

## 새 검사와 기존 증거

`npm --prefix tools/site run test:s09` → exit **0**. UTC 2026-10-21T23:47:26.935291+00:00 ~ 2026-10-21T23:47:32.219678+00:00. 원문/HTML/data/controller/renderer/tests/bundle/proof 해시는 실행 전후 동일하다. 이 명령은 JSDOM·생성HTML/bundle·기존61PASS/SQL 연결과 원문보존을 검사하며 Java/DB를 재실행하지 않는다.

- 원시 stdout: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/test-s09.stdout.log
- 원시 stderr: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/test-s09.stderr.log
- 시점·HEAD·명령·해시·exit: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/test-s09.result.json
- 원문Java/고정JSON/이미지헤더 정적 대조: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/static-inspection.json

기존61관측의 execution.json은 frozen expected와 정확히 일치했다. READ_COMMITTED/autocommit observer와 같은transaction JDBC를 나누고 추가 ProbePost/원문 PurchaseOrder를 구분한다. Java/Gradle/DB·현재 웹은 실행하지 않았다.

## 직접 열람한 시각 증거

view_image로 선정 이미지9장을 모두 열었다:

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-cache-v3.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-flush-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-merge-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-remove-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-fetch-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-service-v2.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-lock.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-auto-v3.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/images/S09-pagination-v3.jpg

과거 full-page 캡처18장 중 아래3장을 열었다:

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/desktop-flush.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/mobile-fetch.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/desktop-auto.jpg

flush·fetch·AUTO의 주요값과 observer/추가 seed 라벨이 probe/JSON과 일치했다. 나머지6시안의 상태/값/환경 경계도 대조했다. 모바일 fetch 캡처는 내부 가로이동 영역의 일부를 보이고 번역 확장 overlay가 있다. JPEG 실제 헤더·캔버스를 확인했고 full-page 이미지 크기를 viewport로 오인하지 않았다. 현재 브라우저와 픽셀정밀비교는 미검증이다.

## 남은 작업

- 관계 주인/FK의 반대편만 변경한 실패 대조, orphanRemoval·cascade·DB cascade·공유 REMOVE 차이를 원문 모델로 보강한다.
- IDENTITY vs assigned-ID의 persist/flush SQL 시점, LAZY/EAGER 기본값·proxy 제약과 실제1+N 대조군을 보강한다.
- OSIV on/off와 transaction 종료·DTO 변환·추가SQL 경계를 별도 장면/실행 근거로 다룬다. 현재 closed-EM 실패와 구분한다.
- 부모ID 페이지 후 상세조회/batch 해결, DTO projection, 낙관적 충돌 API 응답·재시도와 비관적 잠금 선택 기준을 보강한다.
- BOM/API/DDL/대표SQL 업그레이드 대조와 운영 migration 지침/안티패턴을 보강한다.
- minor S09-Q01의 active 인덱스를 수정하고 회귀 검증한다.
- 메인이 현재 desktop/mobile에서 주제·단계·확대·가로이동·copy·원문·overflow를 확인한다. 수정 후 spec→quality 독립 재검토한다.

## 제한

- 이번 감사에서 브라우저·Java/DB 실험·Docker·외부 웹/CLI·LLM/추가 agent를 실행하지 않았다.
- 61PASS·H2 관측은2026-10-20의 기존 증거이며 fresh npm은 JSON/SQL/값 연결·원문보존·JSDOM/controller/bundle을 검증한다.
- 선정9이미지는 모두 직접 열람했지만 과거 캡처는18장 중3장만 직접 열람했다. 전체 픽셀 일치나 현재 브라우저 동작·학습자 이해는 미검증이다.
- OSIV·Spring proxy·HTTP·MySQL·JDK25·비관적락·다른Hibernate버전 runtime은 기존 증거에도 없다.
- 7.4.13 온라인 문서 언급은 기존 기록의 확인 시점을 따른다. 이번 감사에서 현재 웹 상태를 검증하지 않았다.

판정: needs_completion
fullDocumentComplete: false
커버리지: 47단위 / partial=26, covered=9, unrun=9, missing=3
이슈수: critical=0 / important=0 / minor=1 (현재 구현); 전체 범위 공백 별도
exit: test:s09=0
