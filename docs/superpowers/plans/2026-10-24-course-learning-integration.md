# 단계형 과정의 학습 도구 통합 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. 메인이 설계·프롬프트·검증을 담당하고, 명세가 정해진 구현은 gpt-6-luna가 담당한다. 원본 worktree는 변경하지 않는다.

**Goal:** main을 포함한 feat/course-stepper-design의 PC·다크 화면에서 현재 구현 순서에 맞는 API 요청·실제 응답·직접 DB 확인을 수행한다.

**Architecture:** 시작 커밋62d75618은 main a70f1bd5를 포함한다. main의 course/days·명세·학생/예시 서버·진도 저장을 보존하고 렌더러가 추가 학습 도구를 주입한다. 구버전200/본문id/offset/조회수증가 계약은 가져오지 않는다.

**Tech Stack:** 기존 Node ESM·esbuild·HTML/CSS/JS, JSDOM, Chrome CUA, 격리 MySQL/Redis와 변경하지 않은 board-server.

## 1. 기준과 보존
- [x] 원본 브랜치가 clean이며 최신 main을 포함하는지 확인하고 별도 feat/course-learning-integration worktree를 생성한다.
- [x] 보호 소스918파일의 SHA baseline을 별도 research에 기록한다. 원본 데이터/서버는 이번 UI 통합에서 수정하지 않는다.
- [x] 기준 검사에서 D00 hashchange를10ms로 기다리는 테스트 실패를 재현했다. 실제 로직을 바꾸지 않고 이벤트를 기다리는 검사로 고친다.
- [ ] 기준 과정 검사와 생성 HTML 검사 후 이후 변경을 시작한다.

## 2. PC 다크 시안과 화면
- [ ] 실제 imagegen으로 열린 API 도구 상태를 만들고 main의201/204 계약과 맞는지 검수한다. 원본과 같은 픽셀 수의 JPG를 보존한다.
- [ ] 현재 순서의 만들 것·완료 조건은 그대로 두고 그 아래 선택적으로 여는 ‘내 서버에서 결과 확인’ 도구를 배치한다. 도구를 조작해도 일자/구현 체크를 바꾸지 않는다.
- [ ] 도구는 요청·실제 응답·DB 확인의 두 열 배치를 사용하며 PC1366×768/1440×900/1920×1080에서 확인한다. 신규 모바일/라이트 작업은 하지 않는다.

## 3. v2 API 계약과 렌더러

Files: tools/site/course-api-contracts.mjs, course-api-workspace.mjs, course-api-workspace.css, test-course-api-contracts.mjs.

| 순서 | API 도구 | 성공 계약 |
|---|---|---|
| D04-5 | create POST /api/posts | 201 + Location, 본문 없음 |
| D05-1 | detail GET /api/posts/{postId} | 200 상세 JSON, 조회수 증가를 가정하지 않음 |
| D05-2 | replace PUT / partial PATCH / delete DELETE /api/posts/{postId} | PUT/PATCH200 상세 JSON, DELETE204 본문 없음 |
| D05-6 | like PUT / unlike DELETE /api/posts/{postId}/like | 둘 다204 본문 없음 |
| D06-4 | list GET /api/posts | 200 items/nextCursor; cursor,size,keyword,tag,sort |

- [ ] 순서 ID와8개 계약을 정확한main 소스에 연결한다. 같은 순서의 API는 선택창으로 바꾼다. 선택만으로 요청하지 않는다.
- [ ] SQL은 구현 예시의 post/member_id/status/like_count/post_like를 사용한 수동 확인 예시다. 학습자의 설계 테이블에 맞게 바꾸도록 표시하고 실행하지 않는다.
- [ ] 데이터와 UI는 esc/payload로 이스케이프하고 초기 요청/복사 버튼은 비활성으로 둔다. init 후에만 요청할 수 있다.

## 4. 요청·응답·다음 순서 연결

Files: tools/site/course-api-client.mjs, course-api-entry.mjs, test-course-api-client.mjs. Main hook: course-pages.mjs/build.mjs/package.json.

- [ ] 실제 전송 버튼에서만 snapshot(method/url/id/body/token)을 만들어 호출한다. Authorization과 JSON 본문을 URL이나 저장소에 쓰지 않는다.
- [ ] status/header/body를 실제값으로 표시한다. raw 본문은 가공·추정·정답 보충하지 않는다.204 또는201의 빈 본문을 파싱 오류로 처리하지 않는다.
- [ ] POST의 Location은 같은backend origin의 정확한 /api/posts/양의정수 경로만 id로 채택한다. body.id를 추정하지 않는다. Location이 브라우저에 노출되지 않으면 이를 설명하고 사용자가 확인한id를 명시적으로 저장하게 한다.
- [ ] 별도 sessionStorage키 javaexperience.course.api-context.v1에 version/base/id/provenance만 보관한다. 토큰·요청 본문·응답 본문은 저장하지 않는다. 저장소 차단 시 화면 사용은 유지한다.
- [ ] 알려진 글 삭제204는 같은base/id의 이어하기만 지운다. like/unlike204는 글id를 지우지 않는다. 요청 중 입력이 바뀌면 전송snapshot에 대한 응답임을 명확히 표시한다.
- [ ] CORS는 main이 허용한localhost:3000 문서 origin에서 확인한다. 원래8765 서버를 종료하거나 backend의 허용 출처를 확대하지 않는다. Location 미노출은 수동id/원문curl 확인으로 구별한다.
- [ ] 요청 복사는 입력 토큰을 포함한다는 사실을 표시하고 명시적으로 클릭할 때만 복사한다. 실패 시 readonly 대체란에서 선택할 수 있게 한다.

## 5. 다크 셸과 기존 내용 보존
- [ ] 참고 문서의 자동/light 분기를 고정 dark로 맞춘다. Mermaid도 dark로 초기화한다. 기존 의미별 색을 무조건 반전하지 않는다.
- [ ] 현재45일135순서·필수 관찰·제출 증거·진도key를 그대로 유지한다. 원문코드·서버·예시DB에 손대지 않는다.
- [ ] 이전 시나리오/개념 branch 전체 이력을 합치지 않는다. 필요한 기능 원리만 v2로 구현한다. 전체 개념 확장은 별도 후속 작업으로 남긴다.

## 6. 검증과 저장
- [ ] 계약·렌더·전송·원문응답·진도·저장 차단·id 범위 회귀검사, build·course·home·navigation·knowledge 및3audit/이미지검사를 수행한다.
- [ ] 소유한 disposable MySQL/Redis와 같은main board-server로 API8개와 순차 재요청/실패를 확인한다. CLI/브라우저/SQL 증거를 구별하고 자기 소유 자원만 정리한다.
- [ ] CUA 실제PC 화면에서 도구 열기·선택·전송·복사·복귀·강조·가로 넘침을 확인하고 캡처한다.
- [ ] SHA보존, 공개제외 캡처/history 비유입, 시안과실제차이를 기록한 뒤 로컬커밋·복원백업을 남긴다. 전체 개념/기존이미지 전부완료라고 표시하지 않는다.

## 7. 현재 main 코드의 Post 값 흐름 연결
- [ ] D04-4에 객체 생성·기존 태그 연결·INSERT 뒤(commit 전)·commit·rollback5상태를 같은예제의 코드/Java/DB/별도새autocommit 연결로 비교한다. 예시는회원2·기존태그7(spring)·게시글42이며 실제요청도구의값과연결하지않는다.
- [ ] Post 생성 직후 BaseEntity 감사시각은 null이며 저장 감사처리 뒤 t0다. Java의 member 참조와 DB member_id, PostTag 참조와 post_tag의FK를 구별한다. rollback뒤Java 현재값을계측했다고표시하지않고 마지막저장스냅샷으로표시한다.
- [ ] 기존태그재사용사례만기본으로보여준다. 최종참고구현의D07포인트·D09캐시는기본장면에쌓지않고 전제상세에서만범위를밝힌다.
- [ ] 새 imagegen 참조와 순수모델/키보드/비전송 검사를 먼저 만든다. 실제 동일 main JAR과 별도disposableDB에서 커밋 전 observer·최종commit·커밋 전 오류rollback을 별도 검증한다. 실험의 READ UNCOMMITTED 관찰을 앱 내부 연결이라고 표현하지 않는다.
- [ ] 원본서버코드와 schema.sql은보존한다. 실험용지연/실패trigger와fixture초기화는해당일회용DB에만설치하고 기록한다. Javaheap측정/SQL실행순서전체/캐시값을측정했다고과장하지않는다.
