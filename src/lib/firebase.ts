import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyBF0lUQmTe5Y29abRmgr8DUFptNANGMYjI',
  authDomain: 'trainovationscrm.firebaseapp.com',
  projectId: 'trainovationscrm',
  storageBucket: 'trainovationscrm.firebasestorage.app',
  messagingSenderId: '855274712874',
  appId: '1:855274712874:web:bc2c53f83e6fb325937853',
  measurementId: 'G-EXDE86Y1KV',
};

// Prevent re-initialization in Next.js hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };

export function getAnalyticsInstance() {
  if (typeof window === 'undefined') return null;
  // Dynamic import to avoid SSR issues
  return import('firebase/analytics').then(({ getAnalytics }) => getAnalytics(app));
}
