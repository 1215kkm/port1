// Firebase Configuration and Authentication
// Portfolio Platform - Multi-user support

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4kbzUUq7LkrAqA0ge5lS95nw6YboZmGE",
    authDomain: "dunopi-portfolio.firebaseapp.com",
    projectId: "dunopi-portfolio",
    storageBucket: "dunopi-portfolio.firebasestorage.app",
    messagingSenderId: "1025402247448",
    appId: "1:1025402247448:web:43877cdbf9d043cd86266d",
    measurementId: "G-05EJQFD5MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth Manager
const AuthManager = {
    currentUser: null,

    // Initialize auth state listener
    init() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
                resolve(user);
            });
        });
    },

    // Sign up with email/password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: displayName || email.split('@')[0],
                createdAt: new Date().toISOString(),
                portfolioId: this.generatePortfolioId(displayName || email.split('@')[0])
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign in with email/password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user profile exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                // Create user profile
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    createdAt: new Date().toISOString(),
                    portfolioId: this.generatePortfolioId(user.displayName || user.email.split('@')[0])
                });
            }

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Generate unique portfolio ID
    generatePortfolioId(name) {
        const base = name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const random = Math.random().toString(36).substring(2, 6);
        return `${base}-${random}`;
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!this.currentUser;
    }
};

// Firestore Data Manager
const FirestoreManager = {
    // Get user's portfolio data
    async getUserData(userId) {
        try {
            const docRef = doc(db, 'portfolios', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },

    // Save user's portfolio data
    async saveUserData(userId, data) {
        try {
            await setDoc(doc(db, 'portfolios', userId), {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Error saving user data:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user profile
    async getUserProfile(userId) {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },

    // Find user by portfolio ID
    async findUserByPortfolioId(portfolioId) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('portfolioId', '==', portfolioId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                return { id: userDoc.id, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    }
};

// Export
window.AuthManager = AuthManager;
window.FirestoreManager = FirestoreManager;
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

export { AuthManager, FirestoreManager, app, auth, db };
