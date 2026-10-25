import fs from 'node:fs';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderD04Supplementary() {
  const files = [
    ['원문325줄 전체 Markdown', '../../knowledge/D04-build-pipeline-explained.md'],
    ['원문·추가 실행 범위와 재현 안내', 'source-proof/README.md'],
    ['원문325줄·9개 fence SHA', 'source-proof/source.json'],
    ['미실행 원문 Kotlin Java25 설정 전체', 'source-proof/original/block-05.gradle.kts'],
    ['추가 Java21·BOM·JUnit·계측 빌드 설정 전체', 'source-proof/fixture/build.gradle.kts'],
    ['추가 settings·own project cache 설정', 'source-proof/fixture/settings.gradle.kts'],
    ['추가 non-web Boot bootstrap 전체', 'source-proof/fixture/src/main/java/example/build/BuildDemoApplication.java'],
    ['추가 BuildPolicy 전체', 'source-proof/fixture/src/main/java/example/build/BuildPolicy.java'],
    ['추가 JUnit 두 테스트 전체', 'source-proof/fixture/src/test/java/example/build/BuildPolicyTest.java'],
    ['추가 리소스 원본 전체', 'source-proof/fixture/src/main/resources/lesson.properties'],
    ['추가 빌드 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종 CHECK21·모델3 전체', 'source-proof/execution.json'],
    ['frozen 비교 기준 전체', 'source-proof/checkpoints/expected-execution.json'],
    ['실제 명령·태스크 결과·초기 JAR metadata 원자료', 'source-proof/runtime-last.json'],
    ['추가 fixture6개 SHA', 'source-proof/fixture-files.json'],
    ['runtime+test 해석 파일29개 SHA', 'source-proof/dependencies.json'],
    ['최초 실패·동일 원인 중복·정상 online 확보 이력', 'source-proof/attempt-notes.json'],
    ['첫 verification offline 실패 로그', 'source-proof/attempt-01-freeze.log'],
    ['동일 pinned 버전 verification metadata 확보 로그', 'source-proof/verification-metadata-online.log'],
    ['main fresh offline replay 로그', 'source-proof/replay.log'],
    ['독립 temp 재현·전체 frozen·SHA 대조', 'source-proof/independent-replay.json'],
    ['공식 문헌 메인 확인과 버전·접근 한계', 'research/main-verification.json'],
  ];
  return `<details class="d04-supplement"><summary>원문·추가 빌드 전체 코드와 실제 검증 근거</summary>
    <p>원문325줄9fence의 Kotlin Java25 설정과 명령은 보존했고 실행하지 않았습니다. D04에는 Java 원문이 없으며 Java3파일·리소스1파일·settings/build 총fixture6개가 추가 코드입니다. 원문25→추가21 toolchain 변형과 명시 BOM·JUnit·계측을 구분합니다. 실제 Java21.0.6·Wrapper9.8.0·Boot plugin4.1.1·JUnit Jupiter/launcher6.0.3을 사용했습니다. runtime+test 해석 파일29개는 testRuntimeClasspath 집합이며 플러그인 전체 classpath 목록이 아닙니다. Boot JAR의 lib20개와도 다른 집합입니다.</p>
    <p>실제 CHECK21개와 별도 모델3개를 기록했고 main fresh·독립 temp 재현이 전체 frozen과 일치했습니다. dry-run 계획과 출력 부재, major65 class·리소스·JUnit2개 실행·JAR를 나눴습니다. JUnit2개 중1개 실패와 compileJava/compileTestJava 실패, 이전 성공 JAR 잔존과 현재 build 성공을 구분합니다. assemble-only는 새 복사본에서 JAR를 만들었지만 JUnit을 실행하지 않았습니다. 자체 non-web Boot JAR는 리소스와 정책을 출력한 뒤 context를 닫고 exit0으로 종료했습니다. HTTP·운영 배포 실행이 아닙니다.</p>
    <p>UP-TO-DATE는 같은 작업공간 재사용이고 FROM-CACHE는 own .task-cache에서 출력 복원입니다. 이번 호출의 새 JUnit2개 실행을 뜻하지 않습니다. NO-SOURCE·onlyIf SKIPPED는 테스트2개 통과가 아닙니다. lock의 버전 선택과 checksum 검증도 별개입니다. private verification의 예상 checksum만 바꿔 거부를 관찰했으며 global dependency JAR bytes는 그대로였습니다. 전역 캐시는 삭제·이동·바이트 변조하지 않았고 일반 Gradle 실행에 따른 정상 재사용·갱신 가능 범위를 구분합니다.</p>
    <p>첫 verification metadata 생성은 offline에 없던 io.spring.gradle:dependency-management-plugin:1.1.7 metadata가 필요해20 CHECK 뒤 실패했습니다. Gradle의 같은 원인 중복2메시지를 두 독립 실패로 세지 않습니다. 동일 pinned 버전·선언 저장소의 정상 online metadata 확보 뒤 새 폴더 전체 offline freeze·main fresh·독립 temp가21 CHECK/3모델로 통과했습니다. 버전 변경·캐시 삭제·검증 약화로 우회한 결과가 아닙니다.</p>
    <p>두 own clean build의 실제 JAR는9103378bytes·같은 SHA였습니다. 첫 baseline은 빈 private cache에서 --build-cache, 다른 workspace twin은 --no-build-cache였고 양쪽 cache off가 아닙니다. 동일 fixture/JDK/Gradle/의존성 파일 범위의 관측이며 보편 재현성·시간 단축을 증명하지 않습니다. 마지막 private 검증의 clean은 main 출력을 지우므로 저장한 초기 manifest/SHA와 twin 실물의 근거를 구분합니다.</p>
    <p>입력 비교·Docker/registry 경계·실패 계층은 원문·문헌 모델입니다. 실제 CI runner·Docker build/login/push·registry·배포·worker memory failure·원문 Java25 전체 설정·학습자 이해·전수 pixel parity는 검증하지 않았습니다. 현재 UI의 repro-boundary는 native JAR 관측 그림과 분리한 순수 모델 그림에 연결합니다. 이번 선택 핵심 보강을 원문 전체 구현·운영 안전 보장으로 표시하지 않습니다.</p>
    ${files.map(([label, file]) => {
      const raw = fs.readFileSync(new URL('../../docs/design/d04-2026-10-21/' + file, import.meta.url), 'utf8');
      let text = raw;
      try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·소스·로그의 문자열을 그대로 보존한다. */ }
      return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;
    }).join('')}
  </details>`;
}
