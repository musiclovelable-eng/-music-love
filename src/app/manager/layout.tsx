"use client";

import { useUser } from "@/hooks/useUser";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { ManagerSidebar } from "@/components/ManagerSidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  
  // Отслеживание активности менеджера
  useHeartbeat();

  useEffect(() => {
    if (!loading && user) {
      if (user.isAdmin) {
        router.push("/admin/dashboard");
      } else if (!user.isManager) {
        router.push("/artist/dashboard");
      } else if (user.isFrozen) {
        router.push("/");
      }
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

  if (!user || !user.isManager || user.isFrozen) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <ManagerSidebar user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}