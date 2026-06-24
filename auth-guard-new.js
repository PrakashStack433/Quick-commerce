// ============================================================
// auth-guard.js — Client-side Authentication Check
// Runs on every page. Redirects to login if not authenticated.
// ============================================================

async function checkAuthentication() {
  try {
    const response = await fetch('http://localhost:3000/api/me', {
      method: 'GET',
      credentials: 'include' // Important for cookies
    });

    const data = await response.json();

    if (!data.authenticated) {
      // User not logged in → redirect to login
      console.log('Not authenticated, redirecting to login...');
      window.location.href = 'login-new.html';
      return null;
    }

    // User is authenticated
    console.log('✓ User authenticated:', data.user);
    return data.user;

  } catch (error) {
    console.error('Authentication check failed:', error);
    window.location.href = 'login-new.html';
    return null;
  }
}

// ── LOGOUT FUNCTION ──────────────────────────────────────
async function logout() {
  try {
    const response = await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      // Clear local storage
      localStorage.removeItem('qb_user_id');
      localStorage.removeItem('qb_user_email');
      localStorage.removeItem('qb_user_role');

      // Redirect to login
      window.location.href = 'login-new.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ── PROTECT PAGE ─────────────────────────────────────────
// Call this on pages that require authentication
async function protectPage() {
  const currentUser = await checkAuthentication();
  if (!currentUser) {
    return false; // User not authenticated
  }
  
  // Display user info if you want
  console.log('Current user:', currentUser);
  return true;
}

// ── ADD LOGOUT BUTTON TO PAGE ────────────────────────────
function addLogoutButton() {
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Logout';
  logoutBtn.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background: #1dc917;
    color: #000;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    z-index: 9999;
  `;
  logoutBtn.addEventListener('click', logout);
  document.body.appendChild(logoutBtn);
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  addLogoutButton();
});
