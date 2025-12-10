import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, startAfter, Timestamp, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { BlogPost, BlogCategory, BlogComment, User } from '../types';

const BLOG_POSTS_COL = 'blogPosts';
const BLOG_CATS_COL = 'blogCategories';
const BLOG_COMMENTS_COL = 'blogComments';

// --- CATEGORIES (PUBLIC) ---
export const fetchBlogCategories = async (): Promise<BlogCategory[]> => {
  if (!db) return [];
  try {
    // Simplified query to avoid index issues
    const q = query(collection(db, BLOG_CATS_COL)); 
    const snapshot = await getDocs(q);
    const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogCategory));
    // Sort client-side
    return cats.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error("Error fetching blog categories", e);
    return [];
  }
};

// --- CATEGORIES (ADMIN) ---
export const createBlogCategory = async (data: Omit<BlogCategory, 'id'>) => {
  if (!db) return;
  try {
      await addDoc(collection(db, BLOG_CATS_COL), data);
  } catch (e) {
      console.error("Error creating blog category:", e);
      throw e;
  }
};

export const updateBlogCategory = async (id: string, data: Partial<BlogCategory>) => {
  if (!db) return;
  await updateDoc(doc(db, BLOG_CATS_COL, id), data);
};

export const deleteBlogCategory = async (id: string) => {
  if (!db) return;
  await deleteDoc(doc(db, BLOG_CATS_COL, id));
};

// --- POSTS (PUBLIC) ---
export const fetchPublishedPosts = async (categoryId?: string, limitCount = 20): Promise<BlogPost[]> => {
  if (!db) return [];
  try {
    let q;
    // Simple queries without orderBy to prevent 'Missing Index' error
    if (categoryId && categoryId !== 'all') {
        q = query(
            collection(db, BLOG_POSTS_COL),
            where('status', '==', 'published'),
            where('categoryId', '==', categoryId),
            limit(limitCount) 
        );
    } else {
        q = query(
            collection(db, BLOG_POSTS_COL),
            where('status', '==', 'published'),
            limit(limitCount)
        );
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as BlogPost));
    
    // Sort Client-side
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Error fetching blog posts", e);
    return [];
  }
};

// --- POSTS (ADMIN) ---
export const fetchAllPostsAdmin = async (authorId?: string): Promise<BlogPost[]> => {
  if (!db) return [];
  try {
    let q;
    if (authorId) {
        q = query(collection(db, BLOG_POSTS_COL), where('authorId', '==', authorId));
    } else {
        q = query(collection(db, BLOG_POSTS_COL));
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as BlogPost));
    // Sort client-side
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Error fetching admin blog posts", e);
    return [];
  }
};

export const createBlogPost = async (data: any) => {
  if (!db) return;
  const postData = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0
  };
  await addDoc(collection(db, BLOG_POSTS_COL), postData);
};

export const updateBlogPost = async (id: string, updates: Partial<BlogPost>) => {
  if (!db) return;
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, BLOG_POSTS_COL, id), updateData);
};

export const deleteBlogPost = async (id: string) => {
  if (!db) return;
  await deleteDoc(doc(db, BLOG_POSTS_COL, id));
};

// --- DETAIL & RELATED ---
export const fetchPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!db) return null;
  try {
    const q = query(collection(db, BLOG_POSTS_COL), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      updateDoc(docData.ref, { views: (docData.data().views || 0) + 1 }).catch(()=>{});
      return { id: docData.id, ...docData.data() as any } as BlogPost;
    }
    return null;
  } catch (e) {
    console.error("Error fetching post by slug", e);
    return null;
  }
};

export const fetchRelatedPosts = async (currentPostId: string, categoryId?: string): Promise<BlogPost[]> => {
  if (!db) return [];
  try {
    const q = query(
        collection(db, BLOG_POSTS_COL), 
        where('status', '==', 'published'),
        limit(10)
    );
    
    const snapshot = await getDocs(q);
    const posts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any } as BlogPost))
        .filter(p => p.id !== currentPostId)
        .filter(p => !categoryId || p.categoryId === categoryId)
        .slice(0, 3); 
    
    return posts;
  } catch (e) {
    console.error("Error fetching related posts", e);
    return [];
  }
};

// --- COMMENTS ---
export const fetchBlogComments = async (postId: string): Promise<BlogComment[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, BLOG_COMMENTS_COL), where('postId', '==', postId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as BlogComment));
  } catch (e) {
    console.error("Error fetching comments", e);
    return [];
  }
};

export const addBlogComment = async (user: User, postId: string, content: string) => {
  if (!db) return;
  const comment: Omit<BlogComment, 'id'> = {
    postId,
    content,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    isExpert: user.isExpert,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await addDoc(collection(db, BLOG_COMMENTS_COL), comment);
};