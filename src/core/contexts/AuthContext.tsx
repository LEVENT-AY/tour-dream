/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import type { UserProfile, UserRole, AgentNotificationPrefs } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isApprovedAgent: boolean;
  isCustomer: boolean;
  isSuspendedOrRejected: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isAgent: false,
  isApprovedAgent: false,
  isCustomer: false,
  isSuspendedOrRejected: false,
  logout: async () => {},
  refreshUserProfile: async () => {},
});

const VALID_ROLES: UserRole[] = ["customer", "agent", "admin"];

const normalizeProfile = (user: User, data: Record<string, unknown> | undefined): UserProfile => {
  const rawRole = data?.role as string | undefined;
  if (!rawRole || !VALID_ROLES.includes(rawRole as UserRole)) {
    throw new Error('User profile is missing a valid role.');
  }

  const role = rawRole as UserRole;
  const agentStatus = (data?.agentStatus as any) || 'pending';
  const approved = !!(data?.approved as boolean | undefined);
  const suspended = !!(data?.suspended as boolean | undefined);
  return {
    uid: user.uid,
    email: user.email || (data?.email as string) || "",
    displayName: user.displayName || (data?.displayName as string) || "",
    phone: (data?.phone as string) || "",
    photoURL: (data?.photoURL as string) || user.photoURL || "",
    role,
    agentStatus,
    approved,
    suspended,
    businessName: (data?.businessName as string) || "",
    businessType: (data?.businessType as string) || "",
    businessAddress: (data?.businessAddress as string) || "",
    taxNumber: (data?.taxNumber as string) || "",
    description: (data?.description as string) || "",
    notifications: (data?.notifications as AgentNotificationPrefs) || undefined,
    joinedAt: (data?.joinedAt as string) || (data?.createdAt as string) || new Date().toISOString(),
    createdAt: (data?.createdAt as string) || new Date().toISOString(),
    updatedAt: (data?.updatedAt as string) || new Date().toISOString(),
  };
};

const loadProfileForUser = async (user: User): Promise<UserProfile> => {
  const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    throw new Error('User profile not found.');
  }
  return normalizeProfile(user, userDoc.data());
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const cleanupModalArtifacts = () => {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      setCurrentUser(user);
      if (user) {
        try {
          if (isMounted) {
            setUserProfile(await loadProfileForUser(user));
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error("Error clearing invalid auth session:", signOutError);
          }
          if (isMounted) {
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    setCurrentUser(null);
    setUserProfile(null);
    setLoading(false);
    cleanupModalArtifacts();
    try {
      await signOut(auth);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      cleanupModalArtifacts();
    }
  };

  const refreshUserProfile = useCallback(async () => {
    const activeUser = auth.currentUser;
    if (!activeUser) {
      setUserProfile(null);
      setCurrentUser(null);
      return;
    }

    setLoading(true);
    try {
      const profile = await loadProfileForUser(activeUser);
      setCurrentUser(activeUser);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
      setCurrentUser(null);
      setUserProfile(null);
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error clearing invalid auth session:", signOutError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const role = userProfile?.role || null;
    const isAdmin = role === "admin";
    const isAgent = role === "agent" || isAdmin;
    const isApprovedAgent = userProfile?.approved === true && userProfile?.suspended !== true && userProfile?.agentStatus === 'approved';
    const isSuspendedOrRejected = isAgent && (userProfile?.suspended === true || userProfile?.agentStatus === 'rejected' || userProfile?.agentStatus === 'suspended');
    return {
      currentUser,
      userProfile,
      role,
      loading,
      isAuthenticated: !!currentUser && !!userProfile,
      isAdmin,
      isAgent,
      isApprovedAgent,
      isCustomer: role === "customer" || isAgent,
      isSuspendedOrRejected,
      logout,
      refreshUserProfile,
    };
  }, [currentUser, userProfile, loading, refreshUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
