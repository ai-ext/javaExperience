# D12 메모리 이미지 보충 검수

**PASS — Critical 0 / Important 0 / Minor 0.** IMG-M1을 실제 imagegen 교정 이미지에서 종결했다. 기존16개 WITH MINOR 보고서는 그대로 보존했다.

교정문장: 마운트된 파일시스템의 전체·사용·여유 공간을 확인합니다. tmpfs도 포함하며, 물리 디스크나 파티션의 크기와 같다고 볼 수 없습니다.

선정된 memory-available-v2 JPG 전체를 실제 native크기로 열어 확인했다. free 미측정표시, df/du/free 구분, available의 회수가능cache추정, 단순free만으로부족단정금지, 디스크/메모리측정대상구분과 기존3열/하단구조가 유지됐다. 새측정값·PID·시각은 추가되지 않았다.

외부raw PNG→/tmp JPEGQ92 재변환SHA가 선정JPG `be2e4e46e911e23e7d3aa60ef717e06f8b4cb7a642af499d6e37373d86c77a8f`와 byte동일하다. raw/선정1672×941, format/bytes/manifest/prompt가 일치한다. 나머지15개 선정JPG의 해시는 기존16개 검수 때와 같다.

전체선정수는16이다. 구memory-available은이미지그대로보존하고draft-superseded로선정목록에서제외했다. 생성이력은19개(선정16/거절2/교체이전1)다. FOCUS45좌표와sourceproof/Dockerfile은변경없다. 실제UIcrop확인은여전히별도이며Docker를재실행하지않았다.

보충 보고: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-memory-addendum.json

교정 이미지: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/images/memory-available-v2-pc-dark.jpg

Q92검증 원출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-logs/memory-v2-asset-check.json

기존보고: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-review.json

이미지·구현·proof·기존보고서를수정하거나커밋하지않았다.
