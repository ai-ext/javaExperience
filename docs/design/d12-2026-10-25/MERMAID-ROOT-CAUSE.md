# D12 원문 도식 렌더 시점 조사

증상은 메인이 실제로 연 width-1280-reader-pc-dark.jpg에서 발견했다. 첫 원문 도식에 Syntax error in text / Mermaid 11.4.1 오류 그림이 보였다. 앞선 overflow 0 및 45개 학습 장면 정상 결과는 이 원문 도식의 정상 렌더를 증명하지 않는다.

## 수정 전 재현
1. PC 1280×941에서 D12 HTML을 query 없이 처음 연다. 기본은 장면 화면이고 원문 reading 영역은 hidden이다.
2. 세 번째 Mermaid SVG가 붙을 때까지 DOM 조건으로 기다렸다. 숨긴 원문 도식들의 layout width는 0이었고, 첫 SVG에는 Syntax error 문구가 남았다.
3. 같은 문서에서 설명 읽기를 눌러도 그 오류 SVG는 남았다. 이때 원문 폭은 734.390625 / 706.390625 / 706.390625였다.
4. 같은 viewport에서 읽기 URL(read=1)을 새로 로드한 대조군은 같은 원문 3개 SVG가 모두 오류 없이 만들어졌다.

원자료: main-browser 또는 mermaid-investigation에 보존할 mermaid-repro-1.json/JPG와 mermaid-control-initial-read.json/JPG. Cua page.evaluate는 DOM 읽기만 했고, goto/reload/click은 Cua API로 수행했다.

## 확인한 호출 경로와 가설
build.mjs는 Mermaid가 있는 문서에 startOnLoad:true를 넣는다. D12는 reader가 기본 scene을 선택해 원문을 숨기므로 이 자동 렌더가 폭 0에서 시작한다. reader controller 자체에는 Mermaid 재렌더 호출이 없다. 원문이나 Mermaid 문법은 수정하지 않았으며, 초기부터 reading을 보이는 대조군은 정상이다.

따라서 원문을 숨긴 상태에서 시작하는 현재 초기화 시점이 이 환경의 오류 조건이라는 가설을 지지한다. 라이브러리 모든 버전·모든 문서의 결함으로 일반화하지 않는다.

## 수정 계약
D12에 한해 자동 시작을 끄고 읽기 영역이 보이며 실제 node width가 양수일 때 직렬로 렌더한다. 원본 문자열을 보존하고, 렌더 중 숨김/재진입은 복원·재시도로 처리한다. 성공 여부를 만들어 넣거나 오류 SVG를 숨기는 것으로 끝내지 않는다. 다른 문서 HTML·공통 reader·원문 MD·기존 45상태는 변경하지 않는다.

현재 이 기록은 원인 조사와 수정 전 증거이며, 수정 성공 판정은 새 source/helper 검수와 실제 Chrome 재현을 별도로 마친 뒤 기록한다.
