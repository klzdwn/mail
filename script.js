// script.js — plusOptions support, no floating CTA, domain placeholder only
(function(){
  const $ = id => document.getElementById(id);

  const form = $('egForm');
  const inpName = $('inpName'), inpDomain = $('inpDomain'), plusTag = $('plusTag');
  const methodsUser = $('methodsUser'), methodsDom = $('methodsDom');
  const warnName = $('warnName'), warnDomain = $('warnDomain');
  const btnCreate = $('btnCreate'), previewText = $('previewText'), counterEl = $('counter');
  const copyBadge = $('copyBadge'), copyBadgeText = $('copyBadgeText');
  const confettiWrap = $('confettiWrap');
  const themeToggle = $('themeToggle'), themeIcon = $('themeIcon');

  const plusOptions = $('plusOptions'), plusLen = $('plusLen'), plusLenVal = $('plusLenVal');

  // Theme handling (persist)
  const THEME_KEY = 'eg_theme';
  function applyTheme(t){ if(t==='dark') document.body.classList.add('dark'); else document.body.classList.remove('dark'); themeIcon.textContent = (t==='dark')?'🌙':'☀️'; themeToggle.setAttribute('aria-pressed', t==='dark'); }
  function loadTheme(){ const s = localStorage.getItem(THEME_KEY); if(s) return s; return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'; }
  function saveTheme(t){ localStorage.setItem(THEME_KEY,t); }
  applyTheme(loadTheme());
  themeToggle.addEventListener('click', ()=>{ const now = document.body.classList.contains('dark')?'dark':'light'; const next = now==='dark'?'light':'dark'; applyTheme(next); saveTheme(next); });

  if(form) form.addEventListener('submit', e => { e.preventDefault(); return false; });

  // toggle method buttons
  function wireToggle(container){
    if(!container) return;
    container.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-method]');
      if(!btn) return;
      e.preventDefault();
      const active = btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');

      // show/hide plus options when plus toggled
      if(btn.dataset.method === 'plus' && plusOptions){
        if(btn.classList.contains('active')){
          plusOptions.style.display = '';
          plusOptions.setAttribute('aria-hidden','false');
        } else {
          plusOptions.style.display = 'none';
          plusOptions.setAttribute('aria-hidden','true');
        }
      }
    });
  }
  wireToggle(methodsUser); wireToggle(methodsDom);

  // plusOptions controls
  if(plusOptions){
    plusOptions.addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-plusmode]');
      if(!b) return;
      e.preventDefault();
      Array.from(plusOptions.querySelectorAll('button[data-plusmode]')).forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    if(plusLen && plusLenVal){
      plusLenVal.textContent = plusLen.value;
      plusLen.addEventListener('input', ()=> plusLenVal.textContent = plusLen.value);
    }
  }

  // validate inputs live
  if(inpName) inpName.addEventListener('input', ()=> { if(warnName) warnName.style.display = inpName.value.trim()==='' ? 'block' : 'none'; });
  if(inpDomain) inpDomain.addEventListener('input', ()=> { if(warnDomain) warnDomain.style.display = inpDomain.value.trim()==='' ? 'block' : 'none'; });

  // plus helpers
  function randStr(len, chars){
    let s=''; for(let i=0;i<len;i++) s += chars.charAt(Math.floor(Math.random()*chars.length)); return s;
  }
  function readPlusMode(){
    if(!plusOptions) return 'mix';
    const btn = plusOptions.querySelector('button[data-plusmode].active'); return btn ? btn.dataset.plusmode : 'mix';
  }
  window.__applyPlus = function(name, tagValue){
    if(tagValue && tagValue.trim()){
      const clean = tagValue.trim().replace(/^\+/, '');
      return name + '+' + clean;
    }
    const mode = readPlusMode();
    const len = Math.max(1, (plusLen && Number(plusLen.value)) || 12);
    if(mode === 'numbers') return name + '+' + randStr(len, '0123456789');
    if(mode === 'letters') return name + '+' + randStr(len, 'abcdefghijklmnopqrstuvwxyz');
    return name + '+' + randStr(len, 'abcdefghijklmnopqrstuvwxyz0123456789');
  };

  // reading method options
  function readOpts(container){
    const out = {};
    if(!container) return out;
    Array.from(container.querySelectorAll('button[data-method]')).forEach(b => out[b.dataset.method] = b.classList.contains('active'));
    return out;
  }
  function applyDot(name){
    if(!name) return name;
    if(name.length <= 2) return name.split('').join('.');
    return name.slice(0,2) + '.' + name.slice(2);
  }
  function transformUsername(base){
    const opts = readOpts(methodsUser);
    let u = base;
    if(opts.dot) u = applyDot(u);
    if(opts.plus) u = window.__applyPlus(u, plusTag ? plusTag.value : '');
    if(opts.upper && !opts.lower) u = u.toUpperCase();
    else u = u.toLowerCase();
    return u.replace(/\s+/g,'.');
  }

  function generateOne(){
    const base = (inpName && inpName.value||'').trim(); if(!base) return '';
    const domain = (inpDomain && inpDomain.value||'').trim();
    const username = transformUsername(base);
    return username + (domain ? '@' + domain : '');
  }

  async function copyToClipboard(text){
    if(!text) return false;
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); return true; } }catch(e){ console.warn(e); }
    try{ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.focus(); ta.select(); const ok=document.execCommand('copy'); document.body.removeChild(ta); return !!ok; }catch(e){return false;}
  }

  // create button behavior
  let seq = 0;
  if(btnCreate){
    btnCreate.classList.remove('active');
    btnCreate.addEventListener('click', async function(ev){
      // visual feedback only for trusted events
      if(ev && ev.isTrusted){
        this.classList.add('active');
        this.setAttribute('aria-pressed','true');
        clearTimeout(this._rem); this._rem = setTimeout(()=>{ this.classList.remove('active'); this.setAttribute('aria-pressed','false'); }, 1200);
      }

      if(warnName) warnName.style.display='none';
      if(warnDomain) warnDomain.style.display='none';

      const nameVal = inpName.value.trim();
      const domVal = inpDomain.value.trim();
      if(!nameVal){ if(warnName) warnName.style.display='block'; inpName.focus(); return; }
      if(!domVal){ if(warnDomain) warnDomain.style.display='block'; inpDomain.focus(); return; }

      const email = generateOne();
      if(!email) return;

      const ok = await copyToClipboard(email);
      if(ok){
        if(copyBadge){ copyBadgeText.textContent='Tersalin!'; copyBadge.classList.add('show'); setTimeout(()=>copyBadge.classList.remove('show'),1400); }
        if(confettiWrap){
          while(confettiWrap.firstChild) confettiWrap.removeChild(confettiWrap.firstChild);
          const colors = ['#54b8ff','#3fb0ff','#06b6d4','#f59e0b','#7c3aed'];
          for(let i=0;i<8;i++){
            const el = document.createElement('div'); el.className='confetti-piece'; el.style.background = colors[Math.floor(Math.random()*colors.length)];
            const angle = (Math.random()*120 - 60); const dist = 50 + Math.random()*60;
            const tx = Math.cos(angle * Math.PI/180) * dist; const ty = Math.sin(angle * Math.PI/180) * dist + 30*Math.random();
            el.style.setProperty('--tx', tx.toFixed(1)+'px'); el.style.setProperty('--ty', ty.toFixed(1)+'px');
            el.style.animation = `confettiFly 900ms cubic-bezier(.2,.8,.25,1) ${Math.random()*0.12}s forwards`;
            confettiWrap.appendChild(el);
            setTimeout(()=>{ if(el && el.parentNode) el.parentNode.removeChild(el); }, 1400);
          }
        }
      } else {
        if(copyBadge){ copyBadgeText.textContent='Salin manual'; copyBadge.classList.add('show'); setTimeout(()=>copyBadge.classList.remove('show'),1400); }
      }

      if(previewText) previewText.textContent = email;
      seq += 1; if(counterEl) counterEl.textContent = seq;
    });
  }

  // initial UI state
  function initUI(){
    if(plusOptions){ plusOptions.style.display = 'none'; plusOptions.setAttribute('aria-hidden','true'); }
    if(warnName) warnName.style.display='none';
    if(warnDomain) warnDomain.style.display='none';
    if(previewText) previewText.textContent='-';
    if(counterEl) counterEl.textContent = '0';
    document.querySelectorAll('#methodsUser .method, #methodsDom .method').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
    if(plusOptions && !plusOptions.querySelector('button.active')){
      const def = plusOptions.querySelector('button[data-plusmode="mix"]') || plusOptions.querySelector('button[data-plusmode="numbers"]');
      if(def) def.classList.add('active');
    }
    if(plusLen && plusLenVal) plusLenVal.textContent = plusLen.value;
  }
  window.addEventListener('pageshow', initUI);
  window.addEventListener('load', initUI);
  setTimeout(initUI, 40);

})();
