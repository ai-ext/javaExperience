#!/usr/bin/env python3
"""전수 검증 원장을 검색 가능한 독립 HTML 진행판으로 렌더링한다."""

from __future__ import annotations

import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"


def rows(name: str) -> list[dict]:
    return [json.loads(line) for line in (DESIGN / name).read_text().splitlines() if line.strip()]


pages = rows("verification-page-ledger.jsonl")
images = rows("verification-image-ledger.jsonl")
suite_file = max(DESIGN.glob("site-test-suite-*.json"), default=DESIGN / "site-test-suite-2026-10-16.json")
test_count = len(json.loads(suite_file.read_text()))
page_data = [{
    "path": row["page"], "title": row["title"], "kind": row["kind"],
    "coverage": row["coverage"], "images": row["parityRecordCount"],
    "tests": row["relatedStaticTests"], "structure": row["htmlStructureGate"],
    "desktop": row["desktopGate"], "mobile": row["mobile360Gate"],
    "next": row["agentNext"], "user": row["userReviewQuestion"],
} for row in pages]
image_data = [{
    "id": row["id"], "path": row["page"], "mockup": row["mockup"],
    "implementation": row["implementationState"],
    "desktop": row["desktopGate"], "mobile": row["mobileGate"],
    "sameViewport": row["sameDesktopViewport"], "mobile360": row["mobile360"],
} for row in images]
data = json.dumps({"pages": page_data, "images": image_data}, ensure_ascii=False).replace("</", "<\\/")
html = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>javaExperience · 전수 검증 진행판</title>
<style>
:root{{--ink:#0b1930;--muted:#52657c;--blue:#175fd8;--line:#dce5f1;--bg:#f3f6fa;--card:#fff;--navy:#101f34;--gold:#9a641e;--red:#ac394a}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}}button,input,select{{font:inherit}}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{{outline:3px solid #e8a847;outline-offset:2px}}
header{{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:16px clamp(18px,4vw,64px);background:var(--navy);color:#fff}}header strong{{font-size:1.15rem;letter-spacing:-.035em}}header span{{color:#a8c7ed;font-size:.8rem}}
main{{max-width:1540px;margin:auto;padding:clamp(18px,3vw,40px)}}.eyebrow{{color:var(--blue);font-size:.78rem;font-weight:850;letter-spacing:.12em}}h1{{max-width:24ch;margin:.45rem 0 .7rem;font-size:clamp(2rem,4.5vw,4rem);line-height:1.1;letter-spacing:-.06em}}.lead{{max-width:78ch;color:var(--muted);line-height:1.7}}.metrics{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:25px 0}}.metric{{min-width:0;padding:18px;border:1px solid var(--line);border-radius:11px;background:#fff;box-shadow:0 8px 22px #1936550d}}.metric small{{display:block;color:var(--muted);font-size:.76rem}}.metric strong{{display:block;margin-top:.35rem;font-size:clamp(1.35rem,2.5vw,2.3rem);letter-spacing:-.06em}}.metric.is-alert strong{{color:var(--red)}}.notice{{padding:16px 20px;border-left:4px solid #d99631;border-radius:0 9px 9px 0;background:#fff8eb;color:#66512f;line-height:1.65}}.notice strong{{color:#865212}}
.tabs{{display:flex;gap:.5rem;margin:28px 0 13px}}.tabs button{{min-height:43px;padding:.6rem 1rem;border:1px solid #bed3ec;border-radius:7px;background:#fff;color:#285a91;font-weight:800;cursor:pointer}}.tabs button[aria-pressed=true]{{border-color:#185fc8;background:#e8f2ff;color:#1159b2}}.bar{{display:flex;flex-wrap:wrap;gap:.6rem;padding:13px;border:1px solid var(--line);border-radius:9px;background:#fff}}.bar input{{flex:1;min-width:min(100%,250px);padding:.65rem .8rem;border:1px solid #bfd0e1;border-radius:7px}}.bar select{{min-width:150px;padding:.6rem;border:1px solid #bfd0e1;border-radius:7px;background:#fff}}.count{{margin:12px 2px;color:var(--muted);font-size:.8rem}}
.table-wrap{{overflow:auto;border:1px solid var(--line);border-radius:9px;background:#fff}}table{{width:100%;border-collapse:collapse;min-width:850px}}th,td{{padding:11px 13px;border-bottom:1px solid #e5ebf3;text-align:left;vertical-align:top;font-size:.78rem}}th{{position:sticky;top:0;background:#eaf1f9;color:#2c537d;font-size:.73rem;white-space:nowrap}}tr:last-child td{{border-bottom:0}}td.path{{max-width:420px;overflow-wrap:anywhere}}td.path strong{{display:block;color:#163f70}}td.path small{{display:block;color:#7890a9}}.pill{{display:inline-block;padding:.22rem .5rem;border-radius:5px;background:#eff4fa;color:#446884;font-size:.71rem;font-weight:800;white-space:nowrap}}.pill.partial{{background:#e6f2ff;color:#155ca9}}.pill.stale{{background:#fff2db;color:#875819}}.pill.missing{{background:#f8e9ec;color:#9b4050}}.pill.ok{{background:#e9f7ef;color:#277354}}details.row-detail{{padding:5px 0}}details.row-detail summary{{color:#185ea9;font-weight:800;cursor:pointer}}details.row-detail p{{max-width:56ch;margin:.55rem 0;color:#526d88;line-height:1.55}}.copy{{margin-left:.5rem;padding:.18rem .45rem;border:1px solid #c5d7e8;border-radius:5px;background:#fff;color:#205d9f;font-size:.68rem;cursor:pointer}}footer{{padding:35px 0;color:#637b93;font-size:.8rem;line-height:1.7}}[hidden]{{display:none!important}}
@media(max-width:800px){{.metrics{{grid-template-columns:repeat(2,minmax(0,1fr))}}header{{align-items:flex-start;flex-direction:column}}h1{{font-size:2.4rem}}}}@media(max-width:420px){{main{{padding:16px}}.metrics{{grid-template-columns:1fr 1fr}}.metric{{padding:12px}}.metric strong{{font-size:1.5rem}}.bar select{{flex:1}}}}
</style></head><body><header><strong>javaExperience</strong><span>전수 검증 진행판 · 현재 작업 트리</span></header><main><p class="eyebrow">VERIFY / SOURCE · HTML · DESKTOP · 360PX · USER</p><h1>빌드와 화면 검증을 따로 봅니다</h1><p class="lead">각 페이지·시안을 한 줄씩 기록합니다. 정적 검사 통과는 실행·모바일·시안 일치나 학습자 이해의 증거가 아닙니다.</p>
<div class="metrics"><div class="metric"><small>전체 HTML</small><strong>{len(pages)}</strong></div><div class="metric"><small>부분 적용</small><strong>{sum(x['coverage']=='partial' for x in page_data)}</strong></div><div class="metric"><small>미분할 페이지</small><strong>{sum(x['coverage']=='unscoped' for x in page_data)}</strong></div><div class="metric"><small>시안별 기록</small><strong>{len(images)}</strong></div><div class="metric is-alert"><small>현재 화면 전체 검증</small><strong>0</strong></div></div>
<div class="notice"><strong>현재 확인된 한계</strong> 기존 데스크톱·360px 캡처 47쌍은 모두 최신 HTML 이전 자료입니다. 사이트 정적 검사 {test_count}개와 HTML 구조 감사는 통과했지만 현재 렌더 캡처와 브라우저 조작은 대기 중입니다.</div>
<div class="tabs" role="group" aria-label="목록 종류"><button type="button" data-view="pages" aria-pressed="true">페이지 339</button><button type="button" data-view="images" aria-pressed="false">시안 420</button></div>
<section id="pages-panel" aria-label="페이지별 진행"><div class="bar"><input id="page-search" type="search" placeholder="제목·경로 검색" aria-label="페이지 제목 또는 경로 검색"><select id="page-kind" aria-label="페이지 종류"><option value="">모든 종류</option><option value="scenario">시나리오</option><option value="knowledge">공부자료</option><option value="db-query-journey">DB 시나리오</option><option value="lab">랩</option><option value="lesson">레슨</option><option value="ticket">티켓</option></select><select id="page-coverage" aria-label="적용 상태"><option value="">전체 상태</option><option value="partial">부분 적용</option><option value="unscoped">미분할</option></select></div><p class="count" id="page-count"></p><div class="table-wrap"><table><thead><tr><th>페이지</th><th>종류</th><th>HTML 적용</th><th>관련 검사</th><th>구조</th><th>현재 데스크톱</th><th>현재 360px</th><th>다음 확인</th></tr></thead><tbody id="page-rows"></tbody></table></div></section>
<section id="images-panel" aria-label="시안별 진행" hidden><div class="bar"><input id="image-search" type="search" placeholder="시안 ID·경로 검색" aria-label="시안 ID 또는 경로 검색"><select id="image-capture" aria-label="캡처 상태"><option value="">모든 캡처</option><option value="missing">캡처 없음</option><option value="stale">이전 캡처</option></select></div><p class="count" id="image-count"></p><div class="table-wrap"><table><thead><tr><th>시안 ID</th><th>대상 페이지</th><th>HTML</th><th>데스크톱</th><th>360px</th><th>시안 파일</th></tr></thead><tbody id="image-rows"></tbody></table></div></section>
<footer>사용자에게 검토받을 것은 화면의 이해 용이성·깊이·정교함·학습 순서입니다. 에이전트가 현재 화면을 촬영하고 조작·기술 계약을 먼저 확인한 뒤 캡처와 함께 묻습니다.</footer></main>
<script id="ledger" type="application/json">{data}</script><script>
const ledger=JSON.parse(document.getElementById('ledger').textContent);
const h=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pill=(v,kind='')=>'<span class="pill '+kind+'">'+h(v)+'</span>';
function renderPages(){{const q=document.getElementById('page-search').value.toLowerCase(),kind=document.getElementById('page-kind').value,cov=document.getElementById('page-coverage').value;const filtered=ledger.pages.filter(x=>(!q||(x.path+' '+x.title).toLowerCase().includes(q))&&(!kind||x.kind===kind)&&(!cov||x.coverage===cov));document.getElementById('page-count').textContent=filtered.length+' / '+ledger.pages.length+'쪽';document.getElementById('page-rows').innerHTML=filtered.map(x=>'<tr><td class="path"><strong>'+h(x.title)+'</strong><small>'+h(x.path)+'</small><button class="copy" type="button" data-copy="'+h(x.path)+'">경로 복사</button></td><td>'+h(x.kind)+'</td><td>'+pill(x.coverage==='partial'?'부분 적용':'미분할',x.coverage)+'</td><td>'+h(x.tests.length)+'개 · 원문 참조</td><td>'+pill(x.structure==='passed'?'통과':'대기',x.structure==='passed'?'ok':'missing')+'</td><td>'+pill('현재 캡처 대기','missing')+'</td><td>'+pill('현재 360px 대기','missing')+'</td><td><details class="row-detail"><summary>다음 확인</summary><p>'+h(x.next)+'</p><p><b>사용자 검토:</b> '+h(x.user)+'</p></details></td></tr>').join('')}}
function renderImages(){{const q=document.getElementById('image-search').value.toLowerCase(),capture=document.getElementById('image-capture').value;const filtered=ledger.images.filter(x=>(!q||(x.id+' '+x.path+' '+x.mockup).toLowerCase().includes(q))&&(!capture||x.desktop===capture||x.mobile===capture));document.getElementById('image-count').textContent=filtered.length+' / '+ledger.images.length+'건';document.getElementById('image-rows').innerHTML=filtered.map(x=>'<tr><td>'+h(x.id)+'</td><td class="path">'+h(x.path)+'</td><td>'+pill(x.implementation,x.implementation==='implemented'?'partial':'')+'</td><td>'+pill(x.desktop==='stale'?'이전 캡처':x.desktop==='missing'?'없음':'재검토',x.desktop)+'</td><td>'+pill(x.mobile==='stale'?'이전 캡처':x.mobile==='missing'?'없음':'재검토',x.mobile)+'</td><td class="path">'+h(x.mockup)+'</td></tr>').join('')}}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{{for(const t of document.querySelectorAll('[data-view]'))t.setAttribute('aria-pressed',String(t===b));document.getElementById('pages-panel').hidden=b.dataset.view!=='pages';document.getElementById('images-panel').hidden=b.dataset.view!=='images'}}));
for(const id of ['page-search','page-kind','page-coverage'])document.getElementById(id).addEventListener('input',renderPages);for(const id of ['image-search','image-capture'])document.getElementById(id).addEventListener('input',renderImages);
document.addEventListener('click',async e=>{{const b=e.target.closest('[data-copy]');if(!b)return;try{{await navigator.clipboard.writeText(b.dataset.copy);b.textContent='복사됨'}}catch{{b.textContent='복사 불가'}}}});
renderPages();renderImages();
</script></body></html>'''
target = DESIGN / "VERIFICATION-DASHBOARD.html"
target.write_text(html)
print(json.dumps({"pages": len(pages), "images": len(images), "bytes": len(html.encode()), "output": str(target.relative_to(ROOT))}, ensure_ascii=False))
