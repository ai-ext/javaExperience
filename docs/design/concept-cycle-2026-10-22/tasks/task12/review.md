# task12 · W15 독립 감사

판정: **needs_completion**, fullDocumentComplete=false. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 원문 SHA `9937498a3b948f96099dca7bb625573bdc40879254c82c67afc465dee663108b`.

## 1. spec 검토

원문283줄 전체를 현재9질문25장면·HTML·source-proof에 대조했다. 의미단위 49개: partial 22, covered 18, missing 7, unrun 2. 상세 sourceLines/stageIds/evidence/gap은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/source-coverage.json에 있다. covered는 기존장면/저장근거의 대응이며 이번 native 실행을 뜻하지 않는다. 원문 보존과 새 학습장면 범위를 분리했다.

### W15-SPEC-01 · important · 범위 공백

원문의 방식 선택·실무/마이그레이션 의미 단위가 9질문25장면에 없다.

- 위치: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-lesson-data.mjs:7659
- 근거: 원문 L3-5,13,22,74-86,200-205; lesson ids offset/boundary/spring/window/sort/shift/mutable/snapshot/token. 원문은 접힌 #w15-original에 보존되지만 전용 선택 장면은 없음.
- 보강: 요구(임의점프/total/순차피드), 크기 상한, 기존URL 의미 보존·v2이행, 혼합 endpoint를 작은 결정 사례로 보강.
- 재검증: 새 장면↔sourceLines 매핑, 선택 입력/기대 결과 검사, 원문보존/test:w15, 메인 desktop/mobile 확인

### W15-SPEC-02 · important · 범위 공백

페이지 응답·탐색 계약 중 마지막 nextCursor=null, 번호점프/역방향/조건변경 cursor 무효화가 장면에서 빠져 있다.

- 위치: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-lesson-data.mjs:7672
- 근거: 원문 L185-196,263-267. boundary-peek는 반환50번째 vs peek만; window-keyset는 final last=true만. UI 이전은 DB 역방향과 다름.
- 보강: 응답 계약의 종료 null과 순차/점프 제한, 이전 cursor stack 또는 역정렬 및 조건 변경 무효화를 설명/검증하는 장면 추가. HTTP API는 구현하지 않는 범위를 유지 가능.
- 재검증: 마지막 창 {items,nextCursor:null} 기대 계약 검사 및 탐색사례 expected ids/정렬·필터 일치 검사; 실제 API 미실행 표시 유지

### W15-SPEC-03 · important · 범위 공백

covering 성공 계획만으로 원문의 부적합 index/filesort/선택도 조건을 전부 가르치지는 못한다.

- 위치: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-lesson-data.mjs:7664
- 근거: 원문 L33,90,117,223,258; source-proof plans 4개 모두 idx_feed covering. 정렬/필터 부적합 실제 plan은 없음.
- 보강: covering500/50 한계를 유지하고 나쁜 계획은 측정된 추가 근거가 있을 때만 장면 보강; NULL 정상 정책, watermark/export, 권한 재검사도 남은 범위로 관리.
- 재검증: 원문 의미단위 커버리지 재검토. 새 측정은 메인이 별도 승인 범위에서 수행; fresh 하네스 통과로 대체 금지

## 2. quality 진단 (spec 승인 전)

새 critical/important 기술 결함은 확정하지 않았다. quality 승인은 보류한다. 기존 공통 clipboard 지연 race는 task9의 메인 수정목록에서 관리하므로 중복 재현하지 않았다.

OFFSET450과 원문 literal cursor는 다른 페이지다. 별도 row449 경계 seek만 OFFSET450과 같은50행이며 covering iterator500/50은 물리 I/O나 고정 시간 배수가 아니다. tuple·동률20 누락·혼합방향·peek 경계, 조건부 COUNT, Window 초기/배타 위치와 종료 관찰은 저장 결과/코드와 맞는다. 앞삽입/삭제/mutable는 writer 통제순서, RR snapshot만 두연결임을 정확히 구분한다. 원문 Java2는 보존됐지만 Article/schema/seed/standalone JPA/JDBC wrapper는 추가 실험이고 JDK21 실행은 Java25/Boot/HTTP/DTO/consume 업무효과를 인증하지 않는다.

## 3. fresh 하네스와 시각 근거

`npm --prefix tools/site run test:w15`: exit0, UTC 2026-10-21T23:56:55.632945+00:00 → 2026-10-21T23:57:12.736995+00:00. raw output: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/fresh-test-w15.log, HEAD/12개 파일 SHA: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/fresh-test-w15.json. 원문15265자/code4/id23/기존map 보존 및25상태/frozen/native18+Java25 ASSERT ID 연결 검사를 통과했다. 실제 native/Java 실행이 아니라 기존 결과 정합성 검사다.

실제 view_image 열람:

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/images/W15-offset-v2.jpg · JPEG 1672×941
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/images/W15-boundary-v3.jpg · JPEG 1672×941
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/images/W15-snapshot-v3.jpg · JPEG 1672×941
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/mobile-boundary.jpg · JPEG 360×2829
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/desktop-offset.jpg · JPEG 1672×2272

시안3장과 역사 캡처2장만 직접 보았다. 선택9장/역사18장 전수나 현재브라우저 검증이 아니다. 역사 mobile 확대에서 우측 crop과 pan/전체그림 안내가 보인다. 캡처 actual 높이는 viewport와 다르므로 fullpage 치수를 viewport로 쓰지 않는다.

## 4. 남은 묶음

선택·실무/마이그레이션, 마지막 null/번호점프·역방향·무효화, 부적합 계획/NULL 정상 정책·watermark/export·권한 계약을 분리 보강한다. 측정하지 않은 결과를 추가하지 않는다. 수정 뒤 spec→quality와 메인 현재 desktop/mobile 조작이 필요하다. web/외부CLI/nativeDB/Java/브라우저/다른LLM은 이 감사에서 실행하지 않았다.

판정: needs_completion; 전체완료 false.
자동검사: test:w15 fresh exit0, 현재 HEAD·SHA에 귀속.
범위: 의미단위49개, 부분 보강과 원문 보존을 분리.
확정: 새 기술 important/critical 없음; spec 공백3묶음.
후속: 공백 보강 → fresh spec/quality → 메인 현재브라우저.
