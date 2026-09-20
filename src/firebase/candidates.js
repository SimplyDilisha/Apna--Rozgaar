// Candidate-related Realtime Database operations
import {
  ref,
  get,
  set,
  update,
  serverTimestamp
} from 'firebase/database';
import { rtdb } from './config';

const COLLECTION = 'users';

/**
 * Firebase RTDB does not accept `undefined` values — they are silently dropped
 * or cause write failures. This helper recursively removes undefined/null from
 * an object and replaces empty arrays with [] (valid) rather than undefined.
 */
const sanitizeForRTDB = (obj) => {
  if (Array.isArray(obj)) {
    // Keep arrays even if empty — [] is valid in RTDB
    return obj.map(sanitizeForRTDB);
  }
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined) continue; // drop undefined keys
      clean[key] = sanitizeForRTDB(val);
    }
    return clean;
  }
  return obj;
};

// Create/Update candidate profile
export const saveCandidateProfile = async (uid, profileData) => {
  try {
    const userRef = ref(rtdb, `${COLLECTION}/${uid}`);
    
    // First get existing to preserve fields we're not overwriting
    const snapshot = await get(userRef);
    const existing = snapshot.exists() ? snapshot.val() : {};

    const payload = sanitizeForRTDB({
      ...existing,
      ...profileData,
      userType: existing.userType || 'candidate',
      updatedAt: new Date().toISOString()
    });

    console.log('[saveCandidateProfile] Writing to RTDB path:', `${COLLECTION}/${uid}`);
    console.log('[saveCandidateProfile] Payload:', JSON.stringify(payload, null, 2));

    await set(userRef, payload);

    console.log('[saveCandidateProfile] ✅ Write successful');
    return { success: true };
  } catch (error) {
    console.error('[saveCandidateProfile] ❌ Write failed:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

// Get candidate profile by ID
export const getCandidateProfile = async (uid) => {
  try {
    const userRef = ref(rtdb, `${COLLECTION}/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const data = { ...snapshot.val(), id: uid };
      console.log('[getCandidateProfile] Fetched profile for', uid, data);
      return { success: true, data };
    }
    console.warn('[getCandidateProfile] No profile found for', uid);
    return { success: false, error: 'Profile not found' };
  } catch (error) {
    console.error('[getCandidateProfile] Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get all candidates (for employers)
export const getAllCandidates = async () => {
  try {
    const usersRef = ref(rtdb, COLLECTION);
    const snapshot = await get(usersRef);
    const candidates = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(uid => {
        if (data[uid].userType === 'candidate') {
          candidates.push({ ...data[uid], id: uid });
        }
      });
    }
    
    return { success: true, data: candidates };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Search candidates by skills
export const searchCandidatesBySkills = async (skills) => {
  try {
    const usersRef = ref(rtdb, COLLECTION);
    const snapshot = await get(usersRef);
    const candidates = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(uid => {
        const user = data[uid];
        if (user.userType === 'candidate' && user.skills && Array.isArray(user.skills)) {
          // Check if user has any of the requested skills
          const hasSkill = skills.some(skill => user.skills.includes(skill));
          if (hasSkill) {
            candidates.push({ ...user, id: uid });
          }
        }
      });
    }
    
    return { success: true, data: candidates };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update certification verification status
export const updateCertificationStatus = async (uid, status, photoBase64 = null) => {
  // status: 'pending', 'verified', 'rejected'
  try {
    const userRef = ref(rtdb, `${COLLECTION}/${uid}`);
    
    const updateData = sanitizeForRTDB({
      certificationStatus: status,
      ...(status === 'pending' ? { certificationRequestedAt: new Date().toISOString() } : {}),
      ...(status === 'verified' ? { certificationVerifiedAt: new Date().toISOString() } : {}),
      ...(photoBase64 && status === 'pending' ? { certificationPhotoProvided: true } : {})
    });

    await update(userRef, updateData);
    
    return { success: true, message: `Certification status updated to ${status}` };
  } catch (error) {
    console.error('[updateCertificationStatus] Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Candidate Profile Schema Example:
/*
{
  uid: "firebase-user-id",
  name: "John Doe",
  email: "john@example.com",
  skills: ["JavaScript", "React", "Node.js"],
  disabilityType: "visual", // visual, hearing, mobility, cognitive
  assistiveTech: ["screen reader", "voice input"],
  workPreference: "remote", // remote, onsite, hybrid
  accommodations: "Flexible hours, screen reader compatible tools",
  experience: "3 years in web development",
  createdAt: "2026-03-31T10:00:00.000Z",
  updatedAt: "2026-03-31T10:00:00.000Z"
}
*/
