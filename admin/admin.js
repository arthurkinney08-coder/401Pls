
// Admin Rounds & Windows (ET input → UTC storage)
(async () => {
  await requireAdmin();
  const roundsEl = document.getElementById('rounds');
  const windowsEl = document.getElementById('windows');
  document.getElementById('logout-btn').onclick = doLogout;

  async function loadRounds() {
    
const roundsEl = document.getElementById('rounds');
  if (!roundsEl) return;  // ← add this guard

    const { data, error } = await sb.from('playoff_rounds').select('*').order('order_index');
    if (error) { alert(error.message); return; }
    roundsEl.innerHTML = '';
    (data || []).forEach((r) => {
      const row = document.createElement('div');
      row.className = 'team-item';
      row.innerHTML = `
        <div>
          <strong>${r.order_index}. ${r.round_name}</strong>
          <div class="muted">Open: ${r.is_open ? 'Yes' : 'No'} · Active: ${r.is_active ? 'Yes' : 'No'} · Finalized: ${r.is_finalized ? 'Yes' : 'No'}</div>
        </div>
        <div class="team-actions">
          <button class="btn subtle" data-act="toggle-open">${r.is_open ? 'Close' : 'Open'}</button>
          <button class="btn subtle" data-act="toggle-active">${r.is_active ? 'Deactivate' : 'Activate'}</button>
          <button class="btn subtle" data-act="toggle-final">${r.is_finalized ? 'Unfinalize' : 'Finalize'}</button>
        </div>`;
      row.addEventListener('click', async (e) => {
        const t = e.target.closest('button'); 
        if (!t) return;
        const act = t.dataset.act;
        const patch = {};
        if (act === 'toggle-open') patch.is_open = !r.is_open;
        if (act === 'toggle-active') patch.is_active = !r.is_active;
        if (act === 'toggle-final') patch.is_finalized = !r.is_finalized;
        const { error: upErr } = await sb.from('playoff_rounds').update(patch).eq('id', r.id);
        if (upErr) alert(upErr.message); else loadRounds();
      });
      roundsEl.appendChild(row);
    });
  }

  async function loadWindows() {

const windowsEl = document.getElementById('windows');
  if (!windowsEl) return;   // ← add this guard

    const { data: rounds } = await sb.from('playoff_rounds').select('id, round_name, order_index').order('order_index');
    const { data: wins, error } = await sb.from('round_time_windows').select('*').order('start_at_utc');
    if (error) { alert(error.message); return; }
    windowsEl.innerHTML = '';
    (wins || []).forEach((w) => {
      const r = (rounds || []).find((x) => x.id === w.round_id);
      const row = document.createElement('div');
      row.className = 'team-item';
      const et = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' })
        .format(new Date(w.start_at_utc));
      row.innerHTML = `
        <div>
          <strong>${r ? r.round_name : 'Round'} — ${w.label}</strong>
          <div class="muted">Starts (ET): ${et}</div>
        </div>
        <div class="team-actions">
          <button class="btn subtle" data-act="edit">Edit</button>
          <button class="btn danger" data-act="delete">Delete</button>
        </div>`;
      row.addEventListener('click', async (e) => {
        const t = e.target.closest('button'); 
        if (!t) return;
        if (t.dataset.act === 'delete') {
          if (confirm('Delete this window?')) {
            await sb.from('round_time_windows').delete().eq('id', w.id);
            loadWindows();
          }
          return;
        }
        if (t.dataset.act === 'edit') {
          const label = prompt('Label (e.g., 1:00 PM ET)', w.label) || w.label;
          const hhmm = prompt('Time in ET (HH:MM or 1:00 PM)', '13:00');
          if (!hhmm) return;
          const startUtc = toUTC(hhmm);
          const { error: upErr } = await sb.from('round_time_windows').update({ label, start_at_utc: startUtc }).eq('id', w.id);
          if (upErr) alert(upErr.message); else loadWindows();
        }
      });
      windowsEl.appendChild(row);
    });
  }


async function renderPoolLocks() {
  // 1) Find the target box on /admin/admin.html
  const box = document.getElementById('locks');
  if (!box) return; // this page doesn't have the locks box

  // 2) Fetch the pools
  const { data, error } = await sb
    .from('pool_settings')
    .select('pool_type, display_name, is_locked')
    .order('pool_type');

  if (error) { 
    box.innerHTML = `<div class="muted">Error loading locks: ${error.message}</div>`;
    return;
  }

  // 3) Render aligned rows with clickable toggles
  box.innerHTML = (data || []).map(r => `
    <div class="lock-row" data-pool="${r.pool_type}" style="
      display:flex;align-items:center;justify-content:space-between;
      padding:6px 8px;border-bottom:1px solid #2a2a2a">
      <span style="display:block;max-width:75%;overflow:hidden;text-overflow:ellipsis;">
        ${r.display_name || r.pool_type}
      </span>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" class="lock-toggle" ${r.is_locked ? 'checked' : ''} />
      </label>
    </div>
  `).join('');

  // 4) Wire the toggles
  box.querySelectorAll('.lock-row .lock-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      const row = e.target.closest('.lock-row');
      const poolType = row.getAttribute('data-pool');
      const next = e.target.checked;

      // Optimistic UI: if save fails, we’ll revert it
      const { error: upErr } = await sb
        .from('pool_settings')
        .update({ is_locked: next })
        .eq('pool_type', poolType);

      if (upErr) {
        alert(`Failed to update: ${upErr.message}`);
        e.target.checked = !next; // revert toggle
      }
    });
  });
}
  
  
async function renderTeams() {
  // 1) Grab the container elements on /admin/admin.html
  const list = document.getElementById('team-list');
  const empty = document.getElementById('team-empty');
  const search = document.getElementById('team-search');
  const poolSel = document.getElementById('team-pool');

  if (!list || !empty || !search || !poolSel) return; // this page doesn't have the Teams UI

  // 2) Build the base query; filter by pool if a specific pool is picked
  let q = sb.from('teams')
    // if you have a 'pool_type' column on teams, select it here:
    .select('id, name, pool_type, user_id, profiles:profiles(email)');

  const poolVal = poolSel.value; // e.g., "all" or "survivor", "cfp-bracket", etc.
  if (poolVal && poolVal !== 'all') {
    q = q.eq('pool_type', poolVal);
  }

  // Optional: apply search by team name or email if you add that join later.
  const term = search.value?.trim();
  // For now, just name search. If you also want email, we’ll join profiles next.
 
if (term) {
  q = q.or(`name.ilike.%${term}%,profiles.email.ilike.%${term}%`);
}


  // 3) Fetch
  const { data, error } = await q.order('name', { ascending: true });
  if (error) {
    list.innerHTML = `<div class="muted" style="padding:8px">Error loading teams: ${error.message}</div>`;
    empty.hidden = true;
    return;
  }

  // 4) Render
  const rows = (data || []);
  empty.hidden = rows.length > 0;
  list.innerHTML = rows.map(t => `
    <div class="team-item" data-id="${t.id}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #2a2a2a">
      
<div>
  <strong>${t.name}</strong>
  <div class="muted" style="font-size:12px">
    ${t.pool_type ? `${t.pool_type} · ` : ''}${t.profiles?.email || 'no-email'}
  </div>
</div>

      <div class="team-actions" style="display:flex;gap:8px">
        <button class="btn subtle" data-act="rename">Rename</button>
        <button class="btn danger" data-act="delete">Delete</button>
      </div>
    </div>
  `).join('');

  // 5) Wire actions (rename/delete)
  list.querySelectorAll('.team-actions .btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const item = e.target.closest('.team-item');
      const id = item.getAttribute('data-id');
      const act = e.target.dataset.act;

      if (act === 'rename') {
        const newName = prompt('New team name?', item.querySelector('strong').textContent);
        if (!newName) return;
        const { error: upErr } = await sb.from('teams').update({ name: newName }).eq('id', id);
        if (upErr) { alert(upErr.message); return; }
        renderTeams();
      }

      if (act === 'delete') {
        if (!confirm('Delete this team?')) return;
        const { error: delErr } = await sb.from('teams').delete().eq('id', id);
        if (delErr) { alert(delErr.message); return; }
        renderTeams();
      }
    });
  });

  // 6) Re-render when user types or changes pool filter
  // (Attach once per page load; safe if attached multiple times)
  search.oninput = () => renderTeams();
  poolSel.onchange = () => renderTeams();
}

  
  
  // Simple ET → UTC converter for today's date
  function toUTC(hhmm) {
    try {
      const today = new Date();
      const parts = hhmm.trim();
      let [hStr, mRest] = parts.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt((mRest || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const ampmMatch = (hhmm.match(/am|pm|AM|PM/) || [''])[0].toLowerCase();
      if (ampmMatch === 'pm' && h < 12) h += 12;
      if (ampmMatch === 'am' && h === 12) h = 0;

      // Build a Date for ET and then convert to ISO (UTC)
      const etGuess = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), h, m));
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const partsArr = fmt.formatToParts(etGuess);
      const obj = Object.fromEntries(partsArr.map((p) => [p.type, p.value]));
      // NOTE: The -05:00 is a simplification; good enough for initial admin testing.
      const etISO = `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:00-05:00`;
      return new Date(etISO).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }

  
const addRoundBtn = document.getElementById('add-round');
if (addRoundBtn) {
  addRoundBtn.onclick = async () => {
    const name = prompt('Round name (e.g., Wild Card)');
    if (!name) return;
    const order = parseInt(prompt('Order (1–4)', '1'), 10) || 1;
    const { error } = await sb.from('playoff_rounds').insert({ round_name: name, order_index: order });
    if (error) alert(error.message); else loadRounds();
  };
}


 
const addWindowBtn = document.getElementById('add-window');
if (addWindowBtn) {
  addWindowBtn.onclick = async () => {
    const { data: rounds } = await sb.from('playoff_rounds')
      .select('id, round_name, order_index')
      .order('order_index');
    if (!rounds || !rounds.length) { alert('Create a round first'); return; }

    const pick  = prompt('Round number to attach this window to (by order index)');
    const r     = (rounds || []).find(x => String(x.order_index) === String(pick));
    if (!r) { alert('Round not found'); return; }

    const label   = prompt('Label (e.g., 1:00 PM ET)', '1:00 PM ET') || '1:00 PM ET';
    const time    = prompt('Time in ET (e.g., 13:00 or 1:00 PM)', '13:00') || '13:00';
    const startUtc = toUTC(time);

    const { error } = await sb.from('round_time_windows')
      .insert({ round_id: r.id, label, start_at_utc: startUtc });
    if (error) alert(error.message); else loadWindows();
  };
}


  await loadRounds();
  await loadWindows();
await renderPoolLocks();
await renderTeams();

})();
