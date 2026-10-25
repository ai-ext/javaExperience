# Concept PC Dark Reading Implementation Plan

> For agentic workers: superpowers:subagent-driven-development. 사용자지정 Luna high 구현→하네스→Sol high spec/quality→main PCdark검증. 실행방식재질문없음.

**Goal:** 개념학습의홈진입·목록·상세·긴산문을PC다크전용읽기흐름으로연결한다.
**Architecture:** 기존정적렌더러에scoped theme와reader wrapper/controller를추가하며원문영역은그대로보존한다. 새의존성/모바일분기/라이트모드없음.
**Tech Stack:** 현행Node/marked/esbuild/JSDOM·nativeHTML/CSS/JS·실제imagegenJPG.

## taskA: PC다크공통기반

- [ ] 신규 tools/site/knowledge-dark.css, test-knowledge-dark.mjs. build.mjs에서대상136surface(홈1/목록1/상세134)에data-theme=dark·data-concept-surface=dark와마지막cachebustedCSS를등록한다. 기존bodyclasschain은유지한다.
- [ ] 신규css root와body토큰은다음값이다: `--bg:#0c111b;--fg:#edf2f8;--muted:#a2aec2;--line:#2a3649;--card:#141d2c;--accent:#8bb7ff;--accent-soft:#1c3150;--code-bg:#111a29;color-scheme:dark`. rootP09강제light와bodycatalog/home강제light보다우선하도록마지막stylesheet의대상selector에한정한다.
- [ ] 실제control/headings/code/mark/selectedbutton/legacyparagraph의고정light색을좁은selector로교정한다. 그림색반전filter는쓰지않는다. 바탕색뿐아니라PC서식요소의문자대비를맞춘다.
- [ ] RED: CSS/표식미등록검사실패→최소구현→ `npm --prefix tools/site run build`, `node tools/site/test-knowledge-dark.mjs`, `npm --prefix tools/site run test:home`, `test:knowledge-catalog`, `test:navigation`에서출력/동작보존. sourcebaseline134main텍스트/CODE/anchor불변.
- [ ] freshSol spec후quality, mainPCdark대표홈/목록/P09/S09/R03/V04검증. 테스트는CSS구현전체를미러링하지않고scope/등록/원문동등성의실제계약을검사한다.

## taskB: 진입·reader

- [ ] 신규 tools/site/knowledge-reader.mjs(실제sourceheading메타데이터와toolbar/outline생성), knowledge-reader.js(모드·hash·history·focus), knowledge-reader.css, test-knowledge-reader.mjs. build.mjs에서원문변환전heading/intro경계확인후visual과원문을바깥wrapper로만감싼다. 기존renderKnowledgePageSections와원문내부를재작성하지않는다.
- [ ] 상태는 `const key='__javaExperienceKnowledgeReader'`와`read=1`. history.replaceState시spread기존state,hash/query보존. reader내원문hashtarget진입은읽기모드로열고focus한다. scene복귀는기존stage/context를초기화하지않는다. storage/progress/서버요청추가없음.
- [ ] read모드sourceouter와corechapter/topic을열고Q&A답/참고문헌/선택심화는접기보존. class추가에따라읽기폭74ch,lineheight1.85,font17px,좌측목차230px와본문열을만든다. 기존text/code/ids/링크불변. 코드/표만자체scroll허용.
- [ ] 홈home-visual.mjs의intro부근에개념부터이해하기링크추가. knowledge-catalog-view.mjs의기존읽기행링크는`?read=1`,질문제목장면링크는유지한다. data-kc-open문서id와검색복귀계약유지.
- [ ] RED/GREEN: read진입→원문노출→선택정답접힘→scene복귀stage유지/foreignhistory유지/hashdecode오류안전/실제목차target/원문134source baseline일치. 홈기존시작/미리보기와카탈로그검색/뒤로가기회귀.
- [ ] freshSol spec→quality,mainPCdark의홈→목록→장면/설명직행→목차→복귀와대표산문/표/코드실제확인. all134는DOM/원문/앵커동등성검사,대표이외시각검증은했다고하지않는다.

## taskC: P09추가두질문

별도 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/SPEC.md. 최신PCdark지시에따라화이트시안은역사draft로남기고신규darkJPG를확정한뒤Luna구현. 2질문9상태/추가Java21 actual13값/원문489줄preserve. 기존84상태역사관측에가짜추가하지않고새9상태검사·PCdark9행으로검증한다. 전체P09완료판정은별도다.

## 최종관문

- [ ] theme/reader/P09관련검사와전체24harness,build/audit3·code fingerprint·원문135/서버17/proof1366/초기reviews24/dirty2 보존.
- [ ] 결과에실제검증scope/남은공백/향후110문서상태를별도명시. 증거없는verified승격없음. 의미단위로컬커밋만.
