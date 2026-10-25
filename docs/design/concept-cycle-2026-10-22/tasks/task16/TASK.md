# task16: D02 · D02. 서버·네트워크 기초 용어 — 요청이 서버에 닿기까지

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D02-server-network-basics.md
- 원문 SHA256: `6f2fe2c7c720eef33f939ed06b459c2311a8615fbc53ce68acc890a18c80fbaf` / 304줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d02-2026-10-20/VERIFICATION.md
- 참고 개념: DNS와 URL 이름 해석, TCP·QUIC·NAT·방화벽·listener, TLS와 proxy routing
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: D02. 서버·네트워크 기초 용어 — 요청이 서버에 닿기까지
- L7: 1. 큰 그림
- L26: 2. 용어 사전
- L62: 3. 단계별로 보기
- L64: 3.1 URL과 DNS
- L84: 3.2 네트워크 연결, NAT, 방화벽
- L94: 3.3 TLS와 인증서
- L102: 3.4 로드밸런서·리버스 프록시
- L110: 3.5 Tomcat에서 Spring 컨트롤러까지
- L141: 4. 직접 해보기
- L143: 4.1 로컬 Spring Boot 서버
- L200: 두 번째 터미널
- L206: 4.2 DNS·port·TLS 점검
- L209: macOS/Linux의 DNS 질의
- L214: macOS/Linux에서 TCP 8080 LISTEN 확인
- L217: Linux 대안
- L220: OpenSSL 1.1.1+에서 SNI와 hostname 검증
- L229: 5. 자주 하는 오해와 실수
- L241: 6. 시각화 설계 메모
- L247: 7. 자가점검 Q&A (면접 대비)
- L249: Q1. DNS에서 IP를 받았는데 요청이 timeout이다. DNS 문제인가?
- L255: Q2. localhost에서는 되지만 외부에서 안 된다. 무엇을 확인하나?
- L261: Q3. HTTPS에서 인증서는 무엇을 증명하며 TLS는 언제 도나?
- L267: Q4. L4와 L7 로드밸런서의 차이는?
- L273: Q5. Nginx와 내장 Tomcat이 함께 있으면 요청은 어떻게 가나?
- L279: Q6. NAT와 방화벽은 같은 기능인가?
- L285: Q7. HTTP/3 연결을 TCP 3-way handshake로 설명해도 되나?
- L291: 8. 참고문헌

## 기존 관련 파일

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-learning.bundle.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-learning.css
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-learning.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-learning.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-lesson-data.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d02-supplement.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:d02`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
