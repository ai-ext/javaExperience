import { initFunctionalReferenceContext } from './functional-reference-context.mjs';

// defer script로 연결된다. home의 진도 gate는 이 entry 실행 여부에 의존하지 않는다.
if (typeof document !== 'undefined') initFunctionalReferenceContext(document, window);
