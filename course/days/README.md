# 날짜별 과정 편집 원본

하루 내용을 고칠 때는 그날의 `Dnn.json` 하나만 읽고 고친다. 이 폴더는 학습 사이트의 HTML 렌더 대상이 아니다.

## 파일 구조

- `D00.json`~`D45.json`: `id`, `roadmap`, `java`, `hints`, `cards`를 묶은 하루 원본이다.
- `_common.json`: roadmap의 전역 값, hints의 공통 채점 템플릿·API 구현 안내, 카드 문서의 머리말이다. 날짜 목록은 넣지 않는다.
- `README.md`: 편집·추가 방법이다.

`roadmap`에는 날의 메타·목적·순서·만들 파일·파일별 동작·완료 조건·명세 참조·티켓·카드 연결이 들어 있다. `java`는 같은 날 Jnn의 주제·기초 연습·타입 한 컷·습관 메타다. `hints`에는 순서별 힌트·리뷰 초점·참고 자료·오늘의 SQL·관찰·채점 관련 날별 값이 들어 있다. `cards`는 `## Dnn 제목`부터 그날 마지막 카드까지의 Markdown 원문을 JSON 문자열로 보관한다. 카드 ID·나열 순서는 `roadmap.talkCards`와 같아야 한다. 빈 줄과 마지막 개행도 합본에 그대로 이어 붙인다.

`roadmap.steps[].presentation`은 완료 조건의 표시 유형이며 기술 내용이나 채점 기준은 변경하지 않는다. `contract`, `sequence`, `comparison`, `evidence`는 각각 요청·기대 결과, 실행 순서, 조건별 대조, 증거·판단 문서를 표시하고, 화살표 구분은 `contract`·`comparison`에서 코드와 링크 밖 첫 `→`에만 적용한다.

D00은 선택 Java 워밍업이다. 기존 출력에 별도 roadmap·hints·카드가 없으므로 `roadmap: null`, `hints: null`, `cards: ""`이고 `java.day`도 `null`이다. 다른 날에서 `hints: null`은 기존 생성기의 준비 중 페이지 의미를 유지한다.

## 새 날짜 추가

작업 중인 저장소 루트에서 가장 비슷한 날을 복사한다. 다음 예는 기존 D16을 처음 추가하던 때의 출발 틀이다. 현재 D16–D45는 이미 있으므로 덮어쓰지 않는다. 이후 확장에는 총 일수 정책과 실제 분량을 먼저 검토한다.

```bash
cp course/days/D15.json course/days/D16.json
```

복사본의 구조는 그대로 유지하며 다음 값을 고친다.

1. 최상위 `id`와 `roadmap.id`를 `D16`으로 고친다.
2. `roadmap.java`, `java.id`는 `J16`, `java.day`는 `D16`으로 고친다.
3. `roadmap`의 phase·제목·목적·순서·파일·완료 조건·명세 참조·티켓·다음 날 안내를 실제 계획으로 채운다.
4. `hints`의 힌트·SQL·관찰·참고·채점 값을 새 날에 맞춘다. 공통 템플릿 전체를 복사하지 않는다.
5. `roadmap.talkCards`와 `cards`의 제목·카드 ID를 `TC-D16-n`으로 함께 바꾸고 질문·답·근거를 작성한다. `talkCardLinks`가 있으면 그 키·순서·티켓도 맞춘다.

생성기는 파일명을 정렬해 D00부터 연속으로 읽으며 D16 이후도 자동 발견한다. 공통 파일에 날짜 목록을 등록할 필요는 없다. 날짜가 빠지거나 본문 ID·Java 연결·카드 날짜·카드 순서가 다르면 실패한다.

**현재 45일 확장.** D16~D45는 `extend` 단계다. Java의 `reuse`·`labFile`·`acceptance`로 J16~J45 연결 문서를 함께 생성한다. `prerequisite`·`workTarget`·개인 경로·`steps[].dayRefs`의 선행 명세 연결를 빠뜨리지 않는다. `hints.grader.meeting`은 역할·반론·다섯 채점 기준, `dataSetup`은 직접 설계한 실험 데이터 요구를 담는다. 현재 `totalDays`는 `_common.json`에서 45로 관리한다.

**달력 확장은 별도 과정 변경이다.** 초기 날짜별 리팩터링은 15일을 유지했으며 P9에서 45일로 확장했다. D16 이후를 실제 공개할 때는 해당 정책 검사(`tools/course/validate.mjs`), 홈·일정 안내와 Java 문서·흐름·정답 커밋 같은 관련 자료도 함께 확장해야 한다. build 단계는 대응하는 `answer(Dnn-m)` 정답 커밋이 필요하다. 원본 파일 추가만으로 교육 내용까지 완성되지는 않는다.

## 생성물 규칙과 검증

`course/spring/*.md`, 모든 생성 HTML, `course/roadmap.json`, `course/hints.json`, `course/talk-cards.md`는 편집 원본이 아니다. **내용을 고치기 위해 읽지도 고치지도 말고 빌드로 만든다.** 결과 대조는 검증 도구에 맡긴다. 기존 문서 링크와 채점 프롬프트를 보존하기 위해 세 합본은 계속 생성한다. JSON의 첫 `$comment`는 표준 JSON 안의 생성물 경고다. 카드 합본은 기존 원문과 바이트가 같도록 경고를 추가하지 않는다.

```bash
cd tools/site
npm run build
npm run check:course-data
npm run test:course
npm run validate:course
npm run test:course-pages
```

`check:course-data`는 합본의 손편집·누락·공백 차이까지 검사하며 파일을 고치지 않는다. `validate:course`도 이 검사를 수행한다. 생성기·검증기·화면 렌더러·내용 테스트는 합본 대신 날짜 원본을 읽는다. 합본 비교 테스트만 호환용 파일을 읽는다.
