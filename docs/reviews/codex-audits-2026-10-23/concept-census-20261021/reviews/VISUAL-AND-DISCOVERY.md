# 메인 검토: 시각 전달과 실제 발견 경로

## 이번에 관찰한 범위

공개 공통 기반의134개 문서를 실제 Chrome에서 열어 데스크톱1536×1024 첫 화면, 모바일390×844 첫 화면, 기존 문서의 두 번째 핵심 절 앵커로 이동한 화면을 각각 저장했다. 개념 보강 작업의23개 문서도 같은3종을 별도 `-progress` 폴더로 저장했다. 전수 캡처는 문서당 세 관찰 상태이며 **모든 하위 토픽·모든 조작·모든 스크롤 위치 검증은 아니다**.

캡처/DOM/측정 원자료는 /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/visual/ 및 /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/browser/ 에 있다. 각 Luna 담당자가 맡은 캡처를 실제 이미지로 열어 문서별 visual_review에 기록한다. 메인은 주요 쟁점과 보고서 불일치를 재검토한다.

## 공통 화면에서 구별한 것

- 목차·번호·카드·코드 하이라이트는 읽기 보조 장치다. 그것만으로 객체/SQL/DB 행의 변화나 알고리즘 동작을 시각적으로 전달했다고 판정하지 않는다.
- R05 핵심 절은 읽을 수 있는 설명과 SQL이 있으나 한 화면의 긴 산문 중심이다. 인덱스 페이지 방문, 키 순서, PK 재조회 생략을 조작해 비교하는 장면은 별도 보완 대상이다.
- P02처럼 역할과 값의 흐름을 직접 보여 주는 화면은 일반 목차형과 구분한다.
- 여러 문서는 외부 절을 펼쳐도 하위 details가 다시 접혀 있다. '핵심 절로 갔다'와 '핵심 내용을 보았다'가 다르다.
- 미통합 W09/R03 등은 실제 값·전후 상태·증거를 비교하는 장면이 추가됐다. 공개 기반에 없다고 이 작업 자체를 무시해서는 안 된다.
- 보강 화면도 처음에 버전·fixture·native환경·미실행 경계가 길게 나오거나 큰 그림 안의 작은 영문 라벨에 핵심이 몰리면 입문자에게 부담이 된다. 정확성 근거는 보존하면서 첫 질문에 필요한 용어와 관찰값을 먼저 이해할 수 있어야 한다.

## 확인한 모바일 결함

P10 제목의 긴 `List·Set·Map·Queue·Deque·PriorityQueue` 부분이390px에서 오른쪽으로 잘린다. 실제 재확인에서 documentElement.scrollWidth는390이지만 body.scrollWidth는468이고 body의 overflow-x는clip이었다. 따라서 '페이지 가로 스크롤이 없음'만 검사하면 잘림을 놓칠 수 있다.

근거: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/browser/P10-mobile-title.json 및 /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/visual/P10/mobile-title-recheck.jpg.

## 실제 검색16개 결과

- `B-Tree`는 R05를 찾지만 `btree`는0개.
- `복합 인덱스`는 R05를 찾지만 `복합인덱스`는0개.
- `UK`, `커버링 인덱스`, `UNION ALL`, `value object`는0개.
- `UNION`은 SQL 자료가 아니라 J22 Union-Find만 반환.
- `UNIQUE`는 W10만 반환하고, 제약을 다루는 R03은 해당 검색에서 발견되지 않음.
- `서비스에 뭘 써야 해`, `글 하나에 댓글 여러 개`는0개.

이 값은 실제 검색 폼에 입력하고 제출한 뒤 화면의 결과 제목과 보이는 목록을 읽어 기록했다. 원자료: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/browser/search-runs.json.

현재 검색은 제목/Markdown h1~h3/등록 질문 중심이다. 용어가 본문에만 있으면 못 찾고, 공백·기호·영문/한글 표기와 의미가 다른 동음이의어에 취약하다. 자연어 질문을 단어별 부분 문자열 AND로 처리하면 기술명 자체를 모르는 사람에게 불리하다.

## 시각 보완 우선순위

1. 현재 화면에서 답해야 할 질문과 같은 데이터의 시작/결과값을 드러낸다.
2. 필요한 선수개념으로 바로 이동하고 원래 과제로 돌아올 수 있게 한다.
3. 기술 이름만 있는 상자/목차를 데이터가 바뀌는 의미 장면으로 보완한다.
4. 두 겹 접기 속 핵심 설명과 모바일 잘림을 줄인다.
5. 실제 실행 증거와 설명용 모델을 구분하되, 환경 세부정보가 첫 질문을 가리지 않게 배치한다.
6. 동작·키보드·확대·전체 상태 조합은 후속 UI 검증 항목으로 남긴다. 이번 캡처3장 확인을 전체 UI 통과로 확대하지 않는다.
