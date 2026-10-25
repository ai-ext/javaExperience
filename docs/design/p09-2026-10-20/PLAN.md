# P09 개념 학습 실행 계획

확인일: 2026-10-20 KST. 사용자 요청으로 기존 `visual-learning-next`의 미커밋 변경까지 복제한 `concept-learning-night`에서 작업한다. 기준 커밋은 `aed347f`다. 기존 worktree, 홈, 시나리오, 미션, 학습자 서버 코드는 수정하지 않는다. 이후 개념 문서 작업은 문서별로 같은 검증 절차를 적용하며 P09의 완료 조건을 축소하지 않는다.

1. 원문 전체 1~489줄을 읽고 질문·의미 장면·예제 경계를 기록한다 → `questions.json`의 원문 줄과 실제 문서를 대조한다.
2. `gpt-image-prompt/SKILL.md`, `references/learning-contract.md`, `references/verification.md`를 적용해 장면별 이미지를 생성한다 → 다운로드 원본·프롬프트·실제 크기·교정 기록을 남긴다. 웹에는 경로 대신 제작 기준과 실제 예제·장면 요구사항을 본문으로 전달했다. 파일 업로드는 확장의 파일 URL 접근 설정 때문에 실패했다.
3. 검수한 시안의 타이포·배치·연결을 실제 P09 학습 화면으로 구현한다 → 장면 선택/이전/다음/비교가 이미지·값·코드 강조·짧은 설명을 함께 바꾸는지 검사한다. 원문과 기존 앵커는 보존한다.
4. 원문 순수 Java 실행·추가 상태 관찰·컴파일 실패 사례를 대조한다 → `source-proof/`에 코드·실행 환경·출력·판정을 저장한다. 원문 출력과 추가 예시를 구별하고 Spring HTTP는 미실행으로 유지한다.
5. 빌드와 관련 회귀 검사 및 필수 시각 검사를 실행한다 → 실제 데스크톱·360px 조작·원문 보존 결과를 기록하고 이미지와 나란히 대조한다. 증거가 없는 장면은 `verified`로 올리지 않는다.
6. 질문별 이미지/구현/검사 연결과 통합 안내를 마무리한다 → 기준 커밋 이후 변경 범위를 확인하고 원래 worktree의 상태 해시가 그대로인지 검증한다.

## 파일 역할

- `questions.json`: 각 학습 질문, 원문 범위, 이미지·조작·검사 대응표. DOM 블록 수를 장면 수로 취급하지 않는다.
- `source-proof/`: 원문 예제와 별도 설명용 검증 코드 및 실제 실행 결과.
- `tools/site/p09-*.mjs`, `tools/site/p09-*.js`, `tools/site/p09-*.css`: 학습 데이터·HTML·상태 전환과 스타일을 P09 전용으로 분리한다. 정적 HTML과 기존 classic bundle 방식을 따른다.
- `tools/site/build.mjs`: P09에만 새 화면과 원문 보존 영역을 삽입한다. 공통 홈/미션/시나리오 로직은 바꾸지 않는다.
- `docs/design/visual-parity.jsonl`: 실제 시안·데스크톱·모바일·기술·조작 증거가 있는 단위만 기록한다.

## 현 상태와 이미지 재사용 판단

기존 홈 `new` 이미지는 `Greeting.name=김자바`, `message=김자바님, 반가워요`, `nameLength=3`인 다른 예제다. P09 `Greeting.message=Hello, Ada` 또는 `Profile.nickname=Ada/Grace/Local only`와 필드·값이 달라 재사용하지 않는다. 연결·재질 기준의 참고만 가능하다. P16의 keyboard·수량 2 역시 P09와 혼합하지 않는다.

원문 `PassByValueDemo`, `MethodsDemo`, `OperatorsDemo`는 JDK 21.0.6에서 재실행해 출력 전체와 끝 공백까지 일치했다. `source-proof/execution.json` 참조. Spring Boot 4.1.1/Java25 HTTP 예제는 실행하지 않았다.

## 완료 판정

이미지 생성 요청 제출은 이미지 생성·다운로드·검수를 뜻하지 않는다. 데이터나 UI만 준비한 상태로 목표 완료를 선언하지 않는다. 각 질문의 독립 장면과 추가 경계(접근 제어, final, ==/equals, 증감, main, 오류)까지 이미지·동작·기술 증거로 확인한다. 사용자의 이해도 검증은 별개이며 실시하지 않은 경우 그대로 적는다.
