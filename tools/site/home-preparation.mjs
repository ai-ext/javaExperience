import fs from 'node:fs';
import path from 'node:path';

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// 빌드 때 설정 파일을 읽는다. 브라우저나 학습자의 서버를 조회하지 않는다.
export function renderHomePreparation(root) {
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const gradle = read('build.gradle');
  const activeYml = read('src/main/resources/application.yml').split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
  const compose = read('compose.yaml');
  const java = gradle.match(/JavaLanguageVersion\.of\((\d+)\)/)?.[1];
  if (!java) throw new Error('첫 실행 준비: build.gradle의 JDK 버전을 확인할 수 없습니다');
  const mysql = activeYml.match(/\burl:\s*jdbc:mysql:\/\/([^/:?\s]+)(?::(\d+))?\//);
  const dockerPort = compose.match(/\$\{DB_PORT:-(\d+)\}/)?.[1];
  const appPort = mysql?.[2] || '3306';
  const localMysql = mysql && ['localhost', '127.0.0.1'].includes(mysql[1]);
  const mismatch = localMysql && dockerPort && appPort !== dockerPort;
  const dbDescription = mysql
    ? `현재 기본 설정은 MySQL의 <code>${escapeHtml(mysql[1])}:${escapeHtml(appPort)}</code>에 연결합니다. Docker의 DB를 쓴다면 Docker 런타임(Colima 등)을 켜고 연결 포트를 확인하세요.`
    : '현재 사용하는 DB 연결 설정을 확인하세요. Docker의 DB를 쓴다면 Docker 런타임(Colima 등)도 켜 두세요.';
  const portNotice = mismatch
    ? `<p class="home-preparation-port-note" data-home-port-mismatch><strong>DB 포트가 서로 달라요</strong>앱은 <code>localhost:${escapeHtml(appPort)}</code>, Compose 기본값은 <code>localhost:${escapeHtml(dockerPort)}</code>입니다. 이 Docker DB를 사용하려면 앱의 연결 포트를 맞추세요. 실행 중인 포트는 <code>docker compose ps</code>로 확인할 수 있어요.</p>`
    : '';
  return `<dialog class="home-dialog" id="home-prepare-dialog" aria-labelledby="home-prepare-title">
  <header class="home-dialog-head"><div><h2 id="home-prepare-title">첫 실행 준비</h2><p>IDE에서 서버를 켜고, 브라우저에서 응답을 확인해요.</p></div><button class="home-close" type="button" data-home-prepare-close aria-label="닫기">×</button></header>
  <div class="home-dialog-body">
    <ol class="home-preparation-steps">
      <li><strong>JDK ${escapeHtml(java)}로 프로젝트를 여세요</strong><p>IntelliJ IDEA에서 이 저장소를 Gradle 프로젝트로 열고, 프로젝트 JDK를 ${escapeHtml(java)}로 설정하세요. Gradle 동기화가 끝나면 다음으로 넘어가요.</p><details><summary>JDK 버전 확인 명령</summary><p>프로젝트 폴더의 터미널에서 확인하세요.</p><pre><code>./gradlew --version</code></pre></details></li>
      <li><strong>앱과 DB의 연결 주소를 확인하세요</strong><p>${dbDescription}</p>${portNotice}<details><summary>Docker DB 실행·상태 확인 명령</summary><pre><code>docker compose up -d
docker compose ps</code></pre><p>MySQL이 <code>healthy</code>인지 확인하세요. 기본 포트를 바꿔 실행했다면 실제 포트에 맞춰 연결해야 해요.</p></details></li>
      <li><strong>Main을 실행하고 hello를 확인하세요</strong><p>IDE에서 <code>org.example.Main</code>을 실행하세요. 기본 주소 <a href="http://localhost:8080/hello" target="_blank" rel="noopener">localhost:8080/hello</a>를 열어 <code>hello</code>가 보이면 서버가 응답하는 거예요.</p><details><summary>터미널에서 서버 실행하기</summary><pre><code>./gradlew bootRun</code></pre><p>이미 IDE에서 실행했다면 다시 실행할 필요는 없어요.</p></details></li>
      <li><strong>학습 화면은 문서 서버로 여세요</strong><p>API 서버는 8080, 학습 화면은 8765 포트를 사용해요. 문서 서버 주소에서 학습 화면을 열면 요청 보내기와 이어하기를 이용할 수 있어요.</p><details><summary>문서 서버 실행 명령과 주소</summary><p>프로젝트 폴더에서 새 터미널을 열고 실행하세요.</p><pre><code>python3 -m http.server 8765 --bind 127.0.0.1</code></pre><p>브라우저에서 <a href="http://127.0.0.1:8765/index.html" target="_blank" rel="noopener">127.0.0.1:8765/index.html</a>을 여세요.</p></details></li>
    </ol>
    <p class="home-preparation-note">위 단계는 직접 확인하는 안내입니다. 준비 전에도 과제는 열어볼 수 있어요.</p>
  </div>
  <footer class="home-dialog-actions"><a class="home-text-button" href="#전체-안내" data-home-setup>전체 설치·실행 안내 보기</a></footer>
</dialog>`;
}
