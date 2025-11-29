// script.js — cleaned + plusOptions aware generateList
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
  const createBtn = $('btnCreate');

  // plusOptions elements (optional)
  const plusOptions = $('plusOptions');
  const plusLen = $('plusLen');
  const plusLenVal = $('plusLenVal');
  const plusTagInput = $('plusTag');

  function parseList(s){
    return (s || '').split(',').map(x=>x.trim()).filter(Boolean);
  }

  function makeDotVariants(name){
    if(!name) return [];
    return [ name.split('').join('.') ];
  }

  // read which method toggles are active (plus/dot/upper/lower)
  function readMethodFlags(){
    const m = {};
    const btns = document.querySelectorAll('#methodsUser .method');
    btns.forEach(b => { if(b.dataset && b.dataset.method) m[b.dataset.method] = b.classList.contains('active'); });
    return m;
  }

  // ensure domain entries start with '@'
  function normalizeDomains(arr){
    if(!arr || !arr.length) return ['@gmail.com'];
    return arr.map(d => {
      d = d.trim();
      if(!d) return '';
      return d.startsWith('@') ? d : ('@' + d);
    }).filter(Boolean);
  }

  function generateList(){
    const base = (baseInput && baseInput.value || '').trim();
    if(!base) return [];
    const suffix = (suffixInput && suffixInput.value || '').trim();
    const extras = parseList(extrasInput && extrasInput.value);
    const domains = normalizeDomains(parseList(domainsInput && domainsInput.value));
    const useDots = !!(dotsInput && dotsInput.checked);
    const limit = Math.max(1, Number(limitInput && limitInput.value) || 200);

    const methods = readMethodFlags(); // { plus:bool, dot:bool, upper:bool, lower:bool }

    // build core username forms (without domain)
    const core = new Set();

    // base + suffix and base.suffix
    core.add(base + (suffix || ''));
    core.add(base + '.' + (suffix || ''));

    // dotted-variant of base if requested (eg: a.b.c)
    if(useDots || methods.dot){
      makeDotVariants(base).forEach(v => core.add(v + (suffix || '')));
    }

    // extras appended (like 01, _id, etc)
    extras.forEach(e => {
      core.add(base + (suffix || '') + e);
      core.add(base + '.' + (suffix || '') + e);
      if(useDots || methods.dot) makeDotVariants(base).forEach(v => core.add(v + (suffix || '') + e));
    });

    // convert Set to array and enforce limit on core permutations
    const cores = Array.from(core).slice(0, limit);

    // helper: apply plus (use global apply if provided)
    function applyPlusIfNeeded(name){
      if(!methods.plus) return name;
      const tagValue = (plusTagInput && plusTagInput.value) ? plusTagInput.value : '';
      if(window && typeof window.__applyPlus === 'function'){
        try { return window.__applyPlus(name, tagValue); } catch(e){ /* fallback */ }
      }
      // fallback simple: +idNN
      const nn = String(Math.floor(10 + Math.random()*90));
      return name + '+id' + nn;
    }

    // final assembly with domains and case handling
    const out = [];
    cores.forEach(c => {
      // produce both no-plus and plus variants depending on method
      const candidates = [];
      candidates.push(c);
      if(methods.plus){
        candidates.push(applyPlusIfNeeded(c));
      }

      candidates.forEach(candidate => {
        // apply casing
        let finalName;
        if(methods.upper && !methods.lower) finalName = candidate.toUpperCase();
        else finalName = candidate.toLowerCase();

        // replace whitespace with dot
        finalName = finalName.replace(/\s+/g, '.');

        // attach domains
        domains.forEach(d => out.push(finalName + d));
      });
    });

    // cap total output
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
      if(plusOptions) plusOptions.style.display = 'none';
      if(plusOptions){
        plusOptions.querySelectorAll('button[data-plusmode]').forEach(b => b.classList.remove('active'));
        const def = plusOptions.querySelector('button[data-plusmode="mix"]') || plusOptions.querySelector('button[data-plusmode="numbers"]');
        if(def) def.classList.add('active');
        if(plusLen){ plusLen.value = plusLen.getAttribute('min') || 12; if(plusLenVal) plusLenVal.textContent = plusLen.value; }
      }
    });
  }

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
      document.querySelectorAll('.method.active').forEach(b => b.classList.remove('active'));
      const defaultPlus = document.querySelector('.method[data-method="plus"]');
      const defaultLower = document.querySelector('.method[data-method="lower"]');
      if(defaultPlus) defaultPlus.classList.add('active');
      if(defaultLower) defaultLower.classList.add('active');
      const cta = createBtn || document.querySelector('.btn.primary');
      if(cta) cta.classList.remove('active');

      if(plusOptions){
        const plusBtn = document.querySelector('.method[data-method="plus"]');
        if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
        else plusOptions.style.display = 'none';
      }

      if(document.activeElement && document.activeElement.tagName === 'BUTTON'){
        try { document.activeElement.blur(); } catch(e){}
      }
    }
    window.addEventListener('pageshow', () => setTimeout(clearUIState, 40));
    setTimeout(clearUIState, 40);
  })();

  // plusOptions wiring (mode buttons & slider)
  (function(){
    if(!plusOptions) return;
    plusOptions.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-plusmode]');
      if(!btn) return;
      e.preventDefault();
      plusOptions.querySelectorAll('button[data-plusmode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    if(plusLen && plusLenVal){
      plusLenVal.textContent = plusLen.value;
      plusLen.addEventListener('input', ()=> plusLenVal.textContent = plusLen.value);
    }
    // show/hide based on user toggling plus method
    const methodsUser = document.getElementById('methodsUser');
    if(methodsUser){
      methodsUser.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-method]');
        if(!btn) return;
        setTimeout(()=>{
          const plusBtn = methodsUser.querySelector('button[data-method="plus"]');
          if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
          else plusOptions.style.display = 'none';
        }, 10);
      });
      // initial state
      setTimeout(()=>{
        const plusBtn = methodsUser.querySelector('button[data-method="plus"]');
        if(plusBtn && plusBtn.classList.contains('active')) plusOptions.style.display = '';
        else plusOptions.style.display = 'none';
      }, 40);
    }
  })();

  // CTA visual active only on real clicks
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
