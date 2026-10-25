import { mountCourseApiTools } from './course-api-client.mjs';
import { mountCoursePostVisual } from './course-post-client.mjs';

function mountCourseLearningTools() {
  mountCourseApiTools(document);
  mountCoursePostVisual(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCourseLearningTools, { once: true });
} else {
  mountCourseLearningTools();
}
