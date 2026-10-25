import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export function loadPlaywright() {
  try { return require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
  catch { throw new Error('Playwright를 찾지 못했습니다. 기존 playwright 패키지를 node_modules에서 제공하거나 PLAYWRIGHT_MODULE 환경 변수로 모듈 위치를 지정하세요.'); }
}
