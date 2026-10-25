# S08 트랜잭션 개념 보강 검증

2026-10-20. 원문329줄과 Java3블록·기존tx-life-focused/map을 읽고 10질문·30상태를 부분 보강했다. 실제 image_gen26장 중 최종10장을 선택하고16초안은 drafts에 보존했다. 원문 전체 주제 또는 전체134개 개념의 완료를 뜻하지 않는다.

## 원문과 추가 실행

원문 TransferService·ImportService·OrderNotificationListener의3블록은 수정 없이 컴파일했다. 추가 구성은 standalone Spring7.0.9 CGLIB·DataSourceTransactionManager·H22.4.240·JDK21이며 Boot4.1.1은 BOM으로만 사용했다. 원문에는 JDBC 구현·테스트 데이터·추가 Outer/Inner 전파 메서드가 없다.

추가 계정은 id1=1000/id2=100 cents다. failDebit는 UPDATE 후 원문 InsufficientFundsException을 강제 발생시킨다. 실제 잔액 부족 알고리즘을 구현한 것이 아니다. ImportRepository의 INSERT-then-false는 원문 setRollbackOnly 분기를 보기 위한 의도적 fixture이며 실제 insertIfAbsent/중복키 구현이 아니다. gatewayInvocations는 메모리 호출 기록이고 broker 전달/ack가 아니다.

`source-proof/verify-source.py` 최종 재실행은42검사·원문3블록/SHA·전체 frozen JSON·의존성SHA·실제 버전을 대조했다. 독립 검수도 source-proof를 임시 경로에 복제하고 ROOT만 원문 읽기 경로로 조정해42PASS와 JSON 전체를 재현했다. 추가 계정/ledger는 격리된 메모리 H2이며 학습자의 MySQL 데이터에 접근하지 않았다.

## 확인한 결과

- 원문 transfer를 프록시로 호출할 때 debit/credit는 같은 tracked connection6에서 실행됐다. debit UPDATE 뒤 writer750/100·별도 READ_COMMITTED/autocommit observer1000/100, 정상 commit 뒤 observer750/350이었다. 별도 강제 checked 실패 run은 connection11 rollback 뒤1000/100이었다.
- 원문을 직접 new한 같은 checked 실패 호출은 active=false이며 debit이 autocommit되어750/100이 남았다. 별도 ExtraRules의 selfInvoke→this.runtime은 advice를 우회해 runtime 행이 남았고, 외부 proxy의 동일 runtime 호출은 rollback돼 비었다.
- 추가 default checked IOException은 commit, runtime IllegalStateException은 rollback, 명시 noRollbackFor는 commit, 같은 메서드가 runtime을 잡아 정상 반환한 경우는 commit이었다. 원문 명시 rollbackFor와 추가 기본 규칙을 구분했다.
- 원문 ImportService의 true callback은 commit 후 true 반환/import-ok행 보존, 강제 false callback은 setRollbackOnly 후 rollback하고 false를 정상 반환했다. 실제 순서는 callback 반환 → resource 완료 → importOne 반환이다.
- 추가 REQUIRED의 outer/inner는 같은85 연결을 썼다. outer가 inner runtime을 잡은 뒤 isRollbackOnly=true를 실제 읽었고, 경계의 UnexpectedRollbackException/물리rollback/최종 ledger[]를 확인했다.
- 추가 REQUIRES_NEW는 outer91을 보류하고 inner92에서 독립 commit했다. outer91 재개 후 rollback해도 최종 inner-new만 남았다. 풀 고갈/동시 대기/지연시간을 측정한 것은 아니다.
- 추가 NESTED는 동일98 연결의 SAVEPOINT_1로 부분rollback·release 후 outer commit했고 최종 outer만 남았다. 독립 inner commit이 아니며 모든 JPA/관리자의 지원으로 일반화하지 않는다.
- transaction 없는 SUPPORTS/NOT_SUPPORTED/NEVER는 active=false/sync=true/bound없음이었다. MANDATORY는 본문 진입 전 거부됐다. 기존 outer 안의 SUPPORTS/MANDATORY는108 공유, NOT_SUPPORTED는 비활성·bound없음, NEVER는 본문 진입 전 거부됐고 outer108이 유지됐다. synchronization만으로 물리 transaction/연결 대여를 주장하지 않는다.
- readOnlyWrite에서 Spring readOnly=true와 실제 setReadOnly(true) 요청을 기록했지만 이 H2는 쓰기를 commit했다. 드라이버 isReadOnly getter·쓰기 보안·다른DB·강제 readOnly SQL 설정을 측정한 것이 아니다.
- 원문 AFTER_COMMIT 리스너는 성공commit 뒤 메모리gateway77을 호출했고 rollback이나 transaction 없는88발행에서는 호출되지 않았다. 추가 gateway 실패는 afterCompletion 로그에 남고 caller는 정상 반환, 이미 commit한 order행은 유지됐다.

## 예외 가정의 정정과 공식 근거

최초 fixture는 AFTER_COMMIT 리스너 실패가 caller로 전파된다고 잘못 가정했다. 실제 로그/호출 스택을 읽고 Spring v7.0.9의 TransactionPhase와 pinned 구현을 대조했다. 이 enum phase는 direct TransactionSynchronization.afterCommit과 달리 afterCompletion에서 실행되고 해당 경로는 Throwable을 catch/log한다. 원문 listener를 고치지 않고 예상만 교정했다. 초기 실패는 checkpoints, 조사 과정은 DEBUG-NOTE.md에 있다. callback active=true/sync=false는 이미 완료된 DB commit을 뒤집거나 미커밋을 뜻하지 않는다.

Luna 직접 OpenAI 조사는 LOCAL_HOME/research/javaexperience-s08-20261020 에 있다. LiteLLM/재위임/다른 모델 전환은 없었다. Luna의 최신 이벤트 URL 열기가 실패한 한계는 보존했고, 메인의 출처 검증에서는 공식7.0.9 이벤트 본문·API·pinned 구현을 실제 열었다. 원문 버전/격리표·outbox·reactive 선택 기준은 보존했으며 실행 결과로 바꾸지 않았다.

## 실제 화면과 보존

Chrome1672×941/390×844에서30상태씩60관찰을 기록했다. 질문/title/code/values/PASS/전체runJSON/이미지로드/가로넘침/검증기본접기를 대조해0실패였다. 독립 리뷰도 관찰60행을 현재data와 별도assert로 대조했다. 10쌍20개 full-page 캡처를 메인 표본 및 독립검수 전수로 읽었다. 모바일은현재구간확대·내부가로pan으로 읽으며 페이지전체넘침은없었다.

특수10검사: 정확한codecopy, 확대시검증열림유지, ArrowRight내부40px이동, 모바일이전/다음, 원문앵커·새로고침·Back/Forward장면유지, desktopEnd/Enter, 깊은원문절자동펼침. 기존3흐름×2와self-invocation힌트1의7관찰도 보존됐다. 사이트주소필터console0이며 번역확장overlay/고정header·스크롤위치차이는 시안구성이나 픽셀동일성증거가 아니다.

생성HTML은 원문15066자/code5/id28·기존집중화면/map outerHTML·실제classicbundle30상태·PNG10을 검사했다. 문서135개·학습자서버17개SHA, 원본worktree3403파일SHA차이0을 재확인했다. 이전parity545줄은byte-identical보존하고10줄만추가해총555/verified0이다. 새30상태만unreviewed→mockup_ready→implemented의60전이를기록했다. 인벤토리과거verified6은이번검증승격이아니다.

빌드는339HTML/link0. `test:s08`, `test:s09`, `test:jpa-images`, `test:concept-history`, `test:p20`, `test:p19`, `test:w09`, `test:p16`, `test:p04`, `test:p09`, `test:knowledge-catalog` 및 `audit:visual`, `audit:version-cards`, `audit:parity`가통과했다. 실행로그는checks에있다. S09생성HTML의추가rawJSON키순서도현재proof와동기화됐으나JSON의논리값과나머지DOM이동일함을별도검사했다.

## 한계

Boot앱/JPA/MySQL/Java25/HTTP/Docker/격리수준별동시성/timeout만료/private메서드/ALL_EXCEPTIONS/Error/Future/reactive/broker/CDC/outbox/프로세스종료/재전송/전수픽셀정밀비교/다른브라우저/학습자검증은미실행이다. verified로표시하지않는다. 로컬featurecheckpoint로보관하고merge/push/PR하지않는다.
