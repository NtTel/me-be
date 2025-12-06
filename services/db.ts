
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Question, Answer } from '../types';

const QUESTIONS_COLLECTION = 'questions';

// --- REALTIME LISTENER ---
export const subscribeToQuestions = (callback: (questions: Question[]) => void) => {
  if (!db) return () => {};
  
  const q = query(collection(db, QUESTIONS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Question[];
    callback(questions);
  }, (error) => {
    console.error("Error subscribing to questions:", error);
  });
};

// --- QUESTION CRUD ---
export const addQuestionToDb = async (question: Question) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, question.id);
    await setDoc(docRef, question);
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
};

export const updateQuestionInDb = async (id: string, data: Partial<Question>) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating question:", error);
  }
};

export const deleteQuestionFromDb = async (id: string) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting question:", error);
  }
};

// --- ANSWER CRUD ---
// Since answers are stored as an array within the question document,
// we need to read the doc, modify the array, and write it back.

export const addAnswerToDb = async (questionId: string, answer: Answer) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const question = docSnap.data() as Question;
      const updatedAnswers = [...question.answers, answer];
      await updateDoc(docRef, { answers: updatedAnswers });
    }
  } catch (error) {
    console.error("Error adding answer:", error);
  }
};

export const updateAnswerInDb = async (questionId: string, answerId: string, updates: Partial<Answer>) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const question = docSnap.data() as Question;
      const updatedAnswers = question.answers.map(a => 
        a.id === answerId ? { ...a, ...updates } : a
      );
      await updateDoc(docRef, { answers: updatedAnswers });
    }
  } catch (error) {
    console.error("Error updating answer:", error);
  }
};

export const deleteAnswerFromDb = async (questionId: string, answerId: string) => {
  if (!db) return;
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const question = docSnap.data() as Question;
      const updatedAnswers = question.answers.filter(a => a.id !== answerId);
      await updateDoc(docRef, { answers: updatedAnswers });
    }
  } catch (error) {
    console.error("Error deleting answer:", error);
  }
};
