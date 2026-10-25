import classification from '../../docs/design/concept-curriculum-2026-10-25/classification.json' with { type: 'json' };

export const DOMAINS = [
  { id: 'java', label: 'Java' },
  { id: 'spring', label: 'Spring · Boot' },
  { id: 'request', label: 'HTTP · API' },
  { id: 'data', label: 'DB · JPA' },
  { id: 'testing', label: '테스트' },
  { id: 'delivery', label: '개발 · 운영' },
];

const unit = (id, title, primarySourceId, sources, prerequisites, why) => ({
  id, title, why, primarySourceId, sources, prerequisites,
  priority: 'required', depth: 'foundation',
  href: `../../lessons/concept-core.html?unit=${id}`,
});

export const CORE_UNITS = [
  unit('C01', '객체·생성자', 'P09', ['P09', 'P04'], [], '객체의 상태와 생성을 Java 코드로 먼저 익힙니다.'),
  unit('C02', 'Spring과 Boot·앱 시작', 'P01', ['P01'], ['C01'], 'Spring과 Boot의 역할을 알고 애플리케이션 시작점을 읽습니다.'),
  unit('C03', '애노테이션은 누가 언제 읽나', 'P03', ['P03', 'P27', 'J06'], ['C01', 'C02'], '애노테이션 선언이 실제 동작으로 이어지는 시점을 구분합니다.'),
  unit('C04', 'IoC·DI·생성자 주입', 'P12', ['P12', 'P11'], ['C01', 'C02', 'C03'], '컨테이너가 객체와 의존 관계를 관리하는 방식을 연결합니다.'),
  unit('C05', 'Lombok 생성 코드', 'W19', ['W19', 'P11'], ['C01', 'C03'], 'Lombok 애노테이션이 만드는 생성 코드를 원본 Java와 연결합니다.'),
  unit('C06', 'Bean 생명주기', 'S01', ['S01'], ['C04'], 'Bean의 생성부터 초기화와 종료까지 컨테이너 관리 흐름을 살펴봅니다.'),
];

const documentById = new Map(classification.documents.map(document => [document.id, document]));
const validPriorities = new Set(['required', 'optional']);
const validDepths = new Set(['foundation', 'applied', 'advanced']);
const isSha256 = value => /^[a-f0-9]{64}$/.test(value);

export function classifyConcept(id) {
  const document = documentById.get(id);
  if (!document) throw new Error(`분류에서 찾을 수 없는 문서 ID입니다: ${id}`);
  return document;
}

export async function validateCurriculum(documents, { root, units = CORE_UNITS } = {}) {
  if (!root) throw new Error('README와 원문을 확인할 저장소 root가 필요합니다.');
  if (!Array.isArray(documents)) throw new Error('개념 documents는 배열이어야 합니다.');

  // 저장소 파일을 확인하는 코드는 이 검증 함수 안에서만 동적으로 불러온다.
  const [{ readFileSync }, { join, resolve }, { createHash }] = await Promise.all([
    import('node:fs'), import('node:path'), import('node:crypto'),
  ]);
  {
    const classificationIds = new Set();
    for (const document of classification.documents) {
      if (classificationIds.has(document.id)) throw new Error(`분류 문서 ID가 중복되었습니다: ${document.id}`);
      classificationIds.add(document.id);
    }
    if (classificationIds.size !== 134) throw new Error(`분류 문서가 134개가 아닙니다: ${classificationIds.size}`);
    const readme = readFileSync(join(root, 'docs/knowledge/README.md'), 'utf8');
    const readmeDocuments = [];
    for (const line of readme.split(/\r?\n/)) {
      const row = line.match(/^\s*\|\s*\[([^\]]+)\]\(([^)]+\.md)\)\s*\|/);
      if (!row) continue;
      const [, title, filename] = row;
      const id = title.match(/^([A-Z]\d{2})\./)?.[1];
      if (!id || !filename.startsWith(`${id}-`)) throw new Error(`README 문서 ID와 경로가 다릅니다: ${filename}`);
      readmeDocuments.push({ id, title, sourcePath: `docs/knowledge/${filename}` });
    }
    if (readmeDocuments.length !== 134) throw new Error(`README 개념 문서가 134개가 아닙니다: ${readmeDocuments.length}`);

    const documentIds = new Set();
    for (const document of documents) {
      if (documentIds.has(document.id)) throw new Error(`개념 문서 ID가 중복되었습니다: ${document.id}`);
      documentIds.add(document.id);
    }
    if (documents.length !== 134 || documents.length !== readmeDocuments.length) {
      throw new Error(`README와 같은 134개 개념 문서가 필요합니다: ${documents.length}`);
    }

    const suppliedById = new Map(documents.map(document => [document.id, document]));
    const readmeById = new Map(readmeDocuments.map(document => [document.id, document]));
    if (documentIds.size !== readmeById.size) throw new Error('README 문서 ID와 개념 문서 ID가 일치하지 않습니다.');

    for (const [id, expected] of readmeById) {
      const document = suppliedById.get(id);
      const classified = documentById.get(id);
      if (!document || !classified) throw new Error(`README 또는 분류에 없는 문서 ID입니다: ${id}`);
      if (document.title !== expected.title || document.sourcePath !== expected.sourcePath) {
        throw new Error(`README의 제목·ID·sourcePath와 다릅니다: ${id}`);
      }
      if (classified.sourcePath !== expected.sourcePath) throw new Error(`classification.json sourcePath가 README 경로와 다릅니다: ${id}`);
      if (!DOMAINS.some(domain => domain.id === classified.domain)) throw new Error(`잘못된 도메인 값입니다: ${id}`);
      if (!validPriorities.has(classified.priority)) throw new Error(`잘못된 필수성 값입니다: ${id}`);
      if (!Array.isArray(classified.depths) || classified.depths.length === 0 || classified.depths.some(depth => !validDepths.has(depth))) {
        throw new Error(`잘못된 깊이 값입니다: ${id}`);
      }
      if (classified.classificationBasis !== '기본 API 입문 경로와 문서 제목·소제목을 기준으로 한 탐색 분류; 내용·실행 검증과 별개') {
        throw new Error(`분류 근거 문구가 다릅니다: ${id}`);
      }
      if (classified.contentReview !== 'not_reassessed' || classified.execution !== 'see_example_evidence') {
        throw new Error(`원문 검토 또는 실행 증거 상태가 승격되었습니다: ${id}`);
      }
      if (!isSha256(classified.sourceSHA256)) throw new Error(`잘못된 SHA-256 형식입니다: ${id}`);
      const source = readFileSync(resolve(root, expected.sourcePath));
      const actualSha = createHash('sha256').update(source).digest('hex');
      if (actualSha !== classified.sourceSHA256) throw new Error(`원문 SHA-256이 분류 기록과 다릅니다: ${id}`);
      for (const field of ['domain', 'priority', 'depths', 'sourceSHA256']) {
        if (document[field] !== undefined && JSON.stringify(document[field]) !== JSON.stringify(classified[field])) {
          throw new Error(`문서 분류 메타데이터가 classification.json과 다릅니다: ${id} ${field}`);
        }
      }
    }

    const unitIds = new Set();
    for (const item of units) {
      if (!item.id || unitIds.has(item.id)) throw new Error(`단위 ID가 비었거나 중복되었습니다: ${item.id}`);
      unitIds.add(item.id);
      if (!validPriorities.has(item.priority)) throw new Error(`잘못된 단위 필수성 값입니다: ${item.id}`);
      if (!validDepths.has(item.depth)) throw new Error(`잘못된 단위 깊이 값입니다: ${item.id}`);
      for (const sourceId of [item.primarySourceId, ...(item.sources || [])]) {
        if (!documentById.has(sourceId)) throw new Error(`존재하지 않는 sourceId입니다: ${sourceId}`);
      }
    }
    for (const item of units) {
      for (const prerequisite of item.prerequisites || []) {
        if (!unitIds.has(prerequisite)) throw new Error(`없는 선수 단위입니다: ${prerequisite}`);
      }
    }
    const visiting = new Set(), visited = new Set();
    const byUnitId = new Map(units.map(item => [item.id, item]));
    const visit = id => {
      if (visiting.has(id)) throw new Error(`선수 관계 순환이 있습니다: ${id}`);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const prerequisite of byUnitId.get(id).prerequisites || []) visit(prerequisite);
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of unitIds) visit(id);

    return documents.map(document => ({ ...document, ...documentById.get(document.id) }));
  }
}
