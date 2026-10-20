/** 사용자 시안 11~15: DTO 계약, record/Entity 구분, 생성자 주입, 패키지 선택. */
const image = (file, label) => `<a class="p02-image-link" href="../design/mockups-2026-10-15-batch2/${file}" target="_blank" rel="noopener">${label} 시안 보기 ↗</a>`;
const footer = (back, next, source) => `<footer class="p02-focus-footer"><button type="button" data-p02-go="${back}">← 이전 장면</button><a href="${source}" data-p02-source="true">원문 코드·설명 열기 ↗</a>${next ? `<button type="button" class="p02-image-next" data-p02-go="${next}">다음 장면 →</button>` : ''}</footer>`;

export function renderP02DataScenes() {
  return `
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="request-dto" hidden aria-labelledby="p02-request-dto-title">
      <p class="p02-focus-kicker">P02 · 시안 11 / 요청 DTO</p><h2 id="p02-request-dto-title">요청 DTO에는 사용자가 보내도 되는 필드만 둡니다</h2>
      <p class="p02-image-lead">이 예제의 <code>MemoCreateRequest</code>는 <code>title</code>과 <code>content</code>만 선언합니다. 추가 필드가 저장되는지부터 가정하지 마세요.</p>
      <div class="p02-dto-choice" role="group" aria-label="요청 예시 선택"><button type="button" data-p02-dto-request="allowed" aria-pressed="true">계약에 맞는 요청</button><button type="button" data-p02-dto-request="extra" aria-pressed="false">추가 필드가 든 요청</button></div>
      <div class="p02-data-flow"><div class="p02-data-surface"><small>클라이언트 JSON · 설명 예시</small><pre data-p02-dto-input>{"title":"첫 메모","content":"계층을 나눴다"}</pre></div><span aria-hidden="true">→</span><div class="p02-data-surface p02-data-emphasis"><small>요청 계약</small><strong>MemoCreateRequest</strong><code>String title</code><code>String content</code><p data-p02-dto-explain>현재 DTO가 받도록 선언한 두 값입니다.</p></div></div>
      <p class="p02-image-boundary">추가 필드를 무시할지 오류로 거절할지는 Jackson 설정과 검증 정책에 따라 달라집니다. 이 화면은 DTO에 없는 필드가 내부 모델의 필드로 자동 추가되지 않는다는 경계를 보여 줍니다.</p>
      ${image('11-request-dto-v2.jpg','11 · 요청 DTO')}${footer('memory-repository','response-dto','#27-dto와-entity')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="response-dto" hidden aria-labelledby="p02-response-dto-title">
      <p class="p02-focus-kicker">P02 · 시안 12 / 응답 DTO</p><h2 id="p02-response-dto-title">응답 DTO가 밖에 보여 줄 필드를 고릅니다</h2>
      <p class="p02-image-lead">현재 P02의 <code>Memo</code>와 <code>MemoResponse</code>는 모두 <code>id · title · content</code>를 가집니다. 내부 전용 필드 비교는 별도 설계 예시입니다.</p>
      <div class="p02-dto-choice" role="group" aria-label="내부와 외부 값 선택"><button type="button" data-p02-dto-side="internal" aria-pressed="true">내부 객체</button><button type="button" data-p02-dto-side="external" aria-pressed="false">API 응답</button></div>
      <div class="p02-response-stage"><div><small data-p02-dto-side-label>내부 도메인 record · Memo</small><strong data-p02-dto-side-title>저장소가 보관한 Memo</strong><pre data-p02-dto-side-value>id = 실행 뒤 정해짐\ntitle = "첫 메모"\ncontent = "계층을 나눴다"</pre></div><div><small>공개 계약</small><strong>MemoResponse</strong><code>id · title · content</code><p>Service가 필요한 값으로 명시해 응답 DTO를 만듭니다.</p></div></div>
      <p class="p02-image-boundary">시안의 <code>internalNote</code>는 현재 예제 코드에 없습니다. 내부 필드가 나중에 생겨도 응답 DTO에 선언·매핑하지 않으면 공개되지 않는다는 가정 예시로만 읽으세요.</p>
      ${image('12-response-dto-v2.jpg','12 · 응답 DTO')}${footer('request-dto','record-entity','#27-dto와-entity')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="record-entity" hidden aria-labelledby="p02-record-entity-title">
      <p class="p02-focus-kicker">P02 · 시안 13 / record와 Entity</p><h2 id="p02-record-entity-title">이 실습의 Memo record는 JPA Entity가 아닙니다</h2>
      <p class="p02-image-lead">값을 전달하는 타입과 DB 영속 상태를 관리하는 타입을 한 예제의 같은 객체로 합치지 않습니다.</p>
      <div class="p02-dto-choice" role="group" aria-label="타입 역할 비교"><button type="button" data-p02-type="record" aria-pressed="true">현재 실습 · record</button><button type="button" data-p02-type="entity" aria-pressed="false">별도 비교 · JPA Entity</button></div>
      <div class="p02-type-detail"><small data-p02-type-kicker>현재 P02 코드</small><strong data-p02-type-title>MemoResponse · 불변 값 전달</strong><pre data-p02-type-code>public record MemoResponse(long id, String title, String content) {}</pre><p data-p02-type-explain>record 구성 요소는 생성 뒤 다시 대입할 수 없습니다. 이 실습은 인메모리 저장소를 사용합니다.</p></div>
      <p class="p02-image-boundary">JPA Entity는 다른 DB 실습에서 영속성 컨텍스트와 상태 변경을 배웁니다. 시안 속 <code>MemoEntity</code>는 별도 설명 예시이며 이 프로젝트의 P02 코드에 만들지 않습니다.</p>
      ${image('13-record-vs-entity-v3.jpg','13 · record와 Entity')}${footer('response-dto','di-assembly','#28-dto에-record')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="di-assembly" hidden aria-labelledby="p02-di-title">
      <p class="p02-focus-kicker">P02 · 시안 14 / 생성자 주입</p><h2 id="p02-di-title">Spring은 시작할 때 구현 객체를 만들고 생성자로 연결합니다</h2>
      <p class="p02-image-lead">Service는 <code>MemoRepository</code> 인터페이스에 의존하고 Spring은 등록된 구현체를 넣습니다. 요청마다 새로 조립하지 않습니다.</p>
      <div class="p02-dto-choice" role="group" aria-label="의존성 시점 선택"><button type="button" data-p02-di-phase="startup" aria-pressed="true">앱 시작 · 객체 조립</button><button type="button" data-p02-di-phase="request" aria-pressed="false">요청 중 · 메서드 호출</button></div>
      <div class="p02-di-flow"><div><small>@Repository</small><strong>InMemoryMemoRepository</strong><code>implements MemoRepository</code></div><span aria-hidden="true">→</span><div><small>@Service</small><strong>MemoService</strong><code>MemoService(MemoRepository repository)</code></div><span aria-hidden="true">→</span><div><small>@RestController</small><strong>MemoController</strong><code>MemoController(MemoService service)</code></div></div>
      <div class="p02-di-call" hidden>HTTP 요청 <b>→</b> MemoController.create <b>→</b> MemoService.create <b>→</b> MemoRepository.save</div>
      <p class="p02-di-explain" data-p02-di-explain>앱 시작 시 Spring이 구현체·Service·Controller를 만들고 생성자 의존성을 연결합니다.</p>
      <p class="p02-image-boundary">인터페이스 자체의 객체를 만드는 것이 아닙니다. 등록된 구현 객체를 인터페이스 타입 매개변수에 주입합니다.</p>
      ${image('14-di-assembly.jpg','14 · DI 조립')}${footer('record-entity','package-map','#210-의존-방향')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="package-map" hidden aria-labelledby="p02-package-title">
      <p class="p02-focus-kicker">P02 · 시안 15 / 패키지 구조</p><h2 id="p02-package-title">기능을 모으되 역할 경계도 보이게 둡니다</h2>
      <p class="p02-image-lead">이 실습은 <code>com.example.memo</code> 아래에 api·application·domain·repository를 둡니다. 계층별 구조와 비교해 보세요.</p>
      <div class="p02-dto-choice" role="group" aria-label="패키지 구성 선택"><button type="button" data-p02-package="feature" aria-pressed="true">기능별 · 현재 실습</button><button type="button" data-p02-package="layer" aria-pressed="false">계층별 · 비교</button></div>
      <div class="p02-package-display"><small data-p02-package-caption>현재 실습 · 기능별 최상위</small><pre data-p02-package-tree>com.example.memo\n├─ api/          MemoController · MemoCreateRequest · MemoResponse\n├─ application/  MemoService\n├─ domain/       Memo\n└─ repository/   MemoRepository · InMemoryMemoRepository</pre><p data-p02-package-explain>메모 기능을 찾을 때 관련 파일이 가까이 있습니다.</p></div>
      <p class="p02-image-boundary">시안의 ‘메모 제목 수정’은 아직 구현하지 않은 가상 변경입니다. 어떤 파일이 바뀔지 살펴보는 설계 예시이며 모든 파일이 꼭 변경된다는 뜻은 아닙니다.</p>
      ${image('15-package-change-v4.jpg','15 · 패키지 구조')}${footer('di-assembly','memo-practice','#29-패키지-구조')}
    </article>`;
}
