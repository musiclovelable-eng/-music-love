"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminPermissions {
  id: number;
  adminId: number;
  canAccessDashboard: boolean;
  canAccessArtists: boolean;
  canAccessReleases: boolean;
  canAccessWallets: boolean;
  canAccessNews: boolean;
  canAccessFaq: boolean;
  canAccessTickets: boolean;
  canAccessPendingUsers: boolean;
  canAccessLyrics: boolean;
  canAccessStaff: boolean;
  canEditReleases: boolean;
  canDeleteReleases: boolean;
  canDownloadFiles: boolean;
  canApproveReleases: boolean;
  canEditArtists: boolean;
  canDeleteArtists: boolean;
  canManagePayouts: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  surname: string | null;
  artistName: string | null;
  bio: string | null;
  contractSigned: boolean;
  socialNetwork: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isFrozen: boolean;
  uid: string;
  plan: string;
  role: string | null;
  theme: string;
  showSnowflakes: boolean;
  showGarland: boolean;
  avatarUrl: string | null;
  label: string;
  createdAt: string | null;
  telegramChatId: string | null;
  isApproved: boolean;
  emailVerified: boolean;
  accessRequestMessage: string | null;
  isSuperAdmin?: boolean;
  adminPermissions?: AdminPermissions | null;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = () => {
    fetchUser();
  };

  return { user, loading, refreshUser };
}

// Helper: check if admin has permission for a specific section/action
export function hasPermission(user: User | null, permission: keyof AdminPermissions): boolean {
  if (!user || !user.isAdmin) return false;
  if (user.isSuperAdmin) return true; // super-admin has everything
  if (!user.adminPermissions) return true; // fallback: if no perms row, allow
  return !!user.adminPermissions[permission];
}
