# 개념 목록 PC 다크 정렬·배치 수정

2026-10-25. 사용자 지정 DTO 검색 화면과 같은 목록의 첫 진입을 수정했다. 홈·134개 개별 문서의 신규 콘텐츠 완성 판정은 아니다. PC 1280px 이상 다크만 지원·검증하며 모바일·라이트는 사용자 명시 지시에 따라 제외한다.

## 원인과 결과

실제 1668×832 Chrome에서 메뉴 로고 x24, 목록 x274/width1120으로 기준이 달랐다. main max-width1192/padding36과 catalog max-width1120이 본문을 중앙에 제한했다. 다크 공통 :is()의 높은 specificity가 결과 행 배경·CTA·검색 필드의 새 규칙을 덮는 문제도 중간 실제 캡처에서 확인했다.

catalog 전용 shared gutter를 적용해 로고/목록 모두 x40.03125, 목록 width1587.9375로 맞췄다. 결과 행은 padding22px 24px의 평평한 구분선 목록, 설명 읽기는 128×46.5px 버튼으로 바꿨다. 질문→설명→출처/일치 근거 순서이며 관련 과제·링크·문서134개·검색 controller는 보존했다. 검색 첫 결과 y528.59→428.99, 기본 진입 첫 결과 y816 부근→681.98로 조정했다. 원문 전체 목차 이동 시 제목이 배너에 가리던 기존 문제도 scroll-margin92px로 교정해 실제 top92.04/banner68을 확인했다.

## 검증 근거

- 구현 Luna high, 독립 Sol high spec→quality와 메인 실제 Chrome 검증을 구분해 수행했다. 최종 정적 C0/I0/M0. 중간 cascade 문제와 교정 기록은 보존했다.
- build339HTML/링크0, catalog14개 동작 검사, dark136쪽, reader134개 원문·코드·ID·Markdown, navigation339쪽+홈 검사 통과. 원시 출력은 implementation-checks-raw.log, 마지막 anchor CSS 뒤 빌드는 main-build.log 및 최종 검사 로그를 따른다.
- 검색/기본 각각 PC1280/1440/1668/1920에서 가로 넘침0·주요 input/button/select/질문/aside/CTA 잘림0. 메인이 실제 JPG를 직접 열어 확인했다. DTO7, Java필터0→해제7, 제목순, 미확정 초안, 없는 검색, 지우기, P16 설명 읽기→동일 q/category/질문 초점 복귀, End키 초점 이동, 학습 순서/원문 목차 이동을 실제 조작했다. browser-checks.json 참조.
- 최종 원문 목차 보정은 배치 검증 뒤 추가한 catalog ID 전용 CSS다. 다시 빌드·검사하고 실제 anchor 위치와 최종 DTO 정렬/색/폭을 재확인했다.
- 이전 26개 콘텐츠 하네스를 이번 CSS 수정 뒤 모두 재실행한 것은 아니다. 이전 전체 하네스 통과는 b93457b5 기준 역사 근거이며 이번 변경의 검사 범위와 구분한다. 새 콘텐츠/학습자 서버 테스트를 실행했다고 주장하지 않는다.

## 시안·MCP와 한계

gpt-image-prompt/imagegen 스킬의 UI 정렬·계층 기준으로 실제 built-in imagegen 1회 생성했다. 원본은 LOCAL_HOME/.codex/generated_images/01a154b3-918f-7c03-b91b-df3e8d21b2a3/exec-6817eb9e-4620-4c28-903c-50af73bc10ad.png에 있고 선정본 catalog-reference.jpg는 실제 JPEG quality92/1775×886이다. prompt는 image-prompt.txt에 보관했다. 제품에 이미지를 삽입하는 대신 정확한 텍스트 DOM/CSS로 구현했다. 시안의 임의 P06 관련 과제/작은 오문구·그라데이션을 옮기지 않았다. 실제 dto-1775.jpg와 같은 뷰포트로 대조했으며 문구·색·정보 순서 일부가 달라 pixel 동등이나 verified를 주장하지 않는다.

미리캔버스는 LOCAL_HOME/research/javaexperience-concept-ia-20261024/PATTERNS.md의 기존 검증된 검색/구조 참고를 사용했다. 이번 세션에는 MiriCanvas 도구가 노출되지 않았으며 새 MCP 검색·템플릿 편집을 수행했다고 표시하지 않는다. MCP를 사용한 이력이 실제 제품 화면 완성도를 보장하지 않으므로 이번에는 직접 화면과 CSS 계산 결과를 검증했다.

viewport 변경 직후 이전 프레임이 저장된 최초 1775/1920 캡처는 intermediate-stale-frame 파일로 보존하고 최종 이름에서 제외했다. AX 확인 후 재캡처해 JPEG 실제 치수1775×886/1920×832를 검증했다. browser-checks의 final-code-dto-native는 구HTML 캐시로 구 stylesheet d9454cbdf2ce가 로딩된 실패 관측이다. 정상 증거에서 제외하고 실제 reload 뒤 final-after-reload-dto-native 및 final-code-8b650-dto를 최종 증거로 사용한다. 최종 브라우저는 새 생성물로 reload하고 기본 viewport1668×832로 복원해 DTO 결과를 열어 두었다.

모든 새 시안·캡처는 JPG다. 원문135/learner17/외부dirty2/과거proof1366/초기24review24 해시 보존은 preservation-final.json에 기록한다. 신규 verified 승격 없이 기존 catalog 단위의 근거만 보완한다. commit/push/PR/merge는 수행하지 않았다.
