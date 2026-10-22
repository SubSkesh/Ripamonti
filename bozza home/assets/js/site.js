(function(){
  var head=document.querySelector('.site-head'); if(!head) return;
  var burger=head.querySelector('.burger');
  var trig=head.querySelector('[data-mega]');
  var mega=trig && document.getElementById(trig.getAttribute('aria-controls'));
  var desktop=window.matchMedia('(min-width:1101px)');
  var t;
  function setMega(open){ if(!mega) return; trig.setAttribute('aria-expanded',open); mega.hidden=!open; }
  if(trig){
    trig.addEventListener('click',function(){ setMega(trig.getAttribute('aria-expanded')!=='true'); });
    var li=trig.parentNode;
    li.addEventListener('mouseenter',function(){ if(desktop.matches){clearTimeout(t);setMega(true);} });
    li.addEventListener('mouseleave',function(){ if(desktop.matches){t=setTimeout(function(){setMega(false)},180);} });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape' && trig.getAttribute('aria-expanded')==='true'){ setMega(false); trig.focus(); } });
    document.addEventListener('click',function(e){ if(desktop.matches && !li.contains(e.target)) setMega(false); });
  }
  if(burger){
    burger.addEventListener('click',function(){ var o=head.classList.toggle('open'); burger.setAttribute('aria-expanded',o); if(!o) setMega(false); });
  }
  desktop.addEventListener('change',function(){ head.classList.remove('open'); if(burger) burger.setAttribute('aria-expanded','false'); setMega(false); });
  function onScroll(){ head.classList.toggle('scrolled', window.scrollY>40); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  [].forEach.call(document.querySelectorAll('.lang button'),function(b){
    b.addEventListener('click',function(){ if(b.textContent.trim()==='EN'){ b.title='La versione inglese sarà attiva nel sito definitivo'; } });
  });

  // entrances: stagger siblings, play each element once when it enters the viewport
  var root=document.documentElement;
  root.classList.add('m-ok');
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var seq=[['.hero h1',0],['.hero .sub',220],['.hero .actions',320],['.p-hero figure',0],['.p-hero h1',120],['.p-hero .kind',320],['.p-hero .lead',400],['.p-hero .actions',480]];
  seq.forEach(function(p){ var el=document.querySelector(p[0]); if(el) el.style.setProperty('--d',p[1]+'ms'); });
  var lists='.facts,.keyspecs,.kpis,.lines,.svc,.opts,.keydims,.timeline,.hs-list,.brands ul';
  [].forEach.call(document.querySelectorAll(lists),function(ul){
    var base=ul.closest('.hero,.p-hero')?560:0;
    [].forEach.call(ul.children,function(li,i){ li.style.setProperty('--d',(base+Math.min(i,6)*70)+'ms'); });
  });
  var targets=document.querySelectorAll('.hero h1,.p-hero h1,.p-hero figure,.sec-head h2,.viewer h2,.vs h2,.reach h2,.feature h2,.history h2,'+
    '.hero .sub,.hero .actions,.p-hero .kind,.p-hero .lead,.p-hero .actions,.feature .kind,.reach .intro,.sec-head p,'+
    lists.split(',').map(function(s){return s+'>li'}).join(','));

  // key figures count up to their value (integers only; ranges such as 8,5–9,5 stay as written)
  function countUp(li){
    var b=li.querySelector('b'); if(!b||reduce) return;
    var node=b.firstChild; if(!node||node.nodeType!==3) return;
    var m=node.nodeValue.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(\s.*|)$/); if(!m) return;
    var end=parseInt(m[1].replace(/\./g,''),10); if(end>=1900&&end<2100) return; // years stay still
    var dot=m[1].indexOf('.')>-1, t0=null, dur=1100;
    function fmt(v){ return dot?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):String(v); } // keep the datasheet's own grouping
    function step(t){ if(t0===null)t0=t; var k=Math.min(1,(t-t0)/dur); var e=1-Math.pow(1-k,4);
      node.nodeValue=k<1?fmt(Math.round(end*e))+m[2]:m[0]; if(k<1) requestAnimationFrame(step); }
    node.nodeValue=fmt(0)+m[2]; requestAnimationFrame(step);
  }
  function show(el){ el.classList.add('in'); if(el.matches('.keyspecs>li,.keydims>li,.facts>li,.kpis>li')) countUp(el); }
  if(reduce){ [].forEach.call(targets,show); return; }
  // a clipped element reports no area, so the wiped ones are measured through their parent.
  // Elements already scrolled past are shown too, so a fast jump never leaves gaps.
  var wiped='.hero h1,.p-hero h1,.p-hero figure,.sec-head h2,.viewer h2,.vs h2,.reach h2,.feature h2,.history h2';
  var pending=[].map.call(targets,function(el){ return {el:el, box:el.matches(wiped)?el.parentElement:el}; });
  var queued=false;
  function check(){
    queued=false;
    var limit=window.innerHeight*0.92;
    pending=pending.filter(function(p){
      if(p.box.getBoundingClientRect().top<limit){ show(p.el); return false; }
      return true;
    });
    if(!pending.length){ window.removeEventListener('scroll',onMove); window.removeEventListener('resize',onMove); }
  }
  function onMove(){ if(!queued){ queued=true; requestAnimationFrame(check); } }
  window.addEventListener('scroll',onMove,{passive:true});
  window.addEventListener('resize',onMove);
  check();
})();
