import fs from 'node:fs';
import {course} from './course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses} from './combined-course.mjs';
import {esc,range,route,homeMarkup} from './view.mjs';

const serviceCourse=loadServiceCourse();
const selectedCourse=combineCourses(course,serviceCourse);
const beginnerModules=selectedCourse.modules.filter(module=>module.source==='beginner');
const serviceModules=selectedCourse.modules.filter(module=>module.source==='service');

const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const css=read('./style.css');
const view=read('./view.mjs').replace(/^export /gm,'');
const request=read('./request.mjs').replace(/^export /gm,'');
const progress=read('./progress.mjs').replace(/^export /gm,'');
const app=read('./app.js');
const script=`(()=>{\n'use strict';\n${view}\n${request}\n${progress}\n${app}\n})();`.replace(/<\/script/gi,'<\\/script');
const data=JSON.stringify(selectedCourse).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const totalDays=selectedCourse.modules.flatMap(m=>m.days).length;
const courseTitle='입문 과정 · 서비스 만들기';
const courseLabel='JAVA WORKSHOP · 통합 과정';
const headerTag='JAVA 21 · SPRING';
const description='팀원 입문 과정과 서비스 만들기 실무 과정을 한 목록에서 이어 학습합니다.';
const moduleNavigation=[`<div class="nav-group-label">입문 과정 · 팀원</div>${beginnerModules.map(m=>`<a class="module-link" data-module="${m.id}" href="${route(m)}"><span class="nav-num">${m.number}</span><span class="nav-title">${esc(m.title)}</span><span class="nav-complete"></span></a>`).join('')}`,...[...new Set(serviceModules.map(m=>m.group))].map(group=>`<div class="nav-group-label">이어서: 실무 · ${esc(group)}</div>${serviceModules.filter(m=>m.group===group).map(m=>`<a class="module-link service-module-link" data-module="${m.id}" href="${route(m)}"><span class="nav-num">${m.number}</span><span class="nav-title">${esc(m.title)}</span><span class="nav-complete"></span></a>`).join('')}`)].join('');
const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="description" content="${esc(description)}"><title>${esc(courseTitle)} · ${totalDays}회차</title><style>${css}</style></head>
<body data-course="combined"><a href="#main" class="skip">본문으로 건너뛰기</a><header class="site-header"><a href="#overview" class="brand" aria-label="Java Workshop 전체 과정"><span class="brand-mark" aria-hidden="true">Jw</span><span class="brand-name">JAVA WORKSHOP<small>FROM FIRST REQUEST TO REAL WORK</small></span></a><span class="header-middle">${esc(courseLabel)}</span><div class="header-right"><span class="header-tag">${headerTag}</span><span id="header-status">${totalDays}회차 과정</span><a href="#setup">실행 가이드 ↗</a><a id="course-switch" href="#group=service" class="course-switch">실무 묶음으로 이동</a></div></header>
<div class="app-layout"><aside class="sidebar" aria-label="커리큘럼 탐색"><label class="search-box"><span aria-hidden="true">⌕</span><input id="course-search" aria-label="기능 또는 개념 검색" placeholder="기능·개념 검색" autocomplete="off"><kbd>/</kbd></label><div id="search-results" class="search-results" role="region" aria-label="검색 결과" hidden></div><a id="nav-overview" class="nav-home active" href="#overview"><span aria-hidden="true">▦</span> 전체 커리큘럼</a><div class="nav-label">입문 12개 기능 · 이어서 실무 94개</div><nav class="module-nav" aria-label="기능별 과정">${moduleNavigation}</nav><div class="side-progress"><div class="side-progress-top"><span>나의 학습 진도</span><strong id="progress-count">0 / ${totalDays}</strong></div><div class="progress-bar"><i id="progress-fill" style="width:0%"></i></div><p>직접 확인하고 표시한 회차만 기록합니다.</p></div><a class="side-setup" href="#setup">준비물과 API 실행 방법 ↗</a></aside>
<main class="main" id="main"><div id="content">${homeMarkup(selectedCourse)}</div><footer class="site-footer"><strong>JAVA WORKSHOP · ${esc(courseTitle)}</strong><span>기획 → 구현 → 요청 → 데이터 확인 · ${esc(selectedCourse.version)}</span></footer></main></div><div id="toast" class="toast" role="status" hidden></div><noscript><div class="notice">회차별 기획서·검색·API 도구를 사용하려면 브라우저에서 JavaScript를 켜세요.</div></noscript><script type="application/json" id="course-data">${data}</script><script>${script}</script></body></html>`;
new Function(script); // Build fails on invalid browser JavaScript.
fs.writeFileSync(new URL('../java-beginner.html',import.meta.url),html,'utf8');
const redirect='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>서비스 만들기 · 통합 과정</title><p><a href="java-beginner.html#group=service">통합된 서비스 만들기 과정 열기 ↗</a></p><script>location.replace("java-beginner.html"+(location.hash||"#group=service"));</script></html>';
fs.writeFileSync(new URL('../java-service.html',import.meta.url),redirect,'utf8');
process.stdout.write(`새 독립 통합 HTML 생성: java-beginner.html · ${selectedCourse.modules.length}개 기능 · ${totalDays}회차\n`);
