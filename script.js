// script.js — simple username generator (client-side only)
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
    return s.split(',').map(x=>x.trim()).filter(Boolean);
  }

  function makeDotVariants(name){
    // Insert dots between characters, but avoid leading/trailing dot
    if(!name) return [];
    const chars = name.split('');
    const withDots = chars.join('.');
    return [withDots];
  }

  function generateList(){
    const base = baseInput.value.trim();
    if(!base) return [];
    const suffix = suffixInput.value.trim();
    const extras = parseList(extrasInput.value);
    const domains = parseList(domainsInput.value) || ['@gmail.com'];
    const useDots = dotsInput.checked;
    const limit = Math.max(1, Number(limitInput.value) || 200);

    const core = new Set();

    // base + suffix
    core.add(base + suffix);
    core.add(base + '.' + suffix);

    if(useDots){
      makeDotVariants(base).forEach(v => core.add(v + suffix));
    }

    extras.forEach(e => {
      core.add(base + suffix + e);
      core.add(base + '.' + suffix + e);
      if(useDots) makeDotVariants(base).forEach(v => core.add(v + suffix + e));
    });

    // limit
    const cores = Array.from(core).slice(0, limit);

    // append domains
    const out = [];
    cores.forEach(c => domains.forEach(d => out.push(c + d)));
    return out.slice(0, 5000);
  }

  function render(list){
    countEl.textContent = `(${list.length})`;
    if(list.length === 0){
      output.textContent = 'No results yet. Klik Generate.'; return;
    }
    // show as numbered list
    const ol = document.createElement('ol');
    list.forEach(item => {
      const li = document.createElement('li'); li.textContent = item; li.style.wordBreak = 'break-all'; ol.appendChild(li);
    });
    output.innerHTML = ''; output.appendChild(ol);
  }

  generateBtn.addEventListener('click', ()=>{
    const res = generateList();
    render(res);
  });

  resetBtn.addEventListener('click', ()=>{
    baseInput.value = '';
    suffixInput.value = 'ber';
    extrasInput.value = '01,99,2025,_id,x,official,88';
    domainsInput.value = '@gmail.com,@googlemail.com';
    limitInput.value = 200;
    dotsInput.checked = false;
    output.textContent = 'No results yet. Klik Generate.';
    countEl.textContent = '(0)';
  });

  copyBtn.addEventListener('click', async ()=>{
    const text = Array.from(output.querySelectorAll('li')).map(li=>li.textContent).join('\n');
    if(!text) return alert('Tidak ada yang disalin.');
    try{
      await navigator.clipboard.writeText(text);
      alert('Copied ' + text.split('\n').length + ' addresses to clipboard.');
    }catch(err){
      // fallback: select text
      prompt('Copy manually:', text);
    }
  });

  downloadBtn.addEventListener('click', ()=>{
    const text = Array.from(output.querySelectorAll('li')).map(li=>li.textContent).join('\n');
    if(!text) return alert('Tidak ada hasil untuk di-download.');
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'usernames.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // initial render
  output.textContent = 'No results yet. Klik Generate.';
/* ============================
   FLOATING BUTTON SYSTEM
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

  // ketika input fokus → tombol mengambang muncul
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

  // deteksi keyboard mobile (browser height mengecil)
  let lastHeight = window.innerHeight;
  window.addEventListener('resize', () => {
    const h = window.innerHeight;
    if(h < lastHeight - 100) {
      // keyboard muncul
      setSticky(true);
    } else if(h > lastHeight + 80) {
      // keyboard ditutup
      setSticky(false);
    }
    lastHeight = h;
  });
})();
})();
