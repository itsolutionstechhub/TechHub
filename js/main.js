// Global Script for Tech Nexus Portal
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  
  // Default fallback configurations
  let categories = [
    { id: 'news', name: 'Tech News' },
    { id: 'repairs', name: 'Repair Articles' },
    { id: 'store', name: 'Store' }
  ];

  let menuConfig = [
    { id: 'home', name: 'Home', url: 'index.html', visible: true },
    { id: 'news', name: 'Tech News', url: 'news.html', visible: true },
    { id: 'repairs', name: 'Repair Guides', url: 'repairs.html', visible: true },
    { id: 'store', name: 'Store', url: 'store.html', visible: true },
    { id: 'admin', name: 'Admin Portal', url: 'admin.html', visible: true }
  ];

  let siteConfig = { name: 'TechNexus', logoUrl: '' };
  
  // Try fetching dynamic parameters from database
  if (window.dbService) {
    try {
      categories = await window.dbService.getCategories();
      menuConfig = await window.dbService.getMenuConfig();
      siteConfig = await window.dbService.getSiteConfig();
    } catch (error) {
      console.error("Could not fetch configurations for header/footer rendering:", error);
    }
  }

  // Set document title suffix dynamically if on details page
  const pageTitle = document.title;
  if (pageTitle.includes('TechNexus')) {
    document.title = pageTitle.replace('TechNexus', siteConfig.name);
  }

  renderHeader(categories, menuConfig, siteConfig);
  renderFooter(categories, siteConfig);
  setupNavigation();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark mode for premium look
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  if (theme === 'light') {
    btn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    `;
    btn.title = "Switch to Dark Mode";
  } else {
    btn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
      </svg>
    `;
    btn.title = "Switch to Light Mode";
  }
}

// Shared Header Injection with Dynamic Labels & Visibility Flags
function renderHeader(categories, menuConfig, siteConfig) {
  const header = document.querySelector('header');
  if (!header) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  // Filter only visible links and build elements list
  const activeLinks = menuConfig
    .filter(item => item.visible)
    .map(item => {
      let displayName = item.name;
      // If it's a category page, keep name synced with custom category display name
      if (item.id === 'news' || item.id === 'repairs' || item.id === 'store') {
        const cat = categories.find(c => c.id === item.id);
        if (cat) displayName = cat.name;
      }
      return `<li><a href="${item.url}" class="${currentPath === item.url ? 'active' : ''}">${escapeHtml(displayName)}</a></li>`;
    })
    .join('');

  // Dynamically configure branding logo
  const logoBranding = siteConfig.logoUrl 
    ? `<img src="${siteConfig.logoUrl}" alt="${escapeHtml(siteConfig.name)}" style="height: 32px; max-width: 160px; object-fit: contain;">`
    : `<span class="logo-icon"></span>`;

  header.innerHTML = `
    <div class="nav-container">
      <a href="index.html" class="logo" style="display: flex; align-items: center; gap: 0.75rem;">
        ${logoBranding}
        <span>${escapeHtml(siteConfig.name)}</span>
      </a>
      
      <button class="mobile-nav-toggle" id="mobile-toggle" aria-label="Toggle Navigation">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      <ul class="nav-links" id="nav-links">
        ${activeLinks}
      </ul>

      <div class="nav-actions">
        <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle Theme"></button>
      </div>
    </div>
  `;

  // Hook toggle button click
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Update icon after render
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeToggleIcon(currentTheme);
}

// Shared Footer Injection with Dynamic Labels
function renderFooter(categories, siteConfig) {
  const footer = document.querySelector('footer');
  if (!footer) return;

  const newsLabel = categories.find(c => c.id === 'news')?.name || 'Tech News';
  const repairsLabel = categories.find(c => c.id === 'repairs')?.name || 'Repair Guides';
  const storeLabel = categories.find(c => c.id === 'store')?.name || 'Store';

  const logoBranding = siteConfig.logoUrl 
    ? `<img src="${siteConfig.logoUrl}" alt="${escapeHtml(siteConfig.name)}" style="height: 32px; max-width: 160px; object-fit: contain;">`
    : `<span class="logo-icon"></span>`;

  footer.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col footer-about">
        <a href="index.html" class="logo" style="display: flex; align-items: center; gap: 0.75rem;">
          ${logoBranding}
          <span>${escapeHtml(siteConfig.name)}</span>
        </a>
        <p>Your premium source for cutting-edge technology news, hands-on hardware repair tutorials, file downloads, and custom accessories.</p>
      </div>
      
      <div class="footer-col">
        <h3>Categories</h3>
        <ul class="footer-links">
          <li><a href="news.html">${escapeHtml(newsLabel)}</a></li>
          <li><a href="repairs.html">${escapeHtml(repairsLabel)}</a></li>
          <li><a href="store.html">${escapeHtml(storeLabel)}</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h3>Legal & Info</h3>
        <ul class="footer-links">
          <li><a href="about.html">About Us</a></li>
          <li><a href="contact.html">Contact Us</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms & Conditions</a></li>
          <li><a href="disclaimer.html">Disclaimer</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(siteConfig.name)}. All rights reserved. Optimized for high-speed AdSense monetization.</p>
      <p>Designed with visual excellence</p>
    </div>
  `;
}


function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Mobile Toggle Navigation Logic
function setupNavigation() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// Search and filtering utility helper
function performClientSearch(posts, query) {
  if (!query) return posts;
  const q = query.toLowerCase().trim();
  return posts.filter(post => 
    post.title.toLowerCase().includes(q) || 
    post.description.toLowerCase().includes(q) ||
    post.category.toLowerCase().includes(q)
  );
}

window.performClientSearch = performClientSearch;
