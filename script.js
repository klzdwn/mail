// script.js — cleaned: no-floating, no auto-press, CTA active only on real click/copy
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

  // --- REMOVE floating behaviour: ensure no sticky class and no related listeners ---
  (function(){
    const btnArea = document.querySelector('.btn-area');
    if(btnArea){
      btnArea.classList.remove('sticky');
      // remove inline style that might have been applied by previous code
      btnArea.style.position = '';
      btnArea.style.bottom = '';
      btnArea.style.left = '';
      btnArea.style.right = '';
    }

    // If any floating-related listeners exist elsewhere, we don't try to remove unknown handlers.
    // But defensively ensure window resize won't toggle sticky here.
    // (No-op)
  })();

  // --- UI state cleanup on load/pageshow (avoid browser restoring pressed/focus) ---
  (function(){
    function clearUIState(){
      // normalize method buttons
      document.querySelectorAll('.method.active').forEach(b => b.classList.remove('active'));
      const defaultPlus = document.querySelector('.method[data-method="plus"]');
      const defaultLower = document.querySelector('.method[data-method="lower"]');
      if(defaultPlus) defaultPlus.classList.add('active');
      if(defaultLower) defaultLower.classList.add('active');

      // CTA not active by default
      const cta = createBtn || document.querySelector('.btn.primary');
      if(cta) cta.classList.remove('active');

      // blur focused button (if any)
      if(document.activeElement && document.activeElement.tagName === 'BUTTON'){
        try { document.activeElement.blur(); } catch(e){}
      }
    }

    window.addEventListener('pageshow', () => setTimeout(clearUIState, 40));
    setTimeout(clearUIState, 40);
  })();

  // --- Make CTA become blue only on real user clicks (visual feedback) ---
  (function(){
    const cta = createBtn || document.querySelector('.btn.primary');
    if(!cta) return;

    // Ensure it starts non-active
    cta.classList.remove('active');

    // Add click visual feedback (user-initiated)
    cta.addEventListener('click', (ev) => {
      if(ev && ev.isTrusted){
        cta.classList.add('active');
        clearTimeout(cta._rem);
        cta._rem = setTimeout(()=> cta.classList.remove('active'), 900);
      }
    });
  })();

})(); // end IIFE
