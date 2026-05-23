
// Login
if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    window.location.href = 'dashboard.html';
  });
}

// Signup
if (document.getElementById('signup-form')) {
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Check your email to confirm your account.');
  });
}

// Reset
if (document.getElementById('reset-form')) {
  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const np = document.getElementById('new-password').value;
    const { error } = await sb.auth.updateUser({ password: np });
    if (error) alert(error.message); else document.getElementById('reset-msg').innerText = 'Password updated!';
  });
}
