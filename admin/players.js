// Admin — Players Manager (Sleeper API sync + manual add/edit)
(async () => {
  try { if (typeof requireAdmin === 'function') await requireAdmin(); } catch(_) {}

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try { if (typeof doLogout === "function") { await doLogout(); return; } } catch(e){}
    window.location.href = "../index.html";
  });

  // --- Form fields
  const fName = document.getElementById("p.full_name");
  const fPos  = document.getElementById("p.position");
  const fTeam = document.getElementById("p.team");
  const fDate = document.getElementById("p.game_date");
  const fTime = document.getElementById("p.game_time");
  const btnSave  = document.getElementById("p.save");
  const btnReset = document.getElementById("p.reset");
  const btnSync  = document.getElementById("p.sync");

  const sSearch  = document.getElementById("s.search");
  const sPos     = document.getElementById("s.position");
  const tbody    = document.querySelector("#playersTable tbody");
  const empty    = document.getElementById("empty");

  let editId = null;

  // ── Helpers ──────────────────────────────────────────────
  function escapeHtml(s) {
    return (s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function resetForm() {
    editId = null;
    fName.value = "";
    fPos.value = "QB";
    fTeam.value = "";
    if (fDate) fDate.value = "";
    if (fTime) fTime.value = "";
  }

  function etToUtcISO(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    let hh = 0, mm = 0, t = timeStr.trim();
    const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) { hh = +m24[1]; mm = +m24[2]; }
    else {
      const m12 = t.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
      if (!m12) return null;
      hh = +m12[1]; mm = +m12[2];
      const ampm = m12[3].toLowerCase();
      if (ampm === 'pm' && hh < 12) hh += 12;
      if (ampm === 'am' && hh === 12) hh = 0;
    }
    const [y, mo, d] = dateStr.split("-").map(Number);
    const etDate = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
    const offsetGuess = "-05:00";
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).formatToParts(etDate);
    const parts = Object.fromEntries(fmt.map(p => [p.type, p.value]));
    const finalET = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00${offsetGuess}`;
    return new Date(finalET).toISOString();
  }

  // ── Load players ─────────────────────────────────────────
  async function loadPlayers() {
    let q = sb.from("players")
      .select("id, full_name, position, team, game_start_utc, sport")
      .order("full_name");
    if (sPos?.value) q = q.eq("position", sPos.value);
    if (sSearch?.value) q = q.ilike("full_name", `%${sSearch.value}%`);

    const { data, error } = await q;
    if (error) { alert(error.message); return; }

    const rows = data ?? [];
    if (empty) empty.hidden = rows.length > 0;

    tbody.innerHTML = rows.map(p => {
      const et = p.game_start_utc
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Toronto",
            dateStyle: "medium",
            timeStyle: "short"
          }).format(new Date(p.game_start_utc))
        : "—";
      return `
        <tr data-id="${p.id}">
          <td>${escapeHtml(p.full_name)}</td>
          <td>${p.position || ""}</td>
          <td>${p.team || ""}</td>
          <td>${et}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn--ghost btn--sm" data-act="edit">Edit</button>
              <button class="btn btn--ghost-danger btn--sm" data-act="del">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll("button").forEach(btn => {
      btn.onclick = async (e) => {
        const tr = e.target.closest("tr");
        const id = tr.dataset.id;
        const act = e.target.dataset.act;

        if (act === "edit") {
          const { data, error } = await sb.from("players").select("*").eq("id", id).single();
          if (error) { alert(error.message); return; }
          editId = data.id;
          fName.value = data.full_name || "";
          fPos.value = data.position || "QB";
          fTeam.value = data.team || "";
          if (data.game_start_utc && fDate && fTime) {
            const d = new Date(data.game_start_utc);
            fDate.value = d.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
            fTime.value = d.toLocaleTimeString("en-GB", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", hour12: false });
          }
        }

        if (act === "del") {
          if (!confirm("Delete this player?")) return;
          const { error } = await sb.from("players").delete().eq("id", id);
          if (error) { alert(error.message); return; }
          loadPlayers();
        }
      };
    });
  }

  // ── Save player ───────────────────────────────────────────
  async function savePlayer() {
    const payload = {
      full_name: (fName.value || "").trim(),
      position: fPos.value,
      team: ((fTeam.value || "").trim()) || null,
      sport: 'nfl',
    };
    if (!payload.full_name) { alert("Enter player name"); return; }
    if (fDate && fTime) {
      payload.game_start_utc = etToUtcISO(fDate.value, fTime.value);
    }

    let error;
    if (editId) ({ error } = await sb.from("players").update(payload).eq("id", editId));
    else ({ error } = await sb.from("players").insert(payload));
    if (error) { alert(error.message); return; }

    resetForm();
    loadPlayers();
  }

  // ── Sleeper Sync ──────────────────────────────────────────
  async function syncFromSleeper() {
    btnSync.disabled = true;
    btnSync.textContent = "Syncing...";

    try {
      // Sleeper returns ALL NFL players — it's a big file ~5MB
      const res = await fetch("https://api.sleeper.app/v1/players/nfl");
      const all = await res.json();

      // Filter to only active skill position players
      const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];
      const active = Object.values(all).filter(p =>
        p.active &&
        p.full_name &&
        POSITIONS.includes(p.position) &&
        p.team // must be on a team
      );

      // Upsert into Supabase in batches of 100
      let count = 0;
      const BATCH = 100;
      for (let i = 0; i < active.length; i += BATCH) {
        const batch = active.slice(i, i + BATCH).map(p => ({
          full_name: p.full_name,
          position: p.position === "DEF" ? "DST" : p.position,
          team: p.team,
          sport: "nfl",
          external_id: p.player_id,
          is_active: true,
        }));

        const { error } = await sb.from("players")
          .upsert(batch, { onConflict: "external_id" });

        if (error) {
          console.error("Batch error:", error);
        } else {
          count += batch.length;
        }

        // Update button to show progress
        btnSync.textContent = `Syncing... ${count} players`;
      }

      alert(`✅ Sync complete! ${count} NFL players imported.`);
      loadPlayers();

    } catch (err) {
      alert("Sync failed: " + err.message);
      console.error(err);
    } finally {
      btnSync.disabled = false;
      btnSync.textContent = "Sync Players";
    }
  }

  // ── Wire up ───────────────────────────────────────────────
  btnSave.onclick = savePlayer;
  btnReset.onclick = resetForm;
  btnSync.onclick = syncFromSleeper;
  sSearch?.addEventListener("input", loadPlayers);
  sPos?.addEventListener("change", loadPlayers);

  await loadPlayers();
})();