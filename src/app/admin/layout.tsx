"use client";

import { useUser } from "@/hooks/useUser";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { hasPermission, AdminPermissions } from "@/hooks/useUser";
import { Shield } from "lucide-react";
import { useMaintenance } from "@/hooks/useMaintenance";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

// Map route prefixes to required permissions
const ROUTE_PERMISSION_MAP: Record<string, keyof AdminPermissions> = {
  "/admin/wallets": "canAccessWallets",
  "/admin/artists": "canAccessArtists",
  "/admin/verifications": "canAccessArtists",
  "/admin/releases": "canAccessReleases",
  "/admin/news": "canAccessNews",
  "/admin/faq": "canAccessFaq",
  "/admin/tickets": "canAccessTickets",
  "/admin/pending-users": "canAccessPendingUsers",
  "/admin/lyrics": "canAccessLyrics",
  "/admin/staff": "canAccessStaff",
  "/admin/telegram": "canAccessStaff",
  "/admin/dashboard": "canAccessDashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const maintenance = useMaintenance(!!user?.isSuperAdmin);
  const router = useRouter();
  const pathname = usePathname();

  useHeartbeat();

  useEffect(() => {
    if (!loading && user && !user.isAdmin) {
      router.push("/artist/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.theme) {
      if (user.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [user?.theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  // Maintenance mode check (except super admin)
  if (!maintenance.loading && maintenance.enabled) {
    return <MaintenanceScreen initialReason={maintenance.reason} />;
  }

  // Check if admin has frozen session
  if (user.isFrozen) {
    return null;
  }

  // Permission check for current route
  const requiredPermission = Object.entries(ROUTE_PERMISSION_MAP).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  )?.[1];

  const isAccessDenied =
    requiredPermission && !hasPermission(user, requiredPermission);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8">
            {isAccessDenied ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Нет доступа</h2>
                  <p className="text-muted-foreground mt-3 max-w-md">
                    У вас нет прав доступа к данному разделу. Обратитесь к
                    супер-администратору для получения необходимых прав.
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
