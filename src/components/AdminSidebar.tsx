"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Music2,
  Newspaper,
  HelpCircle,
  Sparkles,
  LogOut,
  Menu,
  X,
  Shield,
  UserCog,
  Ticket,
  UserPlus,
  Wallet,
  TrendingUp,
  ShieldCheck,
  BotMessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User as UserType, hasPermission } from "@/hooks/useUser";

interface AdminSidebarProps {
  user: UserType;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const allMenuItems = [
    { icon: LayoutDashboard, label: "Дашборд", href: "/admin/dashboard", permKey: "canAccessDashboard" as const },
    { icon: Users, label: "Артисты", href: "/admin/artists", permKey: "canAccessArtists" as const },
    { icon: Music2, label: "Релизы", href: "/admin/releases", permKey: "canAccessReleases" as const },
    { icon: ShieldCheck, label: "Верификации", href: "/admin/verifications", permKey: "canAccessArtists" as const },
    { icon: Wallet, label: "Кошельки", href: "/admin/wallets", permKey: "canAccessWallets" as const },
    { icon: Newspaper, label: "Новости", href: "/admin/news", permKey: "canAccessNews" as const },
    { icon: HelpCircle, label: "FAQ", href: "/admin/faq", permKey: "canAccessFaq" as const },
    { icon: Ticket, label: "Тикеты", href: "/admin/tickets", permKey: "canAccessTickets" as const },
    { icon: UserPlus, label: "Заявки", href: "/admin/pending-users", permKey: "canAccessPendingUsers" as const },
    { icon: Sparkles, label: "Заявки на тексты", href: "/admin/lyrics", permKey: "canAccessLyrics" as const },
    { icon: TrendingUp, label: "Питчинги", href: "/admin/pitchings", permKey: "canAccessReleases" as const },
    { icon: BotMessageSquare, label: "Telegram", href: "/admin/telegram", permKey: "canAccessStaff" as const },
    { icon: UserCog, label: "Администрация", href: "/admin/staff", permKey: "canAccessStaff" as const },
  ];

  // Filter menu items based on admin permissions
  const menuItems = allMenuItems.filter((item) => hasPermission(user, item.permKey));

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col font-[Manrope,sans-serif]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 lg:transition-none"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <img
              src="/logo.svg"
              alt="Music Love Logo"
              className="w-14 h-14 object-contain"
            />
            <div>
              <h2 className="font-bold text-xl leading-tight">Music Love</h2>
              <p className="text-xs text-muted-foreground">Админ-панель</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="mb-3 p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              {user.isSuperAdmin ? (
                <Shield className="w-3.5 h-3.5 text-purple-500" />
              ) : (
                <UserCog className="w-3.5 h-3.5 text-blue-500" />
              )}
              <p className="text-xs font-medium text-muted-foreground">
                {user.isSuperAdmin ? "Супер-администратор" : "Администратор"}
              </p>
            </div>
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
