import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash as cryptoHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { D11_LESSONS, D11_ASSETS, d11AssetRoot } from './d11-lesson-data.mjs';
import { renderD11Learning } from './d11-learning.mjs';
import { initD11Learning } from './d11-learning.js';

const expectedTopicIds = [
  'object-ownership', 'request-boundaries', 'principal-mapping', 'cors-requests',
  'csrf-credentials', 'sql-boundary', 'output-context', 'security-config',
  'hsts-boundary', 'password-verification', 'secret-log-lifecycle', 'dependency-response',
];
const expectedStageIds = [
  'own-order', 'other-unscoped', 'other-scoped', 'uuid-scoped', 'boundary-identity',
  'boundary-owner', 'boundary-output', 'numeric-name', 'textual-name', 'simple-blocked-read',
  'preflight-denied', 'preflight-allowed', 'credential-wildcard', 'cookie-automatic',
  'bearer-explicit', 'cookie-token', 'value-concat', 'value-bound', 'sort-allowed',
  'sort-rejected', 'output-text', 'output-markup', 'context-policy', 'chain-rules',
  'endpoint-missing', 'version-pinned', 'hsts-unseen', 'hsts-remembered', 'hsts-subdomains',
  'password-store', 'password-check', 'password-rehash', 'secret-injected', 'secret-exposed',
  'secret-revoked', 'sbom-inventory', 'sca-assessment', 'rebuild-verify',
];

assert.deepEqual(D11_LESSONS.map(({ id }) => id), expectedTopicIds);
assert.deepEqual(D11_LESSONS.flatMap(lesson => lesson.stages.map(({ id }) => id)), expectedStageIds);
assert.equal(expectedStageIds.length, 38);
assert.equal(D11_LESSONS[0].id, 'object-ownership');
assert.equal(D11_LESSONS[0].stages[0].id, 'own-order');
assert.equal(d11AssetRoot, '../design/d11-2026-10-25/');
const expectedImages = {
  'own-order': 'object-own-order-v2-pc-dark.jpg', 'other-unscoped': 'object-ownership-pc-dark.jpg',
  'other-scoped': 'object-ownership-pc-dark.jpg', 'uuid-scoped': 'object-uuid-order-pc-dark.jpg',
  'boundary-identity': 'request-boundaries-pc-dark.jpg', 'boundary-owner': 'request-boundaries-pc-dark.jpg',
  'boundary-output': 'request-boundaries-pc-dark.jpg', 'numeric-name': 'principal-mapping-pc-dark.jpg',
  'textual-name': 'principal-mapping-pc-dark.jpg', 'simple-blocked-read': 'cors-requests-v3-pc-dark.jpg',
  'preflight-denied': 'cors-requests-v3-pc-dark.jpg', 'preflight-allowed': 'cors-requests-v3-pc-dark.jpg',
  'credential-wildcard': 'cors-requests-v3-pc-dark.jpg', 'cookie-automatic': 'csrf-credentials-v2-pc-dark.jpg',
  'bearer-explicit': 'csrf-credentials-v2-pc-dark.jpg', 'cookie-token': 'csrf-credentials-v2-pc-dark.jpg',
  'value-concat': 'sql-boundary-v2-pc-dark.jpg', 'value-bound': 'sql-boundary-v2-pc-dark.jpg',
  'sort-allowed': 'sql-boundary-v2-pc-dark.jpg', 'sort-rejected': 'sql-boundary-v2-pc-dark.jpg',
  'output-text': 'output-context-pc-dark.jpg', 'output-markup': 'output-context-pc-dark.jpg',
  'context-policy': 'output-context-pc-dark.jpg', 'chain-rules': 'security-config-pc-dark.jpg',
  'endpoint-missing': 'security-config-pc-dark.jpg', 'version-pinned': 'security-config-pc-dark.jpg',
  'hsts-unseen': 'hsts-boundary-pc-dark.jpg', 'hsts-remembered': 'hsts-boundary-pc-dark.jpg',
  'hsts-subdomains': 'hsts-boundary-pc-dark.jpg', 'password-store': 'password-verification-pc-dark.jpg',
  'password-check': 'password-verification-pc-dark.jpg', 'password-rehash': 'password-verification-pc-dark.jpg',
  'secret-injected': 'secret-log-lifecycle-v2-pc-dark.jpg', 'secret-exposed': 'secret-log-lifecycle-v2-pc-dark.jpg',
  'secret-revoked': 'secret-log-lifecycle-v2-pc-dark.jpg', 'sbom-inventory': 'dependency-response-v2-pc-dark.jpg',
  'sca-assessment': 'dependency-response-v2-pc-dark.jpg', 'rebuild-verify': 'dependency-response-v2-pc-dark.jpg',
};
const expectedFocus = {
  'own-order':[39,60,59,25], 'other-unscoped':[39,31,59,27], 'other-scoped':[39,60,59,25], 'uuid-scoped':[50,36,48,52],
  'boundary-identity':[49,28,15,42], 'boundary-owner':[65,28,17,42], 'boundary-output':[82,28,16,42],
  'numeric-name':[62,23,36,21], 'textual-name':[62,47,36,21],
  'simple-blocked-read':[1,24,98,13], 'preflight-denied':[1,41,98,13], 'preflight-allowed':[1,58,98,13], 'credential-wildcard':[1,74,98,13],
  'cookie-automatic':[1,13,48,42], 'bearer-explicit':[50,13,49,42], 'cookie-token':[1,56,56,24],
  'value-concat':[1,20,48,49], 'value-bound':[50,20,49,49], 'sort-allowed':[49,73,49,8], 'sort-rejected':[49,81,49,7],
  'output-text':[1,35,49,42], 'output-markup':[50,35,49,42], 'context-policy':[1,79,98,20],
  'chain-rules':[1,23,59,47], 'endpoint-missing':[64,39,34,15], 'version-pinned':[1,72,97,15],
  'hsts-unseen':[2,23,30,45], 'hsts-remembered':[34,23,64,45], 'hsts-subdomains':[65,72,33,18],
  'password-store':[1,16,98,38], 'password-check':[1,61,73,22], 'password-rehash':[76,59,22,26],
  'secret-injected':[1,22,35,64], 'secret-exposed':[37,22,29,64], 'secret-revoked':[67,22,31,64],
  'sbom-inventory':[1,14,47,55], 'sca-assessment':[49,14,23,55], 'rebuild-verify':[73,14,26,55],
};
const expectedActive = {
  'own-order':[0,1,2,3], 'other-unscoped':[0,1,2,3], 'other-scoped':[0,1,2,3], 'uuid-scoped':[0,1,2,3],
  'boundary-identity':[0], 'boundary-owner':[0], 'boundary-output':[0],
  'numeric-name':[2,3,4], 'textual-name':[0,1,2,3,4,5,6,7],
  'simple-blocked-read':[0], 'preflight-denied':[1], 'preflight-allowed':[0,1,2,3,4], 'credential-wildcard':[0,1],
  'cookie-automatic':[0], 'bearer-explicit':[0], 'cookie-token':[0],
  'value-concat':[0,1,2,3,4,5], 'value-bound':[0,1,2], 'sort-allowed':[0,1,2,3,4,5], 'sort-rejected':[0,1,2,3,4,5,6,7,8,9],
  'output-text':[0], 'output-markup':[0], 'context-policy':[0],
  'chain-rules':[6,7,8,9,10,11], 'endpoint-missing':[2,3,4,7], 'version-pinned':[0],
  'hsts-unseen':[0], 'hsts-remembered':[0], 'hsts-subdomains':[0],
  'password-store':[0], 'password-check':[0], 'password-rehash':[0],
  'secret-injected':[0,1], 'secret-exposed':[0], 'secret-revoked':[0],
  'sbom-inventory':[0], 'sca-assessment':[0], 'rebuild-verify':[0],
};
const expectedValues = {
  'own-order':[['로그인 주체','7'],['요청 주문 ID','1002'],['결과 행','1002 · owner 7']],
  'other-unscoped':[['로그인 주체','7'],['ID-only 결과','1003 · owner 8'],['소유권 조건','없음']],
  'other-scoped':[['로그인 주체','7'],['요청 주문 ID','1003'],['결과 행','[]']],
  'uuid-scoped':[['공개 UUID','00000000-0000-4000-8000-000000001003'],['로그인 주체','7'],['결과 행','[]']],
  'boundary-identity':[['주체','user 7'],['다음 판단','주문 소유권 확인']],
  'boundary-owner':[['주체','7'],['주문 1002','owner 7'],['주문 1003','owner 8']],
  'boundary-output':[['경계','응답 구성'],['다음 판단','HTML·속성·JS·URL 문맥']],
  'numeric-name':[['Authentication.name','"7"'],['변환 대상','Long.valueOf(authentication.getName())'],['다음 판단','내부 user ID와 객체 owner 비교']],
  'textual-name':[['Authentication.name 예시','alice@example.test'],['Python int() 관측','ValueError'],['Java 실행','아님']],
  'simple-blocked-read':[['credentials','omit'],['Content-Type','text/plain · preflight 없음'],['API source 분기','send_json(200, response) · allow_origin 미지정'],['OPTIONS / POST','0 / 1'],['JavaScript 읽기','거부 · 응답 body 없음']],
  'preflight-denied':[['OPTIONS case','preflight-denied'],['request Origin','PAGE_ORIGIN과 일치'],['server branch','case_name == preflight-allowed · false'],['Allow-* 설정','없음 · conditional body 실행 안 됨'],['OPTIONS / POST','1 / 0'],['JavaScript 결과','fetch 거부 · body 없음']],
  'preflight-allowed':[['OPTIONS case','preflight-allowed'],['request Origin','PAGE_ORIGIN과 일치'],['허용 메서드(Allow-Methods)','POST'],['허용 헤더(Allow-Headers)','content-type, x-d11-probe'],['OPTIONS / POST','1 / 1'],['JavaScript 읽기','실제 HTTP 200 · synthetic body']],
  'credential-wildcard':[['credentials 요청','include · 합성 cookie 이름 수신'],['API source ACAO','*'],['API source ACAC','true'],['OPTIONS / POST','0 / 1'],['JavaScript 읽기','거부 · fetch status/body 없음']],
  'cookie-automatic':[['자격 증명','session cookie'],['전달 방식','브라우저 자동 첨부'],['서버의 다음 판단','CSRF 방어 정책']],
  'bearer-explicit':[['자격 증명','Bearer token'],['전달 방식','요청 코드가 Authorization에 지정'],['서버의 다음 판단','인증·인가']],
  'cookie-token':[['토큰 위치','Cookie'],['전달 방식','조건부 자동 첨부'],['다음 정책','SameSite·CSRF 별도 검토']],
  'value-concat':[['검색 입력',"' OR 1=1 --"],['문자열 연결 결과','1002/7, 1003/8'],['DB','격리 SQLite']],
  'value-bound':[['SQL 값','?'],['bind',`["' OR 1=1 --", 7]`],['결과','[]']],
  'sort-allowed':[['요청 정렬','createdAt'],['허용 매핑','created_at'],['실행 결과','1002 · owner 7']],
  'sort-rejected':[['입력','created_at DESC; SELECT * FROM orders'],['거부 시점','DB query 전'],['queryExecutions','0']],
  'output-text':[['textContent','<b>주문1002</b>'],['child tag','[]'],['B 개수','0']],
  'output-markup':[['textContent','주문1002'],['child tag','B'],['B 개수','1']],
  'context-policy':[['현재 출력 문맥','HTML body'],['다른 문맥','attribute · JS · URL · CSS'],['다음 판단','문맥에 맞는 encoding']],
  'chain-rules':[['접근 허용','/actuator/health · /css/**'],['그 외 요청','authenticated'],['CSRF·headers','기본 설정 유지']],
  'endpoint-missing':[['permitAll','URL 접근 규칙'],['Controller·Actuator endpoint','별도 구현 여부 확인'],['다음 확인','실제 소스와 실행 경로']],
  'version-pinned':[['원문 Spring Boot 기준','4.1.1'],['Java 기준','25'],['공식 live 문서','4.1.2 · 확인일 별도'],['다음 판단','실제 프로젝트 BOM 따로 확인']],
  'hsts-unseen':[['브라우저 정책','아직 모름'],['첫 입력','http://learn.example.test'],['다음 판단','HTTPS와 인증서 확인']],
  'hsts-remembered':[['받은 정책','max-age=31536000 · 그림의 기본 예시'],['다음 입력','http://learn.example.test'],['모델 결과','https://learn.example.test로 업그레이드']],
  'hsts-subdomains':[['정책 범위','learn.example.test 하위 도메인'],['선행 확인','각 하위 도메인 유효한 HTTPS'],['다음 선택','준비된 경우에만 includeSubDomains']],
  'password-store':[['예시 입력','password123!'],['저장 레코드','H(password123!, salt₁, cost₁)'],['메타데이터','algorithm₁ · salt₁ · cost₁']],
  'password-check':[['입력','password123!'],['검증 대상','저장된 hash₁'],['모델 계산','H(password123!, salt₁, cost₁) ↔ hash₁']],
  'password-rehash':[['현재 저장','hash₁ · salt₁ · cost₁'],['계기','성공 로그인 + 새 cost 정책'],['다음 처리','새 정책 hash₂로 갱신 검토']],
  'secret-injected':[['환경 키 이름','DEMO_KEY'],['예시로 들어오는 값','DEMO_ONLY_NOT_A_SECRET'],['다음 판단','값을 로그·Git에 노출하지 않기']],
  'secret-exposed':[['노출된 대상','DEMO_ONLY_NOT_A_SECRET'],['문자 삭제','이미 복사된 값은 취소되지 않음'],['다음 조치','폐기·회전·사용처 감사']],
  'secret-revoked':[['기존 자격 증명','폐기 대상으로 표시'],['다음 자격 증명','NEW_DEMO_KEY · 설명 기호'],['로그 기록','credential=[REDACTED]']],
  'sbom-inventory':[['가상 산출물','web-app'],['직접 의존성','helper-lib'],['전이 의존성','codec-lib']],
  'sca-assessment':[['입력','SBOM + 보안 공지'],['확인 대상','전이 경로·심각도·패치 가능성'],['다음 판단','조치 또는 책임·만료가 있는 예외']],
  'rebuild-verify':[['대상','패치된 배포 산출물'],['다음 단계','재빌드·재검증'],['완료 판단','새 SBOM·검사 근거 확인']],
};
const expectedBinds = {
  'own-order':[1002,7], 'other-unscoped':[1003], 'other-scoped':[1003,7],
  'uuid-scoped':['00000000-0000-4000-8000-000000001003',7], 'value-concat':[],
  'value-bound':["' OR 1=1 --",7], 'sort-allowed':[7], 'sort-rejected':[],
};
const sqlitePath='docs/design/d11-2026-10-25/source-proof/sqlite_proof.py';
const browserPath='docs/design/d11-2026-10-25/source-proof/browser_fixture.py';
const sourcePath='docs/knowledge/D11-web-security-basics.md';
const specPath='docs/design/d11-2026-10-25/SPEC.md';
const promptPath='docs/design/d11-2026-10-25/prompts/secret-log-lifecycle-v2.txt';
const expectedFragments = {
  'own-order':[[sqlitePath,59,62]], 'other-unscoped':[[sqlitePath,64,67]], 'other-scoped':[[sqlitePath,69,72]], 'uuid-scoped':[[sqlitePath,74,77]],
  'boundary-identity':[[specPath,17,17]], 'boundary-owner':[[specPath,17,17]], 'boundary-output':[[specPath,17,17]],
  'numeric-name':[[sourcePath,153,157]], 'textual-name':[[sqlitePath,108,115]],
  'simple-blocked-read':[[browserPath,99,102],[browserPath,257,257]],
  'preflight-denied':[[browserPath,88,92],[browserPath,223,224]],
  'preflight-allowed':[[browserPath,88,92],[browserPath,224,228]],
  'credential-wildcard':[[browserPath,94,97],[browserPath,204,208],[browserPath,254,255]],
  'cookie-automatic':[[sourcePath,120,120]], 'bearer-explicit':[[sourcePath,122,122]], 'cookie-token':[[sourcePath,122,122]],
  'value-concat':[[sqlitePath,79,84]], 'value-bound':[[sqlitePath,82,84]], 'sort-allowed':[[sqlitePath,86,91]], 'sort-rejected':[[sqlitePath,93,102]],
  'output-text':[[browserPath,131,131],[browserPath,144,144]], 'output-markup':[[browserPath,131,131],[browserPath,145,145]],
  'context-policy':[[sourcePath,116,116]], 'chain-rules':[[sourcePath,184,197]], 'endpoint-missing':[[sourcePath,188,195]],
  'version-pinned':[[sourcePath,136,136],[specPath,24,24]], 'hsts-unseen':[[sourcePath,64,70]], 'hsts-remembered':[[sourcePath,67,70]],
  'hsts-subdomains':[[sourcePath,70,70]], 'password-store':[[sourcePath,126,126]], 'password-check':[[sourcePath,128,128]],
  'password-rehash':[[sourcePath,128,128]], 'secret-injected':[[promptPath,2,3],[specPath,27,27]],
  'secret-exposed':[[specPath,27,27]], 'secret-revoked':[[specPath,27,27]],
  'sbom-inventory':[[sourcePath,132,132]], 'sca-assessment':[[sourcePath,295,295]], 'rebuild-verify':[[sourcePath,299,299]],
};
const expectedCodeRange = {
  'own-order':[sqlitePath,59,62], 'other-unscoped':[sqlitePath,64,67], 'other-scoped':[sqlitePath,69,72], 'uuid-scoped':[sqlitePath,74,77],
  'numeric-name':[sourcePath,153,157], 'textual-name':[sqlitePath,108,115],
  'simple-blocked-read':[browserPath,257,257], 'preflight-denied':[browserPath,223,224],
  'preflight-allowed':[browserPath,224,228], 'credential-wildcard':[browserPath,254,255],
  'cookie-automatic':[sourcePath,120,120], 'bearer-explicit':[sourcePath,122,122], 'cookie-token':[sourcePath,122,122],
  'value-concat':[sqlitePath,79,84], 'value-bound':[sqlitePath,82,84], 'sort-allowed':[sqlitePath,86,91], 'sort-rejected':[sqlitePath,93,102],
  'output-text':[browserPath,144,144], 'output-markup':[browserPath,145,145], 'context-policy':[sourcePath,116,116],
  'chain-rules':[sourcePath,184,197], 'endpoint-missing':[sourcePath,188,195], 'version-pinned':[sourcePath,136,136],
  'hsts-unseen':[sourcePath,64,70], 'hsts-remembered':[sourcePath,67,70], 'hsts-subdomains':[sourcePath,70,70],
  'password-store':[sourcePath,126,126], 'password-check':[sourcePath,128,128], 'password-rehash':[sourcePath,128,128],
  'secret-injected':[promptPath,2,3], 'sbom-inventory':[sourcePath,132,132], 'sca-assessment':[sourcePath,295,295], 'rebuild-verify':[sourcePath,299,299],
};
const expectedModelCode = {
  'boundary-identity':'요청 자격 증명 → 현재 주체 확인',
  'boundary-owner':'주체 + 객체 소유 관계 → 허용 여부 판단',
  'boundary-output':'객체 권한 확인 → 응답 데이터와 출력 문맥 검토',
  'secret-exposed':'노출된 자격 증명 발견 → 키 폐기·회전 → 사용처 감사',
  'secret-revoked':'기존 키 폐기 → 새 키 회전 → 사용처 감사·로그 마스킹',
};
const expectedCodeKinds = {
  ...Object.fromEntries(['own-order','other-unscoped','other-scoped','uuid-scoped','value-concat','value-bound','sort-allowed','sort-rejected'].map(id=>[id,'additional-sqlite'])),
  'boundary-identity':'explanatory-model','boundary-owner':'explanatory-model','boundary-output':'explanatory-model',
  'numeric-name':'original-java-unrun','textual-name':'additional-python',
  'simple-blocked-read':'additional-http-server-python','preflight-denied':'additional-http-server-python','preflight-allowed':'additional-http-server-python','credential-wildcard':'additional-http-server-python',
  'cookie-automatic':'original-prose','bearer-explicit':'original-prose','cookie-token':'original-prose',
  'output-text':'additional-browser-dom','output-markup':'additional-browser-dom','context-policy':'original-prose',
  'chain-rules':'original-java-unrun','endpoint-missing':'original-java-unrun','version-pinned':'original-prose',
  'hsts-unseen':'original-prose','hsts-remembered':'original-prose','hsts-subdomains':'original-prose',
  'password-store':'original-prose','password-check':'original-prose','password-rehash':'original-prose',
  'secret-injected':'explanatory-model','secret-exposed':'explanatory-model','secret-revoked':'explanatory-model',
  'sbom-inventory':'original-prose','sca-assessment':'original-prose','rebuild-verify':'original-prose',
};
const expectedEvidenceKinds = {
  ...Object.fromEntries(['own-order','other-unscoped','other-scoped','uuid-scoped','value-concat','value-bound','sort-allowed','sort-rejected','textual-name'].map(id=>[id,'추가 Python·SQLite 실제 관측'])),
  'boundary-identity':'설명용 절차·실행 코드 아님','boundary-owner':'설명용 절차·실행 코드 아님','boundary-output':'설명용 절차·실행 코드 아님',
  'numeric-name':'원문 코드 분석·미실행','chain-rules':'원문 코드 분석·미실행','endpoint-missing':'원문 코드 분석·미실행',
  'simple-blocked-read':'Chrome 결과 + Python server source','preflight-denied':'Chrome 결과 + Python server source','preflight-allowed':'Chrome 결과 + Python server source','credential-wildcard':'Chrome 결과 + Python server source',
  'output-text':'실제 Chrome DOM 관측','output-markup':'실제 Chrome DOM 관측',
  'secret-injected':'설명 모델·실제 환경 변수 미조회',
};
const expectedCodeKindLabels = {
  'additional-sqlite':'추가 Python·SQLite 관측 발췌 · bind는 위 표에 별도 표시',
  'additional-python':'추가 Python 관측 발췌',
  'additional-http-server-python':'Python fixture 서버 응답 조건 · Chrome 결과 별도',
  'additional-browser-dom':'실제 Chrome DOM 관측 발췌',
  'original-java-unrun':'원문 Java · 미실행',
  'original-groovy-unrun':'원문 Gradle/Groovy · 미실행',
  'original-prose':'원문 설명 · 실행 코드 아님',
  'explanatory-model':'설명용 절차·실행 코드 아님',
};
for (const id of ['cookie-automatic','bearer-explicit','cookie-token','context-policy','version-pinned','hsts-unseen','hsts-remembered','hsts-subdomains','password-store','password-check','password-rehash','sbom-inventory','sca-assessment','rebuild-verify']) expectedEvidenceKinds[id]='원문에 근거한 설명 모델·미실행';
for (const id of ['secret-exposed','secret-revoked']) expectedEvidenceKinds[id]='설명용 절차·실행 코드 아님';

for (const lesson of D11_LESSONS) {
  for (const stage of lesson.stages) {
    assert.ok(stage.evidenceKind, `${stage.id} evidenceKind`);
    assert.ok(stage.sourceFragments?.length, `${stage.id} source fragments`);
    assert.ok(stage.code, `${stage.id} visible code or procedure`);
    assert.ok(stage.values?.length, `${stage.id} values`);
    assert.ok(stage.note, `${stage.id} scope note`);
    assert.ok(D11_ASSETS[stage.image], `${stage.id} image`);
    assert.deepEqual(stage.active, expectedActive[stage.id], `${stage.id} active source lines`);
    assert.equal(D11_ASSETS[stage.image].file, expectedImages[stage.id], `${stage.id} independently selected image`);
    assert.deepEqual(D11_ASSETS[stage.image].focus[stage.id], expectedFocus[stage.id], `${stage.id} independent focus crop`);
    const [x, y, width, height] = D11_ASSETS[stage.image].focus[stage.id];
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 100 && y + height <= 100, `${stage.id} focus bounds`);
    for (const fragment of stage.sourceFragments) {
      const source = readFileSync(new URL(`../../${fragment.path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n');
      assert.equal(source.slice(fragment.start - 1, fragment.end).join('\n'), fragment.content, `${stage.id} source range`);
    }
    if (!['explanatory-model'].includes(stage.codeKind)) {
      assert.ok(stage.sourceFragments.some(fragment => fragment.content === stage.code), `${stage.id} exact source excerpt`);
    }
  }
}

const stagesById = Object.fromEntries(D11_LESSONS.flatMap(lesson => lesson.stages.map(stage => [stage.id, stage])));
assert.deepEqual(Object.keys(stagesById).sort(), Object.keys(expectedValues).sort());
assert.deepEqual(Object.keys(stagesById).sort(), Object.keys(expectedFragments).sort());
assert.deepEqual(Object.keys(stagesById).sort(), Object.keys(expectedCodeKinds).sort());
assert.deepEqual(Object.keys(stagesById).sort(), Object.keys(expectedEvidenceKinds).sort());
function sourceExcerpt(path, start, end) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n');
  return source.slice(start - 1, end).join('\n');
}
function expectedPayload(id) {
  const range = expectedCodeRange[id];
  if (range) return sourceExcerpt(...range);
  assert.ok(Object.hasOwn(expectedModelCode, id), `${id} independent model code expectation`);
  return expectedModelCode[id];
}
function renderedPairs(root) {
  const terms = [...root.querySelectorAll('[data-d11-state] dt')];
  const values = [...root.querySelectorAll('[data-d11-state] dd')];
  return terms.map((term, index) => [term.textContent, values[index].textContent]);
}
function expectedPairs(id) {
  const bind = expectedBinds[id];
  return bind === undefined ? expectedValues[id] : [...expectedValues[id], ['SQL bind parameters', JSON.stringify(bind)]];
}
assert.deepEqual(stagesById['own-order'].bindParameters, [1002, 7]);
assert.deepEqual(stagesById['other-unscoped'].bindParameters, [1003]);
assert.deepEqual(stagesById['other-scoped'].bindParameters, [1003, 7]);
assert.deepEqual(stagesById['uuid-scoped'].bindParameters, ['00000000-0000-4000-8000-000000001003', 7]);
assert.match(stagesById['own-order'].evidence, /1002.*owner_id.*7/);
assert.match(stagesById['other-unscoped'].evidence, /1003.*owner_id.*8/);
assert.match(stagesById['other-scoped'].evidence, /→ \[\]$/);
assert.match(stagesById['uuid-scoped'].evidence, /public_id.*7.*→ \[\]$/);
assert.match(stagesById['password-check'].values.map(([, value]) => value).join(' '), /password123.*salt₁.*cost₁.*hash₁/);
assert.match(stagesById['secret-injected'].code, /System\.getenv\("DEMO_KEY"\)/);
assert.equal(stagesById['secret-injected'].codeKind, 'explanatory-model');
assert.equal(stagesById['boundary-identity'].code, '요청 자격 증명 → 현재 주체 확인');
assert.equal(stagesById['boundary-owner'].code, '주체 + 객체 소유 관계 → 허용 여부 판단');
assert.equal(stagesById['boundary-output'].code, '객체 권한 확인 → 응답 데이터와 출력 문맥 검토');
assert.equal(stagesById['simple-blocked-read'].code.trim(), 'self.send_json(200, response)');
assert.match(stagesById['simple-blocked-read'].sourceFragments[0].content, /"Content-Type": "text\/plain"/);
assert.match(stagesById['preflight-denied'].code, /case_name == "preflight-allowed"/);
assert.match(stagesById['preflight-denied'].sourceFragments[0].content, /"X-D11-Probe": "synthetic"/);
assert.match(stagesById['preflight-allowed'].code, /Access-Control-Allow-Origin.*Access-Control-Allow-Methods.*Access-Control-Allow-Headers/s);
assert.notEqual(stagesById['preflight-denied'].code, stagesById['preflight-allowed'].code);
assert.match(stagesById['credential-wildcard'].code, /wildcard=True, credentials=True/);
assert.match(stagesById['credential-wildcard'].sourceFragments[1].content, /Access-Control-Allow-Origin.*Access-Control-Allow-Credentials/s);
assert.equal(stagesById['output-text'].code.trim(), 'document.getElementById("dom-text-content").addEventListener("click", () => readDom("textContent", (target, sample) => { target.textContent = sample; }));');
assert.equal(stagesById['output-markup'].code.trim(), 'document.getElementById("dom-inner-html").addEventListener("click", () => readDom("innerHTML", (target, sample) => { target.innerHTML = sample; }));');
assert.match(stagesById['sbom-inventory'].values.map(([, value]) => value).join(' '), /web-app.*helper-lib.*codec-lib/);

const md = readFileSync(new URL('../../docs/knowledge/D11-web-security-basics.md', import.meta.url), 'utf8');
assert.equal(md.split('\n').length - 1, 314);
assert.equal(sha256(md), 'a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba');

const selected = JSON.parse(readFileSync(new URL('../../docs/design/d11-2026-10-25/selected-images.json', import.meta.url), 'utf8'));
assert.equal(selected.length, 14);
for (const [id, asset] of Object.entries(D11_ASSETS)) {
  const record = selected.find(item => item.id === id);
  assert.ok(record, `selected image record ${id}`);
  const bytes = readFileSync(new URL(`../../docs/design/d11-2026-10-25/${asset.file}`, import.meta.url));
  assert.equal(sha256(bytes), record.sha256, `${id} image SHA`);
  assert.equal(bytes.length, record.bytes, `${id} image bytes`);
}

const sqliteLog = JSON.parse(readFileSync(new URL('../../docs/design/d11-2026-10-25/proof-logs/sqlite-proof-20261024T161249Z.json', import.meta.url), 'utf8'));
assert.equal(sqliteLog.returnCode, 0);
const sqliteActual = JSON.parse(sqliteLog.stdout);
assert.deepEqual(sqliteActual.actual.objectAccess.ownScoped, [{ id: 1002, owner_id: 7 }]);
assert.deepEqual(sqliteActual.actual.objectAccess.otherIdOnly, [{ id: 1003, owner_id: 8 }]);
assert.deepEqual(sqliteActual.actual.objectAccess.otherScoped, []);
assert.deepEqual(sqliteActual.actual.objectAccess.uuidOtherScoped, []);
assert.deepEqual(sqliteActual.actual.titleSearch.unsafeConcatenation, [{ id: 1002, owner_id: 7 }, { id: 1003, owner_id: 8 }]);
assert.deepEqual(sqliteActual.actual.titleSearch.safeBoundOwner7, []);
assert.equal(sqliteActual.sorting.queryExecutionsForRejectedInput, 0);
assert.equal(sqliteActual.principalConversionExample.numericResult, 7);
assert.equal(sqliteActual.principalConversionExample.textException, 'ValueError');
const addendumLog = JSON.parse(readFileSync(new URL('../../docs/design/d11-2026-10-25/proof-logs/addendum-sqlite-compare-20261024T163559Z.json', import.meta.url), 'utf8'));
assert.equal(addendumLog.returnCode, 0);
const addendumActual = JSON.parse(addendumLog.stdout);
assert.deepEqual(addendumActual.actual.idOnly1002, [{ id: 1002, owner_id: 7 }]);
assert.deepEqual(addendumActual.actual.uuidUnscoped1003, [{ id: 1003, owner_id: 8 }]);

const corsRaw = JSON.parse(readFileSync(new URL('../../docs/design/d11-2026-10-25/proof-logs/main-browser-cors.json', import.meta.url), 'utf8'));
assert.deepEqual(corsRaw.map(item => ({ id: item.case, options: item.serverObservation.optionsCount, posts: item.serverObservation.postCount, read: item.fetch.ok, status: item.fetch.status ?? null, body: item.observedBody })), [
  { id: 'simple-blocked-read', options: 0, posts: 1, read: false, status: null, body: null },
  { id: 'preflight-denied', options: 1, posts: 0, read: false, status: null, body: null },
  { id: 'preflight-allowed', options: 1, posts: 1, read: true, status: 200, body: '{"case":"preflight-allowed","message":"synthetic fixture response"}\n' },
  { id: 'wildcard-credentials', options: 0, posts: 1, read: false, status: null, body: null },
]);
assert.ok(corsRaw.every(item => item.source === 'additional Python HTTP fixture, not Spring Security'));
const domRaw = JSON.parse(readFileSync(new URL('../../docs/design/d11-2026-10-25/proof-logs/main-browser-dom.json', import.meta.url), 'utf8'));
assert.deepEqual(domRaw.map(item => ({ method: item.method, childTags: item.childTags, bCount: item.bCount, serializedHTML: item.serializedHTML })), [
  { method: 'textContent', childTags: [], bCount: 0, serializedHTML: '&lt;b&gt;주문1002&lt;/b&gt;' },
  { method: 'innerHTML', childTags: ['B'], bCount: 1, serializedHTML: '<b>주문1002</b>' },
]);

const rendered = renderD11Learning();
assert.match(rendered, /data-d11-learning/);
assert.match(rendered, /data-d11-topic/);
assert.match(rendered, /#d11-original/);
assert.doesNotMatch(rendered, /<h1\b/);
const dom = new JSDOM(`<main><h1>D11 웹 보안</h1>${rendered}<details id="d11-original"><summary>원문</summary><p id="d11-source-anchor">source</p></details></main>`, { url: 'https://example.test/docs/knowledge/D11-web-security-basics.html' });
const { document, Event, KeyboardEvent } = dom.window;
const win = dom.window;
win.matchMedia = () => ({ matches: false, addEventListener() {} });
let clipboard = [];
Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async value => clipboard.push(value) } });
initD11Learning(document, win);
initD11Learning(document, win);
const root = document.querySelector('[data-d11-learning]');
assert.equal(root.dataset.topic, 'object-ownership');
assert.equal(root.dataset.stage, 'own-order');
assert.equal(document.querySelectorAll('main h1').length, 1);
assert.equal(new Set([...document.querySelectorAll('[id]')].map(node => node.id)).size, document.querySelectorAll('[id]').length);
assert.equal(root.querySelector('[data-d11-image]').getAttribute('src'), `${d11AssetRoot}${D11_ASSETS['object-own-order-v2'].file}`);
assert.equal(root.querySelector('[data-d11-zoom]').getAttribute('aria-pressed'), 'false');
root.querySelector('[data-d11-zoom]').click();
assert.equal(root.querySelector('[data-d11-zoom]').getAttribute('aria-pressed'), 'true');
root.querySelector('[data-d11-zoom]').click();
assert.equal(root.querySelector('[data-d11-zoom]').getAttribute('aria-pressed'), 'false');

root.querySelector('[data-d11-stage="other-unscoped"]').click();
assert.equal(root.dataset.stage, 'other-unscoped');
assert.equal(root.querySelector('[data-d11-image]').getAttribute('src'), `${d11AssetRoot}object-ownership-pc-dark.jpg`);
assert.match(root.querySelector('[data-d11-state]').textContent, /1003/);
assert.match(root.querySelector('[data-d11-code-kind]').textContent, /추가 Python·SQLite/);
assert.match(root.querySelector('[data-d11-state]').textContent, /bind parameters.*1003/is);
await root.querySelector('[data-d11-copy]').click();
assert.equal(clipboard.at(-1), root.querySelector('[data-d11-code]').textContent);

const topicSelect = root.querySelector('[data-d11-topic]');
topicSelect.value = 'cors-requests'; topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d11-stage="credential-wildcard"]').click();
assert.equal(root.querySelector('[data-d11-state]').textContent.includes('HTTP status'), false);
assert.equal(root.querySelector('[data-d11-evidence-kind]').textContent, 'Chrome 결과 + Python server source');
assert.equal(root.querySelector('[data-d11-source-details]').open, false);
root.querySelector('[data-d11-source-details]').open = true;
assert.match(root.querySelector('[data-d11-evidence]').textContent, /POST.*false|false.*POST/);
assert.equal(root.querySelector('[data-d11-evidence-link] a').getAttribute('href'), '../../docs/design/d11-2026-10-25/proof-logs/main-browser-cors.json');
assert.match(root.querySelectorAll('[data-d11-source-code] pre code')[1].textContent, /Access-Control-Allow-Credentials/);
const firstStageButton = root.querySelector('[data-d11-stage="simple-blocked-read"]');
const secondStageButton = root.querySelector('[data-d11-stage="preflight-denied"]');
firstStageButton.focus();
root.querySelector('[data-d11-stages]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
assert.equal(document.activeElement, secondStageButton);
assert.equal(root.dataset.stage, 'credential-wildcard');

const saved = { foreign: { preserve: true }, __javaExperienceD11: { topic: 'sql-boundary', stage: 'sort-rejected' } };
win.history.replaceState({ ...saved, __javaExperienceD11: { topic: 'sql-boundary', stage: 'sort-rejected' } }, '', '#d11-source-anchor');
win.dispatchEvent(new Event('popstate'));
assert.equal(root.dataset.stage, 'sort-rejected');
assert.equal(win.history.state.foreign.preserve, true);
assert.equal(document.getElementById('d11-original').open, true);
win.history.replaceState({ foreign: { preserved: true }, __javaExperienceD11: { topic: 'object-ownership', stage: 'own-order' } }, '', '#%E0%A4');
win.dispatchEvent(new Event('hashchange'));
assert.equal(root.dataset.stage, 'sort-rejected');
assert.equal(win.history.state.foreign.preserved, true);

for (const lesson of D11_LESSONS) {
  topicSelect.value = lesson.id; topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(root.dataset.topic, lesson.id);
  for (const stage of lesson.stages) {
    root.querySelector(`[data-d11-stage="${stage.id}"]`).click();
    assert.equal(root.dataset.stage, stage.id);
    assert.equal(root.querySelector('[data-d11-image]').getAttribute('src'), `${d11AssetRoot}${D11_ASSETS[stage.image].file}`);
    assert.deepEqual(stage.values, expectedValues[stage.id], `${stage.id} independent state values`);
    assert.deepEqual(stage.bindParameters ?? null, expectedBinds[stage.id] ?? null, `${stage.id} independent bind values`);
    assert.equal(stage.codeKind, expectedCodeKinds[stage.id], `${stage.id} independent code kind`);
    assert.equal(stage.evidenceKind, expectedEvidenceKinds[stage.id], `${stage.id} independent evidence kind`);
    assert.equal(root.querySelector('[data-d11-code-kind]').textContent, expectedCodeKindLabels[expectedCodeKinds[stage.id]], `${stage.id} rendered source label`);
    assert.equal(root.querySelector('[data-d11-evidence-kind]').textContent, expectedEvidenceKinds[stage.id], `${stage.id} rendered evidence label`);
    assert.deepEqual(stage.sourceFragments.map(({ path, start, end }) => [path, start, end]), expectedFragments[stage.id], `${stage.id} independent source paths`);
    const payload = expectedPayload(stage.id);
    assert.equal(stage.code, payload, `${stage.id} independent code payload`);
    if (['original-java-unrun', 'original-groovy-unrun'].includes(stage.codeKind)) assert.doesNotMatch(payload, /```/, `${stage.id} code payload excludes Markdown fences`);
    assert.deepEqual(renderedPairs(root), expectedPairs(stage.id), `${stage.id} rendered values and binds`);
    assert.equal(root.querySelector('[data-d11-code]').textContent, payload, `${stage.id} displayed exact code`);
    assert.deepEqual([...root.querySelectorAll('[data-d11-source-code] code')].map(code => code.textContent), stage.sourceFragments.map(fragment => fragment.content), `${stage.id} detailed source excerpts`);
    if (stage.evidencePath) assert.equal(root.querySelector('[data-d11-evidence-link] a').getAttribute('href'), `../../${stage.evidencePath}`, `${stage.id} raw evidence link`);
    assert.deepEqual([...root.querySelectorAll('[data-d11-code] mark')].map(mark => mark.textContent), stage.active.map(line => payload.split('\n')[line]));
    root.querySelector('[data-d11-copy]').click(); await Promise.resolve();
    assert.equal(clipboard.at(-1), payload, `${stage.id} copy payload`);
    const focus = D11_ASSETS[stage.image].focus[stage.id];
    const ratio = D11_ASSETS[stage.image].width * focus[2] / (D11_ASSETS[stage.image].height * focus[3]);
    root.querySelector('[data-d11-zoom]').click();
    assert.equal(root.querySelector('.d11-image-frame').dataset.zoom, 'true');
    assert.equal(parseFloat(root.querySelector('.d11-image-frame').style.aspectRatio), ratio);
    assert.equal(root.querySelector('.d11-image-frame').style.getPropertyValue('--d11-zoom-width'), `${540 * ratio}px`);
    assert.equal(root.querySelector('[data-d11-focus]').hidden, true);
    root.querySelector('[data-d11-zoom]').click();
    assert.equal(root.querySelector('.d11-image-frame').dataset.zoom, 'false');
  }
}

const racePromises = [];
Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: value => new Promise((resolve, reject) => racePromises.push({ value, resolve, reject })) } });
topicSelect.value = 'object-ownership'; topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d11-stage="other-unscoped"]').click();
root.querySelector('[data-d11-copy]').click();
topicSelect.value = 'cors-requests'; topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d11-stage="preflight-denied"]').click();
topicSelect.value = 'object-ownership'; topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d11-stage="other-unscoped"]').click();
racePromises[0].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d11-copy-status]').textContent, '');
root.querySelector('[data-d11-copy]').click();
root.querySelector('[data-d11-copy]').click();
racePromises[2].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d11-copy-status]').textContent, '현재 코드 전체를 복사했습니다.');
racePromises[1].reject(new Error('stale rejection')); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d11-copy-status]').textContent, '현재 코드 전체를 복사했습니다.');
root.querySelector('[data-d11-copy]').click();
root.querySelector('[data-d11-copy]').click();
racePromises[4].reject(new Error('current rejection')); await Promise.resolve(); await Promise.resolve();
assert.match(root.querySelector('[data-d11-copy-status]').textContent, /선택했습니다/);
const fallbackStatus = root.querySelector('[data-d11-copy-status]').textContent;
racePromises[3].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d11-copy-status]').textContent, fallbackStatus);
assert.equal(win.getSelection().toString(), root.querySelector('[data-d11-code]').textContent);
Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('clipboard unavailable'); } } });
root.querySelector('[data-d11-copy]').click(); await Promise.resolve(); await Promise.resolve();
assert.equal(win.getSelection().toString(), root.querySelector('[data-d11-code]').textContent);
assert.match(root.querySelector('[data-d11-copy-status]').textContent, /선택했습니다/);

function sha256(value) { return cryptoHash('sha256').update(value).digest('hex'); }
