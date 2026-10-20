const assetRoot = 'docs/design/home-2026-10-18/refinement/';
const creation = 'greeting = new Greeting("김자바", "김자바님, 반가워요", 3);';
const declaration = 'Greeting greeting;';
const alias = 'Greeting same = greeting;';
const another = 'Greeting another = new Greeting("김자바", "김자바님, 반가워요", 3);';
export const NEW_SCENES = [
  { title: '변수 선언', file: 'new-01-declaration.jpg', count: 0, code: declaration, activeLine: 0, references: 'greeting · 아직 초기화되지 않음', caption: '지역 변수 greeting을 선언했습니다. 아직 객체도, 변수에 대입한 참조도 없습니다. 이 상태를 null 값으로 표시하지 않습니다.', alt: '아직 초기화되지 않은 greeting 지역 변수와 빈 객체 영역. 이 예제의 Greeting 객체는 0개입니다.' },
  { title: 'new 평가', file: 'new-02-construction.jpg', count: 1, code: `${declaration}\n${creation}`, activeLine: 1, references: '생성자 표현식 평가 중', caption: '두 번째 줄의 new 표현식을 먼저 평가합니다. 세 인자로 Greeting 객체를 만들며, 아직 왼쪽 변수에 참조를 대입하기 전인 개념 장면입니다.', alt: 'new 표현식으로 생성한 Greeting 객체 하나. name 김자바, message 김자바님 반가워요, nameLength 3. 아직 greeting과 연결하지 않았습니다.' },
  { title: '참조 대입', file: 'new-03-assignment-v2.jpg', count: 1, code: `${declaration}\n${creation}`, activeLine: 1, references: 'greeting → 첫 번째 객체', caption: '같은 두 번째 줄에서 생성된 객체의 참조를 greeting에 대입했습니다. 변수는 객체를 가리킵니다. 이 동작만으로 DB에 저장되지는 않습니다.', alt: 'greeting 참조 하나가 name 김자바, message 김자바님 반가워요, nameLength 3인 Greeting 객체 하나를 가리킵니다.' },
  { title: '참조 공유', file: 'new-04-alias-v2.jpg', count: 1, code: `${declaration}\n${creation}\n${alias}`, activeLine: 2, references: 'greeting · same → 같은 객체', caption: 'new 없이 참조를 대입하면 greeting과 same이 같은 객체를 가리킵니다. 변수가 두 개여도 객체를 복제한 것은 아닙니다.', alt: 'greeting과 same 두 참조가 같은 Greeting 객체 하나를 가리킵니다. 세 필드의 값은 그대로이며 객체 수는 1개입니다.' },
  { title: '새 객체 비교', file: 'new-05-another-v2.jpg', count: 2, code: `${declaration}\n${creation}\n${alias}\n${another}`, activeLine: 3, references: 'greeting · same → 첫 번째 / another → 두 번째', caption: 'new를 한 번 더 호출하면 같은 값을 가진 별도의 객체를 만듭니다. greeting과 same은 첫 번째 객체, another는 두 번째 객체를 가리킵니다.', alt: 'greeting과 same은 첫 번째 Greeting 객체, another는 별도로 생성한 두 번째 Greeting 객체를 가리킵니다. 두 객체 모두 name 김자바, message 김자바님 반가워요, nameLength 3입니다.' },
].map((scene) => ({ ...scene, image: assetRoot + scene.file }));
const fields = (second = false) => `<dl class="home-object-card" ${second ? 'data-object-second hidden' : 'data-object-card hidden'}><dt>${second ? '두 번째' : '첫 번째'} Greeting 객체</dt><dd>name <b>김자바</b></dd><dd>message <b>김자바님, 반가워요</b></dd><dd>nameLength <b>3</b></dd></dl>`;

export function renderHomeNewVisual() {
  return `<div class="home-dialog-body home-new-visual" data-home-new-visual>
    <p>한 줄에서 객체가 생기는 순간과 참조가 연결되는 순간을 나눠 봅니다.</p>
    <div class="home-new-stepper" role="group" aria-label="객체 생성 장면">${NEW_SCENES.map((scene, index) => `<button type="button" data-object-scene="${index}" aria-pressed="${index === 0}"><span>${index + 1}</span>${scene.title}</button>`).join('')}</div>
    <div class="home-new-stage"><figure class="home-new-plate"><img data-object-image src="${NEW_SCENES[0].image}" alt="${NEW_SCENES[0].alt}" width="1536" height="1024" loading="lazy"><figcaption><span data-object-count>이 예제의 Greeting 객체 0개</span><a data-object-open-image href="${NEW_SCENES[0].image}" target="_blank" rel="noopener">그림 크게 보기 ↗</a></figcaption></figure>
    <div class="home-new-observation"><div class="home-object-code"><span>Java 코드 · 선택한 줄을 확인하세요</span><pre><code data-object-code></code></pre></div><p class="home-reference-arrow" data-object-reference>greeting · 아직 초기화되지 않음</p><div class="home-object-empty" data-object-empty>아직 객체를 만들지 않았어요</div>${fields()}${fields(true)}</div></div>
    <p class="home-object-caption" data-object-caption aria-live="polite">${NEW_SCENES[0].caption}</p>
    <div class="home-new-actions"><button type="button" data-object-previous disabled>← 이전 장면</button><span data-object-position>1 / 5</span><button type="button" data-object-next>다음 장면 →</button></div>
    <p class="home-demo-note">그림은 개념 설명입니다. new 평가와 참조 대입은 같은 줄에서 일어나며, 객체 배치를 실제 메모리 주소로 표현한 것은 아닙니다. 이 예시는 DB에 연결하지 않습니다.</p><a href="docs/knowledge/P04-constructors-builder.html">생성자와 객체 만들기 더 살펴보기 →</a>
  </div>`;
}
