"use client";

import { useUser, hasPermission, AdminPermissions } from "@/hooks/useUser";
import { Shield } from "lucide-react";

interface AdminPermissionGuardProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
}

export function AdminPermissionGuard({ permission, children }: AdminPermissionGuardProps) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) return null;

  if (!hasPermission(user, permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Shield className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Нет доступа</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            У вас нет прав доступа к данному разделу. Обратитесь к супер-администратору для получения необходимых прав.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
