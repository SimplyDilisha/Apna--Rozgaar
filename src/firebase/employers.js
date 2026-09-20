// Employer-related Realtime Database operations
import {
  ref,
  get,
  set,
  update,
  serverTimestamp
} from 'firebase/database';
import { rtdb } from './config';

const COLLECTION = 'users';

// Create/Update employer profile
export const saveEmployerProfile = async (uid, profileData) => {
  try {
    const userRef = ref(rtdb, `${COLLECTION}/${uid}`);
    
    // First get existing to preserve stuff
    const snapshot = await get(userRef);
    const existing = snapshot.exists() ? snapshot.val() : {};

    await update(userRef, {
      ...existing,
      ...profileData,
      userType: 'employer',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get employer profile by ID
export const getEmployerProfile = async (uid) => {
  try {
    const userRef = ref(rtdb, `${COLLECTION}/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { success: true, data: { ...snapshot.val(), id: uid } };
    }
    return { success: false, error: 'Employer not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all employers
export const getAllEmployers = async () => {
  try {
    const usersRef = ref(rtdb, COLLECTION);
    const snapshot = await get(usersRef);
    const employers = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(uid => {
        if (data[uid].userType === 'employer') {
          employers.push({ ...data[uid], id: uid });
        }
      });
    }
    
    return { success: true, data: employers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Employer Schema Example:
/*
{
  uid: "firebase-user-id",
  companyName: "Tech Corp",
  email: "hr@techcorp.com",
  industry: "Technology",
  companySize: "100-500",
  location: "Bangalore",
  website: "https://techcorp.com",
  accessibilityCommitment: "We are committed to providing...",
  accessibilityFeatures: [
    "wheelchair_accessible",
    "screen_reader_compatible",
    "flexible_hours"
  ],
  contactPerson: "Jane HR",
  phone: "+91 9876543210",
  createdAt: "2026-03-31T10:00:00.000Z",
  updatedAt: "2026-03-31T10:00:00.000Z"
}
*/
