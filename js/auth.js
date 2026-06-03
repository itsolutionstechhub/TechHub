// Simple Authentication script for the Admin Portal

const DEFAULT_ADMIN_PASSCODE = 'admin123'; // Default passcode - easily changeable

function isAuthenticated() {
  return sessionStorage.getItem('admin_authenticated') === 'true';
}

function authenticate(passcode) {
  if (passcode === DEFAULT_ADMIN_PASSCODE) {
    sessionStorage.setItem('admin_authenticated', 'true');
    return true;
  }
  return false;
}

function logoutAdmin() {
  sessionStorage.removeItem('admin_authenticated');
  window.location.reload();
}

// Function to enforce auth on admin.html
function checkAdminAuth() {
  const container = document.getElementById('admin-portal-container');
  if (!container) return;

  if (isAuthenticated()) {
    container.style.display = 'block';
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay) authOverlay.remove();
  } else {
    container.style.display = 'none';
    renderAuthOverlay();
  }
}

// Render visual overlay modal for password entry
function renderAuthOverlay() {
  if (document.getElementById('auth-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--bg-primary);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  overlay.innerHTML = `
    <div class="content-wrapper" style="width: 100%; max-width: 400px; text-align: center; box-shadow: var(--shadow-lg);">
      <div class="logo" style="justify-content: center; margin-bottom: 2rem;">
        <span class="logo-icon"></span>
        TechNexus Admin
      </div>
      <h2 style="margin-bottom: 1rem;">Administrator Portal</h2>
      <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.9rem;">Please enter your secret administrator passcode to proceed.</p>
      
      <div id="auth-error-msg" style="color: #ef4444; font-size: 0.85rem; margin-bottom: 1rem; display: none; font-weight: 500;">
        Incorrect passcode. Please try again.
      </div>

      <form id="admin-auth-form" onsubmit="handleAuthSubmit(event)">
        <div class="form-group" style="text-align: left;">
          <label class="form-label" for="passcode-input">Passcode</label>
          <input type="password" id="passcode-input" class="form-control" placeholder="Enter password (default: admin123)" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Login</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('passcode-input');
  const errorMsg = document.getElementById('auth-error-msg');
  
  if (authenticate(input.value)) {
    checkAdminAuth();
  } else {
    if (errorMsg) errorMsg.style.display = 'block';
    input.value = '';
    input.focus();
  }
}

// Bind auth to global object
window.checkAdminAuth = checkAdminAuth;
window.logoutAdmin = logoutAdmin;
window.handleAuthSubmit = handleAuthSubmit;
window.isAuthenticated = isAuthenticated;
