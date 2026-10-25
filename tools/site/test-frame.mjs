import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderInitialPage } from './initial-render.mjs';
import { courseDestinations, renderSectionNavigation } from './site-navigation.mjs';
test('모든 과정 하위 페이지는 같은 영역 메뉴와 올바른 상대 링크를 갖는다',()=>{
 const root=new URL('../../',import.meta.url);
 let count=0;
 const visit=dir=>{
  for(const entry of fs.readdirSync(new URL(dir,root),{withFileTypes:true})){
   const name=`${dir}/${entry.name}`;
   if(entry.isDirectory()){if(name!=='course/days')visit(name);continue;}
   if(!entry.name.endsWith('.md'))continue;
   const dom=new JSDOM(renderSectionNavigation(name),{url:`https://learn.example/${name.replace(/\.md$/,'.html')}`});
   const links=[...dom.window.document.querySelectorAll('nav a')];
   assert.deepEqual(links.map(e=>e.textContent),courseDestinations.map(e=>e.label),name);
   assert.deepEqual(links.map(e=>new URL(e.href).pathname.slice(1)),courseDestinations.map(e=>e.target),name);
   const html=fs.readFileSync(new URL(name.replace(/\.md$/,'.html'),root),'utf8');
   assert.ok(html.includes('class="site-frame"'),name);
   assert.ok(html.includes(renderSectionNavigation(name)),`${name}: 생성된 영역 메뉴`);
   dom.window.close();count++;
  }
 };
 visit('course');assert.ok(count>100);
});
test('JS 전에도 공통 틀과 기본 내용이 있으며 런타임이 새 틀을 중복 생성하지 않는다',()=>{
 const html=renderInitialPage('<!doctype html><html><head></head><body><main><h1>출발</h1><h2 id="one">첫 내용</h2><p>원문 하나</p><h2 id="two">다음 내용</h2><p>원문 둘</p></main></body></html>','course/start/README.md');
 const dom=new JSDOM(html,{url:'https://learn.example/course/start/README.html',runScripts:'outside-only'});
 const {window:win}=dom,doc=win.document;win.scrollTo=()=>{};
 assert.equal(doc.querySelectorAll('.site-frame').length,1);
 assert.ok(doc.querySelector('.site-frame-sidebar .section-switcher'));
 assert.ok(doc.querySelector('.site-frame-content h1'));
 assert.ok(doc.head.textContent.includes('javaexperience.course.config-format.v1'));
 win.eval(fs.readFileSync(new URL('section-switcher.js',import.meta.url),'utf8'));doc.dispatchEvent(new win.Event('DOMContentLoaded'));
 assert.equal(doc.querySelectorAll('.page-navigation-layout').length,1);
 doc.querySelector('[data-section-target="two"]').click();
 assert.equal(doc.querySelector('#one').closest('[data-section-panel]').hidden,true);
 assert.equal(doc.querySelector('#two').closest('[data-section-panel]').hidden,false);
 win.close();
});
