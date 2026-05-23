
// Admin — Players Manager
(async () => {
  await requireAdmin();
  const logout = document.getElementById('logout-btn');
  if (logout) logout.onclick = doLogout;

  // Inputs
  const fName = document.getElementById('p.full_name');
  const fPos  = document.getElementById('p.position');
  const fTeam = document.getElementById('p.team');
  const fWin  = document.getElementById('p.window');
  const btnSave = document.getElementById('p.save');
  const btnReset = document.getElementById('p.reset');

  const sSearch = document.getElementById('s.search');
  const sPos    = document.getElementById('s.position');
  const sWin    = document.getElementById('s.window');

  const tbody = document.querySelector('#playersTable tbody');
  const empty = document.getElementById('empty');

  let editId = null; // current editing player id

  function resetForm(){
    editId = null;
    fName.value = '';
    fPos.value  = 'QB';
    fTeam.value = '';
    fWin.value  = '';
  }

  async function loadWindows(){
    const { data, error } = await sb.from('round_time_windows').select('id,label,start_at_utc').order('start_at_utc');
    if (error) { alert(error.message); return; }
    const opts = ['<option value="">(none)</option>'].concat((data||[]).map(w => {
      const et = new Intl.DateTimeFormat('en-US',{timeZone:'America/Toronto', hour:'numeric', minute:'2-digit'}).format(new Date(w.start_at_utc));
      return `<option value="${w.id}">${w.label} — ${et}</option>`;
    }));
    fWin.innerHTML = opts.join('');
    sWin.innerHTML = ['<option value="">All windows</option>'].concat(opts.slice(1)).join('');
  }

  async function loadPlayers(){
    let q = sb.from('players').select('id, full_name, position, team, time_window_id, round_time_windows:round_time_windows(label,start_at_utc)');
    if (sPos.value) q = q.eq('position', sPos.value);
    if (sWin.value) q = q.eq('time_window_id', sWin.value);
    if (sSearch.value) q = q.ilike('full_name', `%${sSearch.value}%`);
    const { data, error } = await q.order('full_name');
    if (error) { alert(error.message); return; }

    const rows = (data||[]);
    empty.hidden = rows.length > 0;
    tbody.innerHTML = rows.map(p => {
      const w = p.round_time_windows ? `${p.round_time_windows.label}` : '';
      return `<tr data-id="${p.id}">
        <td>${p.full_name}</td>
        <td><span class="pill">${p.position}</span></td>
        <td>${p.team||''}</td>
        <td>${w}</td>
        <td style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn subtle" data-act="edit">Edit</button>
          <button class="btn danger" data-act="del">Delete</button>
        </td>
      </tr>`;
    }).join('');

    // Wire actions
    tbody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        const act = e.target.dataset.act;
        if (act === 'edit') {
          // load one
          const { data, error } = await sb.from('players').select('*').eq('id', id).single();
          if (error) return alert(error.message);
          editId = data.id;
          fName.value = data.full_name || '';
          fPos.value = data.position || 'QB';
          fTeam.value = data.team || '';
          fWin.value = data.time_window_id || '';
          fName.focus();
        }
        if (act === 'del') {
          if (!confirm('Delete this player?')) return;
          const { error } = await sb.from('players').delete().eq('id', id);
          if (error) return alert(error.message);
          loadPlayers();
        }
      });
    });
  }

  async function savePlayer(){
    const payload = {
      full_name: fName.value.trim(),
      position: fPos.value,
      team: fTeam.value.trim() || null,
      time_window_id: fWin.value || null,
    };
    if (!payload.full_name) return alert('Enter player name');

    if (editId){
      const { error } = await sb.from('players').update(payload).eq('id', editId);
      if (error) return alert(error.message);
    } else {
      const { error } = await sb.from('players').insert(payload);
      if (error) return alert(error.message);
    }
    resetForm();
    loadPlayers();
  }

  // Events
  btnSave.onclick = savePlayer;
  btnReset.onclick = resetForm;
  sSearch.oninput = () => loadPlayers();
  sPos.onchange = () => loadPlayers();
  sWin.onchange = () => loadPlayers();

  await loadWindows();
  await loadPlayers();
})();



// ---- Sync Players (calls the deployed Edge Function) ----
(() => {
  const btnSync = document.getElementById('p.sync');
  if (!btnSync) return;

  btnSync.onclick = async () => {
    try {
      const base = (window.SUPABASE_URL || '').replace(/\/$/, '');
      const url  = `${base}/functions/v1/sync-players`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // IMPORTANT: send the anon key so the function receives a valid JWT
          'authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ mode: 'demo' }) // demo mode; later we'll switch to provider mode
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json.ok === false) {
        throw new Error(json.error || `HTTP ${resp.status}`);
      }

      alert(`Sync complete: ${json.count || 0} rows`);
      if (typeof loadPlayers === 'function') loadPlayers();
    } catch (e) {
      alert('Sync failed: ' + e.message);
      console.error(e);
    }
  };
})();

