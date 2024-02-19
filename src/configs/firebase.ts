import admin from 'firebase-admin';
import firebaseAuthKey from '../jsons/dev-website-clone-firebase-adminsdk-jz6bz-afc58301c1.json';
import { FIREBASE_STORAGE_ID } from './environment';

export const configFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAuthKey as admin.ServiceAccount),
    storageBucket: FIREBASE_STORAGE_ID
  });
}