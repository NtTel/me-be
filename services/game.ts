
import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Game, GameQuestion } from '../types';

const GAMES_COLLECTION = 'games';

// --- GAME MANAGEMENT ---

export const fetchAllGames = async (onlyActive = false): Promise<Game[]> => {
  if (!db) return [];
  try {
    const gamesRef = collection(db, GAMES_COLLECTION);
    const snapshot = await getDocs(gamesRef);
    let games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    
    if (onlyActive) {
      games = games.filter(g => g.isActive);
    }
    
    // Client-side sort by order
    return games.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
};

export const getGameById = async (gameId: string): Promise<Game | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, GAMES_COLLECTION, gameId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Game;
    }
    return null;
  } catch (error) {
    console.error("Error fetching game:", error);
    return null;
  }
};

export const createGame = async (data: Omit<Game, 'id'>) => {
  if (!db) return;
  try {
    await addDoc(collection(db, GAMES_COLLECTION), data);
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

export const updateGame = async (id: string, updates: Partial<Game>) => {
  if (!db) return;
  try {
    const docRef = doc(db, GAMES_COLLECTION, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};

export const deleteGame = async (id: string) => {
  if (!db) return;
  try {
    // Note: This does not delete subcollections (questions). 
    // In a production app, use a Cloud Function to recursive delete.
    await deleteDoc(doc(db, GAMES_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

// --- QUESTION MANAGEMENT ---

export const fetchGameQuestions = async (gameId: string, onlyActive = false): Promise<GameQuestion[]> => {
  if (!db) return [];
  try {
    const qRef = collection(db, GAMES_COLLECTION, gameId, 'questions');
    const snapshot = await getDocs(qRef);
    let questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameQuestion));
    
    if (onlyActive) {
      questions = questions.filter(q => q.isActive);
    }

    return questions.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

export const createGameQuestion = async (gameId: string, data: Omit<GameQuestion, 'id'>) => {
  if (!db) return;
  try {
    const qRef = collection(db, GAMES_COLLECTION, gameId, 'questions');
    await addDoc(qRef, data);
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
};

export const updateGameQuestion = async (gameId: string, questionId: string, updates: Partial<GameQuestion>) => {
  if (!db) return;
  try {
    const docRef = doc(db, GAMES_COLLECTION, gameId, 'questions', questionId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
};

export const deleteGameQuestion = async (gameId: string, questionId: string) => {
  if (!db) return;
  try {
    const docRef = doc(db, GAMES_COLLECTION, gameId, 'questions', questionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
};
