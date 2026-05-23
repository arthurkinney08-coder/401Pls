// js/send_pick_email_patch.js
// Sends the pick confirmation email via Supabase Edge Function.
// Adds explicit Authorization header so the function always receives a JWT.

;(function () {
  'use strict';

  function getClient() {
    // Prefer window.sb (set by lineup page), else fallback to window.supabaseClient
    if (window.sb && window.sb.functions && typeof window.sb.functions.invoke === 'function') return window.sb;
    if (window.supabaseClient && window.supabaseClient.functions && typeof window.supabaseClient.functions.invoke === 'function') return window.supabaseClient;
    return null;
  }

  function showSummaryToastSafe(msg, kind, ms) {
    if (typeof window.showSummaryToast === 'function') {
      try { window.showSummaryToast(msg, kind || 'ok', ms || 1600); } catch (_) {}
    }
  }

  async function sendPickEmail(entryId) {
    try {
      var client = getClient();
      if (!client) {
        console.warn('[email] Supabase client not ready');
        showSummaryToastSafe('Email not sent (client).', 'warn', 1800);
        return;
      }
      if (!entryId) {
        showSummaryToastSafe('Email not sent (no entry id).', 'warn', 1800);
        return;
      }

      // Ensure session is fresh (ignore errors)
      try { await client.auth.refreshSession(); } catch (_) {}

      // Current window: null == "All Players"
      var wid = null;
      try {
        if (window.state) wid = (window.state.windowId === '__ALL__') ? null : window.state.windowId;
      } catch (_) {}

      // Fetch the current access token explicitly
      var sessionRes = null, token = null;
      try { sessionRes = await client.auth.getSession(); } catch (_) {}
      if (sessionRes && sessionRes.data && sessionRes.data.session) {
        token = sessionRes.data.session.access_token || null;
      }

      // Attach Authorization header explicitly for the Edge Function
      var headers = {};
      if (token) {
        headers.Authorization = 'Bearer ' + token;
        headers['X-Client-Auth'] = token; // optional extra header that the function accepts
      }

      var result = await client.functions.invoke('send-pick-confirmation', {
        body: { entry_id: entryId, window_id: wid },
        headers: headers
      });

      if (result && result.error) {
        console.warn('[email] invoke error:', result.error);
        var code = Number(result.error.status || 0);
        var msg =
          (code === 401) ? 'Email not sent (auth). Re-login.' :
          (code === 404) ? 'Email function not found.' :
          (code === 500) ? 'Email provider error.' :
          'Email failed.';
        showSummaryToastSafe(msg, 'warn', 2000);
        return;
      }

      showSummaryToastSafe('Confirmation email sent', 'ok', 1500);
    } catch (e) {
      console.warn('[email] invoke threw:', e);
      showSummaryToastSafe('Email not sent (network)', 'warn', 2000);
    }
  }

  // Expose globally (overwrites any older inline version)
  window.sendPickEmail = sendPickEmail;
})();