const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** W04의 첫 두 질문은 직접 조작하는 장면으로 보여 주고 긴 원문을 뒤에 둔다. */
export function renderMybatisFocused() {
  const mapper = 'Book findById(@Param("id") long id);';
  const xml = '<mapper namespace="com.example.book.mapper.BookMapper">\n  <select id="findById" resultType="Book">\n    SELECT id, title FROM book WHERE id = #{id}\n  </select>\n</mapper>';
  return `<section class="mybatis-focused" data-mybatis-screen="mapping" aria-label="MyBatis 개념 두 장면">
    <article class="mybatis-focus-screen" data-mybatis-panel="mapping" aria-labelledby="mybatis-mapping-title">
      <p class="mybatis-focus-kicker">W04 · MyBatis 첫 이해</p><h2 id="mybatis-mapping-title">MyBatis는 SQL을 어디서 찾을까요?</h2>
      <p class="mybatis-focus-lead">Java의 Mapper 메서드와 같은 이름의 XML 문장을 연결합니다.</p>
      <div class="mybatis-focus-connection"><div class="mybatis-focus-code"><header><strong>BookMapper.java</strong><small>인터페이스</small></header><pre><code>${esc(mapper)}</code></pre><p><code>findById(42)</code> 호출</p></div><b aria-hidden="true">→</b><div class="mybatis-focus-code"><header><strong>BookMapper.xml</strong><small>SQL 문장</small></header><pre><code>${esc(xml)}</code></pre><p><code>namespace + id</code>로 문장을 찾습니다.</p></div></div>
      <p class="mybatis-focus-result">조회한 행 → <code>Book</code> 객체로 매핑</p><p class="mybatis-focus-note">설명용 예시 · 실제 DB 실행 결과 아님</p>
      <button type="button" class="mybatis-focus-primary" data-mybatis-go="binding">다음: 값은 SQL에 어떻게 들어갈까요? →</button>
    </article>
    <article class="mybatis-focus-screen" data-mybatis-panel="binding" hidden aria-labelledby="mybatis-binding-title">
      <p class="mybatis-focus-kicker">W04 · 값과 문법 구분</p><h2 id="mybatis-binding-title"><code>#{id}</code>와 <code>&#36;{column}</code>은 무엇이 다를까요?</h2>
      <p class="mybatis-focus-lead">입력값에는 <code>#{id}</code>를 씁니다. 값과 SQL 문장이 분리됩니다.</p>
      <div class="mybatis-focus-bind"><div><span>XML에 작성</span><code>WHERE id = #{id}</code></div><b aria-hidden="true">→</b><div><span>준비된 SQL</span><code>WHERE id = ?</code></div><b aria-hidden="true">+</b><div><span>따로 전달하는 값</span><code>42</code></div></div>
      <p class="mybatis-focus-result">입력값은 SQL 문장에 붙이지 않고 바인딩합니다.</p>
      <details class="mybatis-focus-alternative"><summary><code>&#36;{column}</code>은 언제 쓰나요?</summary><p>컬럼 이름처럼 SQL 문법 자체를 바꿔야 할 때만 씁니다. 값과 달리 SQL 글자로 치환되므로 외부 입력을 그대로 넣지 말고, 허용한 컬럼 이름만 선택하세요.</p></details>
      <footer class="mybatis-focus-actions"><button type="button" data-mybatis-go="mapping">← 메서드와 XML</button><a href="#와-는-안전성-모델이-다르다" data-mybatis-source="true">바인딩 원리 자세히 보기 ↗</a></footer>
    </article>
    <details class="mybatis-focus-images"><summary>두 장면의 이미지 시안 보기</summary><a href="../design/mockups-2026-10-15-batch9/01-mybatis-mapper.jpg">Mapper와 XML</a><a href="../design/mockups-2026-10-15-batch9/02-mybatis-binding.jpg">값 바인딩</a></details>
  </section>`;
}
