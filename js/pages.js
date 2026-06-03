// Pages Rendering and Interaction Logic
window.categoryMap = {
  news: 'Tech News',
  repairs: 'Repair Articles',
  store: 'Store'
};

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch dynamic category names from the database
  await initCategoryMap();
  
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  if (currentPath === 'index.html' || currentPath === '') {
    renderHomePage();
  } else if (currentPath === 'news.html') {
    renderCategoryPage('news');
  } else if (currentPath === 'repairs.html') {
    renderCategoryPage('repairs');
  } else if (currentPath === 'store.html') {
    renderCategoryPage('store');
  } else if (currentPath === 'article.html') {
    renderDetailPage();
  }
});

async function initCategoryMap() {
  try {
    const cats = await window.dbService.getCategories();
    cats.forEach(c => {
      window.categoryMap[c.id] = c.name;
    });
  } catch (error) {
    console.error("Failed to populate category mapping:", error);
  }
}

// Render cards dynamically
function createPostCard(post) {
  const badgeClass = post.category === 'news' ? 'news' : post.category === 'repairs' ? 'repairs' : 'store';
  const categoryLabel = window.categoryMap[post.category] || post.category;
  const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  
  const coverImage = post.images && post.images.length > 0 ? post.images[0] : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop';
  
  const priceTag = post.category === 'store' && post.price ? `<div class="store-price">${escapeHtml(post.price)}</div>` : '<div></div>';

  return `
    <article class="post-card">
      <span class="category-badge ${badgeClass}">${categoryLabel}</span>
      <div class="card-image-container">
        <img class="card-image" src="${coverImage}" alt="${escapeHtml(post.title)}" loading="lazy">
      </div>
      <div class="card-content">
        <div class="card-meta">
          <time datetime="${new Date(post.createdAt).toISOString()}">${dateStr}</time>
          <span class="views-count">
            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            ${post.views || 0} views
          </span>
        </div>
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <p class="card-desc">${escapeHtml(post.description)}</p>
        <div class="card-footer">
          ${priceTag}
          <a href="article.html?id=${post.id}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">More Details</a>
        </div>
      </div>
    </article>
  `;
}

// Global search interface setup
function initSearch(posts, onResultChange) {
  const searchInput = document.getElementById('search-box');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    const filtered = window.performClientSearch(posts, query);
    onResultChange(filtered);
  });
}

// Load Home page setup
async function renderHomePage() {
  const gridContainer = document.getElementById('home-posts-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">Loading feeds...</div>';

  try {
    const posts = await window.dbService.getPosts();
    
    if (posts.length === 0) {
      gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No posts available yet. Connect Firebase or login to the admin portal to publish content.</div>';
      return;
    }

    const render = (items) => {
      if (items.length === 0) {
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No matches found for your search.</div>';
        return;
      }
      gridContainer.innerHTML = items.map(createPostCard).join('');
    };

    render(posts);
    initSearch(posts, render);

  } catch (error) {
    console.error("Home loading failed:", error);
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 3rem;">Could not load feeds. Check your setup.</div>';
  }
}

// Load news.html, repairs.html, store.html
async function renderCategoryPage(category) {
  const gridContainer = document.getElementById('category-posts-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">Loading category items...</div>';

  // Update page heading and sub-headings based on dynamic mapping
  const pageTitle = window.categoryMap[category] || category;
  const h1 = document.querySelector('main h1');
  if (h1) h1.textContent = pageTitle;

  try {
    const allPosts = await window.dbService.getPosts();
    const posts = allPosts.filter(p => p.category === category);
    
    if (posts.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No items listed in this category yet.</div>`;
      return;
    }

    const render = (items) => {
      if (items.length === 0) {
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No matching results.</div>';
        return;
      }
      gridContainer.innerHTML = items.map(createPostCard).join('');
    };

    render(posts);
    initSearch(posts, render);

  } catch (error) {
    console.error("Category page loading failed:", error);
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 3rem;">Failed to fetch content.</div>';
  }
}

// Render detail page article.html?id=ID
async function renderDetailPage() {
  const container = document.getElementById('article-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    container.innerHTML = '<div class="content-wrapper" style="text-align:center;"><h2>Invalid Article Selection</h2><p>Please return home and choose an article.</p></div>';
    return;
  }

  container.innerHTML = '<div style="text-align: center; padding: 5rem;">Retrieving article specs...</div>';

  try {
    // 1. Increment view count (updates atomic views)
    await window.dbService.incrementViews(postId);
    
    // 2. Fetch full post item
    const post = await window.dbService.getPostById(postId);

    if (!post) {
      container.innerHTML = '<div class="content-wrapper" style="text-align:center;"><h2>Article Not Found</h2><p>The post you are requesting does not exist or has been deleted.</p></div>';
      return;
    }

    const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const badgeClass = post.category === 'news' ? 'news' : post.category === 'repairs' ? 'repairs' : 'store';
    const categoryLabel = window.categoryMap[post.category] || post.category;

    // Image slides construction
    const slidesHtml = post.images.map((imgUrl, idx) => `
      <div class="slide ${idx === 0 ? 'active' : ''}">
        <img src="${imgUrl}" alt="${escapeHtml(post.title)} - Screen ${idx + 1}" onclick="openLightbox('${imgUrl}')">
      </div>
    `).join('');

    const dotsHtml = post.images.map((_, idx) => `
      <span class="dot ${idx === 0 ? 'active' : ''}" onclick="currentSlide(${idx})"></span>
    `).join('');

    // Dynamic CTA Box based on Category
    let actionBoxHtml = '';
    if (post.category === 'store') {
      const waMessage = encodeURIComponent(`Hello TechNexus, I am interested in purchasing "${post.title}" listed for ${post.price}. Can I get more details?`);
      actionBoxHtml = `
        <div class="action-box">
          <div style="flex-grow: 1;">
            <div style="font-size: 0.85rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Price Tag</div>
            <div style="font-size: 1.8rem; font-weight: 700; color: var(--accent-success); margin-top: 0.25rem;">${escapeHtml(post.price)}</div>
          </div>
          <a href="https://wa.me/YOUR_PHONE_NUMBER?text=${waMessage}" target="_blank" class="btn btn-primary" style="padding: 1rem 2rem;">
            <svg style="width:20px;height:20px" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.82 1.452 5.423 0 9.835-4.402 9.838-9.817.001-2.624-1.013-5.091-2.859-6.939C16.598 2.003 14.135.99 11.516.99c-5.427 0-9.84 4.403-9.843 9.819 0 1.764.484 3.486 1.4 5.013l-.997 3.646 3.734-.975zm13.167-7.234c-.1-.166-.367-.265-.767-.465s-2.367-1.165-2.733-1.3-.633-.2-.9.2-.1 1.3-.133 1.633c-.033.333-.167.666-.3.866-.134.2-.4.4-.767.2-.367-.2-1.54-.567-2.93-1.807-1.084-.967-1.815-2.164-2.03-2.529-.214-.366-.02-.564.18-.763.18-.179.4-.466.6-.7.2-.233.266-.4.4-.666.133-.267.067-.5-.033-.7-.1-.2-.9-2.166-1.233-2.966-.326-.783-.656-.677-.9-.69l-.767-.013c-.267 0-.7.1-.1.7.533.6 1.2 1.433 1.2 2.233 0 .8-.533 2.1-1.3 3.033-.4.467-.8.933-1.333 1.4-1.353 1.185-3.056 1.83-4.82 1.83H12.008c2.617 0 5.127-.638 7.37-1.854l1.246-.67c.367-.2.634-.467.767-.7.133-.233.1-.633 0-.8z"/>
            </svg>
            Inquire via WhatsApp
          </a>
        </div>
      `;
    } else {
      // News or Repair section with links or download options
      const generalBtn = post.link ? `<a href="${post.link}" target="_blank" class="btn btn-secondary">Visit Resource Link</a>` : '';
      const downloadBtn = post.downloadLink ? `
        <a href="${post.downloadLink}" target="_blank" class="btn btn-primary" style="background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));">
          <svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download Package (Secure)
        </a>
      ` : '';
      
      if (generalBtn || downloadBtn) {
        actionBoxHtml = `
          <div class="action-box">
            ${downloadBtn}
            ${generalBtn}
          </div>
        `;
      }
    }

    container.innerHTML = `
      <div class="content-wrapper">
        <div class="content-header">
          <span class="category-badge ${badgeClass}" style="position:static; margin-bottom: 1rem; display:inline-block;">${categoryLabel}</span>
          <h1 style="margin-top:0.5rem;">${escapeHtml(post.title)}</h1>
          <div class="content-meta">
            <time datetime="${new Date(post.createdAt).toISOString()}">${dateStr}</time>
            <span>&bull;</span>
            <span class="views-count" style="font-size: 0.9rem;">
              <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              ${post.views || 0} unique views
            </span>
          </div>
        </div>

        <!-- 4-Image Slideshow Component -->
        <div class="slideshow-container">
          ${slidesHtml}
          
          <button class="slideshow-nav slideshow-prev" onclick="changeSlide(-1)">&#10094;</button>
          <button class="slideshow-nav slideshow-next" onclick="changeSlide(1)">&#10095;</button>
          
          <div class="slideshow-dots">
            ${dotsHtml}
          </div>
        </div>

        <div class="content-body">
          <p style="white-space: pre-wrap;">${escapeHtml(post.description)}</p>
        </div>

        ${actionBoxHtml}
      </div>

      <!-- Fullscreen Lightbox Modal -->
      <div id="image-lightbox" class="lightbox" onclick="closeLightbox()">
        <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
        <img class="lightbox-content" id="lightbox-img" alt="Zoomed view">
      </div>
    `;

    // Initialize slideshow cycling details
    initSlideshow(post.images.length);

  } catch (error) {
    console.error("Detail page rendering failed:", error);
    container.innerHTML = '<div class="content-wrapper" style="text-align:center;"><h2>Database Connection Error</h2><p>Unable to retrieve post data. Please verify your config files.</p></div>';
  }
}

// Slideshow Slider Variables & Controls
let slideIndex = 0;
let totalSlides = 0;
let slideInterval = null;

function initSlideshow(count) {
  slideIndex = 0;
  totalSlides = count;
  
  // Auto switch slide every 5 seconds
  resetSlideTimer();
}

function resetSlideTimer() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    changeSlide(1);
  }, 5000);
}

function changeSlide(direction) {
  if (totalSlides === 0) return;
  
  slideIndex += direction;
  if (slideIndex >= totalSlides) {
    slideIndex = 0;
  } else if (slideIndex < 0) {
    slideIndex = totalSlides - 1;
  }
  
  updateSlidesDisplay();
  resetSlideTimer();
}

function currentSlide(index) {
  slideIndex = index;
  updateSlidesDisplay();
  resetSlideTimer();
}

function updateSlidesDisplay() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  
  slides.forEach((slide, idx) => {
    if (idx === slideIndex) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });

  dots.forEach((dot, idx) => {
    if (idx === slideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Lightbox Open/Close functions
function openLightbox(imgUrl) {
  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  
  if (lightbox && lightboxImg) {
    lightboxImg.src = imgUrl;
    lightbox.style.display = 'flex';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('image-lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Bind slideshow controls globally
window.changeSlide = changeSlide;
window.currentSlide = currentSlide;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.escapeHtml = escapeHtml;
