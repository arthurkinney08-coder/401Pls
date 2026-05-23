// js/supabase.js
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

// Create the client — stored as BOTH "sb" and "supabaseClient"
// so every page works regardless of which name it uses
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;
window.supabaseClient = sb;

// ── Auth helpers ──────────────────────────────────────────

// Redirect to login if not signed in
window.requireAuth = async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) window.location.href = '/index.html';
  return session;
};

// Redirect to login if not an admin
window.requireAdmin = async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/index.html'; return; }
  const { data } = await sb.from('profiles').select('is_admin').eq('id', session.user.id).single();
  if (!data?.is_admin) { window.location.href = '/dashboard.html'; return; }
  return session;
};

// Sign out and go to login page
window.doLogout = async () => {
  await sb.auth.signOut();
  window.location.href = '/index.html';
};

// Get the current user's profile row
window.getProfile = async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('id, email, is_admin').eq('id', user.id).single();
  return data;
};

// ── Pool helpers ──────────────────────────────────────────

// Is this pool currently locked?
window.isPoolLocked = async (poolType) => {
  const { data } = await sb.from('pool_settings').select('is_locked').eq('pool_type', poolType).single();
  return data?.is_locked ?? true;
};

// Get all teams the current user has in a pool
window.fetchMyTeams = async (poolType) => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from('teams').select('id, name, disabled').eq('pool_type', poolType).eq('user_id', user.id).order('created_at');
  return data || [];
};

// Create a new team in a pool
window.createTeam = async (poolType, name) => {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await sb.from('teams').insert({ pool_type: poolType, name, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// Rename a team
window.renameTeam = async (teamId, newName) => {
  const { error } = await sb.from('teams').update({ name: newName }).eq('id', teamId);
  if (error) throw new Error(error.message);
};

// Delete a team
window.deleteTeam = async (teamId) => {
  const { error } = await sb.from('teams').delete().eq('id', teamId);
  if (error) throw new Error(error.message);
};

// ── Profile auto-create ───────────────────────────────────
// Makes sure every logged-in user has a profiles row
(async () => {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    await sb.from('profiles').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
  }
})();