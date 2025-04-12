import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin with auto-detection for environment
let firebaseApp;

try {
  // If running on cloud platforms, use built-in credentials
  firebaseApp = initializeApp();
} catch (error) {
  // If running locally, try to use a service account file
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../../service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id}.appspot.com`
      });
    } else {
      // Fallback to environment variables if file doesn't exist
      firebaseApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
    }
  } catch (initError) {
    console.error("Firebase Admin initialization error:", initError);
    // Initialize with minimal config for development environments
    firebaseApp = initializeApp({
      projectId: "desi-ai-development"
    });
  }
}

// Get Firebase Auth and Storage instances
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

/**
 * Verify a Firebase ID token
 */
export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFileToStorage(
  filePath: string,
  originalFilename: string,
  userId: number
): Promise<string> {
  try {
    const bucket = storage.bucket();
    
    // Create a unique filename based on timestamp and original name
    const timestamp = Date.now();
    const extension = path.extname(originalFilename);
    const filename = path.basename(originalFilename, extension);
    const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const destinationPath = `uploads/user_${userId}/${sanitizedFilename}_${timestamp}${extension}`;
    
    // Upload file to Firebase Storage
    await bucket.upload(filePath, {
      destination: destinationPath,
      metadata: {
        contentDisposition: `inline; filename=${originalFilename}`,
        metadata: {
          originalFilename,
          uploadedBy: `user_${userId}`,
          timestamp
        }
      }
    });
    
    // Get public URL
    const [file] = await bucket.file(destinationPath).get();
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
    return publicUrl;
  } catch (error) {
    console.error("File upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<boolean> {
  try {
    const bucket = storage.bucket();
    
    // Extract the file path from the public URL
    const urlObj = new URL(fileUrl);
    const filePath = urlObj.pathname.replace(`/storage.googleapis.com/${bucket.name}/`, '');
    
    // Delete the file
    await bucket.file(filePath).delete();
    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
}
