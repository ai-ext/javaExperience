import test from 'node:test';
import assert from 'node:assert/strict';
import { toPropertiesFiles, withSpringConfigVariants } from './spring-config.mjs';

const content = (yaml, filename) => toPropertiesFiles(yaml, filename).files[0].content;
test('중첩 키와 점을 포함한 키를 평탄화한다', () => {
  assert.equal(content('spring:\n  jpa:\n    properties:\n      hibernate.generate_statistics: true'), 'spring.jpa.properties.hibernate.generate_statistics=true');
});
test('블록·인라인 목록과 객체 목록은 [0] 인덱스를 쓴다', () => {
  assert.equal(content('board:\n  roles: [USER, "ADMIN"]\n  clients:\n    - name: first\n      urls:\n        - http://localhost:8080\n    - name: second'), 'board.roles[0]=USER\nboard.roles[1]=ADMIN\nboard.clients[0].name=first\nboard.clients[0].urls[0]=http://localhost:8080\nboard.clients[1].name=second');
});
test('따옴표·공백·주석·특수 문자와 역슬래시를 보존한다', () => {
  assert.equal(content(String.raw`board:
  message: '  a # b:=!'
  path: 'C:\temp\data'
  quote: 'it''s ok' # 주석
  line: "a\nb\t\"c\""`), String.raw`board.message=\  a # b:=!
board.path=C:\\temp\\data
board.quote=it's ok
board.line=a\nb\t"c"`);
});
test('ENV 기본값과 URL의 콜론은 그대로 둔다', () => {
  assert.equal(content('spring:\n  datasource:\n    url: ${DB_URL:jdbc:mysql://localhost:13310/board}\n    password: "${DB_PASSWORD:a#b=c}"'), 'spring.datasource.url=${DB_URL:jdbc:mysql://localhost:13310/board}\nspring.datasource.password=${DB_PASSWORD:a#b=c}');
});
test('다중 문서를 프로파일별 파일로 분리하고 활성화 키는 파일명으로 옮긴다', () => {
  const result = toPropertiesFiles('server:\n  port: 8080\n---\nspring:\n  config:\n    activate:\n      on-profile: local\nserver:\n  port: 8081');
  assert.deepEqual(result.files, [{name:'application.properties',content:'server.port=8080'}, {name:'application-local.properties',content:'server.port=8081'}]);
  assert.match(result.note, /프로파일별 파일/);
});
test('프로파일 파일명과 복잡한 목록의 안내를 유지한다', () => {
  const result = toPropertiesFiles('board:\n  clients:\n    - name: one\n      enabled: true', 'application-local.yml');
  assert.equal(result.files[0].name, 'application-local.properties');
  assert.match(result.note, /\[0\]/);
});
test('복합 프로파일 표현식은 분리 시 적용 순서를 잃지 않는다', () => {
  const result = toPropertiesFiles('server.port: 8080\n---\nspring.config.activate.on-profile: "prod & !cloud"\nserver.port: 8081');
  assert.equal(result.files.length, 1);
  assert.match(result.files[0].content, /#---\nspring.config.activate.on-profile=prod & !cloud/);
  assert.match(result.note, /표현식/);
});
test('중복 프로파일·무조건 문서의 덮어쓰기 순서를 보존한다', () => {
  const result = toPropertiesFiles('board.roles: [A, B]\n---\nboard.roles: [C]');
  assert.equal(result.files[0].content, 'board.roles[0]=A\nboard.roles[1]=B\n#---\nboard.roles[0]=C');
});
test('빈 값·빈 문자열·불리언·숫자를 출력한다', () => {
  assert.equal(content('board:\n  empty: null\n  blank: ""\n  enabled: false\n  count: 10'), 'board.empty=\nboard.blank=\nboard.enabled=false\nboard.count=10');
});
test('지원하지 않는 문법과 잘못된 들여쓰기는 조용히 바꾸지 않는다', () => {
  for (const yaml of ['spring: &ref\n  name: app', 'spring: {name: app}', 'spring:\n\tname: app', 'spring:\n  name: first\n  name: second']) assert.throws(() => content(yaml));
});
test('Spring 설정만 변환하고 Compose와 diff 원문은 보존한다', () => {
  const yaml = '```yaml\nspring:\n  application:\n    name: demo\n```';
  const compose = '```yaml\nservices:\n  mysql:\n    image: mysql:8.4\n```';
  const diff = '```diff\n--- a/application.yml\n+++ b/application.yml\n-server.port: 8080\n+server.port: 8081\n```';
  const result = withSpringConfigVariants([yaml, compose, diff].join('\n\n'));
  assert.ok(result.includes(yaml));
  assert.ok(result.includes(compose));
  assert.ok(result.includes(diff));
  assert.equal((result.match(/<!-- spring-config:start /g) || []).length, 1);
  assert.match(result, /```properties\nspring.application.name=demo/);
  assert.match(result, /properties를 쓰면 같은 키를 `key=value`로/);
  assert.equal(withSpringConfigVariants(result), result);
});
test('문장 속 설정 파일은 두 형식을 안내하되 코드·링크 경로는 보존한다', () => {
  const md = '`application.yml`을 고친다.\n\n[설정](application.yml)\n\n```java\nString file = "application.yml";\n```';
  const result = withSpringConfigVariants(md);
  assert.match(result, /`application.yml`\(또는 `application.properties`\)/);
  assert.ok(result.includes('[설정](application.yml)'));
  assert.ok(result.includes('String file = "application.yml";'));
});
