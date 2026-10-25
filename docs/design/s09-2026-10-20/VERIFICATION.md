# S09 JPA·Hibernate 개념 보강 검증

2026-10-20. 원문 전체 304줄과 원문 Java 4블록, 기존 역할 화면·Post42 예상 흐름을 읽고 9질문·31상태를 추가했다. 실제 image_gen 20장 중 교정한 9장을 선택하고 11장은 drafts에 보존했다. 기존 원문·설명용 시뮬레이션과 추가 실측은 서로 구분한다. 모든 원문 세부 주제의 완료를 뜻하지 않는다.

## 실행 근거

`source-proof/verify-source.py` 재실행은 원문4파일 SHA와 전체 frozen `expected-current-execution.json`, 의존성 SHA, Hibernate 7.4.5.Final/H2 2.4.240을 확인하고 61개 관측 검사를 통과했다. 독립 리뷰도 현재61PASS와 JSON 전체를 별도 임시 경로에서 재현했다. 초기50/중간60검사와 실패한 pagination 가정은 checkpoints에 보존하며 최종61과 섞지 않는다.

- 원문 PurchaseOrder·OrderLine·OrderService·OrderReadService를 그대로 컴파일했다. 서비스 호출은 직접 Java이며 수동 EntityManager transaction 안에서 실행했다. Spring 프록시·Boot 앱 실행은 아니다.
- ProbePost(id42/title/version)는 원문에 없는 추가 엔티티다. assigned ID, persist0SQL, seed flush INSERT1, 새 EntityManager 첫 find SELECT1/같은 context 재조회0을 관찰했다. loadedState/EntityEntry는 Hibernate 내부 관찰값이다.
- setter 뒤 Java만 변경, flush 뒤 Java와 loadedState/version1 및 같은 transaction DB 갱신, 별도 READ_COMMITTED/autocommit observer는 commit 전 첫 글/version0, commit 뒤 수정된 글/version1을 관찰했다.
- rollback은 별도 DB 분기다. rollback/EM close 후 같은 POJO getter는 수정된 글/version1, DB는 첫 글/version0이다. 닫힌 context에 대한 no-entry/managed=false는 helper 기본값이므로 실측 상태로 표시하지 않는다.
- merge는 원본과 다른 managed 반환 객체를 만든다. 원본만 바꿔도 반환 객체는 따라 바뀌지 않았고 반환 객체 수정 commit 뒤 DB는 반환 객체 수정/version2다.
- remove 직후 contains=false/EntityEntry DELETED/SQL0과 별도 observer 행 존재, flush DELETE1 후 같은 transaction 행 없음·observer 이전행, commit 뒤 observer 행 없음을 구분했다. remove 전 flush 이전의 같은 transaction JDBC 행은 미측정이다.
- 원문 @BatchSize(size=32)를 유지했다. 추가 seed 3부모·각2자식에서 root1+batch1 SQL, 자식 접근 누적 추가1/1/1이었다. 원문 fetch join은 부모3/자식6/SQL1, 별도 같은 SQL JDBC replay는6행이다. replay행은 Hibernate wire 행 수가 아니다. 추가 fetchgraph도 이 조건에서 SQL1이었다.
- 원문 addLine 직접 호출은 자식 INSERT1, 부모 version0을 관찰하고 rollback했다. 닫힌 EM의 초기화하지 않은 lines 접근은 LazyInitializationException/추가SQL0이었다. 실패 뒤 DB 행 관찰을 새로 주장하지 않는다.
- 낙관적 락은 별도 EM A/B가 version0을 읽고 A commit 후 DB A 수정/version1, B flush의 UPDATE 시도와 OptimisticLockException/영향0행, B rollback 후 A 결과 보존이다. HTTP 요청·상태코드·스레드 지연은 실행하지 않았다.
- AUTO는 무관한 PurchaseOrder 쿼리 SELECT1/no UPDATE, ProbePost 겹치는 조회는 UPDATE→SELECT를 관찰했다. C의 이전 제목은 독립 observer 연결 관찰이며 writer transaction과 구분한다.

## 페이지 제한의 미해결 관측

원문에 없는 추가 쿼리5변형이다. native Hibernate7.4.5/H2에서 API max1(default first0/explicit first0)은 부모[1,2,3]·자식[2,2,2]·SQL limit 없음·별도 replay6행이었다. 명시 memory hint는 부모[1]/자식2·SQL limit 없음·replay6, HQL inline limit1은 부모[1]/자식2·부모 subquery SQL 제한·replay2, plain root API max1은 부모[1]·SQL limit·replay1이었다. 마지막 replay는 유일한 limit 파라미터에 observer가1을 명시 바인딩했다.

PASS는 설정과 관측 기록의 일치를 뜻하며 페이지 제한 정확성 통과 판정이 아니다. 온라인7.4 가이드는7.4.13이고 실행은7.4.5다. 원인·확정 bug명·upstream 수정 버전은 미확인이다. hint 강제·업그레이드·성능 향상을 권고하지 않는다. Luna 직접 OpenAI 조사와 메인 공식 페이지 확인은 research에 보관했다. LiteLLM을 사용하지 않았다.

## 화면·보존 검사

- 생성 HTML 원문15450자/code5/id27, 기존 jpa-focused outerHTML·deep2개를 정확 비교했다. 문서135개·학습자 서버17개 SHA가 기준과 같았다.
- Chrome 1672×941/390×844에서31상태씩 총62관찰. 코드·값·PASS·SQL·이미지 로드·페이지 가로 넘침·접힌 검증 로그를 대조했다. 마지막 auto/pagination 교정 후14상태의 실제 이미지 경로·로드를 재확인했다.
- 9쌍18개 full-page 캡처. 독립 검수의 AUTO observer 주체/추가 seed 라벨2지적을 imagegen v3에서 교정했다. 양쪽 최종4캡처도 갱신했다. 모바일 확대 그림은 내부 가로 이동으로 읽으며 페이지 전체는 넘치지 않았다.
- 특수 검사10건: 정확한 코드 복사, 확대 시 로그 열린 상태 유지, 내부 ArrowRight40px 이동, 모바일 다음/이전, 원문 앵커·새로고침·Back/Forward의 장면 유지, desktop End/Enter, 깊은 원문 절 자동 펼침. 기존 화면46관찰에서 역할/flush결과/4상태/N+1/4단계 시뮬레이션을 양쪽에서 조작했다.
- 사이트 주소 필터 콘솔 항목0. 번역 확장의 chrome-extension notKey 오류 표본은 별도 보존했다. full-page 캡처의 고정 header/스크롤 위치 차이와 모바일 번역 확장 overlay는 사이트 시안의 일부가 아니다.
- 최종 build는 HTML339·링크오류0. `test:s09`, `test:jpa-images`, `test:concept-history`, `test:p20`, `test:p19`, `test:w09`, `test:p16`, `test:p04`, `test:p09`, `test:knowledge-catalog`와 `audit:visual`, `audit:version-cards`, `audit:parity`가 통과했다. 실행 로그는 checks에 있다.
- 새31상태만 unreviewed→mockup_ready→implemented의62전이를 기록했다. 기존 parity536줄은 byte-identical 보존하고9줄을 추가했다. 총545기록/verified0이다. 인벤토리의 과거 verified6은 이번 시각 검증 승격이 아니다.

## 제한과 통합

JDK21/native Hibernate/H2/Boot BOM만 사용했다. MySQL·Docker·Java25·Boot 앱·Spring proxy·HTTP·OSIV·비관적 락·모든 버전 migration·전체 픽셀 정밀 비교·다른 브라우저·학습자 이해도는 미검증이다. Docker daemon 접근 실패를 복구하려고 사용자의 실행 환경을 바꾸지 않았다. 원문 버전별 가이드/선택 기준/자가점검은 보존했으며 전부 새 이미지로 제작한 것은 아니다. 상태는 부분 implemented이며 verified가 아니다.

개념 전용 로컬 브랜치에 보관한다. merge/push/PR은 하지 않는다. 재현과 통합 기준은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-learning-night-2026-10-20/INTEGRATION.md 를 따른다.
