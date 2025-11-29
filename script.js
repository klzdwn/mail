// script.js — cleaned + plusOptions support
(function(){
  const $ = id => document.getElementById(id);
  const baseInput = $('base');
  const suffixInput = $('suffix');
  const extrasInput = $('extras');
  const dotsInput = $('dots');
  const domainsInput = $('domains');
  const limitInput = $('limit');
  const generateBtn = $('generate');
  const resetBtn = $('reset');
  const output = $('output');
  const countEl = $('count');
  const copyBtn = $('copy');
  const downloadBtn = $('download');
  const createBtn = $('btnCreate'); // if present in your markup

  // plusOptions elements (optional: if not present, code will ignore)
  const plusOptions = $('plusOptions');      // container div for plus options
  const plusLen = $('plusLen');              // range input for length
  const plusLenVal = $('plusLenVal');        // display for length
  // plus mode buttons inside plusOptions should have data-plusmode="numbers"|"letters"|"mix"

  function parseList(s){
    return (s || '').split(',').map(x=>x.trim()).filter(Boolean);
  }

  function makeDotVariants(name){
    if(!name) return [];
    return [ name.split('').join('.') ];
  }

  function generateList(){
    const base = (baseInput && baseInput.value || '').trim();
    if(!base) return [];
    const suffix = (suffixInput && suffixInput.value || '').trim();
    const extras = parseList(extrasInput && extrasInput.value);
    const domains = parseList(domainsInput && domainsInput.value);
    const useDots = !!(dotsInput && dotsInput.checked);
    const limit = Math.max(1, Number(limitInput && limitInput.value) || 200);

    const core = new Set();
    core.add(base + (suffix || ''));
    core.add(base + '.' + (suffix || ''));

    if(useDots){
      makeDotVariants(base).forEach(v => core.add(v + (suffix || '')));
    }

    extras.forEach(e => {
      core.add(base + (suffix || '') + e);
      core.add(base + '.' + (suffix || '') + e);
      if(useDots) makeDotVariants(base).forEach(v => core.add(v + (suffix || '') + e));
    });

    const cores = Array.from(core).slice(0, limit);
    const out = [];
    const ds = domains.length ? domains : ['@gmail.com'];
    cores.forEach(c => ds.forEach(d => out.push(c + d)));
    return out.slice(0, 5000);
  }

  function render(list){
    if(countEl) countEl.textContent = `(${list.length})`;
    if(!output) return;
    if(list.length === 0){
      output.textContent = 'No results yet. Klik Generate.';
      return;
    }
    const ol = document.createElement('ol');
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.wordBreak = 'break-all';
      ol.appendChild(li);
    });
    output.innerHTML = '';
    output.appendChild(ol);
  }

  if(generateBtn){
    generateBtn.addEventListener('click', ()=>{
      const res = generateList();
      render(res);
    });
  }

  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(baseInput) baseInput.value = '';
      if(suffixInput) suffixInput.value = 'ber';
      if(extrasInput) extrasInput.value = '01,99,2025,_id,x,official,88';
      if(domainsInput) domainsInput.value = '@gmail.com,@googlemail.com';
      if(limitInput) limitInput.value = 200;
      if(dotsInput) dotsInput.checked = false;
      if(output) output.textContent = 'No results yet. Klik Generate.';
      if(countEl) countEl.textContent = '(0)';
      // hide plusOptions on reset
      if(plusOptions) plusOptions.style.display = 'none';
      // reset plus mode selection
      if(plusOptions){
        plusOptions.querySelectorAll('button[data-plusmode]').forEach(b => b.classList.remove('active'));
        const def = plusOptions.querySelector('button[data-plusmode="mix"]') || plusOptions.querySelector('button[data-plusmode="numbers"]');
        if(def) def.classList.add('active');
        if(plusLen){ plusLen.value = plusLen.getAttribute('min') || 8; if(plusLenVal) plusLenVal.textContent = plusLen.value; }
      }
    });
  }

  // clipboard util
  async function copyTextToClipboard(text){
    if(!text) return false;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(e){
      console.warn('clipboard API failed', e);
    }
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    }catch(err){
      console.warn('fallback copy failed', err);
      return false;
    }
  }

  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      const text = Array.from((output && output.querySelectorAll('li')) || []).map(li=>li.textContent).join('\n');
      if(!text) return alert('Tidak ada yang disalin.');
      let ok = false;
      try{
        ok = await copyTextToClipboard(text);
        if(ok) alert('Copied ' + text.split('\n').length + ' addresses to clipboard.');
        else prompt('Copy manual:', text);
      }catch(err){
        prompt('Copy manual:', text);
      }

      // add visual active only when copy succeeded
      const cta = createBtn || document.querySelector('.btn.primary');
      if(cta && ok){
        cta.classList.add('active');
        clearTimeout(cta._rem);
        cta._rem = setTimeout(()=> cta.classList.remove('active'), 900);
      }
    });
  }

  if(downloadBtn){
    downloadBtn.addEventListener('click', ()=>{
      const text = Array.from((output && output.querySelectorAll('li')) || []).map(li=>li.textContent).join('\n');
      if(!text) return alert('Tidak ada hasil untuk di-download.');
      const blob = new Blob([text], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'usernames.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }

  // default message
  if(output) output.textContent = 'No results yet. Klik Generate.';

  // remove floating behaviour if present
  (function(){
    const btnArea = document.querySelector('.btn-area');
    if(btnArea){
      btnArea.classList.remove('sticky');
      btnArea.style.position = '';
      btnArea.style.bottom = '';
      btnArea.style.left = '';
      btnArea.style.right = '';
    }
  })();

  // UI cleanup on load/pageshow
  (function(){
    function clearUIState(){
      // normalize method buttons
      document.querySelectorAll('.method.active').forEach(b => b.classList.remove('active'));
      const defaultPlus = document.querySelector('.method[data-method="plus"]');
      const defaultLower = document.querySelector('.method[data-method="lower"]');
      if(defaultPlus) defaultPlus.classList.add('active');
      if(defaultLower) defaultLower.classList.add('active');

      // CTA not active
      const cta = createBtn || document.querySelector('.btn.primary');
      if(cta) cta.classList.remove('active');

      // hide plusOptions initially unless plus active
      if(plusOptions){
        const plusBtn = document.querySelector('.method[data-method="plus"]');
        if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
        else plusOptions.style.display = 'none';
      }

      // blur focused button
      if(document.activeElement && document.activeElement.tagName === 'BUTTON'){
        try { document.activeElement.blur(); } catch(e){}
      }
    }

    window.addEventListener('pageshow', () => setTimeout(clearUIState, 40));
    setTimeout(clearUIState, 40);
  })();

  // --- PLUS OPTIONS: wiring + generator helpers ---
  (function(){
    // helpers
    function randStr(len, charset){
      let s = '';
      for(let i=0;i<len;i++) s += charset.charAt(Math.floor(Math.random()*charset.length));
      return s;
    }
    function randNumbers(len){ return randStr(len, '0123456789'); }
    function randLetters(len){ return randStr(len, 'abcdefghijklmnopqrstuvwxyz'); }
    function randMix(len){ return randStr(len, 'abcdefghijklmnopqrstuvwxyz0123456789'); }

    // read selected plus mode
    function readPlusMode(){
      if(!plusOptions) return 'mix';
      const btn = plusOptions.querySelector('button[data-plusmode].active');
      return btn ? btn.dataset.plusmode : 'mix';
    }

    // expose applyPlus globally so existing transformUsername can call it
    window.__applyPlus = function(name, tagValue){
      // if user provided explicit tag (e.g. input plusTag) use it
      if(tagValue && tagValue.trim()){
        const clean = tagValue.trim().replace(/^\+/, '');
        return name + '+' + clean;
      }
      const mode = readPlusMode() || 'mix';
      let len = 12;
      if(plusLen) len = Math.max(1, Number(plusLen.value) || 12);
      if(mode === 'numbers') return name + '+' + randNumbers(len);
      if(mode === 'letters') return name + '+' + randLetters(len);
      return name + '+' + randMix(len); // mix
    };

    // wire plusOptions visibility: show when method 'plus' active
    (function wirePlusVisibility(){
      const methodsUser = document.getElementById('methodsUser');
      if(!methodsUser || !plusOptions) return;

      // when user clicks any method button, update visibility after toggle
      methodsUser.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-method]');
        if(!btn) return;
        // let other handler toggle .active first; check after small delay
        setTimeout(()=>{
          const plusBtn = methodsUser.querySelector('button[data-method="plus"]');
          if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
          else plusOptions.style.display = 'none';
        },10);
      });

      // initial state
      setTimeout(()=>{
        const plusBtn = methodsUser.querySelector('button[data-method="plus"]');
        if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
        else plusOptions.style.display = 'none';
      }, 40);
    })();

    // wire plus mode toggle buttons inside plusOptions
    (function wirePlusModeButtons(){
      if(!plusOptions) return;
      plusOptions.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-plusmode]');
        if(!btn) return;
        e.preventDefault();
        Array.from(plusOptions.querySelectorAll('button[data-plusmode]')).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
      // default selection
      setTimeout(()=>{
        if(!plusOptions.querySelector('button[data-plusmode].active')){
          const def = plusOptions.querySelector('button[data-plusmode="mix"]') || plusOptions.querySelector('button[data-plusmode="numbers"]');
          if(def) def.classList.add('active');
        }
        if(plusLen && plusLenVal) plusLenVal.textContent = plusLen.value;
        if(plusLen) plusLen.addEventListener('input', ()=> { if(plusLenVal) plusLenVal.textContent = plusLen.value; });
      }, 40);
    })();
  })();

  // --- Make CTA become blue only on real user clicks (visual feedback) ---
  (function(){
    const cta = createBtn || document.querySelector('.btn.primary');
    if(!cta) return;
    cta.classList.remove('active');
    cta.addEventListener('click', (ev) => {
      if(ev && ev.isTrusted){
        cta.classList.add('active');
        clearTimeout(cta._rem);
        cta._rem = setTimeout(()=> cta.classList.remove('active'), 900);
      }
    });
  })();

})(); // end IIFE
