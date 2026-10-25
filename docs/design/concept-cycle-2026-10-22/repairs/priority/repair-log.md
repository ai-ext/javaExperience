# 중요 수정 로그 · 2026-10-22

기준 HEAD는 `4b0493af52b1a06decca909d6bf9a8b6f9610686`이다. 기존 review.json·bounded verdict·원문·html-baseline·source-proof/raw/frozen과 과거 이미지 기록은 수정하지 않았다.

## RED → GREEN 및 구현

| finding | RED 재현 | 수정과 GREEN |
|---|---|---|
| task10.fix1 · R03 숫자 범위 | `node tools/site/test-r03-generated.mjs` — exit 1. 역사 baseline의 두 구절에서 `~`가 빠진 현재 생성 원문을 검사했다. | Marked 15.0.12 `del` token의 raw 값이 `~127, unsigned 0~` 또는 `~2⁶³-1 / unsigned 0~`이고 문서가 R03일 때만 escaped literal을 반환한다. 그 외 token은 marked 기본 renderer에 위임한다. 역사 baseline의 정확히 두 구절만 승인 보정하고, 그 외 원문 text/code/ID/map은 기존 기대와 맞춘다. `npm --prefix tools/site run test:r03` — exit 0. 보정 전후와 baseline SHA는 `correction-manifest.json`에 기록했다. |
| task10.fix2 · R03 FK 그림 | `node tools/site/test-r03-generated.mjs` — exit 1. asset이 아직 `R03-foreign-v3.jpg`였다. | 부모가 만든/검토한 후보의 raw SHA와 prompt를 보존하고 JPEG quality 92, 1672×941로 `R03-foreign-v4.jpg`를 만들었다. R03_ASSETS의 해당 파일명만 교체했다. target header `ffd8ff`, bytes 554912, SHA `ffe4c52cb656c149b9b35dc961dc9cf25414193ed84b4824f9fbc3ffd3d1f86e`. 회귀는 활성 R03_ASSETS 경로가 manifest targetJPEG와 같은지 확인한 뒤 그 파일의 hash·크기를 대조하고 v3 보존을 확인한다. |
| task11.fix1 · R04 DML 전체 복사 | `node tools/site/test-r04-full-dml-copy.mjs` — exit 1. 정적 원문 상수가 없었다. | block13 전체 바이트를 R04 data module의 정적 상수로 넣었다. DML topic에만 전체 복사 버튼을 보이고, 기존 코드는 현재 발췌만 복사한다. 실패하면 원문 전체 수동 복사 영역을 열고 안내한다. 두 copy handler 모두 장면 version을 확인해 늦게 끝난 promise가 다른 장면의 status를 바꾸지 않는다. 모바일 header/actions에 wrap CSS를 적용했다. 새 검사를 `test:r04`에 등록했다. `npm --prefix tools/site run test:r04` — exit 0; 전체 SQL의 끝 개행까지 원문과 byte-equal, 버튼 표시 범위·두 payload·실패 안내·두 race를 검사한다. 334px 실제 배치는 메인이 브라우저에서 확인한다. |
| task20.fix1 · D06 Local/Dev 그림 | `node tools/site/test-d06-generated.mjs` — exit 1. asset이 아직 `promotion-v4.jpg`였다. | 부모가 만든/검토한 후보의 raw SHA와 prompt를 보존하고 JPEG quality 92, 1672×941로 `promotion-v5.jpg`를 만들었다. D06_ASSETS의 해당 파일명만 교체했다. target header `ffd8ff`, bytes 692694, SHA `236e10eea522907505167fe6522de2a0724126370095a472796f9b7e25c17fdb`. 기존 v4 및 기존 image-records.json은 보존했다. 회귀는 활성 D06_ASSETS 경로가 manifest targetJPEG와 같은지 확인한 뒤 그 파일의 hash·크기를 대조한다. 나머지 12개는 기존 image record를 계속 대조한다. |

R03 후보는 가운데 오류1451 관계를 `article.author_id → member.id`, `fk_article_author`로 표기한다. D06 후보는 Local 개인 확인과 Dev 공유 통합을 두 줄로 구분한다. 두 JPEG와 raw PNG는 직접 열어 target 해상도·텍스트와 주변 패널 보존을 확인했다. 입력/프롬프트/원본/변환/target hash와 크기는 [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/correction-manifest.json](</Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/correction-manifest.json>)에 기록했다.

## 최종 구현 검증

- `npm --prefix tools/site run build` — exit 0, HTML 339개 생성, 링크 오류 0.
- `npm --prefix tools/site run test:r03` — exit 0.
- `npm --prefix tools/site run test:r04` — exit 0.
- `npm --prefix tools/site run test:d06` — exit 0.
- `npm --prefix tools/site run audit:version-cards` — exit 0.
- `npm --prefix tools/site run audit:parity` — exit 0, 730개 기록 검사, verified 0개.
- `python3 -B docs/design/concept-cycle-2026-10-22/summarize.py --require24` — exit 0, schema/source/review validation 0 errors. 현재 출력은 기존 harness 결과 24개를 historical passed로 보존하고, 코드 변경으로 currentPassed 0 / stale 24로 분리했다. 부모가 전체24 harness를 다시 실행한 뒤 같은 명령을 재실행하면 최신 fingerprint 기준을 계산한다.
- `audit:visual`은 `docs/scenario-visual-state.json`을 덮어쓰므로 실행하지 않았다. 이 shared status 파일은 현재 소유 범위 밖이며 메인이 갱신한다.
- 새 native DB, 기존 데이터, 실제 브라우저는 실행하지 않았다. 수정 후 브라우저 비교와 독립 Sol spec→quality 검토는 메인이 진행한다. commit/push/merge는 하지 않았다.
