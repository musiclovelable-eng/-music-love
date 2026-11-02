"use client";

import { useUser } from "@/hooks/useUser";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import { ArtistProfileDropdown } from "@/components/artist-profile-dropdown";
import { Snowflakes } from "@/components/Snowflakes";
import { ChristmasGarland } from "@/components/christmas-garland";
import { PendingAccessBanner } from "@/components/PendingAccessBanner";
import { PendingAccessOverlay } from "@/components/PendingAccessOverlay";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import { useEffect } from "react";
import { useMaintenance } from "@/hooks/useMaintenance";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, refreshUser } = useUser();
  const maintenance = useMaintenance(!!user?.isSuperAdmin);
  
  useHeartbeat();

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

  if (!user) {
    return null;
  }

  // Maintenance mode check (except super admin)
  if (!maintenance.loading && maintenance.enabled) {
    return <MaintenanceScreen initialReason={maintenance.reason} />;
  }

  const isPendingApproval = user.requiresApproval && !user.isApproved;

  return (
    <ReadOnlyProvider isReadOnly={isPendingApproval}>
      <div className={`min-h-screen bg-background ${isPendingApproval ? "overflow-hidden" : ""}`}>
        {user.theme === "dark" && user.showSnowflakes && <Snowflakes />}
        {user.theme === "dark" && user.showGarland && <ChristmasGarland />}
        
        {isPendingApproval && <PendingAccessOverlay />}

        <div className={`flex h-screen overflow-hidden ${isPendingApproval ? "pointer-events-none select-none blur-[2px] grayscale-[0.5] opacity-50" : ""}`}>
          <ArtistSidebar user={user} onRefresh={refreshUser} />
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
              <div className="container mx-auto px-6 lg:px-8 h-16 flex items-center justify-end">
                <ArtistProfileDropdown user={user} onRefresh={refreshUser} />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="container mx-auto p-6 lg:p-8">
                {isPendingApproval && <PendingAccessBanner />}
                {children}
              </div>
            </div>

          </main>
        </div>
      </div>
    </ReadOnlyProvider>
  );
}
