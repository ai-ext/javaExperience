# task15 D01 독립 감사

판정: **needs_completion**. fullDocumentComplete=false. 원문277줄의 보존과10질문·25상태의 부분정확성은 확인했지만 전체 학습범위 완료는 아니다. 기준HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`.

새 검사 `npm --prefix tools/site run test:d01`: **actual exit 0**, UTC 2026-10-22T00:01:34.609316+00:00 ~ 2026-10-22T00:01:37.784391+00:00. 원문 SHA256 `b0f93186f2b1dd9f88f534874e63a03c311fa7a0a1c5aaaf0486354510a6cf1f`. 명령/HEAD/소스10파일SHA/원시출력은 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task15/test-d01.execution.json`에 보존했다.

## spec 검토

원문 주요 의미79단위: covered8 / partial56 / missing10 / unrun5. 각 용어32개·단계표9행·실습5묶음·오해8개·설계4행·Q&A7개를 따로 매핑했다. missing은 원문 삭제가 아닌 보강 장면의 공백이다. 원문/HTML 보존은 fresh 검사에서13875자·code6·Mermaid3·id16·map1이 일치했다.

| 원문 절·의미 | sourceLines | stageIds | 판정 | 근거·남은 공백 |
|---|---|---|---|---|
| 제목·3줄 요약 | [1, 5] | flow-acceptance, flow-feedback, copy-local, recovery-options | partial | 10질문·25상태가 인수조건→검사→산출물→운영피드백의 부분 사례를 연결한다. / 전체 단계·환경별 검증 책임의 통합 추적 장면은 없다. |
| 1. 생명주기 전체 흐름·CI 실패 되돌림 | [7, 27] | flow-acceptance, flow-feedback, branch-baseline, branch-bad, branch-fixed, build-assemble, build-check, build-fixed, copy-boundary | partial | flow.jpg 오른쪽은 CONCEPT ONLY의 압축 문헌 모델, 왼쪽은 실제 CLI 표본이다. / PR·리뷰 수정·CI실패→구현·dev/stg/prod를 한 티켓으로 추적하지 않는다. |
| 1. 운영 신호·장애·후속 작업 | [29, 29] | flow-feedback, recovery-options | partial | 원문 Mermaid 발췌와 incident-options 미실행 모델 표시. / 운영 신호·영향·회복 확인·사후분석 산출물 예시가 없다. |
| 1. 환경의 목적·권한·비밀값 | [31, 31] | config-values, config-branch, copy-boundary | partial | CLI profile·DB alias 문자열/브랜치와 환경 차이 명시. / local/dev/stg/prod의 데이터·접근권한·비밀값·통합/운영유사 검증을 비교하지 않는다. |
| 1. D 트랙 지도 역할 | [33, 33] | — | covered | 원문 전문과 142행의 심화 문서 지도가 HTML 원문에 보존된다. |
| 2. 요구사항 | [39, 39] | flow-acceptance | partial | 완료조건 표본은 있으나 사용자 필요와 API 설계의 구분은 원문뿐 / 완료조건 표본은 있으나 사용자 필요와 API 설계의 구분은 원문뿐; 후속 개념 사례를 보강한다. |
| 2. 티켓 | [40, 40] | flow-acceptance, flow-feedback | partial | 순환 모델은 있으나 업무 맥락·담당자·결정의 티켓 예시는 없음 / 순환 모델은 있으나 업무 맥락·담당자·결정의 티켓 예시는 없음; 후속 개념 사례를 보강한다. |
| 2. 인수 조건 | [41, 41] | flow-acceptance, build-check, build-fixed | covered | 같은 post42/actor7 두 호출의 기대1/실패2/수정1을 명시 |
| 2. 로컬 | [42, 42] | copy-boundary, config-values | partial | 로컬CLI/실제환경 미실행 경계는 명확하나 개발자PC/공유dev 데이터 구분 없음 / 로컬CLI/실제환경 미실행 경계는 명확하나 개발자PC/공유dev 데이터 구분 없음; 후속 개념 사례를 보강한다. |
| 2. 커밋 | [43, 43] | branch-baseline, branch-bad, branch-fixed | covered | B0/F1/F2의 실제 고정 Git SHA·원격0·수정 이력을 연결 |
| 2. 브랜치 | [44, 44] | branch-baseline, branch-bad, branch-fixed | covered | baseline B0 불변과 feature F1→F2 포인터를 실제 관측 기록으로 표시 |
| 2. PR / MR | [45, 45] | gate-review, gate-check, gate-both | partial | Boolean gate는 실제 PR 토론·검토·변경요청을 다루지 않음 / Boolean gate는 실제 PR 토론·검토·변경요청을 다루지 않음; 후속 개념 사례를 보강한다. |
| 2. 코드 리뷰 | [46, 46] | gate-review, gate-check, gate-both | partial | 사람승인과 자동검사 입력을 구분하나 리뷰 의견·위험 검토 예시 없음 / 사람승인과 자동검사 입력을 구분하나 리뷰 의견·위험 검토 예시 없음; 후속 개념 사례를 보강한다. |
| 2. 머지 | [47, 47] | — | missing | 원문 보존 외 merge와 배포의 독립성 장면 없음 / 원문 보존 외 merge와 배포의 독립성 장면 없음; 후속 개념 사례를 보강한다. |
| 2. CI | [48, 48] | build-check, gate-check | partial | 로컬 check와 원격CI의 경계를 명시하나 잦은 통합 실천은 없음 / 로컬 check와 원격CI의 경계를 명시하나 잦은 통합 실천은 없음; 후속 개념 사례를 보강한다. |
| 2. CD | [49, 49] | — | missing | 지속적 전달/지속적 배포의 두 뜻은 원문에만 있음 / 지속적 전달/지속적 배포의 두 뜻은 원문에만 있음; 후속 개념 사례를 보강한다. |
| 2. 파이프라인 | [50, 50] | — | missing | 작업 순서·조건과 CI/CD 목표의 차이는 원문에만 있음 / 작업 순서·조건과 CI/CD 목표의 차이는 원문에만 있음; 후속 개념 사례를 보강한다. |
| 2. 러너/에이전트 | [51, 51] | — | missing | CI 실행환경과 앱 운영서버의 역할 차이는 원문에만 있음 / CI 실행환경과 앱 운영서버의 역할 차이는 원문에만 있음; 후속 개념 사례를 보강한다. |
| 2. 단위 테스트 | [52, 52] | build-fixed | partial | CLI contract는 JUnit/단위테스트가 아니라고 표시하나 단위 범위 예시는 없음 / CLI contract는 JUnit/단위테스트가 아니라고 표시하나 단위 범위 예시는 없음; 후속 개념 사례를 보강한다. |
| 2. 통합 테스트 | [53, 53] | — | missing | 구성요소·실제DB 연결 검증과 준비 비용의 예시는 없음 / 구성요소·실제DB 연결 검증과 준비 비용의 예시는 없음; 후속 개념 사례를 보강한다. |
| 2. 정적 분석 | [54, 54] | — | missing | 실행 테스트와 정적 분석의 구분 장면 없음 / 실행 테스트와 정적 분석의 구분 장면 없음; 후속 개념 사례를 보강한다. |
| 2. 빌드 | [55, 55] | build-assemble, build-check, build-fixed, artifact-manifest | covered | assemble 성공/JAR 존재·check 실패·수정 build 성공을 실제 raw 로그와 연결 |
| 2. 아티팩트 | [56, 56] | artifact-identity, artifact-manifest, cache-moved | covered | 실제 JAR bytes/SHA/manifest와 project cache를 구분 |
| 2. 컨테이너 이미지 | [57, 57] | — | missing | JAR와 이미지·실행중 컨테이너의 차이는 원문에만 있음 / JAR와 이미지·실행중 컨테이너의 차이는 원문에만 있음; 후속 개념 사례를 보강한다. |
| 2. 레지스트리 | [58, 58] | copy-boundary | partial | 실제registry 미실행 경계만 있으며 저장·제공 주체 설명은 원문뿐 / 실제registry 미실행 경계만 있으며 저장·제공 주체 설명은 원문뿐; 후속 개념 사례를 보강한다. |
| 2. 배포 | [59, 59] | copy-boundary, flag-on | partial | LOCALCOPY/CLI flag가 실제배포가 아님을 표시하나 트래픽준비 상태 예시는 없음 / LOCALCOPY/CLI flag가 실제배포가 아님을 표시하나 트래픽준비 상태 예시는 없음; 후속 개념 사례를 보강한다. |
| 2. 릴리스 | [60, 60] | flag-off, flag-on | partial | 동일JAR의 flag 분기와 두 release 의미는 구분하나 사용자 공개는 미실행 / 동일JAR의 flag 분기와 두 release 의미는 구분하나 사용자 공개는 미실행; 후속 개념 사례를 보강한다. |
| 2. 승격 | [61, 61] | copy-local, copy-boundary | partial | 동일JAR 로컬사본 hash 일치, 실제환경 승격과 분리; 이미지digest 실례 없음 / 동일JAR 로컬사본 hash 일치, 실제환경 승격과 분리; 이미지digest 실례 없음; 후속 개념 사례를 보강한다. |
| 2. 환경 | [62, 62] | config-values, config-branch | partial | 환경문자열이 브랜치를 바꾸지 않음은 관측; 데이터/권한 조합 설명 부족 / 환경문자열이 브랜치를 바꾸지 않음은 관측; 데이터/권한 조합 설명 부족; 후속 개념 사례를 보강한다. |
| 2. 롤백 | [63, 63] | recovery-compatible, recovery-renamed, recovery-options | partial | 컬럼이름집합 모델과 조건별선택을 구분; 실제복구·외부부작용은 없음 / 컬럼이름집합 모델과 조건별선택을 구분; 실제복구·외부부작용은 없음; 후속 개념 사례를 보강한다. |
| 2. 모니터링 | [64, 64] | flow-feedback | partial | Observe 개념노드만 있고 지표·알림 차이 사례 없음 / Observe 개념노드만 있고 지표·알림 차이 사례 없음; 후속 개념 사례를 보강한다. |
| 2. 로그/메트릭/트레이스 | [65, 65] | — | missing | 빌드 raw 로그는 운영 관측 세 신호의 차이를 설명하지 않음 / 빌드 raw 로그는 운영 관측 세 신호의 차이를 설명하지 않음; 후속 개념 사례를 보강한다. |
| 2. 장애 | [66, 66] | recovery-options | partial | 조건부 대응만 있고 서비스영향·일반버그 판단 사례 없음 / 조건부 대응만 있고 서비스영향·일반버그 판단 사례 없음; 후속 개념 사례를 보강한다. |
| 2. 핫픽스 | [67, 67] | recovery-options | partial | 조건부 최소수정 선택지만 있고 새변경/이전버전복귀 대비는 원문에 의존 / 조건부 최소수정 선택지만 있고 새변경/이전버전복귀 대비는 원문에 의존; 후속 개념 사례를 보강한다. |
| 2. 사후 분석 | [68, 68] | flow-feedback, recovery-options | partial | 후속작업은 있으나 타임라인·영향·기여요인 산출물 없음 / 후속작업은 있으나 타임라인·영향·기여요인 산출물 없음; 후속 개념 사례를 보강한다. |
| 2. 회고 | [69, 69] | flow-feedback | partial | Learn and improve 노드만 있고 정기회고/사후분석 범위 차이는 원문뿐 / Learn and improve 노드만 있고 정기회고/사후분석 범위 차이는 원문뿐; 후속 개념 사례를 보강한다. |
| 2. 기능 플래그 | [70, 70] | flag-off, flag-on | partial | 동일JAR CLI 분기0/1은 실제관측; 권한/점진공개/수명관리 설명 없음 / 동일JAR CLI 분기0/1은 실제관측; 권한/점진공개/수명관리 설명 없음; 후속 개념 사례를 보강한다. |
| 3. 표본·시간감각의 한계 | [72, 74] | flow-acceptance | partial | 같은사용자·게시글의 순차표본과 미측정 성능/장애/SLA 경계가 명시됨. / 각단계 시간감각은 추가장면에서 설명하지 않는다. 원문 시간을 측정치로 오인하지 않아야 한다. |
| 3. 단계표 요구사항·티켓 | [78, 78] | flow-acceptance | partial | 인수조건1만 다루며 제품/개발자 합의·우선순위·담당자·모호함 실패사례는 없음 / 인수조건1만 다루며 제품/개발자 합의·우선순위·담당자·모호함 실패사례는 없음 |
| 3. 단계표 설계·로컬 개발 | [79, 79] | flow-acceptance, build-fixed | partial | 메모리정책 구현만 관측, API계약·DB영향·로컬/공유환경 차이 없음 / 메모리정책 구현만 관측, API계약·DB영향·로컬/공유환경 차이 없음 |
| 3. 단계표 커밋·브랜치 | [80, 80] | branch-baseline, branch-bad, branch-fixed | partial | 로컬Git3commit 관측; 원격push·리뷰크기·충돌 대기는 미실행 / 로컬Git3commit 관측; 원격push·리뷰크기·충돌 대기는 미실행 |
| 3. 단계표 PR·코드 리뷰 | [81, 81] | gate-review, gate-check, gate-both | partial | Boolean입력은 실제리뷰가 아님; 목적/테스트/위험·의견/수정요청 표본 없음 / Boolean입력은 실제리뷰가 아님; 목적/테스트/위험·의견/수정요청 표본 없음 |
| 3. 단계표 CI | [82, 82] | build-assemble, build-check, build-fixed | partial | 로컬Gradle대조만 관측; PR이벤트·runner·정적분석/flaky/의존성실패는 없음 / 로컬Gradle대조만 관측; PR이벤트·runner·정적분석/flaky/의존성실패는 없음 |
| 3. 단계표 아티팩트·이미지 | [83, 83] | artifact-identity, artifact-manifest | partial | JAR와commit연결 관측; 이미지·registry·태그/digest는 없음 / JAR와commit연결 관측; 이미지·registry·태그/digest는 없음 |
| 3. 단계표 dev·stg 배포 | [84, 84] | copy-local, copy-boundary, config-values | partial | 로컬복사·문자열과 실제배포를 구분; 통합/마이그레이션/스모크/승인 없음 / 로컬복사·문자열과 실제배포를 구분; 통합/마이그레이션/스모크/승인 없음 |
| 3. 단계표 prod 릴리스 | [85, 85] | flag-off, flag-on | partial | CLI조건분기만 관측; 점진배포·권한·시작실패·부분교체 없음 / CLI조건분기만 관측; 점진배포·권한·시작실패·부분교체 없음 |
| 3. 단계표 운영·장애·회고 | [86, 86] | flow-feedback, recovery-options | partial | 문헌·선택지모델만 존재; 감지/영향/버전/복구지표·후속티켓 산출물 없음 / 문헌·선택지모델만 존재; 감지/영향/버전/복구지표·후속티켓 산출물 없음 |
| 3. CI는 잦은 통합 실천 | [88, 88] | gate-review, gate-check | partial | 검사와 review 신호는 분리. / 오래된 브랜치·통합빈도·깨진 기본브랜치 복구 사례 없음. |
| 3. 산출물·캐시·동일버전 승격 | [90, 90] | artifact-identity, artifact-manifest, copy-local, cache-moved, cache-rebuild | partial | 실제 동일JAR/이 fixture 재현빌드와 global cache 한계를 대조. / job전달·registry·이미지digest와 의존성cache 성능 효과는 실행하지 않음. |
| 3. 역할별 좋아요 기능 시퀀스 | [92, 116] | branch-bad, branch-fixed, gate-review, build-check, copy-local | partial | 각 부분은 원문과 연결되나 flow.jpg의 Review/CI 병합 노드가 협업 메시지를 대체하지 않는다. / push→PR→러너/리뷰어→수정재검사→저장소→환경의 전달 주체/피드백 장면 필요. |
| 3. 환경 보호·승인·비밀값 | [118, 118] | config-values | partial | 문자열입력/실제권한구성 미실행 경계 존재. / 환경별 보호규칙·승인·브랜치제한·비밀값 접근의 책임은 원문에만 있음. |
| 3. 온콜·영향·스키마·회고 | [120, 124] | recovery-compatible, recovery-renamed, recovery-options, flow-feedback | partial | 열이름집합/조건부복구선택은 명시적모델, 실제DB/장애아님. / 온콜·영향확인·회고산출물/탐지지연·기여요인을 더 구체적으로 보여야 함. |
| 3. 장애 분기 흐름 | [126, 140] | recovery-options | partial | rollback/flagoff/hotfix 조건부선택과 회복/후속 연결 표시. / 온콜 호출·영향종료/사후분석의 별도 상태는 없음. |
| 3. 심화 문서 지도 | [142, 142] | — | covered | 현재HTML 원문의 D02~S19 심화 위치 보존. |
| 4. 버전전제·Kotlin설정 | [144, 159] | — | unrun | 원문 Java25/Boot4.1.1 설정은 명시적 미실행; 추가Java21 fixture로 대체 검증할 수 없음 / 원문 Java25/Boot4.1.1 설정은 명시적 미실행; 추가Java21 fixture로 대체 검증할 수 없음 |
| 4. 저장소상태·도구버전·브랜치 | [161, 170] | branch-baseline, branch-bad | unrun | 원문 도구/기본main/pull 명령 미실행; 새private repo의 Git결과는 별도 / 원문 도구/기본main/pull 명령 미실행; 새private repo의 Git결과는 별도 |
| 4. 좋아요API·local프로파일·DB·시작로그 | [172, 178] | flow-acceptance, config-values | unrun | 원문 Boot API/DB/HTTP/포트·profile 실패 검증 없음 / 원문 Boot API/DB/HTTP/포트·profile 실패 검증 없음 |
| 4. 원문clean build·JAR실행 | [180, 193] | build-assemble, build-check, build-fixed | unrun | 원문 Boot앱 build/JAR 미실행; plainJava21 CLI만 과거실행 / 원문 Boot앱 build/JAR 미실행; plainJava21 CLI만 과거실행 |
| 4. 선별커밋·push·PR·원격CI선택 | [195, 203] | branch-fixed, gate-review | unrun | 원문 원격작업·PR설명·workflow·registry 실습 미실행 / 원문 원격작업·PR설명·workflow·registry 실습 미실행 |
| 5. 오해 로컬성공/환경차이 | [207, 207] | config-values, config-branch | partial | 설정문자열만 있어 DB버전·시드·시간대 실패사례 없음 / 설정문자열만 있어 DB버전·시드·시간대 실패사례 없음 |
| 5. 오해 PR승인/테스트 | [208, 208] | gate-review, gate-check, gate-both | partial | 신호독립성모델은 있으나 사람판단 내용은 없음 / 신호독립성모델은 있으나 사람판단 내용은 없음 |
| 5. 오해 CI/잦은통합 | [209, 209] | — | missing | CI실천과 오래된 브랜치 실패사례 없음 / CI실천과 오래된 브랜치 실패사례 없음 |
| 5. 오해 배포/릴리스 | [210, 210] | flag-off, flag-on | partial | CLI분기와 실제공개 경계를 구분; 점진공개/승인은 없음 / CLI분기와 실제공개 경계를 구분; 점진공개/승인은 없음 |
| 5. 오해 환경별재빌드 | [211, 211] | copy-local, cache-rebuild, artifact-manifest | partial | 동일산출물보존 관측; 의존성/시각변화에 따른 차이 표본 없음 / 동일산출물보존 관측; 의존성/시각변화에 따른 차이 표본 없음 |
| 5. 오해 스테이징/운영데이터 | [212, 212] | — | missing | 데이터익명화·보안/비용·선택적유사성 사례 없음 / 데이터익명화·보안/비용·선택적유사성 사례 없음 |
| 5. 오해 롤백/외부부작용 | [213, 213] | recovery-compatible, recovery-renamed, recovery-options | partial | 열이름모델만 있고 메시지발행·배포진행상태 없음 / 열이름모델만 있고 메시지발행·배포진행상태 없음 |
| 5. 오해 비난/사후분석 | [214, 214] | flow-feedback | partial | 후속작업노드만 있고 개인비난/기여요인·기한/측정액션 대비 없음 / 후속작업노드만 있고 개인비난/기여요인·기한/측정액션 대비 없음 |
| 6. 시각화 전체수명주기 | [220, 220] | flow-feedback | partial | 압축순환그림은 있으나 전체단계·실패되돌림 분리 부족 / 압축순환그림은 있으나 전체단계·실패되돌림 분리 부족 |
| 6. 시각화 역할시퀀스 | [221, 221] | gate-review, build-check, copy-local | partial | 역할간 전달·리뷰피드백 흐름 부족 / 역할간 전달·리뷰피드백 흐름 부족 |
| 6. 시각화 환경비교카드 | [222, 222] | config-values, config-branch | partial | 문자열만 있고 데이터/권한/비밀값/목적 비교 없음 / 문자열만 있고 데이터/권한/비밀값/목적 비교 없음 |
| 6. 시각화 장애분기 | [223, 223] | recovery-options | partial | 복구조건은 있지만 영향도·온콜·회고산출물 없음 / 복구조건은 있지만 영향도·온콜·회고산출물 없음 |
| 7. Q1 커밋/PR/배포 | [227, 231] | branch-fixed, copy-boundary | partial | PR/merge후 배포정책의 분리는 원문에 의존 / PR/merge후 배포정책의 분리는 원문에 의존 |
| 7. Q2 CI통과/운영위험 | [233, 237] | build-check, copy-boundary | partial | 운영데이터규모·권한·네트워크·트래픽 위험대조 없음 / 운영데이터규모·권한·네트워크·트래픽 위험대조 없음 |
| 7. Q3 환경구분/잔여차이 | [239, 243] | config-values | partial | 목적/위험·접근권한/점진운영 반영 사례 없음 / 목적/위험·접근권한/점진운영 반영 사례 없음 |
| 7. Q4 아티팩트/캐시 | [245, 249] | artifact-identity, cache-moved, cache-rebuild, copy-local | partial | JAR사례만 있으며 이미지digest/의존성다운로드 재생성/속도는 미검증 / JAR사례만 있으며 이미지digest/의존성다운로드 재생성/속도는 미검증 |
| 7. Q5 리뷰/CI/대기개선 | [251, 255] | gate-review, gate-check, gate-both | partial | 신호독립성은 보여도 PR크기·리뷰어/대기/재작업 개선 질문 없음 / 신호독립성은 보여도 PR크기·리뷰어/대기/재작업 개선 질문 없음 |
| 7. Q6 복구경로선택 | [257, 261] | recovery-compatible, recovery-renamed, recovery-options | partial | DB컬럼외 메시지/외부부작용·배포진행상태·회복지표 예시 없음 / DB컬럼외 메시지/외부부작용·배포진행상태·회복지표 예시 없음 |
| 7. Q7 비난회피/조치책임 | [263, 267] | flow-feedback, recovery-options | partial | 담당있는 후속작업만 언급; 기한·확인기준과 통제효과 사례 없음 / 담당있는 후속작업만 언급; 기한·확인기준과 통제효과 사례 없음 |
| 8. 참고문헌 | [269, 277] | — | covered | 원문7URL과 추가 research/main-verification.json의 역사적 출처대조를 HTML에 보존. / 이번 감사에서는 새 웹검증 금지; 2026-10-20 기록으로만 취급. |

## quality 진단

spec 공백이 있어 quality 승인은 부여하지 않았다. 진단한 범위에서 새 확정 critical/important/minor는0/0/0이다. 공통 clipboard race는 중복 재현·문서전용 새 이슈 집계에서 제외했다.

- **반복호출/테스트**: LikeDemo --self-test는 post42/actor7을 두 번 호출하고 count!=1이면 AssertionError. bad int++는2, good HashSet은1. contractTest는JavaExec이며 check에 연결된다. rawfixed-build의 :test NO-SOURCE를 JUnit통과로 세지 않는다.
- **로그/모델**: freshtest는execution.json/frozen/D01_RUNS의 완전일치·rawPASS11·모델3·stage값을 검증한다. gate/schema/incident stage의 checks는빈배열이고 Boolean/컬럼이름/문헌선택지라고 표시한다.
- **artifact/IO**: 현재역사JAR5개를읽어 모두2859bytes/6e52d10485e682154f7f1a02a2f898eccab91e89608afb047e3d828f06c4fda0/manifest F2를 확인했다. dev/stg/prod는동일머신LOCALCOPY, DB별칭은출력문자열. Registry/digest/attestation/실제배포를 주장하지 않는다.
- **transaction/측정경계**: fixture에JDBC/JPA/DB트랜잭션/flush/commit/rollback은없다. Gitcommit과DBcommit을혼동하지않는다. schema는이름집합뿐이고 실제SQL·DB연결·migration/rollback·장애·SLA·복구시간·속도는측정하지않았다고명시한다.
- **cache/rebuild**: run-proof는새fixture .gradle만이동하며Jar타임스탬프off/순서고정. globalcache미삭제/재사용가능성과이표본재현성으로범위를제한한다.
- **접근성/상태**: jsdom검사는25상태값·code복사·실패fallback·history분리·원문anchor·키보드/경계focus·모바일select/resize를실행했다. 실제CSS배치/pan/현재browser는본감사실행범위밖이다.

## 실제 열람·실행 경계

선정시안 flow/build-v2/recovery3장과 과거캡처 desktop-flow/desktop-build/mobile-recovery3장을 실제 view_image로 열람했다. 모두JPEG 헤더이며 시안1672×941, 캡처1672×2350/1672×2170/360×2442다. 전수 이미지 검수나 현재브라우저 실행을 주장하지 않는다.

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/images/flow.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/images/build-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/images/recovery.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/captures/desktop-flow.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/captures/desktop-build.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/captures/mobile-recovery.jpg

과거실행 JAR archive/dev/stg/prod/rebuild5개는 지금 읽기만 하여 모두2859bytes·동일SHA·F2 Source-Revision을 확인했다. Java/Gradle/DB/브라우저/외부CLI/LLM을 새로 호출하지 않았다. 새 npm검사는 Node/jsdom과 보존기록의 일치 검증이다. 실제 과거실행과 새 runtime 결과를 구분한다.

## 남은 묶음

- **전체 생명주기·역할·CI 실천**: 티켓 내용/담당자/완료조건→commit→PR 의견/수정→runner의 검사→같은 산출물 승격→운영신호→후속티켓을 한 표본으로 연결. merge/배포/릴리스·CD 두 뜻·runner/운영서버·잦은통합을 구분. 완료기준: 누가 무엇을 넘기는지, 실패 때 어디로 돌아가는지, 어떤 산출물이 남는지 문헌 모델로 명시하고 원문 9~27/78~118/209와 대조.
- **용어·검증 범위·환경 책임**: 단위/통합/정적분석, 이미지/컨테이너/registry, 모니터링/로그/메트릭/트레이스, 환경별 목적·데이터·권한·비밀값·운영유사성/익명화. 완료기준: source-coverage missing10 및 관련 partial의 공백을 설명/조작 가능한 사례로 보강. 단순 원문 접기 보존을 장면 완료로 계산하지 않음.
- **운영·복구·사후분석·Q&A**: 영향도·온콜·스키마/외부부작용·배포진행상태·복구지표·기여요인·담당자/기한/확인기준과 Q1~Q7 꼬리질문. 완료기준: 원문123~140/213~214/257~267의 조건별 선택과 남길 산출물을 문헌모델로 보강. 실제장애/DB실험 결과로 표시하지 않음.
- **원문 실습·현재 브라우저·이해 검증**: 원문 Java25/Boot4.1.1/DB/API/로컬/원격CI실습은 현재 unrun이며 추가Java21 fixture로 대체 인증하지 않음. 메인 현재 desktop/mobile 검사와 학습자 검증은 별도. 완료기준: 실제 허용된 원문환경 재현 시 별도 명령/HEAD/설정/원시결과를 보존. 현재 브라우저는 메인 근거와 종합, 학습자이해는 별도 확인.

postflight: HEAD 유지=True, 검사대상 소스10파일 SHA 유지=True. application·원문·기존근거·장부·Git·다른task는 수정하지 않았다.

판정: needs_completion
fullDocumentComplete: false
커버리지: 79단위 = covered8 / partial56 / missing10 / unrun5
이슈수: critical0 / important0 / minor0 (quality 승인 아님)
actualexit: 0
