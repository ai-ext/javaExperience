import fs from 'node:fs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const base = new URL('../../docs/design/d08-2026-10-21/', import.meta.url);
export function renderD08Supplementary() {
  const source = JSON.parse(fs.readFileSync(new URL('source-proof/source.json', base), 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(new URL('source-proof/fixture-manifest.json', base), 'utf8'));
  const runtime = JSON.parse(fs.readFileSync(new URL('source-proof/runtime-last.json', base), 'utf8'));
  const files = [
    ['원문319줄 전체 Markdown', '../../knowledge/D08-cicd-collaboration.md'],
    ['추가 local native·세 빌드·미실행 경계', 'source-proof/README.md'],
    ['원문8block SHA', 'source-proof/source.json'],
    ...source.originalBlocks.map(row => [`원문 block${row.block} 전체 · ${row.language} · 미실행 source`, 'source-proof/original/' + row.file]),
    ...fixture.files.map(row => ['추가 fixture 전체 · ' + row.file, 'source-proof/fixture/' + row.file]),
    ['추가 Git·Java21·JUnit·task 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종 native22CHECK·미실행6모델 전체', 'source-proof/execution.json'],
    ['미실행 정책 모델6 원본 · 변경하지 않은 frozen 표현', 'source-proof/models.json'],
    ['Argo automated 네 경우 별도 명확화 · frozen 미수정', 'source-proof/model-clarifications.json'],
    ['변경하지 않는 frozen 전체 비교 기준', 'source-proof/checkpoints/expected-execution.json'],
    ['명령 exit·실제 task·JAR·Git 원자료 전체 JSON', 'source-proof/runtime-last.json'],
    ['추가 fixture12 SHA와 runner SHA', 'source-proof/fixture-manifest.json'],
    ['resolved runtime21/test29/합집합29 dependency SHA', 'source-proof/dependencies.json'],
    ['최초 freeze 전체 비교 기록', 'source-proof/freeze-verification.json'],
    ['새 private run fresh 전체 비교 기록', 'source-proof/main-fresh-verification.json'],
    ['main fresh 실제22PASS 전체 로그', 'source-proof/main-replay.log'],
    ['독립 사본 전체 frozen·실제 파일·세 빌드 대조', 'source-proof/independent-replay.json'],
    ['원문·추가 정책 모델 독립 검토와 별도 보완', 'model-review.json'],
    ['공식 문헌 메인 검증·현재 버전·보고서 정정·한계', 'research/main-verification.json'],
    ['원본 연구 보고서 · 현재 확인 정정은 위 메인 검증과 대조', 'research/REPORT.md'],
    ...['ungated', 'bad', 'fixed'].map(name => ['실제 JUnit XML 전체 · ' + name, 'source-proof/records/replay/' + name + '-TEST-proof.CalculatorTest.xml']),
    ...runtime.commands.filter(row => ['ungated-clean-test-bootjar', 'buggy-clean-test-bootjar', 'fixed-clean-test-bootjar'].includes(row.name)).map(row => ['실제 로컬 build stdout/stderr · ' + row.name + ' · exit' + row.exitCode, 'source-proof/records/replay/' + row.log.split('/').at(-1)]),
  ];
  return `<details class="d08-supplement"><summary>원문·추가 Git/빌드 실측·미실행 정책 전체 근거</summary>
    <p>D08 원문에는 Java 앱 코드가 없습니다. 원문319줄8block(mermaid3/bash1/YAML3/Groovy1)을 보존하고, Java·JUnit·Gradle·Python을 추가 fixture12개로 분리했습니다. 추가 Java21.0.6/Gradle9.8.0/Boot4.1.1/Spring core7.0.9/Jupiter6.0.3의 로컬 관찰입니다. 원문 Java25·workflow YAML/Groovy·실제 CI·HTTP·앱 기동은 미실행입니다. native22CHECK는 고유 assertion ID이며 독립 실험22회가 아닙니다. 모델6은 executed=false이고 PASS를 붙이지 않습니다.</p>
    <p>서로 독립인 새 private Git6개는 remote0·고정 test author/time입니다. working/index/commit/ref·이동시키지 않은 lightweight tag·merge parent2개·rebase parent/SHA 변화·squash 동일 tree/feature 비조상·실제 한 파일 conflict 뒤 Python2+3=5를 대조했습니다. 사용자 브랜치·공유 이력·PR 승인·보호정책 실험이 아닙니다. tag는 원래 이동 불가능한 객체라는 주장이 아니고 squash 뒤 feature ref의 commit 객체가 삭제됐다는 뜻도 아닙니다.</p>
    <p>같은 추가 Calculator의 테스트1개를 세 빌드에서 실행했습니다. ungated는 bootJar가 test보다 먼저 실행되어 exit1/JUnit1fail이어도 JAR가 존재합니다. 추가 build.gradle에 bootJar dependsOn test를 명시한 다음 같은 bad Java로 clean test bootJar를 실행하면 exit1·bootJar 미실행·JAR 없음입니다. Java를 left+right로 수정한 commit에서는 같은 명령 exit0/JUnit1pass·JAR 생성을 확인했습니다. 명령 나열만으로 task gate가 생긴다고 하지 않으며 CI job needs·후속 skipped와는 다른 층입니다. 첫 ungated 예상 오류와 다음 harness CHECK 개수 오류는 source-proof의 attempt 자료에 보존하고 최종 성공 근거와 구분합니다.</p>
    <p>수정 후 JAR는9102150bytes·nested20이고 full SHA는 실제 관찰값으로 보존합니다. main class major65·JAR 내부 class byte, resolved runtime21/test29/coordinate 합집합29를 대조했습니다. nested20과 resolved 목록은 다르고 플러그인 전체 목록이 아닙니다. 실제 검증 commit97f2a0e544c8218a1e92d45ff3b2fb25f082d94c과 source SHA·JAR SHA는 외부 관찰 metadata로 연결하며 JAR에 Git SHA를 넣었다고 주장하지 않습니다. 같은 JAR의 private dev/stg/prod 폴더 사본은 실제 환경 승격·실행이나 image digest가 아닙니다. 고정 입력·archive 설정의 같은 머신 재현을 보편적인 빌드 재현성으로 확대하지 않습니다.</p>
    <p>기존 cache는 읽어 private Gradle user home으로 복사하고 offline/no-daemon/max-workers2를 사용했습니다. 기존 cache 삭제·cache miss·속도 실험이 아닙니다. JUnit은 Calculator를 직접 생성하는 단위 테스트이며 Spring context·proxy·DB·HTTP 검사로 부르지 않습니다. 원격 Git/PR/CI·registry·Docker·Kubernetes·Argo·secret·실제 조직 dev/stg/prod는 조작하지 않았습니다. 코드·기본 모델의 공식 문헌 대조는 메인 연구 검증과 별개 범위로 기록합니다.</p>
    <p>Argo 별도 명확화: syncPolicy.automated 자체가 없으면 auto-sync 비활성, {}로 존재하면 활성, 그 안 enabled 생략/null은 활성 취급, false는 비활성입니다. prune/selfHeal 옵션만 적어 활성화됐다고 하지 않습니다. 기존 frozen raw의 모호한 absence 표현은 수정하지 않고 model-clarifications.json을 UI 기본 sourceNote·JSON projection과 여기에 함께 보존합니다. prune/selfHeal·같은 SHA/parameters 실패의 새 auto-sync와 별도 retry·multi-source trigger를 나누며, 120s+jitter≤60s 문헌 기본 설정을 실측·즉시원복·모든 sync 완료시간 보장으로 표시하지 않습니다.</p>
    <p>H2/M1과 T/D1/D2는 명시적인 설명 별칭입니다. 일반 열린 merge 가능한 PR의 merge ref와 head-only checkout은 다르고, accepted check에는 정책이 허용하는 skipped/neutral이 포함될 수 있어 모든 job 실행 성공과 같지 않습니다. strict/stale approval과 환경 gate는 설정 조건입니다. 원문 action v4/Java25는 그대로 보존하고 현재 checkout7/setup-java6 문헌 확인·Gradle Java25 호환·native Java21을 구분합니다. v7의 fork guard를 원문 v4에 소급하지 않습니다. sync와 health, image tag와 digest, index와 platform 선택, Delivery와 Deployment·실제 권한을 각각 나누며 digest 고정만으로 승인·취약점 부재·DB 호환을 인증하지 않습니다. 전체 페이지·학습자 이해·전수 pixel parity 검증 완료를 뜻하지 않습니다.</p>
    ${files.map(([label, file]) => { const raw = fs.readFileSync(new URL(file, base), 'utf8'); let text = raw; try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·코드·로그의 줄바꿈 보존 */ } return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`; }).join('')}
  </details>`;
}
