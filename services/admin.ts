
import { 
  collection, getDocs, doc, updateDoc, query, orderBy, where, deleteDoc, getDoc, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, Question, ExpertApplication, Report } from '../types';

// --- USERS ---
export const fetchAllUsers = async (): Promise<User[]> => {
  if (!db) return [];
  // Remove orderBy to prevent index errors. Sort client-side.
  const q = query(collection(db, 'users'));
  const snapshot = await getDocs(q);
  const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
  return users.sort((a, b) => new Date(b.joinedAt || '').getTime() - new Date(a.joinedAt || '').getTime());
};

export const updateUserRole = async (userId: string, updates: { isExpert?: boolean; isAdmin?: boolean; isBanned?: boolean }) => {
  if (!db) return;
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, updates);
};

// --- EXPERT APPLICATIONS ---
export const fetchExpertApplications = async (): Promise<ExpertApplication[]> => {
  if (!db) return [];
  // FIX: Removed orderBy('createdAt') to avoid "Missing Index" error causing empty list
  const q = query(collection(db, 'expert_applications'));
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExpertApplication));
  // Client-side sort
  return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const processExpertApplication = async (appId: string, userId: string, status: 'approved' | 'rejected', reason?: string, specialty?: string) => {
  if (!db) return;
  const batch = writeBatch(db);
  
  // 1. Update Application Status
  const appRef = doc(db, 'expert_applications', appId);
  batch.update(appRef, { 
    status, 
    rejectionReason: reason || null,
    reviewedAt: new Date().toISOString() // Add timestamp for history
  });

  // 2. Update User Profile if Approved
  if (status === 'approved') {
    const userRef = doc(db, 'users', userId);
    const updates: any = { 
      isExpert: true, 
      expertStatus: 'approved' 
    };
    if (specialty) updates.specialty = specialty;
    
    batch.update(userRef, updates);
  } else if (status === 'rejected') {
     const userRef = doc(db, 'users', userId);
     batch.update(userRef, { expertStatus: 'rejected' });
  }

  await batch.commit();
};

// --- QUESTIONS ---
export const fetchAllQuestionsAdmin = async (): Promise<Question[]> => {
  if (!db) return [];
  // Remove orderBy to prevent index errors
  const q = query(collection(db, 'questions'));
  const snapshot = await getDocs(q);
  const questions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Question));
  return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const bulkUpdateQuestions = async (ids: string[], updates: { isHidden?: boolean }) => {
  if (!db) return;
  const batch = writeBatch(db);
  ids.forEach(id => {
    const ref = doc(db, 'questions', id);
    batch.update(ref, updates);
  });
  await batch.commit();
};

export const bulkDeleteQuestions = async (ids: string[]) => {
  if (!db) return;
  const batch = writeBatch(db);
  ids.forEach(id => {
    const ref = doc(db, 'questions', id);
    batch.delete(ref);
  });
  await batch.commit();
};

// --- REPORTS (MOCK) ---
export const fetchReports = async (): Promise<Report[]> => {
    return []; 
};
