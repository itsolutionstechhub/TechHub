// Database abstraction layer that switches between Firebase Firestore and LocalStorage

const MOCK_STORAGE_KEY = 'tech_nexus_posts';
const MOCK_CAT_KEY = 'tech_nexus_categories';

// Helper to get categories from local storage
function getMockCategories() {
  const data = localStorage.getItem(MOCK_CAT_KEY);
  if (data) return JSON.parse(data);
  
  const defaultCats = [
    { id: 'news', name: 'Tech News' },
    { id: 'repairs', name: 'Repair Articles' },
    { id: 'store', name: 'Store' }
  ];
  localStorage.setItem(MOCK_CAT_KEY, JSON.stringify(defaultCats));
  return defaultCats;
}

// Helper to save categories to local storage
function saveMockCategories(cats) {
  localStorage.setItem(MOCK_CAT_KEY, JSON.stringify(cats));
}

// Helper to get posts from local storage
function getMockPosts() {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Helper to save posts to local storage
function saveMockPosts(posts) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(posts));
}

// Setup some sample/initial posts if local storage is empty
function setupInitialMockData() {
  if (getMockPosts().length === 0) {
    const samplePosts = [
      {
        id: 'sample-news-1',
        category: 'news',
        title: 'The Future of AI and Agentic Workflows',
        description: 'Explore how agentic coding models and advanced AI automation are reshaping software development. From visual layout generation to full-stack code deployments, agents are leading the next industrial revolution in IT.\n\nKey takeaways:\n1. Faster iterations.\n2. Standardized component building.\n3. Increased focus on user experience and architectural planning rather than syntax debugging.',
        images: [
          'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1684369175833-3d0774441584?q=80&w=600&auto=format&fit=crop'
        ],
        link: 'https://deepmind.google',
        downloadLink: 'https://github.com',
        price: '',
        views: 342,
        createdAt: Date.now() - 3600000 * 24 // 1 day ago
      },
      {
        id: 'sample-repair-1',
        category: 'repairs',
        title: 'Step-by-Step iPhone 13 Screen Replacement Guide',
        description: 'A comprehensive walkthrough on replacing a damaged iPhone 13 screen at home. This guide highlights the tools needed, cautionary safety steps, and how to safely transfer the sensor array to maintain Face ID functionality.\n\nWarning: Disconnect the battery before working on any internal components! Use heat to loosen the display adhesive and pick tools carefully.',
        images: [
          'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1601784551146-ca0a96e2514e?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1597740985671-2a8a3b80f02e?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600&auto=format&fit=crop'
        ],
        link: 'https://ifixit.com',
        downloadLink: '',
        price: '',
        views: 125,
        createdAt: Date.now() - 3600000 * 48 // 2 days ago
      },
      {
        id: 'sample-store-1',
        category: 'store',
        title: 'Premium Mechanical Keyboard (Hot-swappable)',
        description: 'Elevate your coding and typing experience with our custom hot-swappable mechanical keyboard. Featuring tactile brown switches, beautiful RGB backlight patterns, a solid aluminum frame, and double-shot PBT keycaps.',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?q=80&w=600&auto=format&fit=crop'
        ],
        link: 'https://wa.me/message/YOUR_WHATSAPP_LINK',
        downloadLink: '',
        price: '$89.99',
        views: 89,
        createdAt: Date.now() - 3600000 * 12 // 12 hours ago
      }
    ];
    saveMockPosts(samplePosts);
  }
}

// Check configuration status and populate mock data if needed
if (!window.isFirebaseConfigured) {
  setupInitialMockData();
  getMockCategories();
}

// Database API
const dbService = {
  // Get all categories
  async getCategories() {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const snapshot = await window.firebaseDb.collection('categories').get();
        if (snapshot.empty) {
          // Initialize Firestore with default categories if empty
          const defaults = [
            { id: 'news', name: 'Tech News' },
            { id: 'repairs', name: 'Repair Articles' },
            { id: 'store', name: 'Store' }
          ];
          for (const cat of defaults) {
            await window.firebaseDb.collection('categories').doc(cat.id).set({ name: cat.name });
          }
          return defaults;
        }
        const cats = [];
        snapshot.forEach(doc => {
          cats.push({ id: doc.id, name: doc.data().name });
        });
        // Sort order so categories keep their index position
        const order = ['news', 'repairs', 'store'];
        return cats.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      } catch (error) {
        console.error("Error fetching categories from Firestore:", error);
        return [
          { id: 'news', name: 'Tech News' },
          { id: 'repairs', name: 'Repair Articles' },
          { id: 'store', name: 'Store' }
        ];
      }
    } else {
      return getMockCategories();
    }
  },

  // Update a category name
  async updateCategoryName(id, newName) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        await window.firebaseDb.collection('categories').doc(id).set({ name: newName }, { merge: true });
        return true;
      } catch (error) {
        console.error("Error updating category name in Firestore:", error);
        throw error;
      }
    } else {
      const cats = getMockCategories();
      const cat = cats.find(c => c.id === id);
      if (cat) {
        cat.name = newName;
        saveMockCategories(cats);
        return true;
      }
      return false;
    }
  },

  // Get all posts, optionally sorted by date
  async getPosts() {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const snapshot = await window.firebaseDb.collection('posts').orderBy('createdAt', 'desc').get();
        const posts = [];
        snapshot.forEach(doc => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        return posts;
      } catch (error) {
        console.error("Error fetching posts from Firestore:", error);
        return [];
      }
    } else {
      // LocalStorage mode
      const posts = getMockPosts();
      return posts.sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  // Get a single post by ID
  async getPostById(id) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const doc = await window.firebaseDb.collection('posts').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
        return null;
      } catch (error) {
        console.error("Error fetching post from Firestore:", error);
        return null;
      }
    } else {
      const posts = getMockPosts();
      return posts.find(p => p.id === id) || null;
    }
  },

  // Add a new post
  async createPost(postData) {
    const post = {
      ...postData,
      views: 0,
      createdAt: Date.now()
    };

    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const docRef = await window.firebaseDb.collection('posts').add(post);
        return { id: docRef.id, ...post };
      } catch (error) {
        console.error("Error adding post to Firestore:", error);
        throw error;
      }
    } else {
      const posts = getMockPosts();
      post.id = 'post_' + Math.random().toString(36).substr(2, 9);
      posts.push(post);
      saveMockPosts(posts);
      return post;
    }
  },

  // Delete a post
  async deletePost(id) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        await window.firebaseDb.collection('posts').doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error deleting post from Firestore:", error);
        throw error;
      }
    } else {
      let posts = getMockPosts();
      posts = posts.filter(p => p.id !== id);
      saveMockPosts(posts);
      return true;
    }
  },

  // Increment views
  async incrementViews(id) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const postRef = window.firebaseDb.collection('posts').doc(id);
        await postRef.update({
          views: firebase.firestore.FieldValue.increment(1)
        });
        return true;
      } catch (error) {
        console.error("Error incrementing views in Firestore:", error);
        return false;
      }
    } else {
      const posts = getMockPosts();
      const postIndex = posts.findIndex(p => p.id === id);
      if (postIndex !== -1) {
        posts[postIndex].views = (posts[postIndex].views || 0) + 1;
        saveMockPosts(posts);
        return true;
      }
      return false;
    }
  },

  // Get navigation menu configuration
  async getMenuConfig() {
    const defaultMenu = [
      { id: 'home', name: 'Home', url: 'index.html', visible: true },
      { id: 'news', name: 'Tech News', url: 'news.html', visible: true },
      { id: 'repairs', name: 'Repair Guides', url: 'repairs.html', visible: true },
      { id: 'store', name: 'Store', url: 'store.html', visible: true },
      { id: 'admin', name: 'Admin Portal', url: 'admin.html', visible: true },
      { id: 'about', name: 'About Us', url: 'about.html', visible: false },
      { id: 'contact', name: 'Contact Us', url: 'contact.html', visible: false },
      { id: 'privacy', name: 'Privacy Policy', url: 'privacy.html', visible: false },
      { id: 'terms', name: 'Terms & Conditions', url: 'terms.html', visible: false },
      { id: 'disclaimer', name: 'Disclaimer', url: 'disclaimer.html', visible: false }
    ];

    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const doc = await window.firebaseDb.collection('config').doc('menu').get();
        if (doc.exists) {
          const savedData = doc.data().items || [];
          // Merge to ensure all keys exist
          return defaultMenu.map(def => {
            const saved = savedData.find(s => s.id === def.id);
            return saved ? { ...def, visible: saved.visible, name: saved.name || def.name } : def;
          });
        }
        // Save initial default if not found
        await window.firebaseDb.collection('config').doc('menu').set({ items: defaultMenu });
        return defaultMenu;
      } catch (error) {
        console.error("Error fetching menu configuration from Firestore:", error);
        return defaultMenu;
      }
    } else {
      const MOCK_MENU_KEY = 'tech_nexus_menu_config';
      const localData = localStorage.getItem(MOCK_MENU_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Merge defaults to catch new options
        return defaultMenu.map(def => {
          const saved = parsed.find(s => s.id === def.id);
          return saved ? { ...def, visible: saved.visible, name: saved.name || def.name } : def;
        });
      }
      localStorage.setItem(MOCK_MENU_KEY, JSON.stringify(defaultMenu));
      return defaultMenu;
    }
  },

  // Save navigation menu configuration
  async saveMenuConfig(items) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        await window.firebaseDb.collection('config').doc('menu').set({ items });
        return true;
      } catch (error) {
        console.error("Error saving menu config in Firestore:", error);
        throw error;
      }
    } else {
      const MOCK_MENU_KEY = 'tech_nexus_menu_config';
      localStorage.setItem(MOCK_MENU_KEY, JSON.stringify(items));
      return true;
    }
  },

  // Get site identity configuration (Name and Logo URL)
  async getSiteConfig() {
    const defaultConfig = { name: 'TechNexus', logoUrl: '' };

    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        const doc = await window.firebaseDb.collection('config').doc('site').get();
        if (doc.exists) {
          return { ...defaultConfig, ...doc.data() };
        }
        await window.firebaseDb.collection('config').doc('site').set(defaultConfig);
        return defaultConfig;
      } catch (error) {
        console.error("Error fetching site config from Firestore:", error);
        return defaultConfig;
      }
    } else {
      const MOCK_SITE_KEY = 'tech_nexus_site_config';
      const localData = localStorage.getItem(MOCK_SITE_KEY);
      return localData ? JSON.parse(localData) : defaultConfig;
    }
  },

  // Save site identity configuration
  async saveSiteConfig(config) {
    if (window.isFirebaseConfigured && window.firebaseDb) {
      try {
        await window.firebaseDb.collection('config').doc('site').set(config, { merge: true });
        return true;
      } catch (error) {
        console.error("Error saving site config in Firestore:", error);
        throw error;
      }
    } else {
      const MOCK_SITE_KEY = 'tech_nexus_site_config';
      localStorage.setItem(MOCK_SITE_KEY, JSON.stringify(config));
      return true;
    }
  },

  // Helper for image uploading
  // In mock mode, this resolves as a compressed base64 string to fit LocalStorage quota
  // In firebase mode, this uploads to storage and resolves the download URL
  async uploadImage(file) {
  if (window.isFirebaseConfigured && window.firebaseStorage) {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = window.firebaseStorage.ref().child(`images/${fileName}`);
      const snapshot = await storageRef.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading to Firebase Storage:", error);
      throw error;
    }
  } else {
    // Mock mode: limit size to 5 MB and return base64 string without heavy compression
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return Promise.reject(new Error("File too large for local storage (max 5 MB)."));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
// Legacy uploadImage block removed – cleaned up
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = window.firebaseStorage.ref().child(`images/${fileName}`);
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
      } catch (error) {
        console.error("Error uploading to Firebase Storage:", error);
        throw error;
      }
    } else {
      // Local Mock: Compress image using canvas to prevent exceeding 5MB LocalStorage limit
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Web logos only need to be small (height: 60px), normal posts can be larger (height: 400px)
            const isLogo = file.name && (file.name.toLowerCase().includes('logo') || file.size < 400000);
            const MAX_HEIGHT = isLogo ? 60 : 400;
            
            let width = img.width;
            let height = img.height;
            
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output small compressed JPEG (or PNG if it has transparent pixels)
            const mimeType = isLogo ? 'image/png' : 'image/jpeg';
            const quality = isLogo ? 0.9 : 0.7;
            resolve(canvas.toDataURL(mimeType, quality));
          };
          img.onerror = () => reject(new Error("Invalid image data. Make sure it is a valid picture."));
          img.src = e.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  }
};

window.dbService = dbService;

