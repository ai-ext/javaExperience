import { readFileSync } from 'node:fs';
export const d11AssetRoot = '../design/d11-2026-10-25/';
const repo = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, repo), 'utf8');
const lines = path => read(path).replace(/\r\n/g, '\n').split('\n');
const excerpt = (path, start, end = start) => {
  const content = lines(path).slice(start - 1, end).join('\n');
  if (!content || content.split('\n').length !== end - start + 1) throw new Error(`D11 source range unavailable: ${path}:${start}-${end}`);
  return { path, start, end, content };
};

const manifest = JSON.parse(read('docs/design/d11-2026-10-25/selected-images.json'));
const focusDesign = JSON.parse(read('docs/design/d11-2026-10-25/FOCUS-DESIGN.json'));
export const D11_ASSETS = Object.fromEntries(manifest.map(item => {
  const id = item.id;
  const file = item.destination.split('/').at(-1);
  const alt = {
    'object-ownership': '추가 SQLite에서 주문 1003 소유자 8의 ID-only 결과와 현재 주체 7의 빈 소유권 조건을 비교합니다.',
    'request-boundaries': '인증 주체, 객체 소유권, 출력 문맥의 세 경계를 연결한 설명 모델입니다. 실제 필터·SQL 순서가 아닙니다.',
    'principal-mapping': 'Authentication.name 숫자 변환의 원문 Java 전제와 가짜 텍스트 이름의 Python 변환 관측을 구분합니다.',
    'csrf-credentials-v2': '브라우저 자동 쿠키와 명시 Authorization 헤더의 정책 차이를 보여 줍니다. CSRF 실행 결과가 아닙니다.',
    'output-context': '같은 안전 문자열을 textContent로 표시하면 B 노드 0개, innerHTML로 파싱하면 B 노드 1개입니다.',
    'security-config': '원문 SecurityFilterChain의 접근 규칙과 endpoint 존재 여부를 구분합니다. 원문은 미실행입니다.',
    'hsts-boundary': '정책을 받기 전, 받은 뒤, 하위 도메인 준비를 나눈 HSTS 설명 모델입니다.',
    'password-verification': '가짜 비밀번호와 상징식 H로 저장·검증·재해시를 설명합니다. 실제 해시를 만들지 않습니다.',
    'secret-log-lifecycle-v2': '합성 DEMO_KEY 주입 예시와 노출·폐기 흐름입니다. 실제 환경 변수나 키를 조회하지 않습니다.',
    'dependency-response-v2': '가상 web-app에서 helper-lib, codec-lib로 이어지는 구성 목록·평가·재검증 모델입니다.',
    'object-uuid-order': 'UUID 1003과 현재 주체 7을 함께 조건으로 조회한 추가 SQLite 빈 결과입니다.',
    'object-own-order-v2': '현재 주체 7과 owner 7인 주문 1002의 추가 SQLite 조회 결과입니다.',
    'cors-requests-v3': '실제 Chrome 추가 Python fixture의 OPTIONS·POST 전송 수와 JavaScript 응답 읽기를 나눠 보여 줍니다.',
    'sql-boundary-v2': '추가 SQLite에서 검색값 바인딩과 허용 목록 정렬의 실제 비교를 보여 줍니다.',
  }[id];
  return [id, { file, width: item.canvas.width, height: item.canvas.height, alt, sha256: item.sha256, bytes: item.bytes, focus: {} }];
}));
const stageAsset = {
  'own-order': 'object-own-order-v2', 'other-unscoped': 'object-ownership', 'other-scoped': 'object-ownership', 'uuid-scoped': 'object-uuid-order',
  'boundary-identity': 'request-boundaries', 'boundary-owner': 'request-boundaries', 'boundary-output': 'request-boundaries',
  'numeric-name': 'principal-mapping', 'textual-name': 'principal-mapping',
  'simple-blocked-read': 'cors-requests-v3', 'preflight-denied': 'cors-requests-v3', 'preflight-allowed': 'cors-requests-v3', 'credential-wildcard': 'cors-requests-v3',
  'cookie-automatic': 'csrf-credentials-v2', 'bearer-explicit': 'csrf-credentials-v2', 'cookie-token': 'csrf-credentials-v2',
  'value-concat': 'sql-boundary-v2', 'value-bound': 'sql-boundary-v2', 'sort-allowed': 'sql-boundary-v2', 'sort-rejected': 'sql-boundary-v2',
  'output-text': 'output-context', 'output-markup': 'output-context', 'context-policy': 'output-context',
  'chain-rules': 'security-config', 'endpoint-missing': 'security-config', 'version-pinned': 'security-config',
  'hsts-unseen': 'hsts-boundary', 'hsts-remembered': 'hsts-boundary', 'hsts-subdomains': 'hsts-boundary',
  'password-store': 'password-verification', 'password-check': 'password-verification', 'password-rehash': 'password-verification',
  'secret-injected': 'secret-log-lifecycle-v2', 'secret-exposed': 'secret-log-lifecycle-v2', 'secret-revoked': 'secret-log-lifecycle-v2',
  'sbom-inventory': 'dependency-response-v2', 'sca-assessment': 'dependency-response-v2', 'rebuild-verify': 'dependency-response-v2',
};
for (const [stage, asset] of Object.entries(stageAsset)) D11_ASSETS[asset].focus[stage] = focusDesign.states[stage];

const py = 'docs/design/d11-2026-10-25/source-proof/sqlite_proof.py';
const addendum = 'docs/design/d11-2026-10-25/source-proof/sqlite_compare_addendum.py';
const browser = 'docs/design/d11-2026-10-25/source-proof/browser_fixture.py';
const md = 'docs/knowledge/D11-web-security-basics.md';
const spec = 'docs/design/d11-2026-10-25/SPEC.md';
const secretPrompt = 'docs/design/d11-2026-10-25/prompts/secret-log-lifecycle-v2.txt';
const sqliteRawPath = 'docs/design/d11-2026-10-25/proof-logs/sqlite-proof-20261024T161249Z.json';
const corsRawPath = 'docs/design/d11-2026-10-25/proof-logs/main-browser-cors.json';
const domRawPath = 'docs/design/d11-2026-10-25/proof-logs/main-browser-dom.json';
const sqliteRaw = read(sqliteRawPath);
const corsRaw = read(corsRawPath);
const domRaw = read(domRawPath);

  const stage = (id, title, lead, values, opts = {}) => {
  const sourceFragments = (opts.fragments || []).map(([path, start, end]) => excerpt(path, start, end));
  return {
    id, title, lead, values,
    codeKind: opts.codeKind || 'explanatory-model',
    codePath: sourceFragments.map(fragment => `${fragment.path}:${fragment.start}-${fragment.end}`).join(', '),
    sourceFragments,
    code: opts.code ?? sourceFragments.map(fragment => fragment.content).join('\n'),
    active: opts.active || [],
    image: opts.image || null,
    note: opts.note,
    evidenceKind: opts.evidenceKind || '설명 모델',
    evidence: opts.evidence || opts.note,
    fullEvidence: opts.fullEvidence || '',
    bindParameters: opts.bindParameters,
    evidencePath: opts.evidencePath,
  };
};
const model = (id, title, lead, values, text, sourceRange, note, image, extra = {}) => stage(id, title, lead, values, {
  codeKind: 'explanatory-model', evidenceKind: '설명용 절차·실행 코드 아님', code: text, active: text.split('\n').map((_, i) => i),
  fragments: [[spec, sourceRange[0], sourceRange[1]]], note, image, ...extra,
});
const original = (id, title, lead, values, start, end, note, image, extra = {}) => stage(id, title, lead, values, {
  codeKind: 'original-prose', evidenceKind: '원문에 근거한 설명 모델·미실행', fragments: [[md, start, end]], active: [0], note, image, ...extra,
});
const originalCode = (id, title, lead, values, start, end, note, image, kind = 'original-java-unrun', extra = {}) => stage(id, title, lead, values, {
  codeKind: kind, evidenceKind: '원문 코드 분석·미실행', fragments: [[md, start, end]], active: [0], note, image, ...extra,
});
const sqlite = (id, title, lead, values, start, end, note, image, extra = {}) => stage(id, title, lead, values, {
  codeKind: 'additional-sqlite', evidenceKind: '추가 Python·SQLite 실제 관측', fragments: [[py, start, end]], note, image,
  active: lines(py).slice(start - 1, end).map((_, i) => i), fullEvidence: sqliteRaw, evidencePath: sqliteRawPath, ...extra,
});

export const D11_LESSONS = [
  { id: 'object-ownership', question: '로그인한 주체는 주문 1002와 1003을 모두 볼 수 있을까요?', source: '원문 §3.2·§4.1 · 추가 SQLite 조회', note: '숫자 ID나 UUID를 숨기는 것만으로 소유권 검사가 되지 않습니다.', stages: [
    sqlite('own-order', '내 주문은 주체와 함께 조회', '현재 주체 7이 소유한 주문 1002만 결과로 남습니다.', [['로그인 주체', '7'], ['요청 주문 ID', '1002'], ['결과 행', '1002 · owner 7']], 59, 62, '이 값은 격리된 in-memory SQLite 관측입니다. MySQL/JPA 실행 결과로 확대하지 않습니다.', 'object-own-order-v2', { bindParameters: [1002, 7], evidence: 'SQLite: SELECT id, owner_id FROM orders WHERE id = ? AND owner_id = ? · bind [1002, 7] → [{id:1002, owner_id:7}]' }),
    sqlite('other-unscoped', 'ID만 보면 다른 소유자의 행이 나옵니다', '식별자만 조회하면 1003의 owner 8 행이 반환됩니다.', [['로그인 주체', '7'], ['ID-only 결과', '1003 · owner 8'], ['소유권 조건', '없음']], 64, 67, '이 결과는 권한 허용을 뜻하지 않습니다. 현재 주체와 객체 관계를 함께 확인해야 합니다.', 'object-ownership', { bindParameters: [1003], evidence: 'SQLite: SELECT id, owner_id FROM orders WHERE id = ? · bind [1003] → [{id:1003, owner_id:8}]' }),
    sqlite('other-scoped', '소유권 조건을 붙이면 결과가 비어 있습니다', '1003과 현재 주체 7을 함께 조건으로 묶으면 행이 없습니다.', [['로그인 주체', '7'], ['요청 주문 ID', '1003'], ['결과 행', '[]']], 69, 72, '소유권 검사는 DB 조회와 결합할 수 있습니다. 이 fixture는 HTTP 상태를 관측하지 않았습니다.', 'object-ownership', { bindParameters: [1003, 7], evidence: 'SQLite: SELECT id, owner_id FROM orders WHERE id = ? AND owner_id = ? · bind [1003, 7] → []' }),
    sqlite('uuid-scoped', 'UUID도 소유권 조건은 필요합니다', '공개 UUID로 바꿔도 owner 7 조건을 같이 적용하면 결과가 비어 있습니다.', [['공개 UUID', '00000000-0000-4000-8000-000000001003'], ['로그인 주체', '7'], ['결과 행', '[]']], 74, 77, 'UUID는 식별자 형식일 뿐 권한 증명이 아닙니다.', 'object-uuid-order', { bindParameters: ['00000000-0000-4000-8000-000000001003', 7], evidence: 'SQLite: SELECT id, owner_id FROM orders WHERE public_id = ? AND owner_id = ? · bind ["00000000-0000-4000-8000-000000001003", 7] → []' }),
  ] },
  { id: 'request-boundaries', question: '인증·객체 권한·응답은 어떤 보장을 각각 하나요?', source: '원문 §1·§2 · 설명 모델', note: '객체 소유권 검사 자체가 DB 조회와 결합될 수 있습니다.', stages: [
    model('boundary-identity', '1 · 요청의 주체를 확인', '요청에 붙은 인증 정보에서 현재 주체를 정합니다.', [['주체', 'user 7'], ['다음 판단', '주문 소유권 확인']], '요청 자격 증명 → 현재 주체 확인', [17, 17], '인증 통과는 특정 객체를 볼 권한을 자동으로 주지 않습니다.', 'request-boundaries'),
    model('boundary-owner', '2 · 객체와 주체의 관계를 확인', '주문 1002/1003의 owner를 현재 주체와 비교합니다.', [['주체', '7'], ['주문 1002', 'owner 7'], ['주문 1003', 'owner 8']], '주체 + 객체 소유 관계 → 허용 여부 판단', [17, 17], '그림은 경계 지도입니다. 실제 SQL이나 필터 호출 순서가 아닙니다.', 'request-boundaries'),
    model('boundary-output', '3 · 필요한 응답만 구성', '접근 허용 뒤에도 출력 문맥과 데이터 노출을 따로 살핍니다.', [['경계', '응답 구성'], ['다음 판단', 'HTML·속성·JS·URL 문맥']], '객체 권한 확인 → 응답 데이터와 출력 문맥 검토', [17, 17], '실제 서버 응답이나 호출 순서를 측정한 결과가 아닙니다.', 'request-boundaries'),
  ] },
  { id: 'principal-mapping', question: 'Authentication.name을 내부 숫자 ID로 바로 바꿔도 될까요?', source: '원문 §4.1 · 추가 Python 변환 비교', note: '내부 식별자 매핑은 인증 체계에 맞게 검증해야 합니다.', stages: [
    originalCode('numeric-name', '숫자 이름은 변환 가능한 전제', '원문 코드는 name이 숫자 문자열이라고 가정합니다.', [['Authentication.name', '"7"'], ['변환 대상', 'Long.valueOf(authentication.getName())'], ['다음 판단', '내부 user ID와 객체 owner 비교']], 153, 157, '원문 Java 발췌를 분석한 모델입니다. 추가 Python int() 결과와 별개입니다.', 'principal-mapping', 'original-java-unrun', { active: [2, 3, 4] }),
    sqlite('textual-name', '이메일 형태 이름은 숫자로 변환되지 않습니다', '별도 fixture의 Python int()에서 가짜 이메일은 ValueError였습니다.', [['Authentication.name 예시', 'alice@example.test'], ['Python int() 관측', 'ValueError'], ['Java 실행', '아님']], 108, 115, '추가 Python 관측은 Java Long.valueOf나 Spring 인증 실행을 재현하지 않습니다.', 'principal-mapping', { codeKind: 'additional-python', evidence: 'Python int("7") → 7, int("alice@example.test") → ValueError' }),
  ] },
  { id: 'cors-requests', question: 'CORS에서 서버 전송과 JavaScript 응답 읽기는 어떻게 다른가요?', source: '추가 Python HTTP fixture · 실제 Chrome 기록', note: '실험은 추가 Python HTTP fixture입니다. Spring Security나 cross-site CSRF 재현이 아닙니다.', stages: [
    stage('simple-blocked-read', '단순 요청은 도착했지만 읽기는 막힘', 'text/plain POST는 서버에 도착했지만 허용 Origin 응답 헤더가 없어 읽히지 않았습니다.', [['credentials', 'omit'], ['Content-Type', 'text/plain · preflight 없음'], ['API source 분기', 'send_json(200, response) · allow_origin 미지정'], ['OPTIONS / POST', '0 / 1'], ['JavaScript 읽기', '거부 · 응답 body 없음']], { evidenceKind: 'Chrome 결과 + Python server source', codeKind: 'additional-http-server-python', fragments: [[browser, 99, 102], [browser, 257, 257]], code: excerpt(browser, 257, 257).content, active: [0], image: 'cors-requests-v3', note: '브라우저가 실패 응답의 HTTP status/body를 읽지 못했습니다. allow_origin 미지정은 Python fixture source에 근거합니다.', evidence: 'OPTIONS 0 / POST 1 / fetch ok=false / observedBody=null', fullEvidence: corsRaw, evidencePath: corsRawPath }),
    stage('preflight-denied', 'preflight 거부 뒤 POST는 보내지 않음', '현재 case 이름이 허용 분기와 달라 Allow-* 헤더가 없고 POST는 보내지 않습니다.', [['OPTIONS case', 'preflight-denied'], ['request Origin', 'PAGE_ORIGIN과 일치'], ['server branch', 'case_name == preflight-allowed · false'], ['Allow-* 설정', '없음 · conditional body 실행 안 됨'], ['OPTIONS / POST', '1 / 0'], ['JavaScript 결과', 'fetch 거부 · body 없음']], { evidenceKind: 'Chrome 결과 + Python server source', codeKind: 'additional-http-server-python', fragments: [[browser, 88, 92], [browser, 223, 224]], code: excerpt(browser, 223, 224).content, active: [1], image: 'cors-requests-v3', note: '기본 코드는 Python API 조건식입니다. 실제 client 요청과 전체 OPTIONS handler는 출처 상세에서 확인합니다.', evidence: 'OPTIONS 1 / POST 0 / fetch ok=false / observedBody=null', fullEvidence: corsRaw, evidencePath: corsRawPath }),
    stage('preflight-allowed', '허용된 preflight 뒤 POST와 응답 읽기', 'Origin과 case 조건이 맞아 허용 method·header를 돌려준 뒤 POST와 응답 읽기가 성공합니다.', [['OPTIONS case', 'preflight-allowed'], ['request Origin', 'PAGE_ORIGIN과 일치'], ['허용 메서드(Allow-Methods)', 'POST'], ['허용 헤더(Allow-Headers)', 'content-type, x-d11-probe'], ['OPTIONS / POST', '1 / 1'], ['JavaScript 읽기', '실제 HTTP 200 · synthetic body']], { evidenceKind: 'Chrome 결과 + Python server source', codeKind: 'additional-http-server-python', fragments: [[browser, 88, 92], [browser, 224, 228]], code: excerpt(browser, 224, 228).content, active: [0, 1, 2, 3, 4], image: 'cors-requests-v3', note: '페이지와 API는 다른 Origin, 같은 loopback host라 same-site입니다. 허용 헤더 조건은 기본 코드에 보입니다.', evidence: 'OPTIONS 1 / POST 1 / fetch ok=true / HTTP 200 / 실제 합성 body', fullEvidence: corsRaw, evidencePath: corsRawPath }),
    stage('credential-wildcard', 'credentials와 와일드카드 Origin 조합은 읽기 거부', '서버는 `*`와 credentials 허용 헤더를 함께 보내지만 브라우저는 응답을 읽지 못합니다.', [['credentials 요청', 'include · 합성 cookie 이름 수신'], ['API source ACAO', '*'], ['API source ACAC', 'true'], ['OPTIONS / POST', '0 / 1'], ['JavaScript 읽기', '거부 · fetch status/body 없음']], { evidenceKind: 'Chrome 결과 + Python server source', codeKind: 'additional-http-server-python', fragments: [[browser, 94, 97], [browser, 204, 208], [browser, 254, 255]], code: excerpt(browser, 254, 255).content, active: [0, 1], image: 'cors-requests-v3', note: '기본 분기는 `wildcard=True, credentials=True`입니다. 실제 fetch 실패·cookie 이름 관측은 raw JSON을 펼쳐 확인합니다.', evidence: 'OPTIONS 0 / POST 1 / cookieNamePresent=true / fetch ok=false / body=null', fullEvidence: corsRaw, evidencePath: corsRawPath }),
  ] },
  { id: 'csrf-credentials', question: '상태 변경 자격 증명은 브라우저가 자동으로 보내나요?', source: '원문 §3.4·Q2 · 자격 증명 정책 비교 모델', note: '이 질문은 자격 증명 정책 모델입니다. 실제 cross-site 요청은 재현하지 않았습니다.', stages: [
    original('cookie-automatic', '쿠키는 조건을 만족하면 자동 첨부', '브라우저가 대상 도메인으로 보낼 때 cookie 정책을 적용합니다.', [['자격 증명', 'session cookie'], ['전달 방식', '브라우저 자동 첨부'], ['서버의 다음 판단', 'CSRF 방어 정책']], 120, 120, 'HttpOnly는 쿠키의 JavaScript 접근 조건이며 전송 조건이 아닙니다.', 'csrf-credentials-v2'),
    original('bearer-explicit', 'Authorization 헤더는 코드가 명시', '전형적인 쿠키 자동 전송 모델과 다르지만 토큰 관리와 CORS는 별도입니다.', [['자격 증명', 'Bearer token'], ['전달 방식', '요청 코드가 Authorization에 지정'], ['서버의 다음 판단', '인증·인가']], 122, 122, '이 비교는 CSRF를 모든 Bearer API에서 자동 면제한다는 뜻이 아닙니다.', 'csrf-credentials-v2'),
    original('cookie-token', '토큰을 쿠키에 두면 자동 전송을 다시 고려', '저장 위치가 cookie면 브라우저 자동 첨부 정책이 다시 적용됩니다.', [['토큰 위치', 'Cookie'], ['전달 방식', '조건부 자동 첨부'], ['다음 정책', 'SameSite·CSRF 별도 검토']], 122, 122, 'CORS·CSRF·SameSite는 서로 다른 정책 축입니다.', 'csrf-credentials-v2'),
  ] },
  { id: 'sql-boundary', question: '검색 값과 SQL 문법, 정렬 이름은 어떻게 다르게 다루나요?', source: '원문 §3.3·Q3 · 추가 SQLite 검색·정렬 비교', note: '추가 SQLite 실험은 MySQL/JPA/JDBC server prepare 재현이 아닙니다.', stages: [
    sqlite('value-concat', '입력을 SQL 문자열에 이어 붙이면 범위가 바뀜', '합성 검색 문자열을 이어 붙인 결과 2행과 바인딩 결과 0행을 비교합니다.', [['검색 입력', "' OR 1=1 --"], ['문자열 연결 결과', '1002/7, 1003/8'], ['DB', '격리 SQLite']], 79, 84, '이 좁은 합성 검색 예시는 owner 조건 우회 일반화나 MySQL 실행 증거가 아닙니다.', 'sql-boundary-v2', { bindParameters: [], evidence: 'unsafe SQL → 2행 / bind SQL title+owner → []' }),
    sqlite('value-bound', '값을 별도 parameter로 전달', '같은 문자열은 SQL 구문이 아니라 검색 값으로 처리됩니다.', [['SQL 값', '?'], ['bind', `["' OR 1=1 --", 7]`], ['결과', '[]']], 82, 84, 'SQL 구조와 입력 값의 경계를 나눕니다.', 'sql-boundary-v2', { bindParameters: ["' OR 1=1 --", 7], evidence: 'SELECT ... title = ? AND owner_id = ? · bind ["\' OR 1=1 --", 7] → []' }),
    sqlite('sort-allowed', '정렬 이름은 허용 목록으로 매핑', 'createdAt 요청을 SQL 식별자 created_at으로 바꾸고 owner 7 행을 정렬합니다.', [['요청 정렬', 'createdAt'], ['허용 매핑', 'created_at'], ['실행 결과', '1002 · owner 7']], 86, 91, '컬럼명은 일반 값처럼 바인딩할 수 없습니다. 허용 목록에서 선택합니다.', 'sql-boundary-v2', { bindParameters: [7], evidence: 'allowlist createdAt → created_at · owner_id bind [7] → [{id:1002, owner_id:7}]' }),
    sqlite('sort-rejected', '허용되지 않은 정렬 이름은 query 전에 거부', '알 수 없는 정렬 입력으로 DB query 실행 횟수는 0입니다.', [['입력', 'created_at DESC; SELECT * FROM orders'], ['거부 시점', 'DB query 전'], ['queryExecutions', '0']], 93, 102, '거부 횟수는 SQLite fixture의 별도 관측값이며 입력 검증 전체 보장을 의미하지 않습니다.', 'sql-boundary-v2', { bindParameters: [], evidence: 'rejectedBeforeExecution=true · queryExecutionsForRejectedInput=0' }),
  ] },
  { id: 'output-context', question: '같은 문자열을 textContent와 innerHTML에 넣으면 무엇이 달라지나요?', source: '안전 문자열 `<b>주문1002</b>` · 실제 Chrome DOM 읽기', note: 'DOM parsing 관측이며 공격 스크립트 실행 주장을 포함하지 않습니다.', stages: [
    stage('output-text', 'textContent는 문자열 그대로 둠', '실제 Chrome에서 자식 tag 0개, B 노드 0개를 읽었습니다.', [['textContent', '<b>주문1002</b>'], ['child tag', '[]'], ['B 개수', '0']], { evidenceKind: '실제 Chrome DOM 관측', codeKind: 'additional-browser-dom', fragments: [[browser, 131, 131], [browser, 144, 144]], code: excerpt(browser, 144, 144).content, active: [0], image: 'output-context', note: '문자열은 화면의 text node로 남습니다.', evidence: 'textContent literal / childTags=[] / bCount=0', fullEvidence: domRaw, evidencePath: domRawPath }),
    stage('output-markup', 'innerHTML은 B 요소로 파싱', '같은 문자열에서 실제 B 노드 1개를 관측했습니다.', [['textContent', '주문1002'], ['child tag', 'B'], ['B 개수', '1']], { evidenceKind: '실제 Chrome DOM 관측', codeKind: 'additional-browser-dom', fragments: [[browser, 131, 131], [browser, 145, 145]], code: excerpt(browser, 145, 145).content, active: [0], image: 'output-context', note: '공격 코드나 자동 실행을 관측한 것이 아닙니다.', evidence: 'innerHTML parse / childTags=["B"] / bCount=1', fullEvidence: domRaw, evidencePath: domRawPath }),
    original('context-policy', '출력 위치에 따라 인코딩 문맥이 달라짐', 'HTML 본문·속성·JS·URL을 각각의 문맥 규칙으로 다룹니다.', [['현재 출력 문맥', 'HTML body'], ['다른 문맥', 'attribute · JS · URL · CSS'], ['다음 판단', '문맥에 맞는 encoding']], 116, 116, 'CSP는 출력 인코딩을 대체하지 않습니다.', 'output-context'),
  ] },
  { id: 'security-config', question: 'permitAll은 URL이나 인증 방식을 만들어 주나요?', source: '원문 §4.2 · SecurityFilterChain 설정 분석', note: '원문 Java 설정은 미실행입니다. HTTP status를 예측하지 않습니다.', stages: [
    originalCode('chain-rules', '체인에는 접근 규칙과 보안 설정이 있음', '원문에서 permitAll, authenticated, CSRF, headers 설정을 확인합니다.', [['접근 허용', '/actuator/health · /css/**'], ['그 외 요청', 'authenticated'], ['CSRF·headers', '기본 설정 유지']], 184, 197, '원문 설정 발췌이며 실제 HTTP 상태 코드를 측정하지 않았습니다.', 'security-config', 'original-java-unrun', { active: [6, 7, 8, 9, 10, 11] }),
    originalCode('endpoint-missing', 'permitAll은 endpoint 존재를 보장하지 않음', '접근 규칙과 Controller/Actuator endpoint 구현은 별개입니다.', [['permitAll', 'URL 접근 규칙'], ['Controller·Actuator endpoint', '별도 구현 여부 확인'], ['다음 확인', '실제 소스와 실행 경로']], 188, 195, '접근 정책만으로 endpoint를 만들지 않습니다. HTTP status를 추정하지 않습니다.', 'security-config', 'original-java-unrun', { active: [2, 3, 4, 7] }),
    original('version-pinned', '원문 버전과 live 문서를 분리', '원문은 Boot 4.1.1 문서와 Java 25를 학습 기준으로 적습니다.', [['원문 Spring Boot 기준', '4.1.1'], ['Java 기준', '25'], ['공식 live 문서', '4.1.2 · 확인일 별도'], ['다음 판단', '실제 프로젝트 BOM 따로 확인']], 136, 136, 'live 문서 버전은 이 프로젝트 BOM을 검증한 결과가 아닙니다.', 'security-config', { code: excerpt(md, 136, 136).content, fragments: [[md, 136, 136], [spec, 24, 24]] }),
  ] },
  { id: 'hsts-boundary', question: 'HSTS는 첫 접속과 인증서 검증까지 해결하나요?', source: '원문 §3.1·Q6 · HSTS 동작 설명 모델', note: '실제 HSTS 캐시나 trust store는 변경하지 않았습니다.', stages: [
    original('hsts-unseen', '정책을 받기 전 첫 HTTP 접속', '정책을 아직 받은 적 없는 첫 진입에는 공백이 남습니다.', [['브라우저 정책', '아직 모름'], ['첫 입력', 'http://learn.example.test'], ['다음 판단', 'HTTPS와 인증서 확인']], 64, 70, 'learn.example.test는 설명 모델의 호스트명이며 실제 DNS나 브라우저 HSTS state를 관측하지 않았습니다.', 'hsts-boundary'),
    original('hsts-remembered', '정책을 기억한 뒤 다음 접속을 HTTPS로', '유효한 HTTPS 연결에서 max-age 정책을 받은 뒤 다음 접속을 업그레이드합니다.', [['받은 정책', 'max-age=31536000 · 그림의 기본 예시'], ['다음 입력', 'http://learn.example.test'], ['모델 결과', 'https://learn.example.test로 업그레이드']], 67, 70, 'learn.example.test는 설명 모델 호스트입니다. 원문 헤더의 includeSubDomains는 추가 범위 설정이며 다음 장면에서 다룹니다. 실제 브라우저 상태를 변경하지 않았습니다.', 'hsts-boundary'),
    original('hsts-subdomains', '하위 도메인도 HTTPS 준비가 됐는지 확인', 'includeSubDomains는 모든 하위 도메인 운영이 준비됐을 때 선택합니다.', [['정책 범위', 'learn.example.test 하위 도메인'], ['선행 확인', '각 하위 도메인 유효한 HTTPS'], ['다음 선택', '준비된 경우에만 includeSubDomains']], 70, 70, '모든 하위 도메인의 유효한 HTTPS 운영이 전제입니다.', 'hsts-boundary'),
  ] },
  { id: 'password-verification', question: '비밀번호는 저장·검증·재해시를 어떻게 나누나요?', source: '원문 §3.5·Q5 · 상징적 비밀번호 정책 모델', note: '알고리즘 권장 cost 숫자나 측정 시간을 추가하지 않습니다.', stages: [
    original('password-store', '평문 대신 salt와 느린 password hash 메타데이터 저장', '사용자별 salt와 cost 메타데이터를 포함한 password hash를 저장합니다.', [['예시 입력', 'password123!'], ['저장 레코드', 'H(password123!, salt₁, cost₁)'], ['메타데이터', 'algorithm₁ · salt₁ · cost₁']], 126, 126, 'H와 아래 첨자는 설명 기호입니다. 실제 hash·시간·권장 cost를 만들지 않았습니다.', 'password-verification'),
    original('password-check', '로그인 입력을 저장된 정책으로 검증', '같은 사용자 레코드의 salt·cost 정책으로 입력을 검증합니다.', [['입력', 'password123!'], ['검증 대상', '저장된 hash₁'], ['모델 계산', 'H(password123!, salt₁, cost₁) ↔ hash₁']], 128, 128, '일치 여부를 실제로 계산하지 않았으며 true/false를 결과값처럼 표시하지 않습니다.', 'password-verification'),
    original('password-rehash', '정책을 바꿀 때 성공 로그인 뒤 재해시', '로그인 성공 뒤 정책 조건이 바뀌었다면 새 정책으로 저장을 갱신합니다.', [['현재 저장', 'hash₁ · salt₁ · cost₁'], ['계기', '성공 로그인 + 새 cost 정책'], ['다음 처리', '새 정책 hash₂로 갱신 검토']], 128, 128, '새 hash나 cost를 실제 생성하지 않은 설명 모델입니다.', 'password-verification'),
  ] },
  { id: 'secret-log-lifecycle', question: 'Git에서 비밀 문자열을 지우면 이미 노출된 자격 증명이 취소되나요?', source: '합성 DEMO_ONLY_NOT_A_SECRET · 실제 환경·키 미조회', note: '실제 환경 변수·키를 읽거나 회전하지 않습니다.', stages: [
    stage('secret-injected', '환경에서 합성 값을 주입', '이미지의 System.getenv 예시는 개념 표시이며 환경 변수를 읽지 않았습니다.', [['환경 키 이름', 'DEMO_KEY'], ['예시로 들어오는 값', 'DEMO_ONLY_NOT_A_SECRET'], ['다음 판단', '값을 로그·Git에 노출하지 않기']], {
      codeKind: 'explanatory-model', evidenceKind: '설명 모델·실제 환경 변수 미조회',
      fragments: [[secretPrompt, 2, 3], [spec, 27, 27]],
      code: 'String key =\n    System.getenv("DEMO_KEY");', active: [0, 1],
      image: 'secret-log-lifecycle-v2',
      note: '화면의 코드 형식은 생성 이미지에 포함된 합성 예시입니다. 이 UI는 실제 환경 변수나 자격 증명을 조회하지 않습니다.',
    }),
    model('secret-exposed', 'Git에서 문자를 지워도 노출된 키는 남음', '과거 Git·로그에 노출된 자격 증명은 취소 대상으로 봅니다.', [['노출된 대상', 'DEMO_ONLY_NOT_A_SECRET'], ['문자 삭제', '이미 복사된 값은 취소되지 않음'], ['다음 조치', '폐기·회전·사용처 감사']], '노출된 자격 증명 발견 → 키 폐기·회전 → 사용처 감사', [27, 27], '합성 문자열만 다루는 설명 모델입니다. 실제 저장소 비밀이나 운영 키를 조회하지 않았습니다.', 'secret-log-lifecycle-v2'),
    model('secret-revoked', '폐기·회전·로그 마스킹을 확인', '사용처를 감사하고 민감한 값은 로그에 남기지 않습니다.', [['기존 자격 증명', '폐기 대상으로 표시'], ['다음 자격 증명', 'NEW_DEMO_KEY · 설명 기호'], ['로그 기록', 'credential=[REDACTED]']], '기존 키 폐기 → 새 키 회전 → 사용처 감사·로그 마스킹', [27, 27], '실제 키 rotation이나 운영 감사를 수행한 상태가 아닙니다.', 'secret-log-lifecycle-v2'),
  ] },
  { id: 'dependency-response', question: 'SBOM 목록만 만들면 취약점이 해결되나요?', source: '가상 web-app → helper-lib → codec-lib · 목록/평가/검증 모델', note: '현재 CVE·실제 버전·스캔 결과·해결 수치를 만들지 않습니다.', stages: [
    original('sbom-inventory', 'SBOM은 산출물 구성 목록', '전이 의존성까지 구성요소와 관계를 기록합니다.', [['가상 산출물', 'web-app'], ['직접 의존성', 'helper-lib'], ['전이 의존성', 'codec-lib']], 132, 132, '이 구성은 가상 모델이며 실제 프로젝트 의존성을 스캔한 결과가 아닙니다.', 'dependency-response-v2'),
    original('sca-assessment', 'SCA는 공지 영향과 경로를 평가', '구성 목록을 보안 공지와 연결해 실제 배포물 영향을 판단합니다.', [['입력', 'SBOM + 보안 공지'], ['확인 대상', '전이 경로·심각도·패치 가능성'], ['다음 판단', '조치 또는 책임·만료가 있는 예외']], 295, 295, '실제 CVE나 현재 취약점 판정을 수행하지 않았습니다.', 'dependency-response-v2'),
    original('rebuild-verify', '패치 뒤 실제 산출물을 다시 확인', '패치·예외 책임과 만료, 재빌드·재검증을 연결합니다.', [['대상', '패치된 배포 산출물'], ['다음 단계', '재빌드·재검증'], ['완료 판단', '새 SBOM·검사 근거 확인']], 299, 299, '성공한 해결 수치를 지어내지 않습니다.', 'dependency-response-v2'),
  ] },
];
