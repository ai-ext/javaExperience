/** 0-6에서 분리한 기초 개념 시안 18장을 해당 공부자료의 조작 가능한 첫 장면으로 옮긴다. */
import path from 'node:path';

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const tile = (heading, body, tone = '') => `<div class="cc-tile ${tone}"><strong>${heading}</strong>${body}</div>`;
const code = (heading, value) => `<div class="cc-code"><small>${heading}</small><pre><code>${esc(value)}</code></pre></div>`;
const pair = (left, right) => `<div class="cc-pair">${left}${right}</div>`;
const flow = (...steps) => `<div class="cc-flow">${steps.map((item,index) => `<div><b>${String(index+1).padStart(2,'0')}</b>${item}</div>`).join('<span aria-hidden="true">→</span>')}</div>`;
const note = (value) => `<p class="cc-note">${value}</p>`;
const experiment = '<span class="cc-example">원문 기반 설명용 예시 · 내 실행 결과 아님</span>';

const groups = {
  'P08-maven-gradle-practical.md': {
    label: 'P08 · Gradle·의존성',
    scenes: [
      [3,'Gradle은 재료를 고르고, YAML은 값을 정합니다','build.gradle을 읽을 때와 application.yml을 읽을 때의 질문이 다릅니다.',pair(tile('build.gradle','<p>어떤 라이브러리를 쓸까?</p><code>spring-boot-starter-webmvc</code>'),tile('application.yml','<p>라이브러리에 어떤 값을 줄까?</p><code>spring.application.name</code>','cc-gold'))+note('의존성이 기능을 사용할 재료를 제공하고 설정이 실행 환경의 값을 정합니다.')],
      [4,'플러그인과 JDK 21은 빌드의 출발점','실습 build.gradle의 네 줄을 각 역할로 읽어 보세요.',flow(tile('java','<p>Java 코드 컴파일</p>'),tile('Spring Boot 4.1.1','<p>bootRun · bootJar</p>'),tile('dependency-management 1.1.7','<p>Boot BOM 적용</p>'),tile('toolchain 21','<p>컴파일 JDK 기준</p>'))],
      [5,'webmvc 스타터가 HTTP API 기능을 제공합니다','요청이 서버에 들어온 뒤의 역할을 정확한 순서로 봅니다.',flow(tile('클라이언트','<code>GET /api/start/config</code>'),tile('내장 Tomcat','<p>HTTP 요청 수신</p>'),tile('Spring MVC','<p>Controller 매핑</p>'),tile('Jackson','<p>ConfigView → JSON</p>'))+note('이 스타터를 읽는 개념 장면입니다. 이번 단계에서 build.gradle을 변경하는 지시는 아닙니다.')],
      [7,'의존성 범위는 필요한 시점을 말합니다','같은 라이브러리라도 컴파일·실행·테스트 중 필요한 위치가 다릅니다.',`<div class="cc-scope"><div><strong>implementation</strong><span>컴파일 + 실행</span><code>spring-boot-starter-webmvc</code></div><div><strong>runtimeOnly</strong><span>실행</span><code>mysql-connector-j</code></div><div><strong>testImplementation</strong><span>테스트 컴파일 + 실행</span><code>spring-boot-starter-webmvc-test</code></div></div>`],
      [8,'버전은 BOM으로 맞추고 빌드 정보를 다시 읽습니다','이 저장소는 Boot 플러그인과 dependency-management 플러그인을 함께 적용합니다.',flow(tile('Boot 4.1.1','<p>관리 대상 버전 목록</p>'),tile('BOM 적용','<p>호환 라이브러리 선택</p>'),tile('변경 반영','<p>IntelliJ: Load Gradle Changes<br>터미널: ./gradlew 재실행</p>'))+note('BOM 밖 라이브러리는 별도 버전이 필요할 수 있습니다. Boot 플러그인만 선언했다고 모든 Gradle 프로젝트의 BOM이 자동 적용되는 것은 아닙니다.')],
      [16,'웹 의존성을 빼면 컴파일부터 막힙니다','HTTP 요청을 보내기 전, import할 클래스를 찾을 수 없는 상태입니다.',experiment+flow(tile('webmvc 의존성 제거','<p>선택 고장 실험</p>'),tile('./gradlew compileJava','<p>소스 컴파일</p>'),tile('컴파일 실패','<code>package ... does not exist</code>','cc-red'))+note('원문의 실험 로그와 실제 환경의 오류 개수는 다를 수 있습니다. 실험 뒤 의존성을 복원합니다.')],
    ],
  },
  'S03-boot-autoconfig.md': {
    label: 'S03 · Boot 자동 설정',
    scenes: [
      [6,'JPA 스타터를 넣으면 앱 시작 때 DB 준비가 필요해질 수 있습니다','설정 API 자체는 DB를 조회하지 않아도 기동 과정은 먼저 일어납니다.',flow(tile('data-jpa 스타터','<p>자동 설정 후보가 들어옴</p>'),tile('조건 평가','<p>DataSource·JPA 빈 생성 조건 확인</p>'),tile('앱 시작','<p>DB 연결 준비·스키마 검사 가능</p>'))+note('의존성 추가가 자동 설정을 무조건 켠다는 뜻은 아닙니다. 실제 등록 여부는 조건과 다른 빈·설정에 따라 달라집니다.')],
      [17,'JPA를 빼면 DB 준비 경로도 달라집니다','원문 실험에서는 설정 API가 DB 없이 시작됐지만, 다른 DB 의존성이 있으면 결과가 달라질 수 있습니다.',experiment+pair(tile('JPA 스타터 있음','<p>관련 조건 평가와 DataSource 준비 경로가 열림</p>'),tile('JPA 스타터 제거','<p>원문 실험에서는 DB 없이 기동</p><small>다른 의존성 확인 필요</small>','cc-gold'))+note('현재 build.gradle에 다른 DB 의존성이 있을 수 있습니다. 실험용 삭제를 본편 수정으로 남기지 마세요.')],
    ],
  },
  'S04-config-profiles.md': {
    label: 'S04 · YAML·설정',
    scenes: [
      [9,'들여쓰기가 설정 키의 주소를 만듭니다','2칸씩 안으로 들어가면 상위 키 아래의 값이 됩니다.',pair(code('application.yml 예시','spring:\n  application:\n    name: javaExperience\nstart:\n  greeting: 반가워요, 백엔드!'),tile('점으로 이은 키','<code>spring.application.name</code><code>start.greeting</code><p>탭 대신 스페이스를 사용합니다.</p>'))],
      [10,'spring.*와 start.*는 읽는 주체가 다릅니다','내가 만든 키를 코드가 읽지 않으면 자동으로 응답이 되지 않습니다.',pair(tile('Spring Boot','<code>spring.application.name</code><p>앱 이름으로 사용</p>'),tile('ConfigController','<code>start.greeting</code><code>start.max-items</code><p>생성자 @Value로 읽기</p>','cc-gold'))],
      [13,'@Value 값은 Controller를 만들 때 들어갑니다','요청마다 YAML을 다시 읽는 흐름이 아닙니다.',flow(tile('YAML','<code>start.greeting</code><code>start.max-items</code>'),tile('앱 시작','<p>Spring이 생성자 매개변수에 주입</p>'),tile('final 필드','<p>재시작 전까지 값 유지</p>'))+note('GET /api/start/config는 이미 저장한 필드로 ConfigView를 만듭니다.')],
      [20,'키를 한 글자 틀리면 앱이 시작하지 못합니다','값이 없다는 오류를 요청 중 500과 구분하세요.',experiment+pair(tile('있는 키','<code>start.greeting</code>'),tile('오타 키','<code>start.greating</code><p>Could not resolve placeholder</p>','cc-red'))+note('선택적으로 기본값이 필요한 키라면 @Value의 : 뒤에 기본값을 둘 수 있습니다.')],
      [21,'YAML 들여쓰기 한 칸도 시작을 막습니다','같은 묶음의 값은 같은 깊이로 정렬합니다.',experiment+pair(code('정상','start:\n  greeting: 반가워요, 백엔드!\n  max-items: 5'),code('오류 예시','start:\n  greeting: 반가워요, 백엔드!\n   max-items: 5'))+note('원문 재현 메시지: mapping values are not allowed here. HTTP 요청 전 YAML 파싱 단계입니다.')],
      [22,'같은 최상위 키는 한 번만 씁니다','설정을 더할 때 기존 묶음 안에 값을 넣으세요.',experiment+pair(code('중복 예시','logging:\n  level:\n    root: INFO\n\nlogging:\n  level:\n    org.springframework: DEBUG'),tile('정리 방법','<p>두 번째 logging:을 만들지 않고 첫 묶음의 level 아래에 추가합니다.</p><code>found duplicate key logging</code>','cc-red'))],
      [23,'숫자 자리에 글자를 넣으면 타입 변환이 실패합니다','start.max-items를 int 생성자 매개변수로 받을 때의 실패입니다.',experiment+pair(tile('가능한 값','<code>max-items: 5</code><p>int 5로 변환</p>'),tile('변환 불가','<code>max-items: 다섯</code><p>TypeMismatchException → NumberFormatException</p>','cc-red'))+note('앱 시작 중 실패하므로 HTTP 응답 코드로 비교하지 않습니다.')],
      [24,'앱을 두 번 띄웠다면 포트를 확인하세요','첫 프로세스가 같은 포트를 사용 중이면 두 번째 앱은 시작하지 못합니다.',experiment+flow(tile('첫 번째 앱','<p>포트 사용 중</p>'),tile('두 번째 앱','<p>같은 포트로 시작 시도</p>'),tile('시작 실패','<code>Port already in use</code>','cc-red'))+note('이전 실행을 멈추거나 server.port를 바꾸고, 요청 화면의 서버 주소도 함께 변경합니다.')],
    ],
  },
  'R08-app-to-db-connection.md': {
    label: 'R08 · DB 연결 진단',
    scenes: [
      [18,'드라이버가 없으면 기동 중 클래스를 못 찾습니다','runtimeOnly는 컴파일이 아닌 실행 경로에 필요합니다.',experiment+flow(tile('드라이버 제거','<code>mysql-connector-j</code>'),tile('컴파일 통과','<p>소스에서 직접 import하지 않음</p>'),tile('시작 실패','<code>ClassNotFoundException:<br>com.mysql.cj.jdbc.Driver</code>','cc-red'))+note('원문 MySQL 설정의 선택 실험입니다. 실험 뒤 드라이버 의존성을 복원합니다.')],
      [19,'DB가 꺼졌다면 Connection refused부터 봅니다','뒤의 Dialect 오류는 DB 정보 조회에 실패한 결과일 수 있습니다.',experiment+flow(tile('원인','<code>Connection refused</code><p>포트에 연결 불가</p>','cc-red'),tile('결과','<code>Unable to determine Dialect without JDBC metadata</code><p>DB 메타데이터 없음</p>'))+note('docker compose ps mysql로 healthy 상태를 확인하고, 앱 URL 포트와 공개 포트를 비교하세요. Config API가 DB 쿼리를 보낸다는 뜻은 아닙니다.')],
    ],
  },
};

export function renderConfigConceptScenes(filePath) {
  const group = groups[path.basename(filePath)];
  if (!group) return '';
  const screens = group.scenes.map(([id,title,lead,body],index) => `<article class="cc-screen" data-cc-screen="${index}"${index ? ' hidden' : ''} aria-labelledby="cc-title-${id}"><div class="cc-head"><span>${group.label}</span><span>${String(index+1).padStart(2,'0')} / ${String(group.scenes.length).padStart(2,'0')}</span></div><h2 id="cc-title-${id}">${title}</h2><p class="cc-lead">${lead}</p>${body}<a class="cc-image-link" href="../design/mockups-2026-10-16-batch41/${String(id).padStart(2,'0')}-${group.scenes[index][4] || ({3:'gradle-vs-yml',4:'plugins-jdk',5:'webmvc-role',6:'jpa-startup-db',7:'dependency-scopes',8:'bom-reload',9:'yaml-path',10:'spring-vs-start',13:'startup-injection',16:'webmvc-missing',17:'jpa-removed',18:'mysql-driver-missing',19:'db-down',20:'placeholder-typo',21:'yaml-indentation',22:'duplicate-key',23:'number-type',24:'port-in-use'})[id]}.jpg" target="_blank" rel="noopener">이 장면의 이미지 시안 ↗</a><footer class="cc-actions"><button type="button" data-cc-go="${Math.max(0,index-1)}"${index ? '' : ' disabled'}>← 이전</button>${index < group.scenes.length-1 ? `<button type="button" class="cc-next" data-cc-go="${index+1}">다음 개념 →</button>` : '<span>아래에서 원문 전체를 이어 읽으세요.</span>'}</footer></article>`).join('');
  return `<section class="config-concept-journey" aria-label="${group.label} 이미지 학습 화면"><aside class="cc-rail"><strong>${group.label}</strong><p>하나씩 보고, 아래 원문에서 깊이를 확인하세요.</p><nav aria-label="개념 장면">${group.scenes.map(([id,title],index)=>`<button type="button" data-cc-go="${index}" aria-current="${index ? 'false' : 'step'}"><span>${String(index+1).padStart(2,'0')}</span>${title}</button>`).join('')}</nav></aside><div class="cc-stage">${screens}</div></section>`;
}
