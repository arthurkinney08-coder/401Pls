
// Admin Rounds & Windows (ET input → UTC storage)
(async () => {
  await requireAdmin();
  const roundsEl = document.getElementById('rounds');
  const windowsEl = document.getElementById('windows');
  document.getElementById('logout-btn').onclick = doLogout;

  async function loadRounds() {
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

      const etGuess = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), h, m));
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      const partsArr = fmt.formatToParts(etGuess);
      const obj = Object.fromEntries(partsArr.map((p) => [p.type, p.value]));
      const etISO = `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:00-05:00`;
      return new Date(etISO).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }

  document.getElementById('add-round').onclick = async () => {
    const name = prompt('Round name (e.g., Wild Card)');
    if (!name) return;
    const order = parseInt(prompt('Order (1–4)', '1'), 10) || 1;
    const { error } = await sb.from('playoff_rounds').insert({ round_name: name, order_index: order });
    if (error) alert(error.message); else loadRounds();
  };

  document.getElementById('add-window').onclick = async () => {
    const { data: rounds } = await sb.from('playoff_rounds').select('id, round_name, order_index').order('order_index');
    if (!rounds || !rounds.length) { alert('Create a round first'); return; }
    const pick = prompt('Round number to attach this window to (by order index)');
    const r = (rounds || []).find((x) => String(x.order_index) === String(pick));
    if (!r) { alert('Round not found'); return; }
    const label = prompt('Label (e.g., 1:00 PM ET)', '1:00 PM ET') || '1:00 PM ET';
    const time = prompt('Time in ET (e.g., 13:00 or 1:00 PM)', '13:00') || '13:00';
    const startUtc = toUTC(time);
    const { error } = await sb.from('round_time_windows').insert({ round_id: r.id, label, start_at_utc: startUtc });
    if (error) alert(error.message); else loadWindows();
  };

  await loadRounds();
  await loadWindows();
})();
