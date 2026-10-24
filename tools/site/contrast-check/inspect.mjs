export function inspectDom(state) {
  const iconsOnly=typeof state==='object'&&state.iconsOnly;state=typeof state==='object'?state.state:state;
  const styleCache=new WeakMap(),bgCache=new WeakMap(),refCache=new WeakMap();
  const style=e=>{let v=styleCache.get(e);if(!v){v=getComputedStyle(e);styleCache.set(e,v)}return v};
  const color = s => { const modern=String(s).match(/^color\(srgb ([\d.e+\- ]+)(?:\s*\/\s*([\d.]+))?\)$/); if(modern)return modern[1].trim().split(/\s+/).map(Number).map(v=>v*255).concat(modern[2]===undefined?1:Number(modern[2])); const m=String(s).match(/rgba?\(([^)]+)\)/); if(!m)return null; const a=m[1].replace(/,/g,' ').replace(/\//g,' ').split(/\s+/).filter(Boolean);return [Number(a[0]),Number(a[1]),Number(a[2]),a[3]===undefined?1:Number(a[3])]; };
  const mix=(f,b)=>{const a=f[3]+b[3]*(1-f[3]);return [0,1,2].map(i=>(f[i]*f[3]+b[i]*b[3]*(1-f[3]))/a).concat(a)};
  const lum=c=>{const v=c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
  const ratio=(a,b)=>{let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const hex=c=>'#'+c.slice(0,3).map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
  const visible=e=>{for(let p=e;p&&p.nodeType===1;p=p.parentElement){const s=style(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||p.hidden)return false}return true};
  const bg=e=>{if(bgCache.has(e))return bgCache.get(e);let layers=[],p=e;while(p&&p.nodeType===1){const s=style(p);layers.push({c:color(s.backgroundColor),image:s.backgroundImage!=='none'});p=p.parentElement}let c=[255,255,255,1],image=false;for(const l of layers.reverse()){if(l.c&&l.c[3])c=mix(l.c,c);if(l.image)image=true}// SVG 텍스트는 DOM 배경 대신 뒤에 놓인 도형의 채움색을 사용한다.
    const svg=e.closest('svg');
    if(svg && (e.closest('text,foreignObject') || e.tagName.toLowerCase()==='text')) {
      const box=e.getBoundingClientRect(),point=new DOMPoint(box.x+box.width/2,box.y+box.height/2);
      for(const shape of [...svg.querySelectorAll('rect,polygon,circle,ellipse,path')].reverse()) {
        if(shape.closest('defs,marker') || !(e.compareDocumentPosition(shape)&Node.DOCUMENT_POSITION_PRECEDING))continue;
        const fill=color(style(shape).fill),matrix=shape.getScreenCTM();
        if(!fill||!fill[3]||!matrix)continue;
        try { if(shape.isPointInFill(point.matrixTransform(matrix.inverse()))) { c=mix(fill,c);break; } } catch {}
      }
    }
    const v={c,image};bgCache.set(e,v);return v};
  const ref=e=>{if(refCache.has(e))return refCache.get(e);if(e.id)return '#'+CSS.escape(e.id);let a=[];for(let p=e;p&&p!==document.body&&a.length<4;p=p.parentElement){let s=p.tagName.toLowerCase();if(p.classList.length)s+='.'+[...p.classList].slice(0,2).map(CSS.escape).join('.');a.unshift(s)}const v=a.join(' > ');refCache.set(e,v);return v};
  let nodes=0, edges=0, findings=[];
  const add=(e,kind,text,fg,bgcolor,r,threshold,extra={})=>{if(r>=threshold)return;const rect=e.getBoundingClientRect();findings.push({state,kind,text:text.slice(0,110),selector:ref(e),color:hex(fg),background:hex(bgcolor),ratio:+r.toFixed(2),threshold,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},source:null,backgroundSource:null,...extra})};
  const tree=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(!iconsOnly&&(n=tree.nextNode())){if(!n.textContent.trim())continue;const e=n.parentElement;if(!e||!visible(e)||e.closest(':disabled')||['SCRIPT','STYLE','NOSCRIPT','TITLE','TEXTAREA','OPTION'].includes(e.tagName))continue;const rect=document.createRange();rect.selectNodeContents(n);const box=rect.getBoundingClientRect();if(!box.width||!box.height)continue;nodes++;const s=style(e),b=bg(e),fg=color(s.color);if(!fg||e.closest('svg text'))continue;let actual=mix(fg,b.c);for(let p=e;p;p=p.parentElement){const opacity=Number(style(p).opacity);if(opacity<1)actual=mix(actual.slice(0,3).concat(opacity),bg(p.parentElement||document.documentElement).c)}const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700),threshold=large?3:4.5;const r=ratio(actual,b.c);add(e,e.closest('pre,code')?'code':'text',n.textContent.trim(),actual,b.c,r,threshold,{imageBackground:b.image,fontSize:s.fontSize,fontWeight:s.fontWeight});}
  for(const e of document.querySelectorAll(iconsOnly?'[data-no-contrast-target]':'input[placeholder],textarea[placeholder]')){if(!visible(e))continue;const s=getComputedStyle(e,'::placeholder'),b=bg(e),fg=color(s.color);if(!fg)continue;nodes++;add(e,'placeholder',e.placeholder,mix(fg,b.c),b.c,ratio(mix(fg,b.c),b.c),4.5,{imageBackground:b.image});}
  for(const e of document.querySelectorAll('svg text,svg use,svg path,svg line,svg polyline,svg polygon,svg circle')){if(!visible(e)||e.closest('defs'))continue;const s=style(e),b=bg(e),iconBox=e.closest('svg').getBoundingClientRect(),icon=iconBox.width<=64&&iconBox.height<=64;if(iconsOnly&&!icon)continue;for(const prop of e.tagName.toLowerCase()==='text'?['fill']:icon?['fill','stroke']:['stroke']){if(prop==='stroke'&&(s.stroke==='none'||parseFloat(s.strokeWidth)<1))continue;if(prop==='fill'&&e.tagName.toLowerCase()!=='text'&&e.isPointInFill){const box=e.getBBox();if(![[.5,.5],[.25,.25],[.75,.75]].some(([x,y])=>e.isPointInFill(new DOMPoint(box.x+box.width*x,box.y+box.height*y))))continue;}const c=color(s[prop]);if(!c||!c[3])continue;nodes++;const threshold=e.tagName.toLowerCase()==='text'?4.5:3;add(e,'svg',e.textContent.trim()||e.tagName,mix(c,b.c),b.c,ratio(mix(c,b.c),b.c),threshold,{paint:prop,imageBackground:b.image});}}
  for(const e of document.querySelectorAll(iconsOnly?'[data-no-contrast-target]':'button,input,select,textarea,[role="button"],[role="tab"]')){if(!visible(e)||e.disabled)continue;const s=style(e),b=bg(e),bc=color(s.borderTopColor);if(!bc||parseFloat(s.borderTopWidth)<1)continue;edges++;const outside=bg(e.parentElement).c;if(ratio(b.c,outside)>=3)continue;const c=mix(bc,outside);add(e,'border',e.textContent.trim()||e.getAttribute('aria-label')||e.tagName,c,outside,ratio(c,outside),3,{imageBackground:b.image});}
  return {nodes,edges,findings};
}
