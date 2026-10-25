# P09 경계 질문 구현 기록

## 적용 범위

- `shared-state` 3개 장면과 `varargs-selection` 6개 장면을 추가했다. P09 선택기는 22개 질문·93개 상태를 제공한다.
- 선택한 PC 다크 JPG만 새 질문에 연결했다. 새 모바일·라이트 전용 분기는 추가하지 않았다.
- 핵심 코드 패널에 `RequestState` 필드·대입, 전체 `sum` 메서드, `choose` 두 overload 선언과 현재 호출을 노출한다. 각 fragment는 `P09BoundariesProof.java`의 줄·열 범위와 연결하고 공백 제거 시에도 문자열·문자 리터럴을 보존하는 검사로 맞췄다.
- 강조는 각 장면 의미에 맞춘다. shared 앞 장면은 객체 생성을, 호출 뒤 장면은 메서드 대입문과 해당 호출을 강조한다. `choose`는 선택된 선언과 호출을 함께 강조한다.
- 실제 PC 캡처에서 `choose-empty` 확대 crop이 오른쪽 열의 첫 글자와 공통 heading을 침범해, 선정 JPG 원본을 다시 대조한 뒤 varargs 6개 focus 좌표를 카드 경계에 맞게 좁혔다.
- 새 계약은 9개 장면의 전체 값 행을 별도 기준표와 대조한다. 합계·overload 선택값은 native Java 관측값에 연결하고, 입력 인자·배열 원소·길이·shared 관측 문자열·choose 호출은 고정된 source 기반 값으로 확인한다.
- 전체 Java proof와 raw stdout 13행은 `#p09-original` 바깥의 별도 접기 자료에서 읽고 선택·복사할 수 있다.
- P09 copy handler에만 render generation과 요청 ID 검사를 적용했다. 요청 시작 시 코드를 캡처하고, 오래된 완료·실패가 상태 문구나 선택 범위를 갱신하지 않게 했다. 9개 각 장면의 정상 복사 payload를 표시 코드와 직접 대조한다.

## 수정 파일

- `tools/site/p09-lesson-data.mjs`
- `tools/site/p09-assets.mjs`
- `tools/site/p09-learning.js`
- `tools/site/p09-learning.mjs`
- `tools/site/p09-learning.bundle.js` (빌드 생성)
- `tools/site/package.json`
- `tools/site/test-p09-coverage.mjs`
- `tools/site/test-p09-boundaries.mjs` (신규)
- `docs/knowledge/P09-java-syntax-basics.html` (빌드 생성)

기존 P09 모바일·원문 보존 테스트는 그대로 실행했고, 과거 84상태의 검증은 history ID 집합에 해당하는 기존 상태에만 적용한다. 새 9상태는 별도 계약 테스트가 검사한다. 원문, 학습 서버, proof·실행 로그, proof 독립검수 자료, 기존 질문 27개, 기존 이미지 기록은 수정하지 않았다.

## 확인 결과

- `npm run build`: 성공. HTML 339개 생성, 링크 오류 0. 변경된 P09 산출물은 생성 HTML과 학습 bundle이다.
- `npm run test:p09`: 성공. 기존 P09 회귀와 신규 9상태·소스 fragment·값·강조·history·복사 경쟁·proof/image 보존 검사를 실행했다.
- `npm run test:concept-reader`: 성공. 원문 134개 등 reader 계약 통과.
- `npm run test:concept-dark`: 성공. 다크 범위와 136개 페이지 기준 통과.
- `git diff --check`: 성공.
- 독립 데이터 변이 재검사: `sum-items` 배열 길이와 `sum-array` 원소를 각각 잘못된 값으로 바꾸면 두 경우 모두 신규 contract의 전체 값 비교에서 실패했다. 변이된 bundle은 임시 메모리에서만 만들었고 proof·product data는 변경하지 않았다.
- 독립 UI 검수 attempt2: Spec/Quality PASS, C0/I0/M0, 미해결 finding 0. 최종 판정과 범위는 [ui-sol-review.md](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-review.md)에 기록돼 있다.
- Java proof는 다시 컴파일하지 않았다. 고정 SHA `527af7d57af199b72a6c83cd61a4de1771a98e32c7b6e1eafb39410ce2bfe95b`, execution의 expected/actual 13개 값, raw stdout, 선정 이미지 SHA를 신규 검사로 대조했다. 별도 proof 재실행 승인은 기존 독립검수 자료에 기록돼 있다.

## 남은 확인과 한계

- 실제 1366px 이상 브라우저에서 9개 장면의 시각·확대·스크롤·수동 복사를 확인하지 않았다. 부모 담당자의 실제 UI 검토가 남아 있다.
- inventory 갱신과 전체 harness/시각 장부 갱신도 부모 담당 작업으로 남긴다.
- Node의 비동기 clipboard 대역 테스트는 UI status와 선택 fallback의 오래된 갱신 차단을 확인한다. OS clipboard 구현의 요청 완료 순서를 보증하는 검증은 아니다.
- 이 결과는 P09 전체, 기존 24개 묶음, 전체 134개 묶음의 완료 판정이 아니다.

커밋·push·merge는 하지 않았다.
