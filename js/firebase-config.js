// Firebase configuration and initialization
// Replace the config object below with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBu1t-Aag-lH-YW9m__Qu2nwSwsherJFk4",
  authDomain: "techhub-a270f.firebaseapp.com",
  projectId: "techhub-a270f",
  storageBucket: "techhub-a270f.firebasestorage.app",
  messagingSenderId: "620602462312",
  appId: "1:620602462312:web:7d97cc1e73578b2586ebdd",
  measurementId: "G-HEQRV641Y8"
};

// Check if credentials are still the default placeholders
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// We'll initialize firebase if configuration is set
let db = null;
let storage = null;

if (isConfigured) {
  try {
    // These will be available globally from CDN script tags in our HTML files
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully in Production Mode.");
  } catch (error) {
    console.error("Firebase initialization failed: ", error);
    console.log("Falling back to local storage Mock Database Mode.");
  }
} else {
  console.log("Firebase is not configured. Running in Mock Database (LocalStorage) Mode.");
}

// Export configurations globally
window.firebaseConfig = firebaseConfig;
window.isFirebaseConfigured = isConfigured;
window.firebaseDb = db;
window.firebaseStorage = storage;
