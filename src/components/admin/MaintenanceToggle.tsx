"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
        setReason(data.reason || "");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newEnabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled, reason }),
      });
      if (res.ok) {
        setEnabled(newEnabled);
        toast.success(newEnabled ? "Тех. перерыв включён" : "Тех. перерыв отключён");
      } else {
        toast.error("Ошибка при переключении");
      }
    } catch {
      toast.error("Ошибка подключения");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReason = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        toast.success("Причина обновлена");
      } else {
        toast.error("Ошибка при сохранении");
      }
    } catch {
      toast.error("Ошибка подключения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={enabled ? "border-orange-500/40 bg-orange-500/5" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${enabled ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground"}`}>
              <Wrench className="w-5 h-5" />
            </div>
            Технический перерыв
          </CardTitle>
          <CardDescription>
            Включение режима обслуживания ограничивает доступ всем пользователям (кроме вас)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${enabled ? "border-orange-500/30 bg-orange-500/5" : "border-border"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground"}`}>
                {enabled ? <AlertTriangle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
              </div>
              <div>
                <Label className="cursor-pointer font-semibold">Режим обслуживания</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {enabled ? "Включён — сайт недоступен для пользователей" : "Выключен — сайт работает в штатном режиме"}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          {/* Reason editor */}
          <div className="space-y-2">
            <Label>Причина технического перерыва</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Обновление системы, добавление новых функций. Завершим до 18:00 МСК."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Этот текст увидят все пользователи на экране тех. перерыва
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSaveReason}
            disabled={saving}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Сохранить причину
          </Button>

          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Внимание! Тех. перерыв активен. Все артисты и администраторы видят экран обслуживания. Вы можете отключить его в любой момент.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
