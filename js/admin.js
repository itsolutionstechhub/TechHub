// Admin Portal Business Logic
document.addEventListener('DOMContentLoaded', () => {
  // Check authorization first
  if (typeof window.checkAdminAuth === 'function') {
    window.checkAdminAuth();
  }
  
  initAdminDashboard();
});

let uploadedImagesData = [];

async function initAdminDashboard() {
  const categorySelect = document.getElementById('post-category');
  const storePriceGroup = document.getElementById('store-price-group');
  const postForm = document.getElementById('add-post-form');
  const logoutBtn = document.getElementById('logout-admin-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to log out of the admin panel?")) {
        window.logoutAdmin();
      }
    });
  }

  // Load and populate category display parameters
  await loadCategorySettings();

  // Load and populate menu visibility configurations
  await loadMenuConfigSettings();

  // Load and populate site branding settings
  await loadBrandingSettings();

  // Toggles the price fields dynamically if category === 'store'
  if (categorySelect && storePriceGroup) {
    categorySelect.addEventListener('change', () => {
      if (categorySelect.value === 'store') {
        storePriceGroup.style.display = 'block';
        document.getElementById('post-price').setAttribute('required', 'true');
      } else {
        storePriceGroup.style.display = 'none';
        document.getElementById('post-price').removeAttribute('required');
      }
    });
  }

  // Hook branding logo input
  const logoInput = document.getElementById('brand-logo-file');
  if (logoInput) {
    logoInput.addEventListener('change', handleLogoPreview);
  }

  // Hook image file input events for preview
  for (let i = 1; i <= 4; i++) {
    const fileInput = document.getElementById(`post-img-${i}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleImagePreview(e, i));
    }
  }

  // Submit Handler
  if (postForm) {
    postForm.addEventListener('submit', handlePostSubmit);
  }

  // Render current list of posts
  loadAdminPosts();
}

// Fetch categories, populate create drop-down & fill configuration inputs
async function loadCategorySettings() {
  const categorySelect = document.getElementById('post-category');
  const inputNews = document.getElementById('cat-name-news');
  const inputRepairs = document.getElementById('cat-name-repairs');
  const inputStore = document.getElementById('cat-name-store');

  try {
    const cats = await window.dbService.getCategories();

    // Populate dropdown
    if (categorySelect) {
      categorySelect.innerHTML = cats.map(c => `
        <option value="${c.id}">${escapeHtml(c.name)}</option>
      `).join('');
    }

    // Set input values
    cats.forEach(cat => {
      const input = document.getElementById(`cat-name-${cat.id}`);
      if (input) {
        input.value = cat.name;
      }
    });

  } catch (error) {
    console.error("Failed to load category settings:", error);
  }
}

// Handle category display name changes
async function handleUpdateCategory(id) {
  const input = document.getElementById(`cat-name-${id}`);
  if (!input) return;

  const newName = input.value.trim();
  if (!newName) {
    alert("Category name cannot be empty.");
    return;
  }

  try {
    await window.dbService.updateCategoryName(id, newName);
    alert(`Category renamed to "${newName}" successfully!`);
    
    // Refresh dropdown selections dynamically
    await loadCategorySettings();
    // Refresh menu configuration names
    await loadMenuConfigSettings();
  } catch (error) {
    console.error("Failed to update category name:", error);
    alert("Could not update category name.");
  }
}

// Global cached copy of active menu config loaded from DB
let currentMenuConfig = [];

// Load dynamic menu items and render checkboxes
async function loadMenuConfigSettings() {
  const container = document.getElementById('menu-checkbox-container');
  if (!container) return;

  try {
    const cats = await window.dbService.getCategories();
    currentMenuConfig = await window.dbService.getMenuConfig();

    container.innerHTML = '';
    currentMenuConfig.forEach(item => {
      // Resolve display name for categories dynamically
      let displayName = item.name;
      if (item.id === 'news' || item.id === 'repairs' || item.id === 'store') {
        const cat = cats.find(c => c.id === item.id);
        if (cat) displayName = cat.name;
      }

      const div = document.createElement('div');
      div.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: var(--bg-tertiary);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1px solid var(--border-color);
      `;
      
      div.innerHTML = `
        <input type="checkbox" id="menu-check-${item.id}" ${item.visible ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
        <label for="menu-check-${item.id}" style="cursor: pointer; font-size: 0.95rem; font-weight: 500; color: var(--text-primary);">${escapeHtml(displayName)}</label>
      `;
      container.appendChild(div);
    });

  } catch (error) {
    console.error("Failed to load menu visibility parameters:", error);
  }
}

// Process and save custom visibility states
async function handleSaveMenuConfig(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Saving configuration...';

  try {
    const updatedConfig = currentMenuConfig.map(item => {
      const checkbox = document.getElementById(`menu-check-${item.id}`);
      return {
        ...item,
        visible: checkbox ? checkbox.checked : item.visible
      };
    });

    await window.dbService.saveMenuConfig(updatedConfig);
    alert("Menu visibility configuration updated successfully! Refresh any page to see the new layout.");
    
    // Reload local components
    await loadMenuConfigSettings();

  } catch (error) {
    console.error("Failed to save menu configurations:", error);
    alert("Could not update menu visibility.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Global cached copy of branding configuration
let currentSiteConfig = { name: 'TechNexus', logoUrl: '' };
let uploadedLogoFile = null;

// Load website branding configs
async function loadBrandingSettings() {
  const nameInput = document.getElementById('brand-site-name');
  const previewImg = document.getElementById('logo-preview-img');
  const placeholder = document.getElementById('logo-preview-ph');

  try {
    currentSiteConfig = await window.dbService.getSiteConfig();

    if (nameInput) {
      nameInput.value = currentSiteConfig.name;
    }

    if (currentSiteConfig.logoUrl && previewImg && placeholder) {
      previewImg.src = currentSiteConfig.logoUrl;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';
    }

  } catch (error) {
    console.error("Failed to load branding configurations:", error);
  }
}

// Preview site branding logo before uploading
function handleLogoPreview(event) {
  const file = event.target.files[0];
  const previewImg = document.getElementById('logo-preview-img');
  const placeholder = document.getElementById('logo-preview-ph');

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg && placeholder) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        
        uploadedLogoFile = file;
      }
    };
    reader.readAsDataURL(file);
  }
}

// Save site name and upload logo image file
async function handleSaveBranding(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Uploading assets and saving...';

  try {
    const siteName = document.getElementById('brand-site-name').value.trim();
    if (!siteName) {
      alert("Website name cannot be empty.");
      return;
    }

    let finalLogoUrl = currentSiteConfig.logoUrl || '';

    // If they chose a new logo file, upload it
    if (uploadedLogoFile) {
      finalLogoUrl = await window.dbService.uploadImage(uploadedLogoFile);
    }

    const brandingPayload = {
      name: siteName,
      logoUrl: finalLogoUrl
    };

    await window.dbService.saveSiteConfig(brandingPayload);
    alert("Website branding updated successfully! Refresh any page to see the new layout.");

    // Update locally cached info and refresh header/footer dynamically
    uploadedLogoFile = null;
    await loadBrandingSettings();
    
    // Refresh main headers dynamically on current admin page
    if (typeof window.location.reload === 'function') {
      window.location.reload();
    }

  } catch (error) {
    console.error("Failed to save site branding configuration:", error);
    alert("Could not update site branding.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}



// Handle local image file previews before sending them to the DB
function handleImagePreview(event, slotIndex) {
  const file = event.target.files[0];
  const previewImg = document.getElementById(`preview-img-${slotIndex}`);
  const placeholder = document.getElementById(`preview-ph-${slotIndex}`);

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg && placeholder) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Store reference file in temp uploads array
        uploadedImagesData[slotIndex - 1] = file;
      }
    };
    reader.readAsDataURL(file);
  } else {
    if (previewImg && placeholder) {
      previewImg.src = '';
      previewImg.style.display = 'none';
      placeholder.style.display = 'block';
      uploadedImagesData[slotIndex - 1] = null;
    }
  }
}


// Submit Form action
async function handlePostSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Uploading assets and saving...';

  try {
    const category = document.getElementById('post-category').value;
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-desc').value;
    const link = document.getElementById('post-link').value;
    const downloadLink = document.getElementById('post-download').value;
    const price = category === 'store' ? document.getElementById('post-price').value : '';

    // Collect all uploaded images
    const imageUrls = [];

    // Filter array to ensure we capture all 4 slots
    for (let i = 0; i < 4; i++) {
      const file = uploadedImagesData[i];
      if (file) {
        // Upload via service (handles base64 mock or live bucket paths)
        const finalUrl = await window.dbService.uploadImage(file);
        imageUrls.push(finalUrl);
      } else {
        // If they did not supply an image, add a placeholder matching the slot index
        imageUrls.push(`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop`);
      }
    }

    const postPayload = {
      category,
      title,
      description,
      images: imageUrls,
      link: link || '',
      downloadLink: downloadLink || '',
      price: price || ''
    };

    // Save to DB
    await window.dbService.createPost(postPayload);
    
    alert("Post added successfully!");
    e.target.reset();
    resetPreviews();
    loadAdminPosts();

  } catch (error) {
    console.error("Submission failed:", error);
    alert("An error occurred while creating the post. Read details in the console logs.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Reset previews
function resetPreviews() {
  uploadedImagesData = [];
  for (let i = 1; i <= 4; i++) {
    const previewImg = document.getElementById(`preview-img-${i}`);
    const placeholder = document.getElementById(`preview-ph-${i}`);
    if (previewImg && placeholder) {
      previewImg.src = '';
      previewImg.style.display = 'none';
      placeholder.style.display = 'block';
    }
  }
}

// Load and show posts inside table
async function loadAdminPosts() {
  const tbody = document.getElementById('admin-posts-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Retrieving records...</td></tr>';

  try {
    const posts = await window.dbService.getPosts();
    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No items found. Create a post to get started!</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    posts.forEach(post => {
      const tr = document.createElement('tr');
      
      const dateStr = new Date(post.createdAt).toLocaleDateString();
      const badgeClass = post.category === 'news' ? 'news' : post.category === 'repairs' ? 'repairs' : 'store';
      const categoryLabel = post.category === 'news' ? 'Tech News' : post.category === 'repairs' ? 'Repair' : 'Store';
      
      tr.innerHTML = `
        <td style="font-weight: 500;">${escapeHtml(post.title)}</td>
        <td><span class="category-badge ${badgeClass}" style="position: static;">${categoryLabel}</span></td>
        <td style="color: var(--text-tertiary);">${dateStr}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <a href="article.html?id=${post.id}" target="_blank" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">View</a>
            <button onclick="handleDeletePost('${post.id}')" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Failed to load admin posts:", error);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error retrieving posts.</td></tr>';
  }
}

// Global action handles delete clicks
async function handleDeletePost(id) {
  if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
    try {
      await window.dbService.deletePost(id);
      alert("Post deleted successfully.");
      loadAdminPosts();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Could not delete post.");
    }
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Bind to window to access in onclick handlers
window.handleDeletePost = handleDeletePost;
window.loadAdminPosts = loadAdminPosts;
window.handleUpdateCategory = handleUpdateCategory;
window.handleSaveMenuConfig = handleSaveMenuConfig;
window.handleSaveBranding = handleSaveBranding;



