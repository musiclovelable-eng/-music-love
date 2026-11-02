"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Send, CheckCircle, XCircle, Clock, Info, Lock } from "lucide-react";
import { toast } from "sonner";

interface LyricsSubmission {
  id: number;
  trackName: string;
  lyricLink: string;
  platform: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export default function LyricsSubmissionPage() {
  const { user, loading: userLoading } = useUser();
  const [submissions, setSubmissions] = useState<LyricsSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [trackName, setTrackName] = useState("");
  const [lyricLink, setLyricLink] = useState("");
  const [platform, setPlatform] = useState("musixmatch");

  useEffect(() => {
    if (!userLoading && user) {
      fetchSubmissions();
    }
  }, [user, userLoading]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/lyrics-submissions");
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackName.trim() || !lyricLink.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/lyrics-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackName: trackName.trim(),
          lyricLink: lyricLink.trim(),
          platform,
        }),
      });

      if (response.ok) {
        toast.success("Заявка успешно отправлена!");
        setTrackName("");
        setLyricLink("");
        setPlatform("musixmatch");
        fetchSubmissions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при отправке заявки");
      }
    } catch (error) {
      toast.error("Ошибка подключения к серверу");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Отправлено
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3" />
            Одобрено
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Отказано
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformName = (platform: string) => {
    const platforms: Record<string, string> = {
      musixmatch: "Musixmatch",
      genius: "Genius",
      azlyrics: "AZLyrics",
      other: "Другое",
    };
    return platforms[platform] || platform;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if user has advanced plan
  if (user?.plan !== "advanced") {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Функция недоступна</CardTitle>
                  <CardDescription>Требуется Продвинутый план</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Функция «Загрузка текста на площадки» доступна только артистам с Продвинутым планом.
              </p>
              <p className="text-muted-foreground">
                С Продвинутым планом вы получите:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Загрузка текстов треков на Musixmatch, Genius и другие платформы</li>
                <li>Отслеживание статусов заявок</li>
                <li>Приоритетная обработка заявок</li>
                <li>Промо от Music Love</li>
                <li>Приоритетная модерация релизов</li>
              </ul>
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Свяжитесь с администратором для обновления вашего плана до Продвинутого.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Загрузка текста на площадки</h1>
        <p className="text-muted-foreground">
          Отправьте ссылки на тексты ваших треков для публикации на Musixmatch, Genius и других платформах
        </p>
      </motion.div>

      {/* Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              О функции
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Эта функция позволяет вам отправлять ссылки на тексты ваших треков для публикации на популярных платформах с текстами песен.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Требования для Musixmatch:</h4>
                <a
                  href="https://community.musixmatch.com/guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Руководство по оформлению текстов
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Требования для Genius:</h4>
                <a
                  href="https://genius.com/Genius-russia-how-to-add-songs-to-genius-annotated"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Как добавить песни на Genius
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submission Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Новая заявка</CardTitle>
            <CardDescription>
              Заполните форму, чтобы отправить текст трека на проверку
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="trackName">Название трека *</Label>
                <Input
                  id="trackName"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="Введите название трека"
                  required
                />
              </div>

              <div>
                <Label htmlFor="platform">Платформа *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musixmatch">Musixmatch</SelectItem>
                    <SelectItem value="genius">Genius</SelectItem>
                    <SelectItem value="azlyrics">AZLyrics</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lyricLink">Ссылка на текст *</Label>
                <Input
                  id="lyricLink"
                  type="url"
                  value={lyricLink}
                  onChange={(e) => setLyricLink(e.target.value)}
                  placeholder="https://"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Укажите ссылку на текст трека на выбранной платформе
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить на проверку
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ваши заявки</CardTitle>
            <CardDescription>
              История всех отправленных заявок и их статусы
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Вы ещё не отправляли заявок</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">{submission.trackName}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {getPlatformName(submission.platform)}
                          </Badge>
                        </div>
                        <a
                          href={submission.lyricLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
                        >
                          Открыть ссылку
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">
                          Отправлено: {new Date(submission.createdAt).toLocaleString("ru-RU")}
                        </p>
                        {submission.rejectionReason && (
                          <Alert className="mt-3 bg-destructive/10 border-destructive/20">
                            <AlertDescription className="text-sm text-destructive">
                              <strong>Причина отказа:</strong> {submission.rejectionReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div>{getStatusBadge(submission.status)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
