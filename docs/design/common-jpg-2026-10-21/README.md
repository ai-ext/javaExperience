# 공통 학습 자산 JPG 적용 · 2026-10-21

공통 기반에 있던 PNG **514개**만 검증된 JPG 바이트로 교체했다. 다른 작업본의 CRUD 기능 코드·신규 실습·공개 제외 브라우저 캡처는 가져오지 않았다. 재인코딩하거나 이미지를 새로 생성하지 않았다.

원본 PNG SHA와 기존 변환 manifest의 originalSha256, 공급 JPG SHA와 배포 파일 SHA를 모두 대조했다. JPEG 전체 디코딩·원본과 같은 가로/세로·4:4:4 sampling을 확인했다. 원래 변환 설정은 quality95/subsampling0/optimize/progressive/resize false다. **792,078,047 → 205,769,094 bytes**이며, JPEG 손실 압축이므로 원본과 픽셀 값까지 같다는 뜻은 아니다.

[manifest](manifest.json)는 514개 각각의 원본/배포 경로·SHA·크기와 원본 정제 Git 커밋, 외부 원본 백업을 기록한다. 현행 asset-index/mockup-manifest 442항목에는 원본 PNG 정보와 현재 JPG SHA를 분리했다. 생성 원본 파일명·다운로드 출처·과거 raw baseline/보고서는 유지했다. 과거 PNG는 기록된 Git 커밋이나 백업에서 확인할 수 있다.

[검증 결과](verification.json): 동일 arm64 Node 환경에서 npm ci, build(339쪽/101단계/링크0), inventory, **42개 test 스크립트**, 필수3audit와 audit:images를 통과했다. audit:images는 배포 SHA/크기/샘플링·자산 출처442건·현재 HTML 이미지 링크415개를 검사한다. 실제 브라우저 렌더나 화질 대조를 대신하지 않는다.

원문 변경4개는 기록된 이미지 링크만 달라졌고, 학생 서버 소스·build.gradle·compose.yaml을 바꾸지 않았다. 기존 HTML341개는 JPG 경로와 자산 cache hash만 정규화하면 기존과 같다. parity446개와 inventory44,101개는 항목 수·기존 상태를 그대로 유지하며 verified 승격은 없다.

최초 검사에서 설정 개념 갤러리의 중첩 template 한 곳이 PNG 링크를 유지해 실패했다. 해당 링크를 고친 후 전체 검사를 다시 통과했고 처음 실패 로그도 보존했다. 전체 로그와 적용 스크립트는 `/Users/ds/research/javaexperience-main-preparation-2026-10-21/_data/jpg/`에 있다. 이 작업은 실제 브라우저 검증·commit·push·PR을 수행하지 않았다.
