import fs from 'node:fs';
import {course} from './course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {esc,range,route,homeMarkup} from './view.mjs';

const serviceMode=process.argv.includes('--service');
const selectedCourse=serviceMode?loadServiceCourse():course;

const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const css=read('./style.css');
const view=read('./view.mjs').replace(/^export /gm,'');
const request=read('./request.mjs').replace(/^export /gm,'');
const progress=read('./progress.mjs').replace(/^export /gm,'');
const app=read('./app.js');
const script=`(()=>{\n'use strict';\n${view}\n${request}\n${progress}\n${app}\n})();`.replace(/<\/script/gi,'<\\/script');
const data=JSON.stringify(selectedCourse).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const output=serviceMode?'../java-service.html':'../java-beginner.html';
const totalDays=selectedCourse.modules.flatMap(m=>m.days).length;
const courseTitle=serviceMode?'서비스 만들기 · 실무 과정':'처음 만드는 Java 실무';
const courseLabel=serviceMode?'SERVICE BUILD · 실무 과정':'처음 만드는 Java 실무';
const headerTag=serviceMode?'JAVA · SPRING':'JAVA 21 · SPRING';
const description=serviceMode?'94개 기능의 요구사항과 API 계약을 단계별로 구현하고 확인합니다.':'Java 입문자를 위한 60회차 실무 기능 커리큘럼.';
const moduleNavigation=serviceMode?[...new Set(selectedCourse.modules.map(m=>m.group))].map(group=>`<div class="nav-group-label">${esc(group)}</div>${selectedCourse.modules.filter(m=>m.group===group).map(m=>`<a class="module-link" data-module="${m.id}" href="${route(m)}"><span class="nav-num">${m.number}</span><span class="nav-title">${esc(m.title)}</span><span class="nav-complete"></span></a>`).join('')}`).join(''):selectedCourse.modules.map(m=>`<a class="module-link" data-module="${m.id}" href="${route(m)}"><span class="nav-num">${m.number}</span><span class="nav-title">${esc(m.title)}</span><span class="nav-complete"></span></a>`).join('');
const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="description" content="${esc(description)}"><title>${esc(courseTitle)} · ${totalDays}회차</title><style>${css}</style></head>
<body><a href="#main" class="skip">본문으로 건너뛰기</a><header class="site-header"><a href="#overview" class="brand" aria-label="Java Workshop 전체 과정"><span class="brand-mark" aria-hidden="true">Jw</span><span class="brand-name">JAVA WORKSHOP<small>FROM FIRST REQUEST TO REAL WORK</small></span></a><span class="header-middle">${esc(courseLabel)}</span><div class="header-right"><span class="header-tag">${headerTag}</span><span id="header-status">${totalDays}회차 과정</span><a href="#setup">실행 가이드 ↗</a><a href="${serviceMode?'java-beginner.html':'java-service.html'}" class="course-switch">${serviceMode?'입문 과정':'실무 과정'} ↗</a></div></header>
<div class="app-layout"><aside class="sidebar" aria-label="커리큘럼 탐색"><label class="search-box"><span aria-hidden="true">⌕</span><input id="course-search" aria-label="기능 또는 개념 검색" placeholder="기능·개념 검색" autocomplete="off"><kbd>/</kbd></label><div id="search-results" class="search-results" role="region" aria-label="검색 결과" hidden></div><a id="nav-overview" class="nav-home active" href="#overview"><span aria-hidden="true">▦</span> 전체 커리큘럼</a><div class="nav-label">${serviceMode?'실무 기능':'BUILD BY FEATURE'}</div><nav class="module-nav" aria-label="기능별 과정">${moduleNavigation}</nav><div class="side-progress"><div class="side-progress-top"><span>나의 학습 진도</span><strong id="progress-count">0 / ${totalDays}</strong></div><div class="progress-bar"><i id="progress-fill" style="width:0%"></i></div><p>직접 확인하고 표시한 회차만 기록합니다.</p></div><a class="side-setup" href="#setup">준비물과 API 실행 방법 ↗</a></aside>
<main class="main" id="main"><div id="content">${homeMarkup(selectedCourse)}</div><footer class="site-footer"><strong>JAVA WORKSHOP · ${esc(courseTitle)}</strong><span>기획 → 구현 → 요청 → 데이터 확인 · ${esc(selectedCourse.version)}</span></footer></main></div><div id="toast" class="toast" role="status" hidden></div><noscript><div class="notice">회차별 기획서·검색·API 도구를 사용하려면 브라우저에서 JavaScript를 켜세요.</div></noscript><script type="application/json" id="course-data">${data}</script><script>${script}</script></body></html>`;
new Function(script); // Build fails on invalid browser JavaScript.
fs.writeFileSync(new URL(output,import.meta.url),html,'utf8');
process.stdout.write(`새 독립 HTML 생성: ${serviceMode?'java-service.html':'java-beginner.html'} · ${selectedCourse.modules.length}개 기능 · ${totalDays}회차 · ${Math.round(Buffer.byteLength(html)/1024)} KiB\n`);
