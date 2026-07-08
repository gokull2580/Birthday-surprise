/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  collection,
  getDocs
} from 'firebase/firestore';
import { UserAccount } from '../components/LoginPage';

// Firebase Config derived from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyA8ekGTu48eEyMx32al9j965jpUSvS2Ygw",
  authDomain: "quiet-willow-w71nt.firebaseapp.com",
  projectId: "quiet-willow-w71nt",
  storageBucket: "quiet-willow-w71nt.firebasestorage.app",
  messagingSenderId: "327960710948",
  appId: "1:327960710948:web:9f8660d33a217585352db1"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
export const db = getFirestore(app, "ai-studio-birthdaysurprise-eecbc306-41e1-49a1-bc96-1f2d2dfd4064");

/**
 * Utility to normalize username and DOB to create a deterministic ID
 */
export const getUserDocId = (name: string, dob: string): string => {
  const normName = name.trim().toLowerCase();
  const normDob = dob.trim(); // "YYYY-MM-DD"
  return `${normName}_${normDob}`;
};

/**
 * Validate connection to Firestore as per SKILL.md guidelines
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: the client is offline.");
    } else {
      console.warn("Firebase test connection warning/offline, proceeding with offline cache support:", error);
    }
  }
}

// Call test connection immediately
testConnection();

/**
 * Fetches a single UserAccount from Firestore by name and DOB
 */
export async function getUserAccount(name: string, dob: string): Promise<UserAccount | null> {
  const docId = getUserDocId(name, dob);
  const docRef = doc(db, 'users', docId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
  } catch (error) {
    console.error("Error fetching user account from Firestore:", error);
  }
  return null;
}

/**
 * Saves a UserAccount to Firestore
 */
export async function saveUserAccount(user: UserAccount): Promise<void> {
  const docId = getUserDocId(user.name, user.dob);
  const docRef = doc(db, 'users', docId);
  try {
    await setDoc(docRef, {
      name: user.name,
      dob: user.dob,
      data: user.data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user account to Firestore:", error);
    throw error;
  }
}



/**
 * Fetches all user names and DOBs (for the select dropdown or quick-login helper)
 */
export async function getAllUserSummaries(): Promise<{ name: string; dob: string }[]> {
  try {
    const colRef = collection(db, 'users');
    const querySnapshot = await getDocs(colRef);
    const users: { name: string; dob: string }[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name && data.dob) {
        users.push({
          name: data.name,
          dob: data.dob
        });
      }
    });
    return users;
  } catch (error) {
    console.error("Error getting all user accounts from Firestore:", error);
    return [];
  }
}
