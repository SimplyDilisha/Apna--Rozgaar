// Authentication functions
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, rtdb } from './config';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getAuthContinueBaseUrl = () => {
  const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_AUTH_CONTINUE_URL || '');
  if (envBaseUrl) return envBaseUrl;

  // Firebase may reject 127.0.0.1 unless that exact host is allowlisted.
  const origin = window.location.origin;
  if (origin.includes('127.0.0.1')) {
    return origin.replace('127.0.0.1', 'localhost');
  }

  return trimTrailingSlash(origin);
};

const buildAuthContinueUrl = (pathWithQuery = '') => {
  const normalizedPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${getAuthContinueBaseUrl()}${normalizedPath}`;
};

const mapAuthEmailLinkError = (error) => {
  if (error?.code === 'auth/unauthorized-continue-uri') {
    return 'Email link could not be sent because the redirect domain is not authorized in Firebase. Add your app domain (for example localhost, 127.0.0.1, or your deployed domain) in Firebase Console > Authentication > Settings > Authorized domains.';
  }
  return error?.message || 'Unable to send email link right now.';
};

// Send OTP link to email for new user registration
export const registerUserWithOTP = async (email, userData, userType = 'candidate') => {
  try {
    // Store user data temporarily in RTDB for later retrieval after email verification
    const tempUserRef = ref(rtdb, `pendingUsers/${email.replace(/[.#$[\]]/g, '_')}`);
    await set(tempUserRef, {
      ...userData,
      email,
      userType,
      createdAt: new Date().toISOString(),
      pending: true
    });

    // Send email link for sign-in
    const actionCodeSettings = {
      url: buildAuthContinueUrl(`/?authEmail=${encodeURIComponent(email)}&mode=register&type=${userType}`),
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Save email in localStorage for later verification
    window.localStorage.setItem('emailForSignIn', email);

    return { success: true, message: 'OTP link sent to your email. Please check and click the link to complete registration.' };
  } catch (error) {
    return { success: false, error: mapAuthEmailLinkError(error) };
  }
};

// Send OTP link to existing user for login
export const loginUserWithOTP = async (email) => {
  try {
    const actionCodeSettings = {
      url: buildAuthContinueUrl(`/?authEmail=${encodeURIComponent(email)}&mode=login`),
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Save email in localStorage for later verification
    window.localStorage.setItem('emailForSignIn', email);

    return { success: true, message: 'OTP link sent to your email. Please check and click to sign in.' };
  } catch (error) {
    return { success: false, error: mapAuthEmailLinkError(error) };
  }
};

// Complete OTP email link verification
export const verifyEmailOTP = async (userType = 'candidate') => {
  try {
    // Check if the URL has the email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');

      if (!email) {
        // User opened link on a different device/browser, ask for email
        email = prompt('Please provide your email for confirmation');
      }

      // Sign in with email link
      const result = await signInWithEmailLink(auth, email, window.location.href);
      const user = result.user;

      // Check if this is a new user registration
      const mode = new URLSearchParams(window.location.search).get('mode');

      if (mode === 'register') {
        // Fetch pending user data and create user profile
        const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
        const pendingUserRef = ref(rtdb, `pendingUsers/${sanitizedEmail}`);
        const snapshot = await get(pendingUserRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          const userType = userData.userType || 'candidate';

          // Update display name
          await updateProfile(user, { displayName: userData.name });

          // Create user document in Realtime Database as the sole authority
          const rtdbRef = ref(rtdb, `users/${user.uid}`);
          await set(rtdbRef, {
            ...userData,
            email,
            userType,
            verified: true,
            createdAt: new Date().toISOString(),
            uid: user.uid,
            displayName: userData.name,
            pending: false
          });

          // Delete pending user record
          await set(pendingUserRef, null);
        }
      }

      // Clear localStorage
      window.localStorage.removeItem('emailForSignIn');

      return { success: true, user, isNewUser: mode === 'register' };
    }

    return { success: false, error: 'Invalid email link or already verified' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in existing user with email/password
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Reload to get fresh emailVerified status
    await reload(user);

    if (!user.emailVerified) {
      await signOut(auth);
      return { 
        success: false, 
        error: 'Please verify your email before signing in. Check your inbox for a verification link.',
        needsVerification: true,
        email 
      };
    }

    return { success: true, user };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    }
    return { success: false, error: message };
  }
};

// Register new user with email verification
export const registerUser = async (email, password, userData, userType = 'candidate') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: userData.name });

    // Send verification email
    await sendEmailVerification(user, {
      url: buildAuthContinueUrl('/auth?verified=true'),
      handleCodeInApp: false
    });

    // Store user data in Realtime Database (unverified flag)
    const rtdbRef = ref(rtdb, `users/${user.uid}`);
    await set(rtdbRef, {
      ...userData,
      email,
      userType,
      createdAt: new Date().toISOString(),
      uid: user.uid,
      displayName: userData.name,
      emailVerified: false
    });

    // Sign out immediately until they verify their email
    await signOut(auth);

    return { success: true, user, needsVerification: true };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak. Use at least 6 characters.';
    } else if (error.code === 'auth/unauthorized-continue-uri') {
      message = mapAuthEmailLinkError(error);
    }
    return { success: false, error: message };
  }
};

// Resend verification email to a signed-in (unverified) user
export const resendVerificationEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user, {
      url: buildAuthContinueUrl('/auth?verified=true'),
      handleCodeInApp: false
    });
    await signOut(auth);
    return { success: true, message: 'Verification email resent! Please check your inbox.' };
  } catch (error) {
    return { success: false, error: mapAuthEmailLinkError(error) };
  }
};

// Check if current user's email is verified (after they click the link)
export const checkEmailVerified = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  return user.emailVerified;
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with Google
export const signInWithGoogle = async (userType = 'candidate') => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already exists in RTDB
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // Create new user record for first-time Google sign-in
      await set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        name: user.displayName,
        userType: userType,
        verified: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, user, isNewUser: true };
    }

    return { success: true, user, isNewUser: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user profile data from Realtime Database
export const getCurrentUserProfileRTDB = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { ...snapshot.val(), id: snapshot.key };
    }
    return null;
  } catch (error) {
    console.error('Error fetching RTDB profile:', error);
    return null;
  }
};

// Update user data in Realtime Database
export const updateUserProfile = async (userData, userType = 'candidate') => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'No user logged in' };

  try {
    // Update in Realtime Database
    const rtdbRef = ref(rtdb, `users/${user.uid}`);
    await update(rtdbRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Login anonymously or via fallback guest credentials as Guest
export const loginAsGuest = async (userType = 'candidate') => {
  const guestEmail = 'guest@apnarozgaar.com';
  const guestPassword = 'apnarozgaar123';

  try {
    let userCredential;
    
    // First, try standard Anonymous Login (if enabled in Firebase Console)
    try {
      const result = await signInAnonymously(auth);
      userCredential = { user: result.user };
      console.log('[loginAsGuest] Anonymous sign-in succeeded');
    } catch (anonError) {
      console.warn('[loginAsGuest] Anonymous sign-in failed, falling back to dummy email/password login:', anonError.message);
      
      // Fallback: Login with predefined guest credentials
      try {
        userCredential = await signInWithEmailAndPassword(auth, guestEmail, guestPassword);
        console.log('[loginAsGuest] Fallback email login succeeded');
      } catch (loginError) {
        // If user does not exist, register them
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential' || loginError.message.includes('user-not-found')) {
          console.log('[loginAsGuest] Guest user not found, registering new fallback account...');
          userCredential = await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
          await updateProfile(userCredential.user, { 
            displayName: `Guest ${userType === 'employer' ? 'Employer' : 'Candidate'}` 
          });
        } else {
          throw loginError;
        }
      }
    }

    const user = userCredential.user;

    // Initialize guest profile in RTDB
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        uid: user.uid,
        email: user.email || guestEmail,
        displayName: `Guest ${userType === 'employer' ? 'Employer' : 'Candidate'}`,
        name: `Guest ${userType === 'employer' ? 'Employer' : 'Candidate'}`,
        userType: userType,
        isGuest: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error('[loginAsGuest] Guest login failed entirely:', error.message);
    return { success: false, error: error.message };
  }
};
