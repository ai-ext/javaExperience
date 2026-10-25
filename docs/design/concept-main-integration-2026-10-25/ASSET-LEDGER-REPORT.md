# 자산·장부 준비 보고서

- 고정 입력: base `a70f1bd531c1b72077d56e7363ff424ba5795143`, source snapshot `af274f94e72ee2a344329c1e3bd3f1f70737c690`, virtual tree `21aa562413687cfe1957e75198b0f622f18a946c`.
- 기준 이미지 트리: JPG 602개, PNG 0개.
- 이미지 충돌: 56개. 모두 main blob 유지 계획.
- 새 concept JPG: 1743개 이식 후보. 파일 본문은 열지 않았고 Git blob ID를 기록.
- source PNG: 517개 복사 제외; 공개 제외 캡처 PNG 3개, JPG 0개.
- virtual tree PNG: 26개; main에 동일 basename JPG가 있는 경로 23개, 없는 경로 3개.

## 장부 대조

### `docs/design/visual-inventory.jsonl`

- main/source row: 50616/47304; ID 합집합 53982.
- main-only 6678개, concept-only 추가 3366개, 공유 ID 원문 충돌 38개.
- 공유 충돌은 양쪽 raw 행을 계획 JSON에 보존; 적용 시 main 행 유지.
- main 바이트 SHA-256 `94f07d06250ecdd3b056c9daf56400bcb38fb132c1b1803eea8fd5488376a4d7`; source 바이트 SHA-256 `922f1f5d1dce8ed3be8a9ba28179710d0832a4a978c6e7ce8fbf7b68a95e9319`.
- 신규 mockup PNG→JPG 경로 매핑 0개. proof 필드 값은 복사 원문 유지.

### `docs/design/visual-parity.jsonl`

- main/source row: 446/768; ID 합집합 768.
- main-only 0개, concept-only 추가 322개, 공유 ID 원문 충돌 446개.
- 공유 충돌은 양쪽 raw 행을 계획 JSON에 보존; 적용 시 main 행 유지.
- main 바이트 SHA-256 `556e1896a70996a12e2ce5f3fbb87da78224674393ee73ce60bee8f93996f367`; source 바이트 SHA-256 `27a8263cd34b50f3c649b45df6f4b46628d6d2f866fbb5f75eb36193771434c1`.
- 신규 mockup PNG→JPG 경로 매핑 0개. proof 필드 값은 복사 원문 유지.

## 검사 요구사항 경고

- main 기준 `tools/site/package.json`에는 `audit:images`가 있으나 `test:jpg`, `test:raster`는 없다. source snapshot에는 두 검사가 있다.
- source `test:raster-size.mjs`는 `docs/design/mockups-2026-10-15-batch2/05-mvc-premium.png`와 `docs/design/d02-2026-10-20/captures/mobile-url.jpg`를 요구한다. PNG는 main에 없고 같은 basename JPG만 main에 있다. 이 검사는 PNG 바이트를 요구하므로 PNG 비복사 정책과 충돌하며, 검사 상수를 바꾸지 말라는 조건도 함께 root에 보고한다.
- source `test:jpg-migration.mjs`는 `docs/design/jpg-2026-10-20/conversion-manifest.json`, P09 질문 원문, manifest의 419개 전환 destination 및 Git blob SHA 체인을 요구하며, PNG 56개 보존·363개 제거를 단언한다. 해당 manifest와 보조 파일은 main에 없다. source PNG 전체 비복사 정책과 56개 PNG 보존 assertion은 양립하지 않으므로 root가 검사 불가/정책 충돌로 기록해야 한다. 검사 상수는 변경하지 않는다.
- main `audit-image-assets.mjs`는 common-jpg manifest의 602개 배포/원본 관계, 공개 제외 PNG/JPG 부재, asset-index 및 mockup-manifest 출처, 생성 HTML 이미지 링크를 검사한다. 실제 HTML은 root build 후 검사해야 하므로 여기서는 runtime PASS 판정을 하지 않는다.

## 적용·검증 경계

- 고정 Git tree에서 장부와 자산 경로의 존재를 확인했다. 계획 JSON SHA-256 `ef2fcec20a575be3dda2c4e7e42e424c9ebe4d8793324f52f64eb18f96ed34e1`; 구현 스크립트 SHA-256 `d99f3026f65003b7c34beaddcd040e8d6acb97f66dfc81c2ea0226e2d142e150`.
- 이번 실행에서 `--write-ledgers`로 두 장부 seed를 적용했다. collector 재생성은 아직 하지 않았다.
- 장부 seed는 main raw bytes + concept-only 행이다. root 결합 collector 재생성 뒤 main-only 구 ID 누락, concept-only 추가, status 변화를 확인해야 한다.
- status 승격이나 새 `verified` 표시는 하지 않는다. 이미지 시각 검증·HTML 런타임 검증은 수행하지 않았다.

## 적용 결과 확인

- inventory main prefix 바이트 동일: 18814265 bytes, SHA-256 `94f07d06250ecdd3b056c9daf56400bcb38fb132c1b1803eea8fd5488376a4d7`; 총 53982행, 추가 `verified` 0행.
- parity main prefix 바이트 동일: 414098 bytes, SHA-256 `556e1896a70996a12e2ce5f3fbb87da78224674393ee73ce60bee8f93996f367`; 총 768행; 실제 누락 mockup 경로 0개.
- 새 concept JPG 1743개 중 실제 누락 0개; 23개 PNG→main JPG 대응 경로 누락 0개.
- main JPG 대응이 없는 virtual PNG 세 경로는 공개 제외 캡처: work/browser-qa/4-2-desktop-full.png, work/browser-qa/4-2-p2-desktop-final-full.png, work/browser-qa/4-2-p2-desktop-full.png.
