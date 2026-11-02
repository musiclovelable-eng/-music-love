"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { User as UserType } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ArtistProfileDropdownProps {
  user: UserType;
  onRefresh: () => void;
}

export function ArtistProfileDropdown({
  user,
  onRefresh,
}: ArtistProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(user.theme);
  const [snowflakesEnabled, setSnowflakesEnabled] = useState(
    user.showSnowflakes
  );
  const [garlandEnabled, setGarlandEnabled] = useState(user.showGarland);
  const [updating, setUpdating] = useState(false);

  const updateSettings = async (
    newTheme?: string,
    newSnowflakes?: boolean,
    newGarland?: boolean
  ) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: newTheme,
          snowflakesEnabled: newSnowflakes,
          garlandEnabled: newGarland,
        }),
      });

      if (response.ok) {
        onRefresh();
        
        // Apply theme immediately
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (newTheme === "light") {
          document.documentElement.classList.remove("dark");
        }
      } else {
        toast.error("Ошибка обновления настроек");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Ошибка обновления настроек");
    } finally {
      setUpdating(false);
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    await updateSettings(newTheme, undefined, undefined);
  };

  const handleSnowflakesToggle = async (enabled: boolean) => {
    setSnowflakesEnabled(enabled);
    await updateSettings(undefined, enabled, undefined);
  };

  const handleGarlandToggle = async (enabled: boolean) => {
    setGarlandEnabled(enabled);
    await updateSettings(undefined, undefined, enabled);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors",
          isOpen && "bg-muted"
        )}
      >
        <Avatar className="w-9 h-9">
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {/* Profile Section */}
              <div className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Профиль
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm mt-1 truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Лейбл: {user.label}
                    </p>
                    <Badge
                      variant={
                        user.plan === "advanced" ? "default" : "secondary"
                      }
                      className="mt-2"
                    >
                      {user.plan === "advanced"
                        ? "Продвинутый план"
                        : "Базовый план"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Navigation buttons */}
              <div className="p-3 space-y-1">
                <button
                  onClick={() => { window.location.href = "/artist/profile"; }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-sm font-medium text-left"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  Профиль
                </button>
                <button
                  onClick={() => { window.location.href = "/artist/settings"; }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-sm font-medium text-left"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Настройки
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}