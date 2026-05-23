import POOLS from './catalog-data.js';

const catalogEl = document.getElementById('catalog');
const searchEl  = document.getElementById('pool-search');
const sportEl   = document.getElementById('filter-sport');
const sortEl    = document.getElementById('sort-mode');

// Default rules fallback
const DEFAULT_RULES_HTML = (() => {
  const cfp = POOLS.find(p => p.id === 'cfp-bracket');
  return cfp?.rulesHtml || `<p>Rules coming soon.</p>`;
})();

/* --------------------------------------------------------
   Explicit join routes per pool id
   (uses the /pools/*.html files you listed)
--------------------------------------------------------- */
const JOIN_ROUTE_BY_ID = {
  'cfp-bracket'    : './pools/cfp-bracket.html',
  'march-madness'  : './pools/march-madness.html',
  'pick6'          : './pools/pick6.html',
  'playoff-squares': './pools/playoff-squares.html',
  'stanley-cup'    : './pools/stanley-cup.html',
  'super-bowl'     : './pools/super-bowl.html',
  'survivor'       : './pools/survivor.html',
  'weekly-pickem'  : './pools/weekly-pickem.html',
};

function normalizeRel(url) {
  const u = String(url).trim();
  if (!u) return '#';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('./') || u.startsWith('../')) return u;
  if (u.startsWith('/')) return `.${u}`; // make absolute into relative
  return `./${u}`;
}

function resolveJoinUrl(p) {
  if (p.joinHref && typeof p.joinHref === 'string') return normalizeRel(p.joinHref);
  const mapped = p?.id ? JOIN_ROUTE_BY_ID[p.id] : null;
  if (mapped) return normalizeRel(mapped);

  const id = (p.id || '').trim();
  if (id) return `./pools/${id}.html`;

  console.warn('[Join URL] Could not resolve a URL for pool:', p);
  return '#';
}

/* --------------------------------------------------------
   Card HTML (sport tag + buttons)
   IMPORTANT: Join is a proper <a> with button classes
--------------------------------------------------------- */
function cardHTML(p) {
  const joinUrl = resolveJoinUrl(p);

  return `
    <div class="card" data-pool-id="${p.id}">
      <span class="tag tag--sport">${p.sport.toUpperCase()}</span>

      <h4 style="margin-top:10px; margin-bottom:6px; font-size:18px;">
        ${p.title}
      </h4>

      <p>${p.desc}</p>

      <div class="card-actions" style="margin-top:12px;">
        <button type="button" class="btn btn--ghost btn--sm rules-btn">Rules</button>
        <a class="btn btn--ghost btn--sm join-btn" href="${joinUrl}">Join Pool</a>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------
   Render
--------------------------------------------------------- */
function render(items) {
  catalogEl.innerHTML = '';

 if (!items.length) {
    document.getElementById('empty-state').hidden = false;
    return;
  }
  document.getElementById('empty-state').hidden = true;

  const frag = document.createDocumentFragment();
  for (const p of items) {
    const wrap = document.createElement('div');
    wrap.innerHTML = cardHTML(p);
    frag.appendChild(wrap.firstElementChild);
  }
  catalogEl.appendChild(frag);
}

/* --------------------------------------------------------
   Delegated click (Rules only). Join uses plain anchor.
--------------------------------------------------------- */
catalogEl.addEventListener('click', (e) => {
  const rulesBtn = e.target.closest('.rules-btn');
  if (rulesBtn && catalogEl.contains(rulesBtn)) {
    const card   = rulesBtn.closest('[data-pool-id]');
    const poolId = card?.getAttribute('data-pool-id');
    const pool   = POOLS.find(x => x.id === poolId);
    if (pool) openRules(pool, rulesBtn);
  }
});

/* --------------------------------------------------------
   Filter + sort + render
--------------------------------------------------------- */
function apply() {
  let list = POOLS.slice();

  const q = (searchEl?.value || '').toLowerCase();
  if (q) {
    list = list.filter(p =>
      (p.title + ' ' + p.desc + ' ' + p.sport).toLowerCase().includes(q)
    );
  }

  const sport = sportEl?.value || '';
  if (sport) list = list.filter(p => p.sport === sport);

  const sort = sortEl?.value || 'title_asc';
  list.sort((a, b) => {
    if (sort === 'title_asc')  return a.title.localeCompare(b.title);
    if (sort === 'title_desc') return b.title.localeCompare(a.title);
    if (sort === 'sport_asc')
      return a.sport.localeCompare(b.sport) || a.title.localeCompare(b.title);
    if (sort === 'sport_desc')
      return b.sport.localeCompare(a.sport) || a.title.localeCompare(b.title);
    return 0;
  });

  render(list);
}

/* --------------------------------------------------------
   Rules Modal
--------------------------------------------------------- */
function openRules(p, invokerBtn) {
  const modal = document.getElementById('rules-modal');
  const title = document.getElementById('rules-title');
  const body  = document.getElementById('rules-body');

  title.textContent = `${p.title} — Rules`;
  body.innerHTML = p?.rulesHtml || DEFAULT_RULES_HTML;

  modal.classList.add('open');

  document.getElementById('rules-close')?.focus();

  modal.dataset.invoker = '';
  if (invokerBtn) {
    modal.dataset.invoker = 'set';
    modal._invoker = invokerBtn;
  }
}

/* --------------------------------------------------------
   Init
--------------------------------------------------------- */
searchEl?.addEventListener('input',  apply);
sportEl?.addEventListener('change', apply);
sortEl?.addEventListener('change',  apply);
document.addEventListener('DOMContentLoaded', apply);