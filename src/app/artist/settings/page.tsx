"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { Loader2, Sun, Moon, Snowflake, Settings, ArrowLeft, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ArtistSettings() {
  const { user, loading, refreshUser } = useUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(user?.theme || "light");
  const [showSnowflakes, setShowSnowflakes] = useState(user?.showSnowflakes || false);
  const [showGarland, setShowGarland] = useState(user?.showGarland || false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, showSnowflakes, showGarland }),
      });

      if (response.ok) {
        await refreshUser();
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        toast.success("Настройки сохранены");
        router.refresh();
      } else {
        toast.error("Ошибка при сохранении");
      }
    } catch {
      toast.error("Ошибка подключения");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/artist/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="w-7 h-7" /> Настройки
          </h1>
          <p className="text-muted-foreground">Внешний вид и персонализация</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Тема оформления</CardTitle>
            <CardDescription>Выберите светлую или тёмную тему интерфейса</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`p-6 rounded-lg border-2 transition-all ${theme === "light" ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-border hover:border-[var(--brand)]/50"}`}
              >
                <Sun className="w-10 h-10 mx-auto mb-2" />
                <p className="font-medium">Светлая</p>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-6 rounded-lg border-2 transition-all ${theme === "dark" ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-border hover:border-[var(--brand)]/50"}`}
              >
                <Moon className="w-10 h-10 mx-auto mb-2" />
                <p className="font-medium">Тёмная</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Анимация</CardTitle>
            <CardDescription>Декоративные эффекты (только для тёмной темы)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Snowflake className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="cursor-pointer">Анимация снежинок</Label>
                  <p className="text-xs text-muted-foreground">Плавно падают сверху вниз</p>
                </div>
              </div>
              <Switch checked={showSnowflakes} onCheckedChange={setShowSnowflakes} disabled={theme !== "dark"} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <div>
                  <Label className="cursor-pointer">Новогодняя гирлянда</Label>
                  <p className="text-xs text-muted-foreground">Мерцающие огоньки</p>
                </div>
              </div>
              <Switch checked={showGarland} onCheckedChange={setShowGarland} disabled={theme !== "dark"} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</> : "Сохранить настройки"}
        </Button>
      </motion.div>
    </div>
  );
}
