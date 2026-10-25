import fs from 'node:fs';
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderD01Supplementary(){
 const files=[['원문·추가 실행의 범위','source-proof/README.md'],['원문 SHA·9개 fence','source-proof/source.json'],['실제 CHECK11·별도 모델3','source-proof/execution.json'],['재현 runner 전체','source-proof/run-proof.py'],['추가 Gradle 설정','source-proof/fixture/common/build.gradle'],['추가 CLI와 계약','source-proof/fixture/common/src/main/java/example/lifecycle/LikeDemo.java'],['의도한 실패 구현','source-proof/fixture/variants/bad/LikeLedger.java'],['수정된 순차 메모리 구현','source-proof/fixture/variants/good/LikeLedger.java'],['독립 임시 사본 재현','source-proof/independent-replay.json'],['공식 출처 메인 대조·접근 한계','research/main-verification.json'],['실제 실패한 check의 raw 로그','source-proof/bad-check.log'],['실제 수정 뒤 build의 raw 로그','source-proof/fixed-build.log']];
 return `<details class="d01-supplement"><summary>원문·추가 실험 전체 코드와 실제 검증 근거</summary>
 <p>원문277줄·9개 fence를 보존했습니다. 추가 plain Java21.0.6/Gradle9.8.0 CLI를 새 임시 Git 저장소에서 실행했습니다. 실제 CHECK11개와 별도 Boolean·컬럼 이름 집합·장애 선택지 모델3개를 구분합니다. 원문의 Java25/Boot 앱·PR·원격 CI·registry·Docker·실제 배포와 DB migration은 실행하지 않았습니다.</p>
 <p>동일 actor7/post42의 두 호출에서 실패 구현은2개, 수정 구현은1개였습니다. assemble0/JAR 생성과 check1은 함께 나타날 수 있습니다. 수정 build0/PASS1은 추가 CLI 계약이며 JUnit·HTTP·동시성 시험이 아닙니다. Git baseline 포인터와 사용자 저장소는 보존했고 새 저장소의 remote는0입니다. 상위 run0700 아래 repo는 Git 초기화 후 실측0755입니다.</p>
 <p>실제2859바이트 JAR의 manifest Source-Revision과 SHA-256, dev/stg/prod 로컬 사본·설정 문자열·CLI flag·프로젝트 캐시 이동 뒤 동일 재빌드를 확인했습니다. 폴더 이름은 실제 환경 배포가 아니며 DB 별칭은 연결하지 않는 문자열입니다. 글로벌 Gradle 캐시는 삭제·이동하지 않았고 재사용·갱신될 수 있습니다. 재현성은 timestamp/순서를 고정한 이 fixture의 결과입니다. 성능·실제 장애·회복 시간은 측정하지 않았습니다.</p>
 ${files.map(([label,file])=>{const raw=fs.readFileSync(new URL('../../docs/design/d01-2026-10-20/'+file,import.meta.url),'utf8');let text=raw;try{text=JSON.stringify(JSON.parse(raw),null,2);}catch{}return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;}).join('')}
 </details>`;
}
