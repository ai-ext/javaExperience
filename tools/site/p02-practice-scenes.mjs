/** 사용자 시안 16·17·29~32: 메모 실습과 요청/기동/뷰 오류를 별도 학습 장면으로 보여 준다. */
const image = (file, label) => `<a class="p02-image-link" href="../design/mockups-2026-10-15-batch2/${file}" target="_blank" rel="noopener">${label} 시안 보기 ↗</a>`;
const footer = (back, next, source) => `<footer class="p02-focus-footer"><button type="button" data-p02-go="${back}">← 이전 장면</button><a href="${source}" data-p02-source="true">원문 확인 ↗</a>${next ? `<button type="button" class="p02-image-next" data-p02-go="${next}">다음 장면 →</button>` : ''}</footer>`;
const stage = (number, title, description, tone = '') => `<div class="p02-practice-step ${tone}"><b>${number}</b><strong>${title}</strong><p>${description}</p></div>`;
const error = (title, lead, request, gate, result, fix, asset, back, next, source) => `<article class="p02-focus-screen p02-image-screen" data-p02-screen="${gate.id}" hidden aria-labelledby="p02-${gate.id}-title"><p class="p02-focus-kicker">P02 · ${gate.label}</p><h2 id="p02-${gate.id}-title">${title}</h2><p class="p02-image-lead">${lead}</p><div class="p02-error-path">${stage('1','시작',request)}${stage('2',gate.name,gate.detail,'p02-error-active')}${stage('3','관찰할 것',result)}</div><div class="p02-error-fix"><strong>어디를 고칠까요?</strong><p>${fix}</p></div><p class="p02-image-boundary">원문 설명을 바탕으로 한 예상 흐름입니다. 이 화면이 지금 서버에 요청을 보내거나 오류를 재현한 결과는 아닙니다.</p>${image(asset,gate.label)}${footer(back,next,source)}</article>`;

export function renderP02PracticeScenes() {
  return `
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="memo-practice" hidden aria-labelledby="p02-practice-title">
      <p class="p02-focus-kicker">P02 · 시안 16 / 직접 해 보는 메모 한 건</p><h2 id="p02-practice-title">POST로 저장하고 GET으로 목록을 확인하세요</h2>
      <p class="p02-image-lead">P02의 별도 메모 예제 프로젝트를 실행한 뒤 터미널에서 두 요청을 순서대로 보냅니다. 결과는 서버 실행 전 기대값과 구별합니다.</p>
      <div class="p02-practice-flow">${stage('1','POST /api/memos','title="첫 메모", content="계층을 나눴다"')}${stage('2','Controller → Service → Repository','인메모리 Map에 메모를 보관하고 응답 DTO를 만듭니다.')}${stage('3','201 Created · 예상','새 id가 포함된 JSON입니다. id는 실행 후 정해집니다.')}${stage('4','GET /api/memos','저장된 MemoResponse 배열을 조회합니다.')}</div>
      <div class="p02-practice-commands"><div><small>먼저 보내기</small><pre><code>curl -i -X POST http://localhost:8080/api/memos -H 'Content-Type: application/json' -d '{"title":"첫 메모","content":"계층을 나눴다"}'</code></pre><button type="button" data-p02-command="post">POST 명령 복사</button></div><div><small>그다음 조회</small><pre><code>curl -i http://localhost:8080/api/memos</code></pre><button type="button" data-p02-command="get">GET 명령 복사</button></div></div><p class="p02-practice-copy-state" data-p02-command-state role="status" aria-live="polite"></p>
      <p class="p02-image-boundary">이 앱은 DB가 아닌 메모리에 저장합니다. 재시작하면 목록이 비며, 이미지의 id=1은 고정 응답 계약이 아닙니다.</p>
      ${image('16-memo-practice.png','16 · 메모 실습')}${footer('package-map','error-415','#35-curl로-요청-보내기')}
    </article>
    ${error('JSON을 text/plain으로 보내면 415가 날 수 있습니다','Content-Type이 본문 형식과 맞지 않으면 메서드에 들어가기 전에 변환 단계에서 멈춥니다.','POST /api/memos · Content-Type: text/plain',{id:'error-415',label:'시안 17 / 415',name:'요청 본문 변환',detail:'JSON을 읽을 적절한 변환기를 찾지 못함'},'415 Unsupported Media Type · Controller 메서드 호출 전','JSON 본문이라면 Content-Type: application/json으로 다시 보냅니다.','17-mvc-error-trace.png','memo-practice','error-404','#5-자주-나는-에러와-해결')}
    ${error('등록되지 않은 경로는 Controller에 도착하지 않습니다','이 예제에는 /api/memos가 등록되어 있습니다. 한 글자 빠진 경로는 다른 요청입니다.','GET /api/memo · 등록 경로는 /api/memos',{id:'error-404',label:'시안 29 / 404',name:'경로 매핑',detail:'요청 URL과 등록된 경로가 일치하지 않음'},'404 Not Found · Controller·Service 미실행','메서드와 URL을 함께 확인하고 GET /api/memos로 요청합니다.','29-route-404.png','error-415','error-bean','#5-자주-나는-에러와-해결')}
    ${error('Repository 구현 빈이 없으면 앱이 시작하지 못합니다','MemoService 생성자가 MemoRepository를 요구하는데 등록된 구현체가 없으면 조립 단계에서 실패합니다.','앱 시작 · HTTP 요청 전',{id:'error-bean',label:'시안 30 / 빈 누락',name:'생성자 주입',detail:'MemoRepository 타입으로 넣을 구현 빈을 찾지 못함'},'No qualifying bean of type MemoRepository · 기동 실패','InMemoryMemoRepository의 @Repository와 컴포넌트 스캔 범위를 확인합니다. 인터페이스 객체를 직접 만드는 문제는 아닙니다.','30-missing-bean-v4.png','error-404','error-template','#5-자주-나는-에러와-해결')}
    ${error('hello 템플릿이 없으면 View 렌더링에서 멈춥니다','Controller는 name을 Model에 담고 뷰 이름 hello를 반환했지만, 템플릿을 찾지 못한 경우입니다.','GET /hello · Controller가 return "hello"',{id:'error-template',label:'시안 31 / 템플릿',name:'ViewResolver·Thymeleaf',detail:'templates/hello.html 탐색 실패'},'TemplateInputException · Controller 실행 후 View 렌더링 실패','Thymeleaf 스타터, templates/hello.html 위치, 반환한 뷰 이름을 함께 확인합니다.','31-template-error-v4.png','error-bean','next-depth','#5-자주-나는-에러와-해결')}
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="next-depth" hidden aria-labelledby="p02-next-depth-title">
      <p class="p02-focus-kicker">P02 · 시안 32 / 다음 깊이</p><h2 id="p02-next-depth-title">규칙이 늘면 Service 경계를 다시 살펴보세요</h2>
      <p class="p02-image-lead">현재 예제는 저장과 DTO 변환만 합니다. 검증·중복 확인·여러 데이터 변경이 생기면 어느 계층의 판단인지 다시 결정합니다.</p>
      <div class="p02-practice-flow">${stage('1','HTTP 경계','Controller · 요청 매핑·DTO·상태')}${stage('2','유스케이스 판단','Service · 규칙·처리 순서')}${stage('3','데이터 접근','Repository · 조회·저장')}${stage('4','HTTP 응답','필요한 DTO와 상태 코드')}</div>
      <div class="p02-next-links"><a href="S05-mvc-request-flow.html">S05 · 요청 매핑과 변환 ↗</a><a href="S06-rest-api-clients.html">S06 · REST 계약 ↗</a><a href="S08-transactions.html">S08 · 트랜잭션 경계 ↗</a></div>
      <p class="p02-image-boundary">시안 속 빈 제목 거절·중복 제목 검사·여러 저장의 원자 처리는 현재 P02 코드에 없습니다. 다음 개념을 공부할 때 적용할 설계 질문입니다.</p>
      ${image('32-mvc-next-depth.png','32 · 다음 깊이')}${footer('error-template',null,'#6-한-단계-더')}
    </article>`;
}
