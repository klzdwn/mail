// script.js — updated: no auto-press on reload, btn active only on real click/copy, floating CTA kept
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
      // visual feedback: make CTA active only on successful copy or real user click
      const cta = document.querySelector('.btn.primary');
      if(cta && ok){
        cta.classList.add('active');
        clearTimeout(cta._rem);
        cta._rem = setTimeout(()=> cta.classList.remove('active'), 1400);
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

  /* FLOATING CTA: muncul hanya saat fokus / keyboard */
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
    // keyboard heuristic
    let lastHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      const h = window.innerHeight;
      if(h < lastHeight - 100) setSticky(true);
      else if(h > lastHeight + 80) setSticky(false);
      lastHeight = h;
    });
  })();


  /* SAFEGUARDS: avoid auto-active / auto-sticky on page load or bfcache restore */
  (function(){
    // remove any autofocus attribute (prevents immediate focus)
    document.querySelectorAll('[autofocus]').forEach(el => el.removeAttribute('autofocus'));

    // clear sticky and .active states after pageshow (covers bfcache)
    function clearUIState(){
      // remove sticky container class so button tidak melayang pada load/restore
      const btnArea = document.querySelector('.btn-area');
      if(btnArea) btnArea.classList.remove('sticky');

      // normalize method buttons: remove all active then set intended defaults explicitly
      document.querySelectorAll('.method.active').forEach(b => b.classList.remove('active'));
      const defaultPlus = document.querySelector('.method[data-method="plus"]');
      const defaultLower = document.querySelector('.method[data-method="lower"]');
      if(defaultPlus) defaultPlus.classList.add('active');
      if(defaultLower) defaultLower.classList.add('active');

      // CTA should not be active by default
      const cta = document.querySelector('.btn.primary');
      if(cta) cta.classList.remove('active');

      // blur any focused button (browser sometimes restores focus)
      if(document.activeElement && document.activeElement.tagName === 'BUTTON'){
        try { document.activeElement.blur(); } catch(e){}
      }
    }

    // run shortly after load and on pageshow
    window.addEventListener('pageshow', () => setTimeout(clearUIState, 40));
    setTimeout(clearUIState, 40);

    // only allow CTA visual activation for real user interaction:
    const ctaBtn = document.querySelector('.btn.primary');
    if(ctaBtn){
      // remove existing active
      ctaBtn.classList.remove('active');

      // only add .active if the click event is trusted (user-initiated)
      ctaBtn.addEventListener('click', (ev) => {
        if(ev && ev.isTrusted){
          ctaBtn.classList.add('active');
          clearTimeout(ctaBtn._rem);
          ctaBtn._rem = setTimeout(()=> ctaBtn.classList.remove('active'), 1400);
        } else {
          // If not trusted (programmatic), don't set active class (but still allow app logic elsewhere)
        }
      });
    }

    // prevent programmatic focus/press from triggering unwanted UI on load:
    // only necessary if other scripts attempt to auto-click; if so, this avoids visual activation.
    // We DO NOT block programmatic click entirely (some app logic may rely on it).
    const nativeClick = HTMLElement.prototype.click;
    let allowSynthetic = false;
    // once user interacts, allow synthetic clicks to behave normally
    function userInteracted(){ allowSynthetic = true; window.removeEventListener('pointerdown', userInteracted); window.removeEventListener('keydown', userInteracted); }
    window.addEventListener('pointerdown', userInteracted);
    window.addEventListener('keydown', userInteracted);

    HTMLElement.prototype.click = function(...args){
      // if it's the CTA and user hasn't interacted, dispatch a non-visual click event (no focus/active)
      if(this && this.id === 'btnCreate' && !allowSynthetic){
        try {
          const ev = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
          return this.dispatchEvent(ev);
        } catch (e) {
          return nativeClick.apply(this, args);
        }
      }
      return nativeClick.apply(this, args);
    };

    window.addEventListener('beforeunload', ()=>{
      try { HTMLElement.prototype.click = nativeClick; } catch(e){}
    });
  })();

})(); // end main IIFE
