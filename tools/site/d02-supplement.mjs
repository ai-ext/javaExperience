import fs from 'node:fs';
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderD02Supplementary(){
 const files=[['원문·추가 실행 범위와 실패 교정','source-proof/README.md'],['원문 SHA·9개 fence','source-proof/source.json'],['실제 CHECK17·별도 모델3','source-proof/execution.json'],['원문 그대로 ProbeApplication.java','source-proof/fixture/java/com/example/ProbeApplication.java'],['추가 Java21 Gradle 설정','source-proof/fixture/build.gradle'],['추가 DNS·TCP·TLS·Python proxy 전체','source-proof/run-proof.py'],['관찰기 잘못된 가정·demo CA 교정','source-proof/attempt-notes.json'],['실제 의존성39개 SHA','source-proof/dependencies.json'],['독립 temp 재현·버전 차이','source-proof/independent-replay.json'],['공식·규격 메인 대조·접근 한계','research/main-verification.json']];
 return `<details class="d02-supplement"><summary>원문·추가 실험 전체 코드와 실제 검증 근거</summary>
 <p>원문304줄9fence와 완전한 Java 소스를 보존했습니다. 원문 Java 그대로 추가 Java21/Boot4.1.1/Tomcat11.0.24·새127.0.0.1/port0에서 실제 TCP /probe200/ok와 미등록404를 확인했습니다. Java25·8080·Kotlin 전체 설정을 실행한 결과는 아닙니다. 의존성39개 SHA와 main·독립17CHECK/3모델 frozen 일치를 기록했습니다.</p>
 <p>DNS UDP toy는 자체 loopback의 고정 응답이고 documentation IP로 HTTP를 보내지 않았습니다. TTL60 cache는 고정 clock 모델입니다. 현재 Mac의 listen 전 connect timeout·listen 뒤 TCP·의도한 무응답 read deadline을 구분합니다. timeout 하나로 방화벽 원인을 확정하지 않습니다.</p>
 <p>새0700 run의 demo CA/leaf와0600 개인키를 사용했고 인증서·hostname·strict X509 검증을 유지했습니다. 시스템 truststore를 바꾸지 않았습니다. 추가 Python proxy에서 TLS를 끝내고 원문 Boot에 HTTP로 전달했습니다. 경로 변환200/변환 생략404와 이름 불일치·신뢰 CA 부재의 HTTP전 거부를 관찰했습니다. Nginx·실제 resolver·root/TLD·NAT/firewall·외부 경로·QUIC·Forwarded 정책을 실행한 것은 아닙니다. 자체 서버·thread·socket은 종료했습니다.</p>
 ${files.map(([label,file])=>{const raw=fs.readFileSync(new URL('../../docs/design/d02-2026-10-20/'+file,import.meta.url),'utf8');let text=raw;try{text=JSON.stringify(JSON.parse(raw),null,2);}catch{}return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;}).join('')}
 </details>`;
}
