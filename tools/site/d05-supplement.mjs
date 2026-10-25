import fs from 'node:fs';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const base = new URL('../../docs/design/d05-2026-10-21/', import.meta.url);

export function renderD05Supplementary() {
  const source = JSON.parse(fs.readFileSync(new URL('source-proof/source.json', base), 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(new URL('source-proof/fixture-files.json', base), 'utf8'));
  const files = [
    ['원문343줄 전체 Markdown', '../../knowledge/D05-debugging-methodology.md'],
    ['원문·추가 실험·재현 범위', 'source-proof/README.md'],
    ['원문9개 fence SHA', 'source-proof/source.json'],
    ...source.originalBlocks.map(block => [`원문 block${block.block} 전체 · ${block.language}`, 'source-proof/original/' + block.file]),
    ...fixture.map(row => [`fixture 전체 · ${row.file} · 원문 사본/추가 구분은 설명 참조`, 'source-proof/' + row.file]),
    ['추가 HTTP·jdb·thread·Git 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종23 CHECK·3모델 전체', 'source-proof/execution.json'],
    ['수정하지 않는 frozen 비교 기준', 'source-proof/checkpoints/expected-execution.json'],
    ['실제 명령·6 HTTP·대화형 입력 원자료 전체 JSON', 'source-proof/runtime-last.json'],
    ['fixture9개 SHA', 'source-proof/fixture-files.json'],
    ['runtime+test47개 해석 파일 SHA', 'source-proof/dependencies.json'],
    ['line12/line13 첫 관찰 시점 교정', 'source-proof/attempt-notes.json'],
    ['최초 실패 jdb 원시 출력', 'source-proof/attempt-01-jdb.log'],
    ['설치된 JDK21 jdb 명령 help', 'source-proof/jdb-local-help.txt'],
    ['main fresh 전체 재현 로그', 'source-proof/replay.log'],
    ['독립 temp 전체 재현·보존·종료 검토', 'source-proof/independent-replay.json'],
    ['공식 문헌 메인 검증과 한계', 'research/main-verification.json'],
  ];
  return `<details class="d05-supplement"><summary>원문·추가 예시 전체 코드와 실제 검증 근거</summary>
    <p>원문343줄9fence를 보존했습니다. fixture9개에는 byte 그대로인 원문 Java/properties 사본2개와 추가 관찰 도구·JUnit·Java21 Gradle 설정이 있습니다. 실제 Java21.0.6·Wrapper9.8.0·Boot4.1.1/FW7.0.9/Tomcat11.0.24·Logback1.5.38·JUnit6.0.3과 runtime+test47개 해석 파일 SHA를 확인했습니다. 원문 Java25/8080·IntelliJ·DB·운영 구성을 그대로 실행한 결과는 아닙니다. 실제 CHECK23개·모델3개는 연결된 관측이며23개 독립 실험이라는 뜻이 아닙니다. main fresh와 독립 temp는 전체 frozen과 일치했습니다.</p>
    <p>원문 Controller의 id7은200/OK, id13은가상 SQLException을 감싼500입니다. 실제 DB 호출은 없습니다. default HTTP error JSON의 error/path/status/timestamp와 서버 stack은 별도 증거입니다. SourceProbe의 첫 앱 frame·line29·공통2 frame 생략은 해당 direct 호출의 관측이며 HTTP 전체 stack의 생략 수가 아닙니다. 별도 Resource의 primary/body failed·cause null·suppressed/close failed를 원문 Controller와 섞지 않습니다. 추가 Logback INFO/DEBUG에서 marker 출력은 달라도 methodResult는 둘 다OK였습니다.</p>
    <p>추가 JUnit은 원문7=OK/13=가상 실패 계약으로2개 통과했습니다. private 사본의 조건13→7만 바꾸면2개 실패했고 원문 bytes 복원 뒤 다시2개 통과했습니다. DB 오류를 고친 결과가 아닙니다. 원문과 학습자 소스·frozen은 변경하지 않았습니다.</p>
    <p>별도 DebugTarget에만 own127.0.0.1 동적 JDWP와 JDK21 jdb CLI를 사용했습니다. inspect id13/counter0에서 bump 평가가 counter1로 바뀌고 후속 result는27이었습니다. 평가 없는 별도 실행은26입니다. 원문 Controller의 상태 변경이나 IntelliJ UI 실험이 아닙니다. 첫 step up은 caller line11, 첫 next의line12는 result 대입 전입니다. 둘째 next로line13에 정지한 뒤 result27을 읽었습니다. 최초 실패의 Name unknown 관찰은 시점 교정이며 결과나 fixture를 바꾼 것이 아닙니다. 원시 포트·PID·시각은 원자료에 두고 P_DEBUG는 설명 별칭으로만 씁니다.</p>
    <p>별도 ThreadTarget의 own Thread.print2회에서 monitor 진입 BLOCKED와 release latch WAITING을 구분했습니다. holder는 monitor를 잡은 채 latch를 기다립니다. latch 해제·join 뒤 자체 fixture는exit0입니다. 운영 deadlock·CPU·heap·지연을 측정한 것이 아닙니다. private Git의 C1..C7은 실제 commit 별칭이며 같은 javac/Java 계약 판정으로C4 exit1·C3 exit0을 관찰해first bad C4를 찾았습니다. bisect reset은C7·remotes0이며 사용자 worktree는 bisect하지 않았습니다.</p>
    <p>HTTP 앱은 관측 뒤 자체 SIGTERM으로 종료돼exit143이며 자연exit0으로 표시하지 않습니다. 별도 DebugTarget baseline/target·jdb·ThreadTarget은exit0이고 own HTTP/JDWP port는 닫혔습니다. IDE 조건부/예외/로그 breakpoint·All/Thread suspension·Chrome Network·request ID 전파·SQL/bind/plan/pool wait·metrics/traces/heap/Kubernetes/rollback/deploy는 모델 또는 미실행 경계입니다. 모델에는 PASS를 만들지 않습니다. UI·학습자 이해·전수 pixel parity까지 완료했다는 뜻도 아닙니다.</p>
    ${files.map(([label, file]) => {
      const raw = fs.readFileSync(new URL(file, base), 'utf8');
      let text = raw;
      try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·소스·로그 문자열 보존 */ }
      return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;
    }).join('')}
  </details>`;
}
