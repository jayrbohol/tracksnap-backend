import { memoryParcelRepo } from './memoryParcelRepo.js';
import { firestoreParcelRepo } from './firestoreParcelRepo.js';
import { supabaseParcelRepo } from './supabaseParcelRepo.js';

export function getParcelRepo() {
  const backend = (process.env.DATA_BACKEND || 'memory').toLowerCase();
  switch (backend) {
    case 'firestore':
      return firestoreParcelRepo;
    case 'supabase':
      return supabaseParcelRepo;
    case 'memory':
    default:
      return memoryParcelRepo;
  }
}
