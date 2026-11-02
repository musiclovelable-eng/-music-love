"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  FileX2,
  CirclePlus,
  Music2,
  BarChart3,
  Wallet,
  Wrench,
  Newspaper,
  LifeBuoy,
  TrendingUp,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/hooks/useUser";
import { ARTIST_VERIFICATION_REQUIRED } from "@/lib/verification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ArtistSidebarProps {
  user: UserType;
  onRefresh: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  isPrimary?: boolean;
  hasSubmenu?: boolean;
  subItems?: { label: string; href: string }[];
}

export function ArtistSidebar({ user }: ArtistSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTheme = user?.theme || 'light';
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "Музыка": true,
    "Инструменты": false,
    "Поддержка": false,
    "Маркетинг": false,
  });
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/artist/tools")) setOpenSubmenus(prev => ({ ...prev, "Инструменты": true }));
    if (pathname.startsWith("/artist/support") || pathname === "/artist/chat" || pathname === "/artist/faq") setOpenSubmenus(prev => ({ ...prev, "Поддержка": true }));
    if (pathname.startsWith("/artist/marketing")) setOpenSubmenus(prev => ({ ...prev, "Маркетинг": true }));
  }, [pathname]);

  useEffect(() => { setMounted(true); }, []);

  const toggleSubmenu = (e: React.MouseEvent, label: string) => {
    e.preventDefault(); e.stopPropagation();
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "A";

  const menuItems: MenuItem[] = [
    {
      label: "Новый релиз",
      href: "/artist/upload",
      icon: CirclePlus,
      active: pathname === "/artist/upload",
      isPrimary: true,
    },
    {
      label: "Верификация",
      href: "/artist/verification",
      icon: ShieldCheck,
      active: pathname === "/artist/verification",
    },
    {
      label: "Музыка",
      href: "/artist/releases",
      icon: Music2,
      active: pathname.startsWith("/artist/releases") || pathname === "/artist/moderation" || pathname === "/artist/corrections" || pathname.startsWith("/artist/drafts"),
      hasSubmenu: true,
      subItems: [
        { label: "Все релизы", href: "/artist/releases" },
        { label: "Черновики", href: "/artist/drafts" },
        { label: "Модерация", href: "/artist/moderation" },
        { label: "Требуются изменения", href: "/artist/corrections" },
      ],
    },
    {
      label: "Аналитика",
      href: "/artist/analytics",
      icon: BarChart3,
      active: pathname === "/artist/analytics",
    },
    {
      label: "Финансы",
      href: "/artist/wallet",
      icon: Wallet,
      active: pathname === "/artist/wallet",
    },
    {
      label: "Инструменты",
      href: "/artist/tools/lyrics",
      icon: Wrench,
      active: pathname.startsWith("/artist/tools"),
      hasSubmenu: true,
      subItems: [{ label: "Загрузка текста", href: "/artist/tools/lyrics" }],
    },
    {
      label: "Новости",
      href: "/artist/dashboard",
      icon: Newspaper,
      active: pathname === "/artist/dashboard",
    },
    {
      label: "Поддержка",
      href: "/artist/support",
      icon: LifeBuoy,
      active: pathname.startsWith("/artist/support") || pathname === "/artist/chat" || pathname === "/artist/faq",
      hasSubmenu: true,
      subItems: [
        { label: "Тикеты", href: "/artist/support" },
        { label: "Чат", href: "/artist/chat" },
        { label: "FAQ", href: "/artist/faq" },
      ],
    },
    {
      label: "Маркетинг",
      href: "/artist/marketing/pitching",
      icon: TrendingUp,
      active: pathname.startsWith("/artist/marketing"),
      hasSubmenu: true,
      subItems: [{ label: "Питчинг", href: "/artist/marketing/pitching" }],
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 250 }}
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-40 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200/70 dark:border-neutral-800/70 flex flex-col transition-all duration-300 shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo header */}
        <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0", isCollapsed && "justify-center px-0")}>
          <div className="w-8 h-8 flex-shrink-0 relative">
            <img
              src="/logo.svg"
              alt="Logo" className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white leading-none tracking-tight">Music Love</h2>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.15em] mt-0.5">Artist Portal</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                {item.hasSubmenu && !isCollapsed ? (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => toggleSubmenu(e, item.label)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group",
                        item.active
                          ? "text-[var(--brand)] bg-[var(--brand)]/8"
                          : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.7} />
                        <span className="font-medium text-[13px]">{item.label}</span>
                      </div>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-400 transition-transform duration-200", openSubmenus[item.label] && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {openSubmenus[item.label] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="ml-[18px] pl-3.5 border-l border-neutral-200 dark:border-neutral-800 my-1 space-y-0.5">
                            {item.subItems?.map((sub) => {
                              const isSubActive = pathname === sub.href || (sub.href.includes("?") && pathname === sub.href.split("?")[0]);
                              return (
                                <Link key={sub.href} href={sub.href} onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn("block py-1.5 px-3 text-[12px] rounded-md transition-all",
                                    isSubActive ? "text-[var(--brand)] bg-[var(--brand)]/8 font-medium" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/30")}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (ARTIST_VERIFICATION_REQUIRED && item.href === "/artist/upload" && !user.contractSigned) {
                        e.preventDefault();
                        setShowContractModal(true);
                        return;
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150",
                      item.active
                        ? "text-[var(--brand)] bg-[var(--brand)]/8"
                        : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40",
                      isCollapsed && "justify-center px-0",
                      item.isPrimary && !item.active && "text-[var(--brand)] font-semibold"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.7} />
                    {!isCollapsed && <span className="font-medium text-[13px]">{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-[12px] font-medium text-neutral-800 dark:text-neutral-200 truncate">{user.artistName || user.name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center px-2.5 pb-2.5 gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 flex-1",
                isCollapsed && "justify-center px-0"
              )}
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.7} />
              {!isCollapsed && <span className="text-[12.5px] font-medium">Выйти</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Модальное окно: договор не подписан */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <FileX2 className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Требуется договор</DialogTitle>
            <DialogDescription className="text-center text-base pt-2 leading-relaxed">
              Для загрузки релизов необходимо пройти верификацию и подписать договор с Music Love.
              <br /><br />
              Пройдите верификацию в личном кабинете, чтобы получить доступ к созданию релизов.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center flex-col gap-2">
            <Button onClick={() => { setShowContractModal(false); router.push("/artist/verification"); }} className="px-8 gap-2">
              <ShieldCheck className="w-4 h-4" /> Пройти верификацию
            </Button>
            <Button variant="ghost" onClick={() => setShowContractModal(false)}>Позже</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${mounted && currentTheme === 'dark' ? '#262626' : '#e5e5e5'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${mounted && currentTheme === 'dark' ? '#404040' : '#d4d4d4'}; }
      `}</style>
    </>
  );
}
