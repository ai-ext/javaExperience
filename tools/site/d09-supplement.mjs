import fs from 'node:fs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const base = new URL('../../docs/design/d09-2026-10-21/', import.meta.url);
export function renderD09Supplementary() {
  const source = JSON.parse(fs.readFileSync(new URL('source-proof/source.json', base), 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(new URL('source-proof/fixture-manifest.json', base), 'utf8'));
  const runtime = JSON.parse(fs.readFileSync(new URL('source-proof/runtime-last.json', base), 'utf8'));
  const recordRoot = 'source-proof/records/replay/' + runtime.run.split('/').at(-1) + '/';
  const optional = [
    ['독립 native 재현·원문·binary·정리 검토', 'source-proof/independent-replay.json'],
    ['미실행 모델 독립 검토', 'model-review.json'],
  ];
  const files = [
    ['원문309줄 전체 Markdown', '../../knowledge/D09-operations-observability.md'],
    ['추가 native와 component/full 모드·미실행 경계', 'source-proof/README.md'],
    ['원문9block SHA', 'source-proof/source.json'],
    ...source.originalBlocks.map(row => [`원문 block${row.block} 전체 · ${row.language} · 이번 미실행`, 'source-proof/original/' + row.file]),
    ...fixture.files.map(row => ['추가 fixture 전체 · ' + row.file, 'source-proof/fixture/' + row.file]),
    ['추가 own HTTP·실제 Prom query·SQLite·샘플 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종 native22CHECK·미실행 모델6 전체', 'source-proof/execution.json'],
    ['미실행 모델6 원본 전체', 'source-proof/models.json'],
    ['변경하지 않는 frozen 전체 비교 기준', 'source-proof/checkpoints/expected-execution.json'],
    ['actual HTTP·Prom sample 시각·PID/port·종료 원자료 전체', 'source-proof/runtime-last.json'],
    ['fixture4·runner SHA', 'source-proof/fixture-manifest.json'],
    ['공식 main artifact 기록·실행 binary version/SHA', 'source-proof/prometheus-artifact.json'],
    ['최초 freeze·역사적 모델0 probe 보존 기록', 'source-proof/freeze-verification.json'],
    ['author fresh 전체 frozen·정리 대조', 'source-proof/author-fresh-verification.json'],
    ['main fresh 전체 frozen·정리 대조', 'source-proof/main-fresh-verification.json'],
    ['main fresh 실제22PASS 전체 로그', 'source-proof/main-replay.log'],
    ['component-only17CHECK · Prom 미실행의 별도 역사적 기록', 'source-proof/component-execution.json'],
    ['실제 업무 JSON 사건4개 전체', recordRoot + 'business-events.jsonl'],
    ['실제 own Prom config · 원문 설정과 구분', recordRoot + 'prometheus-extra.yml'],
    ['실제 own Prom stdout/stderr 전체', recordRoot + 'prometheus.log'],
    ['원본 공식 조사 보고서', 'research/REPORT.md'],
    ['메인 직접 공식 문헌 확인·정정·한계', 'research/main-verification.json'],
    ['공식 출처 전체', 'research/sources.json'],
    ...optional.filter(([, file]) => fs.existsSync(new URL(file, base))),
  ];
  const pending = optional.filter(([, file]) => !fs.existsSync(new URL(file, base)));
  return `<details class="d09-supplement"><summary>원문·추가 native·명시 계산·미실행 모델 전체 근거</summary>
    <p>D09 원문309줄9block(Mermaid4/YAML2/bash3)과 기존 본문·코드는 별도로 보존합니다. 원문에는 Java 코드가 없고 Java25/S16 Actuator·Micrometer 준비/Docker Compose/Grafana 예시를 이번에 실행하지 않았습니다. 추가 Python3.14.3/SQLite3.53.0·native Prometheus3.15.0 darwin/arm64의 새0700 runtime·loopback·새 TSDB만 사용했습니다. fixture4개는 exporter·SQLite 복원·명시 계산·추가 Prom config입니다. native22CHECK는 고유 assertion ID이며 독립22실험·39전체상태 PASS가 아닙니다. native17·모델19·미실행 원문3상태를 구분하고 미실행 모델6은 executed=false/PASS 없음입니다.</p>
    <p>실제 업무 GET4건은 success200/true/true, httpfail500/false/true, badpayload200/false/true, invalid400/false/false(status/business_ok/valid)입니다. outcome1/2/1이고 invalid 제외는 이 toy의 정의이지 모든4xx 정책이 아닙니다. 유효3·업무성공1과 유효HTTP200의2는 다릅니다. /metrics·Prom polling·scrape·readiness까지 전체 HTTP가4번이라는 뜻이 아닙니다. 고정 request_id와 actual timestamp를 응답·JSON 사건4개에서 대조했고 exporter metric label은 bounded outcome만 둡니다. Prom job/instance label은 별도입니다. ID 상관은 OTel span/context 전파·export·저장·조회를 실행한 증거가 아닙니다.</p>
    <p>추가 /metrics와 원문 /actuator/prometheus를 혼합하지 않습니다. 실제 Prom API의 up1이지만 업무 실패2건이 있고 선택 counter6개는1/2/1/3/1/2였습니다. 자체 exporter 종료의 통제 사례에서 up0을 관측했고 같은 own 포트·새 PID 재시작 뒤 up1과 선택6counter0을 확인했습니다. up0 일반 원인은 연결/timeout/HTTP/형식 등 scrape 실패이며 이번 native 원인은 own stop 한 사례입니다. 새 메모리 counter0은 같은 Prom TSDB의 과거 sample 삭제를 뜻하지 않습니다. rate·histogram·장기 운영 SLO는 측정하지 않았습니다. 1s scrape/500ms timeout은 추가 fixture 선택값이지 제품 기본·수집 속도·latency 측정이 아닙니다.</p>
    <p>Prom archive SHA920df4d17e78b3b0175af144eb318b0c74d1cf7b1d1251b326966f0e81977260와 실행파일 SHAedfbcf257fff3694e345be7648ce8ee05aa0cf602662097c649f4923116d7145는 다른 대상입니다. main 공식 artifact 검증과 runner의 actual binary version/SHA·query를 함께 보존합니다. 자체 장기 프로세스3개(exporter2/Prom1)는 최종 exit0/PIDgone·자체 포트2개 closed·kill fallback 없음이고 별도 SQLite/Decimal/version 명령과 다른 분모입니다. cleanup CHECK는 모든 검증 뒤 별도 시점입니다. 원문8080/9090/3000·기존서비스·DB·practice·cache는 접속/변경하지 않았습니다.</p>
    <p>명시10000/9980/20/99.9%의 Decimal 결과 allowed10/remaining-10/burn2는 업무4건과 별개인 지정 입력입니다. 30일43.2분은 시간 기반 정의일 때만의 예시이며 요청 SLI를 downtime으로 환산하지 않습니다. 분모0·no-data를 자동 성공100%로 숨기지 않습니다. 숫자 벡터10/20/30/40/50의 nearest-rank p50rank3/value30·p95rank5/value50도 실제 latency·단위·Prom histogram 쿼리가 아닙니다. classic 선형 보간을 native exponential 모두로 확대하거나 인스턴스 p95 단순 평균을 전체p95로 부르지 않습니다.</p>
    <p>별도 SQLite에서 seed1행 commit→Connection.backup snapshot→원본 새 행 commit→새 target 복원을 실행했습니다. 원본2행은 보존되고 snapshot/restored1행·seed 보존·세 integrity ok/연결 close를 대조했습니다. 기존 DB 삭제·실제 운영 장애·RPO5분/RTO2시간 달성·앱 연결·서비스 복구 시간을 측정한 것이 아닙니다. 데이터 파일 복원과 사용자 기능·키 접근·네트워크/의존성 회복은 다른 단계이며 복제가 역사적 백업을 대체하지 않습니다.</p>
    <p>원문 block05/06은 실제 YAML입니다. 15s·host.docker.internal:8080·9090/3000·Grafana 내부 http://prometheus:9090·가변 latest는 원문 미실행 구성입니다. block07~09의 원본 bash도 전체 보존합니다. 문헌 모델의 로그·메트릭·트레이스는 선택한 질문 범위이지 세 신호만으로 모든 관측성 완성이라는 뜻이 아닙니다. 사용자 영향·행동 가능한 알림과 임박한 자원 위험 경고·평가 window·low traffic/no-data 정책을 구분합니다. 실제 page·온콜·incident·공지·HPA·cache/CDN·운영 DR는 실행하지 않았습니다. HPA15s는 설정 가능한 제어 루프 간격이며 기동/warmup 완료 시간이 아닙니다. CDN forwarding과 cache key는 별개이고 CloudFront minimumTTL&gt;0은 원본 no-cache/no-store/private보다 최소 캐시 기간을 우선할 수 있습니다. 전수pixel·학습자 이해·실제 운영 목표 인증을 주장하지 않습니다.</p>
${pending.length ? `<p>아직 파일이 없는 별도 근거: ${pending.map(([label]) => escape(label)).join(' / ')}. 이 범위의 완료를 주장하지 않습니다.</p>` : ''}
    ${files.map(([label, file]) => { const raw = fs.readFileSync(new URL(file, base), 'utf8'); let text = raw; try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·실제 코드·로그 개행 보존 */ } return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`; }).join('')}
  </details>`;
}
