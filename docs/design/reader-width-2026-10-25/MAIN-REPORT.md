# 개념 상세 PC 공통 폭 조정

2026-10-25. 사용자의 PC 다크 전용 지시에 따라 개념 상세 공통 레이아웃을 넓혔다. 개별134개 문서의 신규 학습 콘텐츠나 전수 시각 검증 완료 판정이 아니다. 기존 목록 수정·홈·시나리오·학습자 서버는 보존했다. commit/push/PR/merge는 하지 않았다.

## 수정 결과

기존 main 최대920/1192px와 원문 전체74ch 제한을 분리했다. reader가 있는 다크 문서에만 메뉴와 본문이 같은 clamp(24px,2.4vw,48px) 여백을 쓰도록 했다. 원문 전체는 콘텐츠 폭을 사용하고 문단은17px/74ch를 유지한다. 목차220px와32px 간격은 보존했다. 코드·표·그림은 부모 가용 폭을 쓰고 긴 내용은 내부 스크롤한다. viewport 폭으로 부모를 벗어나던 기존 그림/P02 블록과 별도P04 보충 코드·P02 역할 지도 최대 폭도 reader 안에서만 보정했다. 확대 이미지의 내부 transform은 바꾸지 않았다.

P16 실제1668×832에서 메뉴/reader 왼쪽40.03125px, reader1587.9375px, 원문1335.9375px다. 이전에는 메뉴24px/reader274px, 원문792.390625px였다. 문단은792.390625px를 유지하고 첫 코드영역은706.39→1249.94px, 표는734.39→1277.94px로 넓어졌다. 본문과 toolbar의 중복 상단 간격도 줄였다.

## 검증 범위와 원자료

- Luna high 구현, Sol high 독립 spec→quality 검수, 메인 실제 Chrome 검증을 수행했다. 최종 CSS691dfb866a25c133e42b6d36ad2eb9d2994d25c7dd8eaad658df9a7e9b757c30. 독립 최종 C0/I0/M0, 원자료·한계는 SOL-REVIEW.json에 분리했다.
- build339HTML/링크0, reader134원문·코드·ID·Markdown/history, dark136페이지, catalog14/14·DTO7/복귀, navigation339쪽+index 검사 통과. 최종 root보정 후 build/reader/dark 재실행도 통과했다. implementation-checks-raw.log와 Sol 원시 로그에 명령/종료 코드가 있다. 첫 실행의 로그 경로 오류로 테스트가 시작되지 않은 시도도 기록하고 실제 후속 실행과 구분했다.
- 공통 폭 조정 뒤 P16읽기/P09장면/W11산문/S09/P02/D12읽기 여섯 경로를 PC1280/1440/1668/1920의24개 사례로 실제 측정했다. 메뉴/reader 왼쪽 좌표 일치24, 문서 가로 넘침0. width-cases.json 참조. 메인이 대표6JPG를 모두 직접 열어 확인했다.
- 이후 P04/P02 별도root의 남은 폭 제한만 추가 교정했다. 최종 코드에서 보충 코드/P02 역할 지도 펼침을 각3폭에서 확인했고 경계 이탈0이었다. P04는1218.56/1587.94/1827.84px, P02는부모 안쪽 여백을 제외한937.38/1306.75/1546.66px를 사용한다. 기본24사례를 이 두 규칙 추가 뒤 다시 전부 반복한 것은 아니다. 최종 P16은 다시 측정·캡처했다.
- S09 원본 버전표를 펼쳐 실제 표 바깥 경계 이탈0, 긴 표의scroll1872/client1218을 확인했다. P16 목차 이동 제목top95.82/banner68, D12 Q1열기/닫기와 Mermaid SVG3/구문오류0, P09장면 선택·읽기 전환 후 단계 유지, P04확대true/내부transform유지를 확인했다. 최종 검색→P16설명→동일DTO7결과·q/category·질문 초점 복귀도 확인했다. browser-checks.json 참조.
- 첫 P09복사 확인은 비동기 성공 피드백 전에 clipboard를 읽어 이전 값과 비교한 실패 관측이다. 정상 근거에서 제외하고 기록은 보존했다. 최종은 '코드를 복사했습니다.'가 보인 뒤 읽어 현재DOM코드 changeObject(p);와 정확히 일치했다. 앱의 복사 코드를 수정한 것은 아니다.
- 마지막 visual/version-cards/parity 감사, inventory 갱신 및 보존 해시 검사를 수행했다. 원문135·학습자서버17·기존dirty2·과거proof1366·초기review24는 preservation-final.json을 따른다. 이전 전체26하네스를 이번 CSS 뒤 모두 재실행했다고 주장하지 않는다.

## 시각 참고와 남은 범위

gpt-image-prompt/imagegen 스킬을 적용해 실제 built-in imagegen 1회 생성했다. 원본 /Users/ds/.codex/generated_images/01a154b3-918f-7c03-b91b-df3e8d21b2a3/exec-242e15ee-4fc3-4de9-9419-f7cf7550b563.png, 선정본 reader-reference.jpg는실제JPEG quality92/1775×886이다. 최종 같은1775×886 실제 화면은 final-p16-wide-1775.jpg, 프롬프트는 image-prompt.txt다. 제품은 원문DOM을 보존하므로 이미지에 임의로 들어간 축약annotation·줄번호·새비교표는 추가하지 않았다. 시안은배치 방향이며 기술 근거나 pixel동등 판정이 아니다.

산문 폭을 유지하므로 오른쪽에 여유 공간이 남는 문단은 있다. 코드/표/장면을 포함한 바깥 화면까지 중앙의 좁은 틀에 가두던 제한은 해제했다. 새 모바일·라이트·file URL 오프라인 검증이나134개 개별 학습효과/전체상태 검증은 이번 완료 범위가 아니다. 장부는 신규verified 승격 없이 공통 적용과 표본 검증을 구분한다. 모든 새 이미지·캡처는 JPG다.
