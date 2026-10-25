import { homedir, tmpdir } from 'node:os';
import path from 'node:path';

const recordedTmpRoot = process.platform === 'darwin' ? path.join(path.parse(homedir()).root, 'tmp') : tmpdir();

// 기록의 placeholder만 현재 환경 경로로 해석한다. 파일 유무·해시 검사는 호출자가 유지한다.
export function resolveEvidencePath(value) {
  if (typeof value !== 'string') return value;
  if (value === 'LOCAL_HOME') return homedir();
  if (value.startsWith('LOCAL_HOME/')) return path.join(homedir(), value.slice('LOCAL_HOME/'.length));
  if (value === 'LOCAL_TMP') return recordedTmpRoot;
  if (value.startsWith('LOCAL_TMP/')) return path.join(recordedTmpRoot, value.slice('LOCAL_TMP/'.length));
  return value;
}
