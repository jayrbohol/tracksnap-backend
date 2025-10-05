import { memoryParcelRepo } from './memoryParcelRepo.js';
import { firestoreParcelRepo } from './firestoreParcelRepo.js';
import { supabaseParcelRepo } from './supabaseParcelRepo.js';
import { postgresParcelRepo } from './postgresParcelRepo.js';

export function getParcelRepo() {
  const backend = (process.env.DATA_BACKEND || 'postgres').toLowerCase();
  switch (backend) {
    case 'firestore':
      return firestoreParcelRepo;
    case 'supabase':
      return supabaseParcelRepo;
    case 'postgres':
      return postgresParcelRepo;
    case 'memory':
    default:
      return memoryParcelRepo;
  }
}
