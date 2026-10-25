import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { getFunctionalVisualModel } from './functional-visual-model.mjs';
import { FUNCTIONAL_CONTRACT, FUNCTIONAL_TASKS, FUNCTIONAL_TASK_BY_ID, getFunctionalTask } from './functional-scenario-data.mjs';

const root = new URL('../../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(read(FUNCTIONAL_CONTRACT.manifest));
const files = new Map(manifest.files.map(file => [file.path, file]));
const checked = new Set();
function blob(file) {
  const entry = files.get(file);
  assert.ok(entry, `${file}: 3-2 manifest에 있어야 한다`);
  const body = read(`scenario/snapshots/blobs/${entry.blob}.txt`);
  if (!checked.has(file)) {
    const bytes = Buffer.from(body);
    const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(hash, entry.blob, `${file}: 정본 blob 바이트 해시`);
    checked.add(file);
  }
  return body;
}
const postFile = name => `src/main/java/org/example/post/${name}.java`;
function methodBody(file, method) {
  const text = blob(file);
  const start = new RegExp(`(?:public|private)\\s+[^\\n]+\\s${method}\\([^)]*\\)\\s*\\{`).exec(text);
  assert.ok(start, `${file}: ${method} 선언`);
  const opening = start.index + start[0].lastIndexOf('{');
  let depth = 1;
  let cursor = opening + 1;
  for (; cursor < text.length && depth; cursor++) {
    if (text[cursor] === '{') depth++;
    if (text[cursor] === '}') depth--;
  }
  return text.slice(opening + 1, cursor - 1);
}
const service = blob(postFile('PostService'));
const queryService = blob(postFile('PostQueryService'));
const controller = blob(postFile('PostController'));
const boardController = blob(postFile('BoardPostController'));
const entity = blob(postFile('Post'));
const policy = blob(postFile('PostAccessPolicy'));
const repository = blob(postFile('PostRepository'));
const byId = FUNCTIONAL_TASK_BY_ID;

assert.equal(manifest.id, '3-2');
assert.deepEqual(FUNCTIONAL_TASKS.map(t => t.id), ['create', 'detail', 'list', 'update', 'delete']);
assert.equal(new Set(FUNCTIONAL_TASKS.map(t => t.sourcePath)).size, 5);
for (const [index, task] of FUNCTIONAL_TASKS.entries()) {
  assert.equal(getFunctionalTask(task.sourcePath), task);
  assert.equal(getFunctionalTask(task.sourcePath.replace('.md', '.html')), task);
  assert.equal(getFunctionalTask('/tmp/work/' + task.sourcePath), task);
  assert.equal(getFunctionalTask(task.id), task);
  assert.ok(fs.existsSync(new URL(task.sourcePath, root)), `${task.id}: 설명 원문 존재`);
  const guide = read(task.sourcePath);
  assert.ok(guide.includes(`${task.api.method} ${task.api.path}`), `${task.id}: 안내 원문의 주 API`);
  assert.ok(guide.includes(task.target.path) && guide.includes(`${task.target.symbol}(...)`), `${task.id}: 안내 원문의 수정 범위`);
  assert.match(guide, /같은 프로젝트·서버·DB/);
  assert.match(guide, /기존 사용자 코드 위에 전체 덮어쓰지/);
  for (const check of task.completion) assert.ok(guide.includes(check.text), `${task.id}: 완료 기준과 원문 동기화`);
  assert.ok(guide.includes(task.request.exampleLabel), `${task.id}: 사용자 행동 안내 동기화`);
  const httpExample = /```http\n([\s\S]*?)\n```/.exec(guide);
  assert.ok(httpExample, `${task.id}: 복사할 HTTP 요청 예시`);
  const requestBody = httpExample[1].split('\n\n').slice(1).join('\n\n').trim();
  assert.deepEqual(requestBody ? JSON.parse(requestBody) : null, task.request.body, `${task.id}: Markdown과 실행 도구의 요청 본문 일치`);
  assert.doesNotMatch(JSON.stringify(task.request.body), /\[채점\]/, `${task.id}: 사용자 예시에 원문 채점용 제목을 노출하지 않음`);
  assert.equal(task.startingState.completedTasks.length, index);
  assert.deepEqual(task.startingState.pendingTasks, FUNCTIONAL_TASKS.slice(index).map(t => t.id));
  assert.equal(task.startingState.priorTask, FUNCTIONAL_TASKS[index - 1]?.id || null);
  assert.match(task.startingState.learnerWork, /메서드 본문 한 개/);
  assert.ok(task.startingState.provided.some(text => text.includes('Controller')));
  assert.ok(task.startingState.provided.some(text => text.includes('PostAccessPolicy')));
  assert.equal(task.packagePath, `scenario/flow/packages/${task.id}.zip`);
  assert.equal(task.files.length, 1, '이번 과제의 수정 파일 한 개');
  assert.deepEqual(task.files[0].methods, [task.target.symbol]);
  methodBody(task.target.path, task.target.symbol);
  for (const check of task.completion) {
    assert.equal(check.source.snapshot, '3-2');
    assert.ok(blob(check.source.path).includes(check.source.symbol), `${task.id}/${check.id}: 완료 기준의 정본 근거`);
  }
  for (const ref of [...task.concepts, ...task.legacy]) {
    assert.ok(fs.existsSync(new URL(ref.path, root)), `${ref.path}: 원문 보존 링크`);
    if (ref.anchor) {
      const htmlPath = ref.path.replace(/\.md$/, '.html');
      assert.ok(read(htmlPath).includes(`id="${ref.anchor}"`), `${ref.path}#${ref.anchor}: 실제 기존 앵커`);
    }
  }
  const vis = task.visualization;
  assert.match(vis.label, /예상.*미실행/);
  assert.match(vis.disclaimer, /개략.*측정한 로그가 아닙니다/);
  assert.ok(vis.states.some(s => s.id === vis.initialState));
  assert.equal(new Set(vis.states.map(s => s.id)).size, vis.states.length);
  for (const scene of vis.states) {
    for (const lane of ['code', 'object', 'context', 'sql', 'database', 'observer']) {
      assert.ok(scene[lane].length, `${task.id}/${scene.id}: ${lane} 장면 누락`);
    }
    if (scene.branch) assert.ok(vis.states.some(s => s.id === scene.branch));
    assert.doesNotMatch(JSON.stringify(scene), /id=42|id=23|전체 14|실측 완료|실제 SQL 로그/);
  }
}
assert.equal(getFunctionalTask('scenario/ch1-create-post/1-4-save-to-db.md'), undefined, '기존 원문을 최종 계약 화면으로 잘못 변환하지 않음');
assert.equal(getFunctionalTask(null), undefined);

// 주 API를 실제 Controller 매핑과 대조한다. 요청 실행의 query는 path와 분리한다.
assert.match(controller, /@RequestMapping\("\/api\/posts"\)/);
for (const [id, mapping, status] of [['create', 'PostMapping', 201], ['detail', 'GetMapping', 200], ['update', 'PatchMapping', 200], ['delete', 'DeleteMapping', 204]]) {
  assert.equal(byId[id].api.method.toLowerCase(), mapping.replace('Mapping', '').toLowerCase());
  assert.equal(byId[id].api.path, id === 'create' ? '/api/posts' : '/api/posts/{id}');
  assert.match(controller, new RegExp(`@${mapping}(?:\\("/\\{id\\}"\\))?`));
  assert.equal(byId[id].expected.status, status);
}
assert.match(controller, /ResponseEntity\.created\(URI\.create\("\/api\/posts\/" \+ post\.getId\(\)\)\)/);
assert.match(controller, /@ResponseStatus\(HttpStatus.NO_CONTENT\)/);
assert.match(boardController, /@RequestMapping\("\/api\/boards\/\{slug\}\/posts"\)/);
assert.equal(byId.list.api.path, '/api/boards/{slug}/posts');
assert.deepEqual(byId.list.request.query, { page: 0, size: 10 });
assert.match(boardController, /defaultValue = "0"\) @Min\(0\)/);
assert.match(boardController, /defaultValue = "10"\) @Min\(1\) @Max\(50\)/);

// 예시 문구는 학습용으로 재구성한다. 원문과는 키·타입·인증 계약을 비교한다.
function shape(value) {
  if (Array.isArray(value)) return { arrayOf: [...new Set(value.map(item => typeof item))].sort() };
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  return typeof value;
}
for (const task of [byId.create, byId.update]) {
  const requests = [...read(task.request.sourcePath).matchAll(/```check\n([\s\S]*?)\n```/g)].flatMap(match => JSON.parse(match[1]).requests || []);
  const reference = requests.find(request => request.id === task.request.sourceRequest);
  assert.ok(reference, `${task.id}: 참고 계약 요청은 실제 원문에 존재`);
  assert.match(task.request.sourceUsage, /계약 참고.*예시값 재구성/);
  assert.deepEqual(shape(task.request.body), shape(reference.body), `${task.id}: 입력 키와 타입 계약 유지`);
  assert.match(task.request.headers.Authorization, /^Bearer \S+$/);
  assert.equal(task.request.headers['Content-Type'], 'application/json');
}
const createDTO = blob(postFile('PostCreateRequest'));
const requiredStrings = [...createDTO.matchAll(/@NotBlank\([^)]*\)\s*(?:@Size\([^)]*\)\s*)?String (\w+)/g)].map(match => match[1]);
assert.ok(requiredStrings.length > 0);
for (const field of requiredStrings) assert.ok(typeof byId.create.request.body[field] === 'string' && byId.create.request.body[field].trim(), `${field}: 실제 DTO의 필수 문자열 제약`);
const titleMax = Number(/@Size\(max = (\d+), message = "[^"]*"\)\s+String title/.exec(createDTO)?.[1]);
const tagCountMax = Number(/@Size\(max = (\d+), message = "[^"]*"\)\s+List</.exec(createDTO)?.[1]);
const [, tagMin, tagMax] = /List<@NotNull @Size\(min = (\d+), max = (\d+)/.exec(createDTO);
assert.ok(byId.create.request.body.title.length <= titleMax);
assert.ok(byId.create.request.body.tags.length <= tagCountMax);
for (const tag of byId.create.request.body.tags) assert.ok(typeof tag === 'string' && tag.length >= Number(tagMin) && tag.length <= Number(tagMax));
assert.ok(['PUBLIC', 'FOLLOWERS'].includes(byId.create.request.body.visibility));
assert.ok(byId.update.request.body.title.trim() && byId.update.request.body.title.length <= titleMax);
assert.ok(!Object.hasOwn(byId.create.request.body, 'authorId'), '작성자를 본문으로 지정하지 않음');
assert.match(methodBody(postFile('PostController'), 'create'), /postService.create\(loginMember.id\(\), request\)/);
assert.equal(byId.create.request.headers.Authorization, byId.update.request.headers.Authorization, '같은 인증 작성자로 수정');
const createObject = byId.create.visualization.states.find(scene => scene.id === 'new-object').object;
assert.ok(createObject.includes(`title=${byId.create.request.body.title}`));
assert.ok(createObject.includes(`content=${byId.create.request.body.content}`));
const patchBefore = byId.update.visualization.states.find(scene => scene.id === 'patch-before').object;
const patchAfter = byId.update.visualization.states.find(scene => scene.id === 'patch-title').object;
assert.ok(patchBefore.includes(`title=${byId.create.request.body.title}`));
assert.ok(patchAfter.includes(`title=${byId.update.request.body.title}`));
for (const object of [patchBefore, patchAfter]) {
  assert.ok(object.includes(`content=${byId.create.request.body.content}`));
  assert.ok(object.includes(`tags=[${byId.create.request.body.tags.join(',')}]`));
}
assert.match(JSON.stringify(byId.create.visualization), /이름이 있으면 재사용하고 없으면 INSERT/);
assert.equal(byId.create.request.body.boardSlug, byId.list.request.pathParams.slug);
for (const task of [byId.detail, byId.update, byId.delete]) assert.equal(task.request.pathParams.id, '{capturedId}');
assert.equal(byId.detail.request.headers.Authorization, undefined);
assert.equal(byId.list.request.headers.Authorization, undefined);

// 응답 필드를 record 선언에서 읽어 표시 계약의 누락을 검사한다.
function recordFields(file) {
  const text = blob(postFile(file));
  if (!text.includes('public record')) {
    return [...text.matchAll(/private final [^;]+?\s+(\w+);/g)].map(m => m[1]);
  }
  const declaration = text.slice(text.indexOf('public record'), text.indexOf(') {', text.indexOf('public record')));
  return [...declaration.matchAll(/(?:String|Long|Integer|int|long|boolean|LocalDateTime|AuthorResponse|List<[^>]+>)\s+(\w+)/g)].map(m => m[1]);
}
function topLevel(fields) { return [...new Set(fields.map(field => field.split(/[.[]/)[0]))].sort(); }
assert.deepEqual(topLevel(byId.create.expected.fields), recordFields('PostResponse').sort());
assert.deepEqual(topLevel(byId.detail.expected.fields), recordFields('PostDetailResponse').sort());
assert.deepEqual(byId.update.expected.fields, byId.detail.expected.fields);
assert.deepEqual(topLevel(byId.list.expected.fields), recordFields('PostListResponse').sort());
assert.ok(!recordFields('PostListItemResponse').includes('content'));

// JPA 시점·가시성·카운터·PATCH 입력·soft delete를 정본 코드와 대조한다.
assert.match(entity, /@GeneratedValue\(strategy = GenerationType.IDENTITY\)/);
assert.doesNotMatch(entity, /@Version/);
assert.match(service, /@Transactional\s+public Post create/);
assert.match(queryService, /@Transactional\s+public PostDetailResponse getDetail/);
assert.match(queryService, /@Transactional\(readOnly = true\)\s+public PostListResponse list/);
const detail = methodBody(postFile('PostQueryService'), 'getDetail');
assert.ok(detail.indexOf('accessPolicy.canView') < detail.indexOf('increaseViewCount'));
assert.equal(methodBody(postFile('Post'), 'increaseViewCount').trim(), 'this.viewCount = this.viewCount + 1;');
const list = methodBody(postFile('PostQueryService'), 'list');
assert.ok(list.includes('findViewableByBoard') && list.includes('countViewableByBoard'));
assert.match(list, /Sort.Order.desc\("publishedAt"\), Sort.Order.desc\("id"\)/);
assert.doesNotMatch(list, /increaseViewCount|touchUpdatedAt|\.save\(/);
assert.match(repository, /p.deletedAt IS NULL/);
assert.match(repository, /p.status = 'PUBLISHED'/);
assert.match(repository, /MemberBlock/);
assert.match(repository, /JOIN FETCH p.author/);
assert.ok(policy.indexOf('post.getDeletedAt() != null') < policy.indexOf('switch (post.getStatus())'));
const patch = methodBody(postFile('PostService'), 'patch');
assert.ok(patch.indexOf('accessPolicy.canView') < patch.indexOf('post.getAuthor().getId().equals'));
for (const field of ['title', 'content', 'tags', 'visibility']) assert.match(patch, new RegExp(`if \\(request\\.${field}\\(\\) != null\\)`));
assert.match(patch, /post\.replaceTags\(resolveTags\(request\.tags\(\), now\)\)/);
assert.match(patch, /post.touchUpdatedAt\(now\)/);
assert.doesNotMatch(patch, /increaseViewCount|tagRepository\.delete/);
assert.deepEqual(byId.update.request.variants.map(v => v.body.tags), [undefined, null, [], undefined]);
assert.match(methodBody(postFile('Post'), 'replaceTags'), /this.tags.clear\(\)/);
assert.match(methodBody(postFile('PostService'), 'validateTags'), /tag == null \|\| tag.isBlank\(\)/);
const postCreateRequest = blob(postFile('PostCreateRequest'));
assert.match(postCreateRequest, /List<@NotNull @Size\(min = 1, max = 30/);
assert.doesNotMatch(postCreateRequest, /List<[^>]*@NotBlank/);
const deletion = methodBody(postFile('PostService'), 'delete');
assert.ok(deletion.indexOf('accessPolicy.canView') < deletion.indexOf('boolean isAuthor'));
assert.match(deletion, /!isAuthor && !isAdmin/);
assert.doesNotMatch(deletion, /Repository\.delete|\.deleteById/);
const softDelete = methodBody(postFile('Post'), 'delete');
assert.deepEqual([...softDelete.matchAll(/this\.(\w+)\s*=/g)].map(m => m[1]).sort(), ['deletedAt', 'updatedAt']);
assert.match(JSON.stringify(byId.create.visualization), /IDENTITY.*commit/);
assert.match(JSON.stringify(byId.detail.expected), /동시 GET/);
assert.ok(byId.delete.expected.unchanged.includes('post_tag'));
// 같은 stateId의 정적 설명과 순수 모델이 commit 전/후를 다르게 말하지 않게 한다.
const patchScenes = Object.fromEntries(byId.update.visualization.states.map(scene => [scene.id, scene]));
assert.deepEqual(Object.keys(patchScenes), ['patch-before', 'patch-title', 'patch-commit', 'patch-rollback']);
for (const id of ['patch-title']) {
  const model = getFunctionalVisualModel('update', id);
  assert.equal(model.transaction.phase, 'active');
  const row = model.after.database.post[0];
  assert.ok(patchScenes[id].database.includes(`title=${row.title} / updated_at=${row.updated_at}`), `${id}: flush 전 앱 DB에는 원래 post 값`);
  const observed = model.observer.database.post[0];
  assert.ok(patchScenes[id].observer.includes(`title=${observed.title} / updated_at=${observed.updated_at}`), `${id}: 외부 DB에는 미확정 변경이 보이지 않음`);
}
const committedPatch = getFunctionalVisualModel('update', 'patch-commit', { request: byId.update.request.body });
assert.equal(committedPatch.transaction.phase, 'commit');
assert.ok(patchScenes['patch-commit'].database.includes(`title=${committedPatch.after.database.post[0].title} / updated_at=${committedPatch.after.database.post[0].updated_at}`));
assert.equal(getFunctionalVisualModel('update', 'patch-commit').request.title, byId.update.request.body.title, '모델 기본 title과 실제 기본 요청 예시 일치');
assert.match(patchScenes['patch-rollback'].context.join(' '), /Java 객체.*자동 원복.*보장하지/);
assert.match(byId.update.expected.caveats.join(' '), /t1>t0.*설명.*항상.*보장하지/);
const createBody = methodBody(postFile('PostService'), 'create');
assert.ok(createBody.indexOf('resolveTags(') < createBody.indexOf('postRepository.save('), '태그 해석·저장은 정본에서 Post save보다 먼저');
const beforeDelete = getFunctionalVisualModel('delete', 'delete-before', { viewCount: 1 });
const deleteScenes = Object.fromEntries(byId.delete.visualization.states.map(scene => [scene.id, scene]));
assert.ok(deleteScenes['delete-before'].object.includes(`updatedAt=${beforeDelete.after.object.updatedAt}`), '앞 PATCH 뒤의 같은 글 수정 시각과 설명 모델 일치');
assert.ok(deleteScenes['delete-before'].database.some(line => line.includes(`updated_at=${beforeDelete.after.database.post[0].updated_at}`)));
console.log(`기능형 계약 검사 통과 · 5과제, ${checked.size}개 정본 blob, 실제 매핑·DTO·가시성·상태 변경 대조`);
