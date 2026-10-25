# D12 inventory 및 parity 장부 반영

## 결과

- visual-inventory.jsonl은 47,304행을 유지한다. typed D12 stage 45개는 각각 CLI를 두 번 호출해 unreviewed → mockup_ready → implemented로 표시했다. CLI 호출은 총 90회이며 모두 exit 0이다.
- mockup_ready 근거는 selected-images.json의 선택 asset과 destination이고, implemented 근거는 MAIN-VISUAL-REVIEW.json 및 해당 stage의 current base/zoom 캡처다.
- 최종 상태 합계: unreviewed 46,388, implemented 910, verified 6, mockup_ready 0.
- 기존 HEAD inventory 47,254행의 status/evidence/updatedDate 변경은 0건이다. 추가 nonstage toggle 5행도 모두 unreviewed, 빈 evidence, 빈 updatedDate를 유지했다.
- D12 summary page는 in_progress이며 단위 182개, toggle 29개다. VISUAL-PAGES.md와 summary는 --mark CLI가 갱신했다.
- CLI가 updatedDate를 UTC ISO 날짜로 기록해 typed 45행은 2026-10-24다. parity checkedAt은 검수일 2026-10-25로 기록했다.

## Parity

- 기존 750행 뒤에 D12 선택 시안 16개 record를 append했다. 최종 766행이며 D12 record는 모두 implemented, verified는 0이다.
- 기존 prefix 866,105 bytes / SHA-256 b07631cc9cbdc8635f05bc9bface969a24305eb04f5d2c23d3d8d675c90548ca를 그대로 보존했다.
- 각 record는 선택된 JPEG 시안, 매핑된 main-browser desktop capture, sourceCheck, main visual review 근거를 연결했다. mobileCapture는 null이다.
- 시각 차이와 검수 문구는 PC dark native image와 별도 DOM 콘텐츠의 관계를 설명하며 페이지 전체 pixel equivalence를 주장하지 않는다.

## 처리 로그와 검증

- 개별 --mark 명령, exit code, stdout, stderr: main-mark-log.jsonl (90행).
- D12 selected image 16개와 desktop capture 매핑, sourceCheck를 확인했다. current capture manifest는 90개(45 state × base/zoom)다.
- 기존 parity prefix, 16개 신규 ID 중복 없음, inventory 전체 행 수·상태 합계, 기존 47,254행 및 추가 toggle 5행의 비변경을 확인했다.
- verified 표시는 하지 않았다.
