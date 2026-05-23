
// Admin — Roster Editor
(async () => {
  await requireAdmin();
  document.getElementById('logout-btn').onclick = doLogout;

  const POS = ['QB','RB','WR','TE','FLEX','K','DST'];

  function setDefaultsUI(){
    document.getElementById('qty.QB').value = 1;
    document.getElementById('qty.RB').value = 2;
    document.getElementById('qty.WR').value = 2;
    document.getElementById('qty.TE').value = 1;
    document.getElementById('qty.FLEX').value = 1;
    document.getElementById('qty.K').value  = 1;
    document.getElementById('qty.DST').value = 1;
    document.querySelectorAll('.flex-allow').forEach(chk=> chk.checked = ['RB','WR','TE'].includes(chk.value));
  }

  async function loadCurrent(){
    const { data, error } = await sb.from('roster_settings').select('*');
    if (error) { alert(error.message); return; }
    const byPos = {};
    (data||[]).forEach(r => { byPos[r.position] = r; });

    // Quantities
    ['QB','RB','WR','TE','K','DST'].forEach(p => {
      const el = document.getElementById(`qty.${p}`);
      if (!el) return;
      el.value = byPos[p]?.quantity ?? '';
    });

    // FLEX
    const flexQty = document.getElementById('qty.FLEX');
    flexQty.value = byPos['FLEX']?.quantity ?? '';

    const allowed = byPos['FLEX']?.allowed_positions || [];
    document.querySelectorAll('.flex-allow').forEach(chk => {
      chk.checked = allowed.includes(chk.value);
    });

    // If nothing present (fresh DB), show defaults in UI (not saved yet)
    const hasAny = (data||[]).length > 0;
    if (!hasAny) setDefaultsUI();
  }

  async function saveAll(){
    try{
      // Build rows from UI
      const rows = [];
      // Standard positions
      ['QB','RB','WR','TE','K','DST'].forEach(p => {
        const qty = parseInt(document.getElementById(`qty.${p}`).value, 10) || 0;
        rows.push({ position:p, quantity: qty, is_flex: false, allowed_positions: null });
      });
      // FLEX
      const fq = parseInt(document.getElementById('qty.FLEX').value, 10) || 0;
      const allowed = Array.from(document.querySelectorAll('.flex-allow'))
        .filter(chk => chk.checked)
        .map(chk => chk.value);
      rows.push({ position:'FLEX', quantity: fq, is_flex: true, allowed_positions: allowed });

      // Persist: delete existing for these positions, then insert fresh
      const { error: delErr } = await sb.from('roster_settings').delete().in('position', POS);
      if (delErr) throw delErr;
      const { error: insErr } = await sb.from('roster_settings').insert(rows);
      if (insErr) throw insErr;
      alert('Saved.');
    }catch(e){
      alert('Save failed: ' + e.message);
    }
  }

  document.getElementById('defaults-btn').onclick = setDefaultsUI;
  document.getElementById('save-btn').onclick = saveAll;

  await loadCurrent();
})();
