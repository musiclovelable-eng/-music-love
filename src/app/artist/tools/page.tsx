"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ExternalLink, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ArtistTools() {
  const { user } = useUser();
  const [trackUrl, setTrackUrl] = useState("");
  const [lyricsUrl, setLyricsUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/lyrics-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl, lyricsUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Ошибка при отправке заявки" });
        return;
      }

      setMessage({ type: "success", text: "Заявка успешно отправлена!" });
      setTrackUrl("");
      setLyricsUrl("");
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка подключения к серверу" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdvancedPlan = user?.plan === "advanced";

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Инструменты</h1>
        <p className="text-muted-foreground">
          Дополнительные возможности для артистов
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={!isAdvancedPlan ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Загрузка текста на площадки
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Отправьте тексты ваших треков для публикации на Musixmatch, Genius и других платформах
                    </CardDescription>
                  </div>
                  <Badge variant={isAdvancedPlan ? "default" : "secondary"}>
                    {isAdvancedPlan ? "Доступно" : "Продвинутый план"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!isAdvancedPlan ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Функция доступна только в Продвинутом плане. Обратитесь к администратору для повышения плана.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="track-url">Ссылка на трек</Label>
                      <Input
                        id="track-url"
                        type="url"
                        placeholder="https://open.spotify.com/track/..."
                        value={trackUrl}
                        onChange={(e) => setTrackUrl(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Ссылка на ваш трек на Spotify, Apple Music или других платформах
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lyrics-url">Ссылка на текст трека</Label>
                      <Input
                        id="lyrics-url"
                        type="url"
                        placeholder="https://docs.google.com/document/..."
                        value={lyricsUrl}
                        onChange={(e) => setLyricsUrl(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Ссылка на документ с текстом (Google Docs или другой сервис)
                      </p>
                    </div>

                    {message && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                      >
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                          {message.type === "success" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        "Отправить на проверку"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Требования к текстам</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Musixmatch</h4>
                  <a
                    href="https://community.musixmatch.com/guidelines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Правила сообщества
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Genius</h4>
                  <a
                    href="https://genius.com/Genius-russia-how-to-add-songs-to-genius-annotated"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Как добавить песню
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg">Обработка заявок</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>
                  После отправки заявки наша команда проверит ссылки и загрузит текст на указанные платформы.
                </p>
                <p className="font-semibold text-foreground">
                  Среднее время обработки: 7 рабочих дней
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
