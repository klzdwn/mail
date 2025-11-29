// script.js — updated: no auto-press on reload, btn active on click/copy, floating CTA kept
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

  function parseList(s){
    return (s || '').split(',').map(x=>x.trim()).filter(Boolean);
  }

  function makeDotVariants(name){
    if(!name) return [];
    const chars = name.split('');
    return [chars.join('.')];
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
      output.textContent = 'No results yet. Klik Generate.'; return;
    }
    const ol = document.createElement('ol');
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.wordBreak = 'break-all';
      ol.appendChild(li);
    });
    output.innerHTML = ''; output.appendChild(ol);
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
      // collect list items (if any)
      const text = Array.from((output && output.querySelectorAll('li')) || []).map(li=>li.textContent).join('\n');
      if(!text) return alert('Tidak ada yang disalin.');
      try{
        await navigator.clipboard.writeText(text);
        alert('Copied ' + text.split('\n').length + ' addresses to clipboard.');
      }catch(err){
        prompt('Copy manual:', text);
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

  // initial render
  if(output) output.textContent = 'No results yet. Klik Generate.';

  /* ============================
     FLOATING BUTTON SYSTEM (keep)
     ============================ */
  (function(){
    const btnArea = document.querySelector('.btn-area');
    if(!btnArea) return;

    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
    let blurTimeout = null;

    function setSticky(on){
      if(on) btnArea.classList.add('sticky');
      else btnArea.classList.remove('sticky');
    }

    inputs.forEach(inp => {
      inp.addEventListener('focus', ()=>{
        clearTimeout(blurTimeout);
        setTimeout(()=> setSticky(true), 80);
      });
      inp.addEventListener('blur', ()=>{
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(()=> setSticky(false), 250);
      });
    });

    // detect keyboard mobile (resize heuristic)
    let lastHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      const h = window.innerHeight;
      if(h < lastHeight - 100) setSticky(true);
      else if(h > lastHeight + 80) setSticky(false);
      lastHeight = h;
    });
  })();


  /* ============================
     FIX: avoid "automatic" active states on load
     - remove any lingering :active / .active from buttons
     - blur buttons if focused due to session restore
     - ensure create button only becomes active on user-click (or successful copy)
     ============================ */
  (function(){
    // remove .active from method buttons and CTA on load (safety)
    function clearActiveStates(){
      document.querySelectorAll('.method.active').forEach(b => b.classList.remove('active'));
      // if your UI expects some default active method, set it explicitly instead of relying on browser restore
      const defaultPlus = document.querySelector('.method[data-method="plus"]');
      const defaultLower = document.querySelector('.method[data-method="lower"]');
      if(defaultPlus) defaultPlus.classList.add('active');
      if(defaultLower) defaultLower.classList.add('active');

      const cta = document.querySelector('.btn.primary');
      if(cta) cta.classList.remove('active');

      // blur any focused button (some browsers restore pressed/focused element on reload)
      if(document.activeElement && document.activeElement.tagName === 'BUTTON'){
        document.activeElement.blur();
      }
    }

    // run after a tick so browser restore states have settled
    window.addEventListener('pageshow', () => {
      // pageshow also fires on bfcache restore; clear states there too
      setTimeout(clearActiveStates, 40);
    });

    // also on initial load
    setTimeout(clearActiveStates, 40);

    // make CTA become active only when user clicks it or on successful copy
    const ctaBtn = document.querySelector('.btn.primary');
    if(ctaBtn){
      // ensure it doesn't have "active" by default
      ctaBtn.classList.remove('active');

      // existing click behavior might be implemented elsewhere; wrap to toggle visual active state
      ctaBtn.addEventListener('click', async (ev) => {
        // quick guard: only toggle visual state, do not trigger generation logic here
        // add .active immediately to give feedback
        ctaBtn.classList.add('active');

        // remove .active after a short delay so style returns (unless you want it persistent)
        clearTimeout(ctaBtn._rem);
        ctaBtn._rem = setTimeout(()=> ctaBtn.classList.remove('active'), 1400);
      });

      // if you prefer to show active only on successful copy, listen on copy events:
      // example: when copy happens (copyBtn handler above), set active for short time
      if(copyBtn){
        copyBtn.addEventListener('click', ()=>{
          const btn = document.querySelector('.btn.primary');
          if(!btn) return;
          btn.classList.add('active');
          clearTimeout(btn._rem);
          btn._rem = setTimeout(()=> btn.classList.remove('active'), 1400);
        });
      }
    }
  })();

  // end of main IIFE
})();
