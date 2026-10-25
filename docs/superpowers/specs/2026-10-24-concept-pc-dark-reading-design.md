# PC 다크 개념학습의 진입과 읽기 구조

2026-10-24 사용자 승인 범위: 기존 개념 개발을 계속하고, 8766 미리캔버스 비교 보드와 연결된 MCP에서 더 넓은 템플릿을 살펴 전체 진입·산문 배치를 개선한다. 이후 PC다크만기준,모바일구성은폐기가능. 모바일/라이트의새분기·시안·QA는제외한다. 현재worktree LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night, minor9완료HEAD119a8c5. 다른worktree/8766보드는수정하지않는다.

## 근거와 선택

추가 directOpenAI CodexCLI gpt-6-luna/high+인증MiriMCP18질의/540반환/203기존외신규고유키, 신규40grid비교/22구조/본문48page/14레퍼런스. LOCAL_HOME/research/javaexperience-concept-ia-20261024 . 134개는제목·소제목기반분류이며12대표일부절을읽음. 메인은6개대표본문을직접열람했다. 회사연혁의가짜KPI·매거진사진·교사일러스트를제품에복제하지않고 본문계층/표-해석의인접성/진입행동만참고한다. 기술사실은원문·실행근거로만판단한다.

가능한 접근은 색만 다크로 바꾸기, 슬라이드형 페이지로 재작성하기, 기존 원문·교구를 보존하며 읽기 흐름을 바꾸기의 세 가지였다. 마지막을 선택한다. 기존코드·원문·개별기술검증을보존하면서 산문이여러겹접기속에숨는문제와진입동선을함께고칠수있다.

## 설계

1. **PC다크기반:** 홈·개념목록·134상세에만명시적dark표식과마지막scoped CSS를적용한다. 기존정적HTML/CSS/JS를유지,React/Tailwind/외부폰트라이브러리추가없음. navy배경0c111b/전경edf2f8/보조a2aec2/선2a3649/표면141d2c/파랑8bb7ff. 기존24의고정light토큰과white UI패널을교정하되래스터이미지내용을CSSfilter로변조하지않는다. 새이미지는dark방향actualimagegen후JPG. 기존모바일/라이트의추가개발없음.
2. **진입:** 홈의첫API시작은유지,상단에개념목록으로가는조용한보조링크를노출한다. 목록의질문제목은기존장면진입,행의읽기링크는같은문서`?read=1`로긴설명에직행한다. 기존검색/분야/복귀상태를보존. 원문README제목은숨긴상태로id/원문을보존하여보이는H1은하나로한다.
3. **장면/읽기:** 상세공통bar에`장면으로 보기`와`설명 차근차근 읽기`를둔다. 기존visual전체를바깥wrapper로묶고기존원문전체도바깥wrapper로묶는다. 원문내부텍스트/코드/앵커/지도DOM을변경하거나중복원문을만들지않는다. PC장면보기는그림왼쪽·현재값/코드오른쪽의2열을우선해같은시점의관계를함께읽는다.
4. **산문:** 읽기선택시원문outer details와핵심chapter/topic을열고,원문옆에실제H2앵커목차를둔다. 산문17px/1.85·폭약74ch,소제목구분,flat한문단/표/코드블록으로읽는다. Q&A는질문제목을보이고답이있는topic은접기,참고문헌/명시적선택심화는접기유지. 에러판단·조건·핵심정의를모두접지않는다. 원문보조로그/정답details를일괄펼치지않는다.
5. **동작:** `read=1`로직행/새로고침가능. 원문hash에진입하면읽기를열고타깃을노출한다. own historykey를써서기존24장면state·카탈로그검색복귀·다른state를보존하며완료표시/자동학습진도/localStorage쓰기를추가하지않는다. 모드복귀시장면선택은그대로. 읽기heading에focus/scroll을보내어PCstickyheader에가리지않는다. 새reader모듈에는matchMedia/모바일전용layout분기가없다.

## 경계와 수용 기준

- source135/learner17/기존proof1366/초기Sol24JSON/기존AGENTS·RESUME2dirty보존. scenario/practice/학습자정답/DB수정없음.
- 스타일공통적용을134개고유학습장면완료로표시하지않는다. 기존24원문공백과나머지110미구현은별도.
- PC1280×900·1440×1000·1672×941에서dark색실제적용/주요텍스트대비/그림·값·코드/산문폭/키보드·원문·목차·복귀를확인. 모바일/라이트검증은완료요건아님.
- before baseline의각134원문영역normalized text/code/앵커와대조,새reader의mode/history/hash/선택정답접기회귀,홈·목록·24하네스·build/audit3통과.
- Luna구현→하네스→freshSol spec→quality→메인PCdark실제검증→로컬커밋. push/PR/merge없음.
