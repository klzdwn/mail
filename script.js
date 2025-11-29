// FINAL CLEAN JS – plusOptions full support – no floating – correct username builder
(function () {
  const $ = id => document.getElementById(id);

  // inputs
  const base = $('base');
  const suffix = $('suffix');
  const extras = $('extras');
  const dots = $('dots');
  const domains = $('domains');
  const limit = $('limit');

  // buttons
  const generateBtn = $('generate');
  const resetBtn = $('reset');
  const copyBtn = $('copy');
  const downloadBtn = $('download');
  const createBtn = $('btnCreate');

  // outputs
  const output = $('output');
  const count = $('count');

  // plusOptions
  const plusOptions = $('plusOptions');
  const plusTag = $('plusTag');
  const plusLen = $('plusLen');
  const plusLenVal = $('plusLenVal');

  //--------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------
  function parseList(s) {
    return (s || '').split(',').map(x => x.trim()).filter(Boolean);
  }

  function normalizeDomains(arr) {
    if (!arr.length) return ['@gmail.com'];
    return arr.map(d => d.startsWith('@') ? d : '@' + d);
  }

  function dotVariant(name) {
    if (name.length <= 2) return name.split('').join('.');
    return name.slice(0, 2) + '.' + name.slice(2);
  }

  // generate random text for +tag
  function rand(len, chars) {
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function randomTag(mode, length) {
    if (mode === 'numbers') return rand(length, '0123456789');
    if (mode === 'letters') return rand(length, 'abcdefghijklmnopqrstuvwxyz');
    return rand(length, 'abcdefghijklmnopqrstuvwxyz0123456789');
  }

  function getPlusMode() {
    const btn = plusOptions?.querySelector('button[data-plusmode].active');
    return btn ? btn.dataset.plusmode : 'mix';
  }

  //--------------------------------------------------------------------
  // MAIN GENERATOR
  //--------------------------------------------------------------------
  function generateList() {
    const b = (base?.value || '').trim();
    if (!b) return [];

    const sfx = (suffix?.value || '').trim();
    const extraArr = parseList(extras?.value || '');
    const domArr = normalizeDomains(parseList(domains?.value || ''));
    const useDotCheckbox = dots?.checked;
    const max = Math.max(1, Number(limit?.value) || 200);

    // read toggle methods
    const methods = {};
    document.querySelectorAll('#methodsUser .method').forEach(btn => {
      methods[btn.dataset.method] = btn.classList.contains('active');
    });

    const core = new Set();

    // normal
    core.add(b + sfx);
    core.add(b + '.' + sfx);

    // dot-mode (checkbox OR method dot active)
    if (useDotCheckbox || methods.dot) {
      core.add(dotVariant(b) + sfx);
    }

    // extras
    extraArr.forEach(e => {
      core.add(b + sfx + e);
      core.add(b + '.' + sfx + e);
      if (useDotCheckbox || methods.dot) core.add(dotVariant(b) + sfx + e);
    });

    const cores = [...core].slice(0, max);
    const out = [];

    cores.forEach(c => {
      let name = c;

      // PLUS
      if (methods.plus) {
        const custom = plusTag?.value.trim();
        if (custom) {
          name = name + '+' + custom.replace(/^\+/, '');
        } else {
          const length = Number(plusLen?.value) || 8;
          const mode = getPlusMode();
          name = name + '+' + randomTag(mode, length);
        }
      }

      // UPPER / LOWER
      if (methods.upper && !methods.lower) name = name.toUpperCase();
      else name = name.toLowerCase();

      // whitespace safety
      name = name.replace(/\s+/g, '.');

      // apply domain
      domArr.forEach(d => out.push(name + d));
    });

    return out.slice(0, 5000);
  }

  //--------------------------------------------------------------------
  // RENDER
  //--------------------------------------------------------------------
  function render(list) {
    if (count) count.textContent = `(${list.length})`;
    if (!output) return;

    if (!list.length) {
      output.textContent = "No results yet. Klik Generate.";
      return;
    }

    const ol = document.createElement('ol');
    list.forEach(x => {
      const li = document.createElement('li');
      li.textContent = x;
      li.style.wordBreak = 'break-all';
      ol.appendChild(li);
    });

    output.innerHTML = '';
    output.appendChild(ol);
  }

  //--------------------------------------------------------------------
  // BUTTON LOGIC
  //--------------------------------------------------------------------
  generateBtn?.addEventListener('click', () => render(generateList()));

  resetBtn?.addEventListener('click', () => {
    if (base) base.value = '';
    if (suffix) suffix.value = 'ber';
    if (extras) extras.value = '01,99,2025,_id,x,official,88';
    if (domains) domains.value = '@gmail.com,@googlemail.com';
    if (limit) limit.value = 200;
    if (dots) dots.checked = false;
    if (output) output.textContent = 'No results yet. Klik Generate.';
    if (count) count.textContent = '(0)';

    if (plusOptions) plusOptions.style.display = 'none';
    plusOptions?.querySelectorAll('button[data-plusmode]').forEach(b => b.classList.remove('active'));
    plusOptions?.querySelector('[data-plusmode="mix"]')?.classList.add('active');

    if (plusLen && plusLenVal) {
      plusLen.value = 12;
      plusLenVal.textContent = '12';
    }
  });

  copyBtn?.addEventListener('click', async () => {
    const txt = [...output.querySelectorAll('li')].map(li => li.textContent).join('\n');
    if (!txt) return alert('Tidak ada yang disalin.');
    try {
      await navigator.clipboard.writeText(txt);
      alert('Copied!');
      createBtn?.classList.add('active');
      setTimeout(() => createBtn?.classList.remove('active'), 900);
    } catch {
      prompt('Salin manual:', txt);
    }
  });

  downloadBtn?.addEventListener('click', () => {
    const txt = [...output.querySelectorAll('li')].map(li => li.textContent).join('\n');
    if (!txt) return alert("Tidak ada hasil.");
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'emails.txt'; a.click();
    URL.revokeObjectURL(url);
  });

  // no floating
  document.querySelector('.btn-area')?.classList.remove('sticky');

  // CTA blue only when clicked
  createBtn?.addEventListener('click', ev => {
    if (!ev.isTrusted) return;
    createBtn.classList.add('active');
    setTimeout(() => createBtn.classList.remove('active'), 900);
  });

})();
