'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Load user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data());
          } else {
            // Create new user profile if it doesn't exist
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date(),
              portfolioCount: 0,
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        setError(err.message);
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      console.error('Logout error:', err);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });
      setUserProfile((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      setError(err.message);
      console.error('Update profile error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
