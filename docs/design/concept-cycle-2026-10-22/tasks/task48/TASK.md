# task48: J20 · J20. I/O·NIO·HttpClient·JDBC 기초

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J20-io-nio-jdbc.md
- 원문 SHA256: `189671633aa73cf9c5c4d14d92c7c6949c075ebfe26a2e6d2ced2f46eafd0930` / 317줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: InputStream/Reader/Charset, Path/Files and resource lifecycle, Buffer/Channel/Selector mechanics, HttpClient lifecycle and body handling, JDBC PreparedStatement and pool sizing
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J20. I/O·NIO·HttpClient·JDBC 기초
- L7: 1. 왜 알아야 하나
- L13: 2. 핵심 개념
- L27: 헷갈리는 쌍
- L38: 3. 내부 동작·원리
- L40: 3.1 바이트에서 문자까지
- L49: 3.2 `Path`와 `Files`
- L55: 3.3 NIO의 버퍼·채널·셀렉터
- L73: 3.4 `HttpClient` 요청 흐름
- L79: 3.5 JDBC와 풀
- L90: 4. 코드로 확인
- L94: 예제 1 — 문자 디코딩, 버퍼링, 파일 왕복
- L140: 예제 2 — `ByteBuffer` 읽기·쓰기 상태
- L174: 예제 3 — `HttpClient.sendAsync`와 응답 본문 핸들러
- L220: 5. 버전별 변화 — 왜 바뀌었나
- L231: 6. 실무 가이드
- L242: 7. 함정·안티패턴
- L253: 8. 자가점검 Q&A (면접 대비)
- L255: Q1. `InputStream.read(byte[])`가 배열 전체를 채운다고 가정하면?
- L261: Q2. 바이트를 `Reader`로 바꿀 때 문자셋이 왜 필요한가?
- L267: Q3. `flip()`과 `compact()`는 언제 구분해 쓰나?
- L273: Q4. 논블로킹 채널이면 호출 스레드는 절대 기다리지 않나?
- L279: Q5. `PreparedStatement`가 SQL Injection을 막는 경계는?
- L285: Q6. 풀이 부족해 보일 때 풀 크기를 늘리는 게 정답인가?
- L291: Q7. `sendAsync()`면 HTTP 작업에 타임아웃이 필요 없나?
- L297: Q8. 역직렬화 필터가 데이터 신뢰성을 보장하나?
- L303: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j20`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task48/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
