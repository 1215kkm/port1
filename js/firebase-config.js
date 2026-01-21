// Firebase Configuration and Authentication
// Portfolio Platform - Multi-user support

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);
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

// Storage Manager for Image Uploads
const StorageManager = {
    // Upload image file and return download URL
    async uploadImage(userId, file, path = 'images') {
        try {
            if (!userId) {
                console.error('[Storage] No userId provided');
                return { success: false, error: '로그인이 필요합니다' };
            }

            if (!file) {
                console.error('[Storage] No file provided');
                return { success: false, error: '파일이 없습니다' };
            }

            console.log(`[Storage] Uploading ${file.name} (${(file.size/1024).toFixed(1)}KB) for user ${userId}`);

            // Generate unique filename
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `users/${userId}/${path}/${timestamp}_${safeName}`;

            console.log(`[Storage] Target path: ${filePath}`);

            const storageRef = ref(storage, filePath);

            // Upload file
            console.log('[Storage] Starting upload...');
            const snapshot = await uploadBytes(storageRef, file);
            console.log('[Storage] Upload complete, getting URL...');

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('[Storage] Success! URL:', downloadURL.substring(0, 60) + '...');

            return {
                success: true,
                url: downloadURL,
                path: filePath
            };
        } catch (error) {
            console.error('[Storage] Upload failed:', error.code, error.message);

            // Provide helpful error messages
            let userMessage = error.message;
            if (error.code === 'storage/unauthorized') {
                userMessage = 'Storage 권한이 없습니다. Firebase Console에서 Storage Rules를 확인하세요.';
            } else if (error.code === 'storage/canceled') {
                userMessage = '업로드가 취소되었습니다.';
            } else if (error.code === 'storage/unknown') {
                userMessage = '알 수 없는 오류가 발생했습니다. 네트워크를 확인하세요.';
            }

            return { success: false, error: userMessage, code: error.code };
        }
    },

    // Upload base64 image and return download URL
    async uploadBase64Image(userId, base64Data, fileName, path = 'images') {
        try {
            // Convert base64 to blob
            const response = await fetch(base64Data);
            const blob = await response.blob();

            // Generate unique filename
            const timestamp = Date.now();
            const safeName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
            const filePath = `users/${userId}/${path}/${timestamp}_${safeName}`;

            const storageRef = ref(storage, filePath);

            // Upload blob
            const snapshot = await uploadBytes(storageRef, blob);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                success: true,
                url: downloadURL,
                path: filePath
            };
        } catch (error) {
            console.error('Error uploading base64 image:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete image by path
    async deleteImage(filePath) {
        try {
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    },

    // Upload multiple images
    async uploadMultipleImages(userId, files, path = 'images') {
        const results = [];
        for (const file of files) {
            const result = await this.uploadImage(userId, file, path);
            results.push(result);
        }
        return results;
    }
};

// Analytics Manager
const AnalyticsManager = {
    SUPER_ADMIN_EMAILS: ['1215kkm@naver.com'],

    // Check if current user is super admin
    isSuperAdmin() {
        const user = AuthManager.getUser();
        return user && this.SUPER_ADMIN_EMAILS.includes(user.email);
    },

    // Track page visit
    async trackVisit(page = 'portfolio') {
        try {
            const today = new Date().toISOString().split('T')[0];
            const analyticsRef = doc(db, 'analytics', 'global');

            // Use setDoc with merge to create if doesn't exist
            await setDoc(analyticsRef, {
                [`visits.${today}`]: increment(1),
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Log activity
            await this.logActivity('visit', `${page} 페이지 방문`);

        } catch (error) {
            console.error('Error tracking visit:', error);
        }
    },

    // Track PDF download
    async trackPdfDownload(userId) {
        try {
            const analyticsRef = doc(db, 'analytics', 'global');

            await setDoc(analyticsRef, {
                pdfDownloads: increment(1),
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Log activity
            await this.logActivity('pdf', `PDF 다운로드 (${userId || 'anonymous'})`);

        } catch (error) {
            console.error('Error tracking PDF download:', error);
        }
    },

    // Log activity
    async logActivity(type, message, userId = null) {
        try {
            const activityRef = doc(collection(db, 'activity_logs'));
            await setDoc(activityRef, {
                type,
                message,
                userId: userId || AuthManager.getUser()?.uid || 'anonymous',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    // Track user login
    async trackLogin(userId) {
        try {
            // Update user's last login
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, {
                lastLogin: new Date().toISOString()
            }, { merge: true });

            // Log activity
            await this.logActivity('login', '로그인', userId);

        } catch (error) {
            console.error('Error tracking login:', error);
        }
    },

    // Track signup
    async trackSignup(userId, email) {
        try {
            await this.logActivity('signup', `신규 가입: ${email}`, userId);
        } catch (error) {
            console.error('Error tracking signup:', error);
        }
    }
};

// Coupon Manager
const CouponManager = {
    // Generate random coupon code
    generateCode(length = 10) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Create new coupon
    async createCoupon(options) {
        const { months, type, maxUses, createdBy } = options;
        const code = this.generateCode();

        const couponData = {
            code,
            months: parseInt(months),
            type: type, // 'single' or 'multi'
            maxUses: type === 'single' ? 1 : (maxUses || null),
            usedCount: 0,
            usedBy: [],
            createdAt: new Date().toISOString(),
            createdBy: createdBy,
            active: true
        };

        try {
            await setDoc(doc(db, 'coupons', code), couponData);
            return { success: true, coupon: couponData };
        } catch (error) {
            console.error('Error creating coupon:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all coupons
    async getAllCoupons() {
        try {
            const couponsSnap = await getDocs(collection(db, 'coupons'));
            const coupons = [];
            couponsSnap.forEach(doc => {
                coupons.push({ id: doc.id, ...doc.data() });
            });
            return coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting coupons:', error);
            return [];
        }
    },

    // Validate and apply coupon
    async applyCoupon(code, userId) {
        try {
            const couponRef = doc(db, 'coupons', code.toUpperCase());
            const couponSnap = await getDoc(couponRef);

            if (!couponSnap.exists()) {
                return { success: false, error: '존재하지 않는 쿠폰입니다.' };
            }

            const coupon = couponSnap.data();

            if (!coupon.active) {
                return { success: false, error: '비활성화된 쿠폰입니다.' };
            }

            if (coupon.type === 'single' && coupon.usedCount >= 1) {
                return { success: false, error: '이미 사용된 쿠폰입니다.' };
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return { success: false, error: '쿠폰 사용 횟수를 초과했습니다.' };
            }

            if (coupon.usedBy.includes(userId)) {
                return { success: false, error: '이미 이 쿠폰을 사용했습니다.' };
            }

            // Calculate expiry date
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + coupon.months);

            // Update coupon usage
            await setDoc(couponRef, {
                ...coupon,
                usedCount: coupon.usedCount + 1,
                usedBy: [...coupon.usedBy, userId]
            });

            // Update user subscription
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};

            await setDoc(userRef, {
                ...userData,
                subscription: {
                    status: 'active',
                    plan: 'coupon',
                    couponCode: code.toUpperCase(),
                    months: coupon.months,
                    startedAt: now.toISOString(),
                    expiresAt: expiresAt.toISOString()
                }
            }, { merge: true });

            return {
                success: true,
                months: coupon.months,
                expiresAt: expiresAt.toISOString()
            };
        } catch (error) {
            console.error('Error applying coupon:', error);
            return { success: false, error: error.message };
        }
    },

    // Check user subscription status
    async checkSubscription(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return { status: 'none', canUse: false };
            }

            const userData = userSnap.data();
            const subscription = userData.subscription;

            // No subscription - check if in trial period
            if (!subscription) {
                // Trial: 3 months from account creation
                const createdAt = new Date(userData.createdAt);
                const trialEnd = new Date(createdAt);
                trialEnd.setMonth(trialEnd.getMonth() + 3);

                if (new Date() < trialEnd) {
                    return {
                        status: 'trial',
                        canUse: true,
                        expiresAt: trialEnd.toISOString(),
                        daysLeft: Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
                    };
                } else {
                    return { status: 'expired', canUse: false };
                }
            }

            // Check subscription expiry
            const expiresAt = new Date(subscription.expiresAt);
            if (new Date() > expiresAt) {
                return { status: 'expired', canUse: false, expiredAt: subscription.expiresAt };
            }

            return {
                status: subscription.status,
                canUse: true,
                plan: subscription.plan,
                expiresAt: subscription.expiresAt,
                daysLeft: Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            };
        } catch (error) {
            console.error('Error checking subscription:', error);
            return { status: 'error', canUse: false };
        }
    },

    // Deactivate coupon
    async deactivateCoupon(code) {
        try {
            const couponRef = doc(db, 'coupons', code);
            await setDoc(couponRef, { active: false }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Error deactivating coupon:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete coupon
    async deleteCoupon(code) {
        try {
            await deleteDoc(doc(db, 'coupons', code));
            return { success: true };
        } catch (error) {
            console.error('Error deleting coupon:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export
window.AuthManager = AuthManager;
window.FirestoreManager = FirestoreManager;
window.StorageManager = StorageManager;
window.AnalyticsManager = AnalyticsManager;
window.CouponManager = CouponManager;
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

export { AuthManager, FirestoreManager, StorageManager, AnalyticsManager, CouponManager, app, auth, db, storage };
