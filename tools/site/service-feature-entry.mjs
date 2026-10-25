import { mountServiceFeaturePages } from './service-feature-pages.mjs';
import { mountServiceRequestTools } from './service-request-client.mjs';

function mountServiceLearning() {
  mountServiceFeaturePages(document);
  mountServiceRequestTools(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountServiceLearning, { once: true });
} else {
  mountServiceLearning();
}
