# task10 · R03 독립 감사

**판정: needs_fix.** 전체 범위 spec는 needs_completion이며, quality는 승인 없이 진단했다. important 2건을 확인했다. 원문 217줄은 현재 SHA `4e23b082e208b0a93e9debcd4be106bf8ced96847a7f26189ced3cf9fed22f1f`, HEAD는 `4b0493af52b1a06decca909d6bf9a8b6f9610686`이다. 기존 보고서의 부분구현 상태를 전체 완료로 올리지 않는다.

## 범위와 새 검사

- 의미 단위 45개: covered 10 / partial 24 / missing 9 / unrun 2. 절별 sourceLines·stageIds·근거·공백 전수표: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/source-coverage.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/source-coverage.json). 같은 줄의 여러 개념과 Q&A 반복을 분리한 개수이며 진척률이 아니다.
- `npm --prefix tools/site run test:r03`: **exit 0**, UTC `2026-10-21T23:52:45.797601+00:00` 시작. 9질문·30상태·35개 과거관측 연결, 원문/코드/기존UI, history·copy·키보드·포커스를 검사했다. [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/test-r03.result.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/test-r03.result.json)에 시점·HEAD·소스SHA·stdout/stderr 경로를 기록했다.
- 이 명령은 JSDOM/정적 JSON·동결 로그 대조다. **이번에 MySQL을 실행한 검사가 아니다.** 과거 native35PASS를 이번 native 실행처럼 읽지 않는다.

## 구현 결함

### R03-F01 · important · 정수 범위가 취소선으로 바뀜

원문 L17의 `signed -128~127, unsigned 0~255`가 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R03-schema-types-constraints.html](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R03-schema-types-constraints.html:2841)에서 `signed -128<del>127, unsigned 0</del>255`로 나온다. L21 BIGINT도 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R03-schema-types-constraints.html](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R03-schema-types-constraints.html:2861)에서 같은 방식으로 훼손된다. 숫자 범위를 읽는 데 필요한 구분자가 사라지고 범위 일부에 취소선이 붙는다.

GFM을 켜는 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs:207)와 `marked.parse` L261이 관련 경로다. [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-r03-generated.mjs](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-r03-generated.mjs:13)는 이미 훼손된 baseline text와 비교하므로 exit0이어도 이 오류를 놓친다. 기존 결과에도 있던 결함이며 새 보강이 만들었다고 단정하지 않는다.

task10에만 둔 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/reproduce-range-rendering.mjs](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/reproduce-range-rendering.mjs)를 실행해 두 표 셀의 `del=1`과 빠진 `~`를 확인했다. 결과 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/reproduce-range-rendering.result.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/reproduce-range-rendering.result.json)는 **exit1(현재 결함 재현)**이다. 수정 뒤에는 exit0이어야 한다. 원문을 바꾸지 않고 렌더링에서 숫자 범위를 보존하며, 기존 의도적 취소선/코드/링크 영향도 확인해야 한다.

### R03-F02 · important · FK 그림의 관측 경로와 실제 오류가 다름

| 대조 대상 | 직접 확인한 내용 |
|---|---|
| [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/images/R03-foreign-v3.jpg](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/images/R03-foreign-v3.jpg) 중앙2번 | `ds_practice.member` id1 삭제, 자식 `orders.member_id`, ERROR1451. footer는 MySQL8.4.11/연습사본·추가probe이고, 중앙에 일반 관계 예시라는 라벨은 없다. |
| [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-lesson-data.mjs](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-lesson-data.mjs:845) | `foreign-parent` 본문은 실제 `article.author_id`/`fk_article_author`에서 거부되었으며 orders FK로 바꾸지 않는다고 명시한다. 현재값도 article 경로다. |
| [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-lesson-data.mjs](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-lesson-data.mjs:997) / L1001 / L1009 | 이 JPEG가 선택그림이고 alt는 “foreign 관측”. foreign-parent focus `[34,10,32,58]`은 바로 member/orders 중앙 패널을 확대한다. |
| [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/source-proof/execution.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/source-proof/execution.json:685) | `extra.sourceFkParent.error.message`는 `article`, `fk_article_author`, `author_id→member.id`; code1451이다. |

`orders`에도 FK가 있다는 것은 일반 관계 예시로는 맞지만, 이 실행의 실제 실패 경로와 같다는 증거가 아니다. 처음의 minor 추정은 이미지 안의 관측 라벨·alt·focus까지 대조한 뒤 important로 정정했다. 본문이 정확하더라도 같은 관측 장면의 그림과 충돌한다.

중앙 그림을 실제 article 경로로 교정하거나 일반 예시를 명확히 분리하고 실제 관측에는 article 그림을 사용해야 한다. 새 JPEG의 표/컬럼/1451·alt·focus를 raw와 직접 대조하고 desktop/mobile 확대를 다시 확인해야 한다. 파일 로드/크기·DOM만 확인하는 현 테스트는 픽셀 속 컬럼을 검증하지 않는다.

## 전체 문서의 남은 묶음

이 항목들은 구현 결함 2건과 별도인 원문 커버리지 공백이다. 원문은 대부분 접기 안에 보존되었지만 해당 의미를 보여 주는 장면은 없다.

1. 도메인별 자료형, 5종 정수 범위/UNSIGNED/Java long, DECIMAL p·s와 허용 오차, CHAR/TEXT/JSON/ENUM.
2. VARCHAR 접두사·255 관습, TempTable/MEMORY, 전체 행/페이지 로컬 한도, 콜레이션 대소문자·악센트·정렬과 UNIQUE.
3. 자연키/대리키·업무 유일성, 정규화의 세 이상과 시점 스냅샷, FK 생략의 운영 책임·고아복구·동시 사전조회 한계.
4. 분수초/정확 날짜 경계/UTC 규칙, DDL 마이그레이션·대형ALTER/락, 오류의 도메인 응답·보존 정책 선택.

## 기술 관측과 실행 경계

- 원문 SQL2~5의 클라이언트 `\G` 종결자만 adapter에서 바꾸고, 원문 추출SHA와 SQL표현식은 유지한다. 외부 연습 schema/seed 사본과 추가 `r03_extra`, 기존 repo practice/학습자DB를 구분한다.
- 각항 CAST DOUBLE/DECIMAL 결과0/1, writer9701 대 독립 observer9700, rollback뒤 양쪽9700은 과거 raw와 stage값이 일치한다. run-proof의 observer는 autocommit READ COMMITTED다. 금액 commit 성공분기는 실행하지 않았다.
- NULL CHECK UNKNOWN, 생략 DEFAULT0 대 명시NULL1048/필수누락1364, nullable UNIQUE NULL2행/중복1062, AUTO_INCREMENT없는 PK 거부, BOOLEAN2/CHECK3819를 서로 다른 추가테이블/사본 관측으로 구분한다.
- strict mode1406·page16KiB/DYNAMIC/utf8mb4 UNIQUE 폭3072·고정 offset 시간대 관측은 해당 환경에 한정한다. nonstrict mode·콜레이션 의미 비교·다른page/rowformat·물리 page/성능은 미실행이다.
- DDL CREATE 전/뒤 observer `[]→id1`, rollback 뒤 marker는 writer, 테이블 존재는 metadata라는 경계는 실제 코드와 열람 그림에 맞는다.

## 실제 이미지 열람과 한계

선택9장 중 money-v3/foreign-v3/ddl-v2 **3장**, 과거18캡처 중 desktop-money/desktop-foreign/mobile-ddl **3장**을 `view_image`로 직접 열었다. [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/images-viewed.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/images-viewed.json)에 정확한 경로·JPEG SOI·해시·실제 bitmap 치수를 기록했다. 나머지 선택6장·draft10장·과거캡처15장은 이번에 열지 않았다.

세 과거 캡처의 bitmap은 1672×2399 / 1672×2272 / 360×2840이며, 기록된 viewport1672×941 / 360×800과 구별한다. mobile-ddl의 번역 확장 overlay와 가로 크롭은 보였지만 현재 pan조작을 실행한 것은 아니다. 현재 브라우저·DB·Java·웹·외부CLI·추가agent/LLM은 실행하지 않았다. 메인의 현재desktop/mobile 브라우저 검증이 남는다.

제품·원문·기존 근거·공유 장부·다른task·Git은 수정하지 않았다. 수정 이후 spec→quality→현재browser 순으로 재검토해야 한다.

판정: needs_fix (spec needs_completion; quality 진단 needs_fix)
fullDocumentComplete: false
커버리지: 45개 = covered10 / partial24 / missing9 / unrun2
이슈 수: critical0 / important2 / minor0
exit: test:r03=0 / 숫자범위 재현=1 (수정 뒤 기대값0)
