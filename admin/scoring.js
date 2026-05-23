
(async () => {
  await requireAdmin();
  document.getElementById('logout-btn').onclick = doLogout;

  const inputs = Array.from(document.querySelectorAll('input'));

  async function loadAll(){
    const { data, error } = await sb.from('scoring_settings').select('*');
    if (error) return alert(error.message);
    const map = {};
    for (const row of (data||[])) map[`${row.category}.${row.stat}`] = row.value;
    for (const el of inputs){ if(map[el.id] != null){ el.value = map[el.id]; } }
  }

  async function saveOne(key){
    const [category, stat] = key.split('.');
    const el = document.getElementById(key);
    const value = parseFloat(el.value);
    if (Number.isNaN(value)) return alert('Enter a number');
    const { error } = await sb.from('scoring_settings').upsert({ category, stat, value }, { onConflict: 'category,stat' });
    if (error) alert(error.message);
  }

  document.querySelectorAll('button.save').forEach(btn => {
    btn.addEventListener('click', () => saveOne(btn.dataset.key));
  });

  await loadAll();
})();
