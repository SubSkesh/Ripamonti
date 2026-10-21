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
})();
