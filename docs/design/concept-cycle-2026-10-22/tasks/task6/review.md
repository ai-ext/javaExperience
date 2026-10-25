# task6 · P20 독립 감사

판정은 **needs_completion**이다. 기존21상태에서 재현 가능한 critical/important/minor 구현 결함은 이번 범위에서 발견하지 않았지만, 원문 전체는 의미 단위 50개 중 covered 18 / partial 17 / missing 12 / unrun 3이다. 원문 접기 안에 텍스트를 보존한 것과 장면·기술 근거로 보강한 것은 구분했다.

검토 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 원문 SHA256: `6cd8b34253f33255e8c7ec5608f07c382d3fe020b049182bfa0bc536dabdd125`. 원문386줄 전문을 읽고 data/controller/renderer/tests·현재생성HTML·기존 VERIFICATION/source-proof와 대조했다.

새 명령 `npm --prefix tools/site run test:p20`는 UTC 2026-10-21T23:44:08.160892+00:00 ~ 2026-10-21T23:44:12.750469+00:00에 **exit 0**. Node/JSDOM과 생성HTML에서 8질문/21상태·8JPG·과거27PASS/SQL 연결 및 원문13279자/code13/id25·기존map/generic 보존 검사를 통과했다. 이 명령은 Java나 DB를 실행하지 않는다. 원시 출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/test-p20.raw.txt. UTC·HEAD·15개 입력 SHA·변경 여부·rawSHA: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/test-p20.meta.json.

## spec: 범위와 근거

전수 대응: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/source-coverage.json. `sourceLines`는 start,end 쌍, `stageIds`는 실제 stage 식별자다. covered도 명시한 역사 증거 범위의 대응이며 오늘의 DB 재실행이나 학습자 이해 인증이 아니다.

| 원문 단위 | 줄 | stage | 판정 | 남은 범위 |
|---|---|---|---|---|
| P20-C01 도입·§1 Entity/DTO 전체 계약 | 3,9 | compile-original, dto-copy, dto-after-close | partial | non-final, 무인자 생성자, non-final persistent 멤버와 field access를 하나의 최소 엔티티로 읽는 전용 장면 없음. |
| P20-C02 §2.1 non-final/생성자/field access | 13,15 | compile-original | partial | 현재 compile 장면은 LineStatus 접근 오류를 다룬다. Entity 생성자·non-final·field access 계약의 사례/검증은 없음. |
| P20-C03 §2.1 Table 이름·naming strategy | 17,17 | mapping-columns | partial | @Table 생략/명시 비교, naming strategy에 따른 실제 이름 차이 장면 없음. |
| P20-C04 §2.1 nullable 선언과 실제 DDL | 17,17 | mapping-columns | covered | H2 추가 실험 범위에서 covered. 원문 MySQL DDL은 별도 unrun 항목. |
| P20-C05 §2.2 IDENTITY INSERT 시점 | 21,23,42,42 | identity-new, identity-persist, identity-flush, identity-commit | covered | 이 추가 H2 fixture의 관측이며 모든 provider·키전략·SQL 순서의 보장으로 일반화하지 않음. |
| P20-C06 §2.2 SEQUENCE·allocationSize | 25,27,42,42 | 없음 | missing | DB sequence 값 획득, allocationSize=50과 INSERT의 분리 장면·근거 필요. |
| P20-C07 §2.2 AUTO 선택과 운영 DDL | 42,42 | 없음 | missing | AUTO 위임과 명시 전략 선택을 비교하는 장면/확인 지점 없음. |
| P20-C08 §2.2 BigDecimal·precision/scale | 29,30 | mapping-columns | covered | double 사용 시 비교/금액 정책 실험은 원문에 필수 실행으로 제시되지 않았으며 추가하지 않음. |
| P20-C09 §2.2 LocalDate/LocalDateTime·Lob | 31,39 | 없음 | missing | 날짜·Lob 타입의 매핑 사례와 차이 설명 장면 없음. |
| P20-C10 §2.2 Enum STRING 명시·기본값 예외 | 34,36,44,44 | mapping-enum | covered | 현재 explicit STRING 사례의 저장값 covered. ORDINAL 순서 변경/이름 변경은 별도 공백. |
| P20-C11 §2.2 ORDINAL 순서 변경 위험 | 44,44 | mapping-enum | partial | 상수 삽입 전/후 기존 숫자의 의미 변화 비교 없음. |
| P20-C12 §2.2 JSON 문자열 검증·Hibernate JSON | 44,44 | 없음 | missing | 문자열+검증과 @JdbcTypeCode(SqlTypes.JSON)의 선택·값 사례 없음. 실행하지 않은 JSON mapping을 실측으로 표시하면 안 됨. |
| P20-C13 §2.3 감사 설정·사용자/날짜 분리 | 46,48 | mapping-audit | covered | 원문의 상수 사용자 관측이며 인증 사용자 실측 아님. |
| P20-C14 §2.4 주인·mappedBy Java 필드명 | 50,62,74,74 | inverse-memory, inverse-reject, mapping-columns | covered | 원문 L52의 order_line 표기는 §3.3 실제 @Table(name="order_lines") 기준으로 설명함. DB NOT NULL 예외 실행과는 구분. |
| P20-C15 §2.4 add/remove 양쪽 참조 갱신 | 64,74 | ownership-add, ownership-remove | covered | 순수 Java 참조 변경이다. helper detach()를 EntityManager.detach와 같은 연산으로 설명하지 않음. |
| P20-C16 §2.4 컬렉션 setter·관계 카디널리티 | 59,74 | ownership-add, ownership-remove, inverse-memory | partial | 1:N에서 부모 0..N 자식과 각 자식의 필수 부모1을 여러 행·객체로 비교하지 않음. 단일 예제로 관계가 1:1이라는 오류 주장은 없으나 전체 전달 미완료. |
| P20-C17 §2.5 JPA cascade와 DB cascade | 76,78 | identity-persist, orphan-flush, mapping-columns | covered | PERSIST와 managed orphan 삭제의 사례에 한정. CascadeType.ALL의 모든 연산을 실행했다고 보지 않음. |
| P20-C18 §2.5 orphanRemoval 종속 생명주기 | 78,78 | orphan-memory, orphan-flush, orphan-commit | covered | managed 사례 covered. new/detached/already removed 제외는 문헌 설명이고 실행하지 않았다는 경계를 명시함. |
| P20-C19 §2.5 다대다 중간 엔티티 | 80,80 | 없음 | missing | 수량·가격·생성일이 있는 중간 엔티티로 바꾸는 관계/행 사례 없음. |
| P20-C20 §2.6 LAZY 기본값·선택 조회 | 80,82 | dto-copy, dto-after-close | partial | ManyToOne/OneToOne EAGER 기본값, collection LAZY와 실제 SELECT 시점 비교 없음. 추가 DTO 실험을 LAZY 실행 증거로 볼 수 없음. |
| P20-C21 §2.6 @Data·equals/hashCode/toString | 84,84 | 없음 | missing | 연관 순회·순환·proxy·generated ID null/hash 안정성의 사례/선택 장면 없음. |
| P20-C22 §2.6 DTO 응답 경계 | 86,86 | dto-copy, dto-after-close | covered | 직접 entity 직렬화 실패를 재현한 것이 아니며 DTO 결과만 covered. |
| P20-C23 §3/3.1 원문 MySQL·Docker 환경 | 88,119 | 없음 | unrun | mysql healthy/shop 확인·Docker 명령의 원문 환경 실행 없음. 감사에서 DB/Java 재실행 금지이므로 메인 계획으로 넘김. |
| P20-C24 §3.2 Gradle/Maven·Java25·datasource | 121,163 | 없음 | unrun | 원문 Gradle/Maven/Java25/MySQL 설정으로 컴파일·구동 검증하지 않음. 현재 검사는 JSDOM이고 앱 build가 아님. |
| P20-C25 §3.2 create 학습용·운영 validate/DDL 확인 | 165,165 | mapping-columns | partial | 학습 create와 운영 migration/validate 선택 설명 장면 없음; MySQL DDL 미확인. |
| P20-C26 §3.3 ShopApplication 감사 설정 | 169,187 | mapping-audit | covered | Spring HTTP 앱 전체 실행으로 승격하지 않음. |
| P20-C27 §3.3 BaseEntity 공통 매핑 | 189,205 | mapping-audit | partial | 공통 컬럼이 Order에 상속되고 OrderLine에는 없는 것은 그림에 있으나 BaseEntity 자체 테이블 부재 metadata·수정 시 updated 필드 변화는 별도 실행 검증 없음. |
| P20-C28 §3.3 Order ID·컬렉션·편의 메서드 | 207,229 | identity-new, identity-persist, ownership-add, ownership-remove, orphan-memory | covered | 한 자식의 생성/제거·persist 경로 covered. 대량 자식/페이지 선택은 별도 공백. |
| P20-C29 §3.3 OrderLine 기본열·FK·quantity | 231,259 | ownership-quantity, mapping-columns, mapping-enum, inverse-reject | covered | NULL parent는 Hibernate가 child INSERT 전에 거부한 사례. DB null FK가 저장되었다고 주장하지 않음. |
| P20-C30 §3.3 OrderResponse·LineStatus 접근성 | 261,278 | compile-original, compile-corrected, dto-copy, dto-after-close | covered | 원문 그대로 성공이 아니라 실패 원인과 별도 교정 범위가 covered. 이 감사에서는 javac 재실행하지 않음. |
| P20-C31 §3.3 Controller·curl·MySQL FK 확인 | 280,303 | dto-copy | unrun | POST /orders·원문 Controller 메서드·MySQL select 결과 없음. DTO JSON을 HTTP 결과로 대체할 수 없음. |
| P20-C32 §3.4 순수 Java stdout | 305,312 | ownership-add, ownership-remove | covered | 기존 순수 Java 실행 증거와 현재 표시 일치. 이번 감사에서는 Java를 다시 실행하지 않음. |
| P20-C33 §4 치트시트 Entity~ManyToOne | 314,323 | identity-persist, mapping-columns, compile-original | partial | @Entity/non-final/생성자·@Table·AUTO를 설명하는 신규 장면은 미완료. 오기 원문 자체는 보존 정책에 따라 남음. |
| P20-C34 §4 치트시트 OneToMany~DTO | 324,330 | inverse-memory, orphan-flush, mapping-enum, mapping-audit, dto-copy | partial | 실행된 cascade 연산은 한정되어 있고 MappedSuperclass 공통 테이블·전체 Auditing 변경 동작 검증은 미완료. |
| P20-C35 §5-1 LAZY collection no Session | 334,334 | 없음 | missing | 닫힌 세션의 미초기화 collection 접근과 transaction 안 DTO 해결을 같은 입력으로 비교하는 장면/실행 증거 필요. |
| P20-C36 §5-2 detached proxy getter | 335,335 | 없음 | missing | Order#1 프록시 초기화 전/후와 no Session 실패 장면·근거 없음. |
| P20-C37 §5-3 detached entity passed to persist | 336,336 | 없음 | missing | 새 객체/managed/detached 식별 및 persist 실패→aggregate 조회 변경 비교 없음. |
| P20-C38 §5-4 unsaved transient parent | 337,337 | inverse-reject | partial | null owner 실패와 별개의 unsaved transient parent 참조 TransientPropertyValueException은 미재현. 현재 null-owner 장면은 이를 실행했다고 주장하지 않음. |
| P20-C39 §5-5 JSON 양방향 무한 순환 | 338,338 | dto-copy | partial | 양방향 entity를 직접 직렬화하여 Infinite recursion을 재현한 것이 아님. 원인 그래프와 DTO 비교 장면 필요. |
| P20-C40 §5-6 DataIntegrity/null FK | 339,339 | inverse-memory, inverse-reject, mapping-columns | partial | DB DataIntegrityViolationException 또는 Column order_id cannot be null의 실제 경로는 미재현. 같은 오류로 섞으면 안 됨. |
| P20-C41 §6 owning field와 inverse collection | 341,343 | inverse-memory, inverse-reject | covered | 현재 원문 public getLines는 수정불가 복사본이므로 별도 reflection fixture라고 명시한 점 확인. |
| P20-C42 §6 큰 자식 목록·페이지 조회·연결문서 | 343,343 | 없음 | missing | 대량 자식에서 단방향 ManyToOne+조건/페이지 조회를 고르는 예시 장면 없음. 성능 측정은 새로 주장하지 않음. |
| P20-C43 §7 Q1 mappedBy | 347,349 | inverse-memory, inverse-reject | covered | FK owner null 실패를 JPA 상태 오류로 분리하며 mappedBy만 변경한 잘못된 그래프가 주된 사례. |
| P20-C44 §7 Q2 LAZY와 추가 SQL | 351,353 | dto-copy, dto-after-close | partial | EAGER/LAZY 조회 범위·N+1 가능성을 실제 SELECT 관찰로 연결하지 못함. |
| P20-C45 §7 Q3 cascade/orphanRemoval | 355,357 | identity-persist, orphan-memory, orphan-flush, orphan-commit, mapping-columns | covered | 전체 cascade enum 연산 전수 실행을 뜻하지 않음. |
| P20-C46 §7 Q4 ORDINAL·이름 변경 | 359,361 | mapping-enum | partial | 상수 순서 삽입·이름 변경 시 데이터 이행 사례 없음. |
| P20-C47 §7 Q5 @Data·generated ID hash | 363,365 | 없음 | missing | equals/hashCode/toString의 순회와 hash 안정성 비교 장면·실행 없음. |
| P20-C48 §7 Q6 DTO·JsonIgnore 선택 | 367,369 | dto-copy, dto-after-close | partial | API 계약/조회범위 분리 효과는 설명하지만 entity 직접반환·JsonIgnore의 장기 경계 비교 없음. |
| P20-C49 §7 Q7 ManyToOne만 두는 경우 | 371,373 | 없음 | missing | 부모 컬렉션·child 조건 조회/페이지네이션 선택을 구체 데이터로 비교하지 않음. |
| P20-C50 §8 참고문헌 | 375,386 | 없음 | partial | 이번 감사는 외부 web 금지로 현재 문헌 URL/변경 내용을 새로 열지 않음. 과거 문헌 확인을 오늘의 웹 검증으로 표시하지 않음. |

추가 실험의 rollback2상태와 observer 경계는 source-coverage.json의 additionalScopeCoverage로도 별도 기록했다. 원문에 없는 실험을 원문의 실행 성공으로 대체하지 않는다.

원문6Java 추출본은 원문 코드와 모두 일치했고 corrected DTO는 정확히 `l.getStatus().name()` → `String.valueOf(l.getStatus())` 한 식 차이였다. 원문 접근성 compile 실패와 치트시트 무인자 생성자 오기는 화면에서 별도로 안내한다. L80의 literal `\n\n` 때문에 §2.6 heading이 되지 않는 원문 형식 문제도 기록했고, LAZY/객체계약 내용은 coverage에서 누락하지 않았다. 기존 원문 결함을 새 구현 결함 수에 섞지 않았다.

## quality: 승인 전 진단

spec는 원문 전체에서 통과하지 않았으므로 quality는 **diagnostic_only**이며 승인하지 않았다. 발견 결함 배열은 비어 있다. 현재21상태를 완전무결하다고 인증하는 뜻이 아니다.

- FK/owner: `ORDER_LINES.ORDER_ID → ORDERS.ID`, FK 주인 `OrderLine.order`, `mappedBy="order"`는 Java 필드명이다. inverse-only 실패는 원문 getter 복사본을 우회한 reflection probe이고, Hibernate PropertyValueException 뒤 child INSERT가 없었다. DB null FK 행이 저장되었다는 주장이 없다.
- 카디널리티: 코드의 Order 1:N OrderLine과 `optional=false`/NOT NULL은 맞다. 하나의 child 사례만 보여 여러 자식/부모0..N과 자식별 필수부모1의 전달은 partial이다.
- IDENTITY: 기존 H2에서는 persist 중 부모/자식 INSERT2와 id1/1. explicit flush와 commit의 추가 SQL문0은 이 fixture 조건이며 commit 작업량0이 아니다. 같은 transaction JDBC와 별도 READ_COMMITTED autocommit observer가 구분된다.
- rollback/orphan: id2 rolled는 id1 commit 뒤 별도 transaction이다. managed orphan은 메모리 관계 제거→flush DELETE 후 내부0/외부1→commit child0/parent1이다. JPA 삭제와 DB cascade는 별개이며 new/detached/removed 제외조건은 미실행으로 표시한다.
- LAZY/DTO: DTO는 just-persisted managed 객체에서 복사했으므로 지연 로딩 조회나 예외 재현을 증명하지 않는다. close 뒤 같은 DTO JSON을 확인한 것과 detached entity 직렬화는 다르다. 현재 화면도 이 차이를 명시한다.
- 접근성/동작: fresh JSDOM에서 keyboard/Enter·끝포커스·copy fallback·history 외부상태 보존·원문앵커·zoom/resize 증거열림·모바일 step 처리는 통과했다. 현재 브라우저·보조기술·픽셀 검증은 하지 않았다.

## 직접 열람한 이미지와 캡처

아래 선택8장과 과거캡처3장을 실제 `view_image`로 열었다. 선택8장 JPEG magic `ffd8ff`, 실제1672×941 및 manifest SHA 일치를 새로 검사했다.

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-compile-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-ownership-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-inverse-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-identity-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-rollback-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-orphan-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-mapping-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/images/P20-dto-v3.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/desktop-identity.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/mobile-dto.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/desktop-orphan.jpg

identity·rollback·orphan 값과 DTO v3 entity LineStatus/DTO String 구분을 읽고 기존 JSON/Java에 대조했다. 과거 mobile DTO의 가로로 긴 JSON은 확대/pan 영역에 있고 DOM에 전체 값이 있다. Translate overlay는 당시 확장 표시로 분리한다. 과거 full-page 이미지는1672×2355/360×2578/1672×2303이며 현재 viewport가 아니다. 새 실브라우저 조작을 대신하지 않는다.

## 남은 관문과 산출물

- SEQUENCE/AUTO·JSON·다대다 중간 엔티티·@Data/equality·LAZY/no Session·detached persist·대규모 child 페이지 선택 등 원문 누락 의미 단위를 작은 장면으로 보강하고 각 실제 근거를 연결.
- 최소 엔티티 계약·명명 전략·1:N 카디널리티·날짜/Lob·ORDINAL 변경·공통 매핑·예외 원인 차이·DTO 선택의 부분 공백을 보강. 기존 오류와 새 기능을 혼동하지 않음.
- MySQL/Java25/HTTP/Docker 원문 경로를 실행할지 메인이 범위를 정하고, 실행하지 않으면 미실행으로 유지. 이 감사에서 DB를 조작하지 않음.
- 메인이 현재 preview desktop/mobile에서 선택·단계·copy·zoom/pan·원문·overflow를 확인하고 현재 JPG 및 viewport 증거를 별도 기록. 구현 수정 시 fresh spec→quality 재검토 필요.

기계 판정: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/review.json. fresh 정적 소스·JPEG 증거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/static-evidence.json. application·원문·기존증거·장부·Git·다른task는 수정하지 않았다. reviewer는 브라우저/DB·Java 재실행/외부 web·CLI/agent 호출을 하지 않았다.

판정: needs_completion
커버리지: 50단위 · covered 18 / partial 17 / missing 12 / unrun 3
이슈 수: critical 0 / important 0 / minor 0 (quality 진단 범위)
actual exit: 0 (npm --prefix tools/site run test:p20)
fullDocumentComplete: false
