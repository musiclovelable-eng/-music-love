"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Send,
  Users,
  Unlink,
  BotMessageSquare,
  RefreshCw,
  Power,
  PowerOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConnectedArtist {
  id: number;
  name: string;
  surname: string | null;
  artistName: string | null;
  email: string;
  telegramChatId: string;
}

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
}

interface TelegramData {
  connectedArtists: ConnectedArtist[];
  botEnabled: boolean;
  webhookInfo: WebhookInfo | null;
}

type BroadcastTarget = "all" | "selected";

export default function AdminTelegramPage() {
  const [data, setData] = useState<TelegramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

  // Broadcast form
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>("all");
  const [broadcastText, setBroadcastText] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/telegram");
      const json = await res.json();
      setData(json);
    } catch {
      setMessage({ type: "error", text: "Не удалось загрузить данные" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleBot = async () => {
    if (!data) return;
    setTogglingBot(true);
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_bot", enabled: !data.botEnabled }),
      });
      const json = await res.json();
      if (json.ok) {
        setData((prev) => prev ? { ...prev, botEnabled: json.botEnabled } : prev);
        showMessage(
          "success",
          json.botEnabled ? "Бот включён" : "Бот выключен"
        );
      }
    } catch {
      showMessage("error", "Ошибка при смене статуса бота");
    } finally {
      setTogglingBot(false);
    }
  };

  const handleUnlink = async (artistId: number, artistName: string) => {
    setUnlinkingId(artistId);
    try {
      const res = await fetch("/api/admin/telegram/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      const json = await res.json();
      if (json.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                connectedArtists: prev.connectedArtists.filter((a) => a.id !== artistId),
              }
            : prev
        );
        setSelectedArtistIds((prev) => prev.filter((id) => id !== artistId));
        showMessage("success", `Telegram отвязан от ${artistName}`);
      }
    } catch {
      showMessage("error", "Ошибка при отвязке");
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      showMessage("error", "Введите текст сообщения");
      return;
    }
    if (broadcastTarget === "selected" && selectedArtistIds.length === 0) {
      showMessage("error", "Выберите хотя бы одного артиста");
      return;
    }

    setSendingBroadcast(true);
    try {
      const body =
        broadcastTarget === "all"
          ? { action: "broadcast_all", message: broadcastText }
          : { action: "broadcast_selected", artistIds: selectedArtistIds, message: broadcastText };

      const res = await fetch("/api/admin/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        showMessage(
          "success",
          `Отправлено: ${json.successCount} ✓${json.failCount > 0 ? `, не доставлено: ${json.failCount}` : ""}`
        );
        setBroadcastText("");
        setSelectedArtistIds([]);
      } else {
        showMessage("error", json.error || "Ошибка рассылки");
      }
    } catch {
      showMessage("error", "Ошибка рассылки");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const toggleSelectArtist = (id: number) => {
    setSelectedArtistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredArtists = (data?.connectedArtists ?? []).filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.surname ?? "").toLowerCase().includes(q) ||
      (a.artistName ?? "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const webhookOk = data?.webhookInfo?.url && !data?.webhookInfo?.last_error_message;

  return (
    <div className="space-y-6 font-[Manrope,sans-serif]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <BotMessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Telegram</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Управление ботом и рассылки
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </motion.div>

      {/* Alert */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Bot status card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="w-4 h-4" />
              Статус бота
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="font-medium">Telegram-бот</p>
                <p className="text-sm text-muted-foreground">
                  Отправка уведомлений артистам{" "}
                  {data?.botEnabled ? (
                    <span className="text-green-500 font-medium">активна</span>
                  ) : (
                    <span className="text-red-500 font-medium">приостановлена</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={data?.botEnabled ? "default" : "secondary"}
                  className={data?.botEnabled ? "bg-green-500/15 text-green-600 border-green-500/30" : ""}
                >
                  {data?.botEnabled ? "Включён" : "Выключен"}
                </Badge>
                <Button
                  variant={data?.botEnabled ? "destructive" : "default"}
                  size="sm"
                  onClick={handleToggleBot}
                  disabled={togglingBot}
                >
                  {togglingBot ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : data?.botEnabled ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-1.5" />
                      Выключить
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-1.5" />
                      Включить
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Webhook info */}
            {data?.webhookInfo && (
              <div className="p-3 rounded-lg border text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Webhook:</span>
                  <Badge
                    variant="outline"
                    className={
                      webhookOk
                        ? "text-green-600 border-green-500/40"
                        : "text-red-500 border-red-500/40"
                    }
                  >
                    {webhookOk ? "Активен" : "Ошибка"}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate">{data.webhookInfo.url}</p>
                {data.webhookInfo.last_error_message && (
                  <p className="text-red-500 text-xs">{data.webhookInfo.last_error_message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Ожидающих обновлений: {data.webhookInfo.pending_update_count}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Broadcast form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4" />
                Рассылка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target selector */}
              <div className="flex gap-2">
                <Button
                  variant={broadcastTarget === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBroadcastTarget("all");
                    setSelectedArtistIds([]);
                  }}
                >
                  Всем артистам
                </Button>
                <Button
                  variant={broadcastTarget === "selected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBroadcastTarget("selected")}
                >
                  Выбранным ({selectedArtistIds.length})
                </Button>
              </div>

              {/* Artist selection for targeted broadcast */}
              {broadcastTarget === "selected" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск артиста..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                    {filteredArtists.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">Нет подключённых артистов</p>
                    ) : (
                      filteredArtists.map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedArtistIds.includes(a.id)}
                            onCheckedChange={() => toggleSelectArtist(a.id)}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {a.artistName || `${a.name} ${a.surname ?? ""}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Message textarea */}
              <div className="space-y-1.5">
                <Label>Текст сообщения</Label>
                <Textarea
                  placeholder="Введите текст рассылки... (поддерживается HTML: <b>жирный</b>, <i>курсив</i>)"
                  rows={5}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {broadcastTarget === "all"
                    ? `Получат: все подключённые артисты (${data?.connectedArtists.length ?? 0})`
                    : `Получат: ${selectedArtistIds.length} артист(ов)`}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleBroadcast}
                disabled={sendingBroadcast || !broadcastText.trim()}
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить рассылку
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected artists */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Подключённые аккаунты
                </span>
                <Badge variant="secondary">{data?.connectedArtists.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.connectedArtists.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BotMessageSquare className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Нет подключённых Telegram-аккаунтов
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Артисты могут авторизоваться в боте командой /start
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {data.connectedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {artist.artistName || `${artist.name} ${artist.surname ?? ""}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{artist.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          chat: {artist.telegramChatId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() =>
                          handleUnlink(
                            artist.id,
                            artist.artistName || `${artist.name} ${artist.surname ?? ""}`
                          )
                        }
                        disabled={unlinkingId === artist.id}
                      >
                        {unlinkingId === artist.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
