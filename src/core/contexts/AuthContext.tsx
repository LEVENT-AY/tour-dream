/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
});

const VALID_ROLES: UserRole[] = ["customer", "agent", "admin"];

const normalizeProfile = (user: User, data: Record<string, unknown> | undefined): UserProfile => {
  const rawRole = (data?.role as string) || "customer";
  const role = VALID_ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : "customer";
  const agentStatus = (data?.agentStatus as any) || 'pending';
  const approved = !!(data?.approved as boolean | undefined);
  const suspended = !!(data?.suspended as boolean | undefined);
  return {
    uid: user.uid,
    email: user.email || (data?.email as string) || "",
    displayName: user.displayName || (data?.displayName as string) || "",
    phone: (data?.phone as string) || "",
    photoURL: (data?.photoURL as string) || "",
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDocFromServer(doc(db, 'users', user.uid));
          if (isMounted) {
            setUserProfile(normalizeProfile(user, userDoc.exists() ? userDoc.data() : undefined));
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (isMounted) {
            // Fail-safe: treat as unauthenticated so user is not stuck in loading
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
    await signOut(auth);
    // State will be cleared by onAuthStateChanged callback
  };

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
    };
  }, [currentUser, userProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
