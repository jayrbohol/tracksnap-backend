import admin from 'firebase-admin';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Firestore backend selected but FIREBASE_PROJECT_ID not set');
  }
  // Private key may contain literal \n sequences
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }
  initialized = true;
}

export const firestoreParcelRepo = {
  async save(parcel) {
    ensureInit();
    await admin.firestore().collection('parcels').doc(parcel.id).set(parcel, { merge: true });
    return parcel;
  },
  async getById(id) {
    ensureInit();
    const snap = await admin.firestore().collection('parcels').doc(id).get();
    return snap.exists ? snap.data() : null;
  }
};
