# Task B Luna implementation log

## Scope

- 구현: `knowledge-reader.mjs`, `knowledge-reader.js`, `knowledge-reader.css`, `test-knowledge-reader.mjs`
- 연결: `build.mjs`, `package.json`, `home-visual.mjs`, `knowledge-catalog-view.mjs`, `test-knowledge-dark.mjs`
- 원문 Markdown, `source-baseline.json`, source IDs, Java code, 기존 history controller 계약은 수정하지 않았다.

## RED observations and fixes

- 생성 상세 원문 selector 해시가 실패했다. 원인은 장면을 상세 body에 미리 삽입한 뒤 그 전체를 다시 reader source로 넘겨 생성 장면이 원문 영역에 중복된 것이었다. reader 경계를 실제 원문 body와 별도 visual wrapper로 나눴고 기존 원문 text/code 해시가 통과한다.
- 목차가 H2 외에 H3 질문 topic ID도 포함했다. 변환된 `details.knowledge-chapter > summary`만 목차 metadata로 수집하도록 제한해 source H2와 1:1로 맞췄다.
- 초기 ID 고유성 단언은 P09의 기존 중복 source ID를 reader가 만든 중복으로 잘못 분류했다. reader가 사용하는 `kr-scene`, `kr-reading`의 기존 source ID 충돌만 확인하고, baseline의 모든 기존 ID 보존 검사는 유지했다.
- P09 원문 wrapper가 접히는 상태를 발견해 `.knowledge-chapters`를 감싼 원문 details는 read에서 열고, Q&A topic 및 심화 details는 별도로 접도록 수정했다.

## GREEN commands

- `npm run build` — HTML 339개 생성, 링크 오류 0
- `npm run test:concept-dark` — 136페이지 테마 scope, body class, 마지막 stylesheet, source baseline 통과
- `npm run test:concept-reader` — 134개 source text/code/Markdown SHA와 ID 보존, H2 목차, hash/history, 순수 문서 기본 읽기, 홈·카탈로그 진입 통과
- `npm run test:home` 통과
- `npm run test:knowledge-catalog` 통과
- `npm run test:navigation` 통과

## 확인 범위

- actual Chrome의 PC 시각 검증과 전체 24개 harness 및 3개 audit은 메인 담당자가 마무리한다.
- 134개 문서의 원문은 보존됐으며, 134개 전부에 새 장면 UI가 생겼다고 주장하지 않는다.

## Sol spec FAIL 후속 수정

- read 모드의 펼침 상태를 부모 chapter 제목으로 결정한다. Q&A chapter는 질문 heading만 열고 답 topic을 닫으며, 참고문헌·선택 심화 chapter는 닫는다. 내부의 일반 `details`를 전체 순회해 자동으로 열지 않는다.
- 원문에 같은 ID의 H1이 이미 있으면 새 복제본을 만들지 않는다. 별도 짧은 reader H1은 ID 없이 만들고 `tabindex="-1"`로 focus 가능하게 했다. 원문 H1은 DOM에 보존하고 read CSS에서 숨긴다.
- reader content wrapper를 `div`로 변경해 generated document의 `main` landmark를 하나만 둔다.
- scene 모드에서는 TOC 열을 숨기고 기존 `.p09-workspace`를 그림/관찰 패널 2열로 넓혔다. read 모드 TOC는 `top: 96px`로 내렸다.
- read 모드 chapter/topic 제목을 각각 24px/20px로 올리고 원문 H1·outer original summary를 숨겨 산문을 평탄화했다. 표는 table 자체에 내부 horizontal scroll을 둔다.
- 카탈로그에는 새 링크를 추가하지 않고 기존 `.kc-result-open`만 `?read=1`로 연결한다. 질문 제목/`data-kc-open`/복귀 경로는 유지한다.
- metadata의 `<T>` JSON roundtrip, 생성 DOM의 전체 ID 고유성과 단일 main, 실제 P09/J01/S09/W11 chapter 상태, 읽기 제목 focus 및 stale history key와 `read=1` 우선순위를 회귀 검사에 추가했다.

### 후속 GREEN 확인

- `npm run build` — HTML 339개 생성, 링크 오류 0
- `npm run test:concept-dark`, `npm run test:concept-reader`, `npm run test:home`, `npm run test:knowledge-catalog`, `npm run test:navigation` — 통과
- `git diff --check` — 통과

## Sol attempt 2 후속 수정

- P16의 `p16-original-title`은 reader 조립 후 첫 H1에 붙이지 않고, `readerSourceTitle`에만 적용해 원문 제목 H1을 숨긴다. 장면의 `#p16-heading`은 class를 유지해 표시되며 전역 ID 고유성도 검사한다.
- 19개 `test-*-generated.mjs`는 승인된 원문 제목 query를 `main>h1, h1.kr-source-title`로만 넓혔다. 원문 text/code/ID/baseline 비교는 변경하지 않았다.
- `npm run build`, `test:concept-reader`, `test:concept-dark` 통과. 승인된 19개 generated test도 모두 직접 실행해 통과했다.
- 메인 담당자의 full 24 harness와 실제 PC 화면 검증은 다음 단계다.

## Sol attempt 3 후속 수정

- read 모드에서 숨길 original wrapper summary를 `.knowledge-reader-original`의 직계 `details[class$="-original"]`에만 한정했다. nested `.version-original`은 접힌 채 summary를 통해 사용자가 열 수 있다.
- Q&A chapter에 H3 topic이 없고 `<p><strong>Qn…</strong>` 문단이 있는 경우, 기존 strong 질문 노드를 summary로 이동하고 답 문단/후속 목록을 접힌 `details.knowledge-topic` 안에 한 번씩 둔다. Q&A 범위 밖의 목록은 변환하지 않는다.
- P11의 유일한 Q&A `<ol><li><strong>질문</strong>답…</li></ol>` 형식도 해당 Q&A section에서만 list item을 접기 항목으로 바꿨다. 원문에 없는 Q 번호를 만들지 않는다. D13에는 Q&A를 추가하지 않았다.
- scene 원본에 H1이 없으면 toolbar 문서 제목을 H1로, scene에 H1이 있으면 H2로 만든다. read에서는 toolbar 제목 블록을 숨기고 짧은 reader H1만 남긴다.
- 신규 회귀는 28개 문단형 Q&A 문서의 생성 항목 수와 P11 목록형 답 접힘, 실제 R03/R04/B01/D10 답 접힘, J03 접힌 version summary, R03/P09/P16 H1 계약을 확인한다. 기존 134개 원문 text/code/Markdown SHA, ID 고유성, 단일 main 검사는 유지한다.
- `npm run build`, `test:concept-reader`, `test:concept-dark`, `test:home`, `test:knowledge-catalog`, `test:navigation`, `git diff --check` 통과.
