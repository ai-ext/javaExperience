import { readFileSync } from 'node:fs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const proofRoot = new URL('../../docs/design/p16-2026-10-20/source-proof/', import.meta.url);
export function renderP16ExecutionEvidence() {
  const files = ['MapperExample.java', 'P16MapperProof.java', 'P16MvcProof.java'];
  return `<section class="p09-learning p16-execution-evidence" aria-labelledby="p16-execution-heading">
    <h2 id="p16-execution-heading">버전 차이와 추가 실행의 범위</h2>
    <p>원문과 위의 주문 예상 장면은 보존했습니다. 아래는 Jackson 3.1.5·JDK 21의 독립 mapper 실행과 Spring 7.0.9 MockMvc 추가 검사입니다. Boot 4.1.1·Java 25·DB·실제 HTTP 포트는 실행하지 않았습니다.</p>
    <p><strong>Jackson 3의 기본 unknown 필드 처리는 무시입니다.</strong> strict는 명시적으로 켜는 정책입니다. Enum은 기본 toString()을 사용하며, 위의 원문 Enum에는 재정의가 없어 PAID가 나옵니다. primitive의 명시적 null 입력은 기본 거부입니다. 애플리케이션 설정은 이 기본값을 바꿀 수 있습니다.</p>
    <p>직접 실행한 원문 MapperExample은 <code>{"name":"Kim","age":29}</code>와 <code>Kim:29</code>를 출력했습니다. 추가 mapper 검사24개와 아래 MockMvc 검사11개도 통과했습니다.</p>
    <h3>같은 추가 Controller로 확인한 요청·응답 경계</h3>
    <p>원문 §3.2의 DTO와 반환식에 본문 호출 계수만 추가했습니다. JSON converter 하나를 명시 등록한 MockMvc 결과이므로 다른 consumes·converter·예외 처리 설정의 응답까지 보장하지 않습니다.</p>
    <table><thead><tr><th>추가 입력</th><th>관찰 결과</th><th>이번 본문 호출</th></tr></thead><tbody>
      <tr><td>JSON · keyboard / 2 · Accept JSON</td><td>200 · 원문 고정 id1·시각</td><td>호출됨</td></tr>
      <tr><td>JSON · quantity "two"</td><td>400 · 읽기 실패</td><td>호출되지 않음</td></tr>
      <tr><td>같은 정상 본문 · text/plain</td><td>415 · 읽을 converter 없음</td><td>호출되지 않음</td></tr>
      <tr><td>같은 정상 본문 · Content-Type 없음</td><td>415 · 이 구성의 결과</td><td>호출되지 않음</td></tr>
      <tr><td>정상 JSON · Accept application/xml</td><td>406 · 응답 협상 실패</td><td>이미 호출됨</td></tr>
    </tbody></table>
    <p><a href="https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.0" target="_blank" rel="noopener">Jackson 3 기본값 변경</a> · <a href="https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html" target="_blank" rel="noopener">Spring 메시지 변환기</a> · 확인 2026-10-20. Codex CLI gpt-6-luna 공식 원문 조사와 메인의 라이브 출처·실행 대조를 함께 기록했습니다.</p>
    <details><summary>추가 실행 전체 코드와 원시 출력</summary><p>첫 파일만 원문 추출본이며 나머지 두 파일은 독립 추가 실험입니다. JPA의 순환·지연 로딩 예외는 이 실행에서 재현하지 않았습니다.</p>${files.map(file => `<details><summary>${escape(file)}</summary><pre><code>${escape(readFileSync(new URL(file, proofRoot), 'utf8'))}</code></pre></details>`).join('')}${['MapperExample.stdout.txt','P16MapperProof.stdout.txt','P16MvcProof.stdout.txt'].map(file => `<details><summary>${escape(file)}</summary><pre><code>${escape(readFileSync(new URL(file, proofRoot), 'utf8'))}</code></pre></details>`).join('')}</details>
  </section>`;
}
