// 기능 화면에서 쓰는 시작 패키지 출처와 코드. 학생 src는 읽거나 수정하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packagesDir = path.join(root, 'scenario/flow/packages');
const serviceNames = new Set(['PostService.java', 'PostQueryService.java']);

export function loadFunctionalPackageManifest() {
  return JSON.parse(fs.readFileSync(path.join(packagesDir, 'manifest.json'), 'utf8'));
}

export function readFunctionalCodeFile(filePath, { taskId = 'reference' } = {}) {
  if (typeof filePath !== 'string' || path.posix.isAbsolute(filePath)
      || filePath.split('/').includes('..') || filePath.includes('\\')) {
    throw new Error('안전한 snapshot 파일 경로가 필요합니다.');
  }
  const manifest = loadFunctionalPackageManifest();
  if (!manifest.packages.some(item => item.taskId === taskId)) {
    throw new Error(`알 수 없는 기능 패키지: ${taskId}`);
  }
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, manifest.sourceSnapshot.path), 'utf8'));
  const file = snapshot.files.find(item => item.path === filePath);
  if (!file || !/^[a-f0-9]{40}$/.test(file.blob)) throw new Error(`snapshot에 없는 파일: ${filePath}`);
  if (filePath.startsWith('src/main/java/org/example/post/') && serviceNames.has(path.posix.basename(filePath))) {
    return fs.readFileSync(path.join(packagesDir, 'code', taskId, path.posix.basename(filePath)), 'utf8');
  }
  return fs.readFileSync(path.join(root, 'scenario/snapshots/blobs', `${file.blob}.txt`), 'utf8');
}
