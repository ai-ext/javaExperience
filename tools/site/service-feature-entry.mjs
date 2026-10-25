import { mountServiceFeaturePages } from './service-feature-pages.mjs';
import { mountServiceRequestTools } from './service-request-client.mjs';

function mountServiceLearning() {
  // 인라인 초기 렌더링과 캐시 번들이 함께 있어도 이벤트·요청 도구는 한 번만 연결한다.
  if (document.documentElement.dataset.serviceLearningReady) return;
  document.documentElement.dataset.serviceLearningReady = 'true';
  mountServiceFeaturePages(document);
  mountServiceRequestTools(document);
}

// body 끝의 인라인 번들은 DOM이 완성돼 있으므로 DCL보다 먼저 URL 선택을 인계한다.
if (document.currentScript?.hasAttribute('data-service-initial')) {
  mountServiceLearning();
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountServiceLearning, { once: true });
} else {
  mountServiceLearning();
}
