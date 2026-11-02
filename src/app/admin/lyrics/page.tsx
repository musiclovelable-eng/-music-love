"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface LyricsSubmission {
  id: number;
  artistId: number;
  trackName: string;
  lyricLink: string;
  platform: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  artistName?: string;
  artistEmail?: string;
}

export default function AdminLyrics() {
  const [submissions, setSubmissions] = useState<LyricsSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<LyricsSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(false);

  // Form state
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  const handleUpdateStatus = async () => {
    if (!selectedSubmission || !newStatus) {
      toast.error("Выберите статус");
      return;
    }

    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Укажите причину отказа");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/lyrics-submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: newStatus === "rejected" ? rejectionReason : null,
        }),
      });

      if (response.ok) {
        toast.success("Статус успешно обновлён");
        setDialogOpen(false);
        setSelectedSubmission(null);
        setNewStatus("");
        setRejectionReason("");
        fetchSubmissions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      toast.error("Ошибка подключения к серверу");
    } finally {
      setUpdating(false);
    }
  };

  const openDialog = (submission: LyricsSubmission) => {
    setSelectedSubmission(submission);
    setNewStatus(submission.status);
    setRejectionReason(submission.rejectionReason || "");
    setDialogOpen(true);
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

  const filteredSubmissions = submissions.filter((submission) => {
    if (statusFilter === "all") return true;
    return submission.status === statusFilter;
  });

  const stats = {
    total: submissions.length,
    sent: submissions.filter((s) => s.status === "sent").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Загрузка текста на площадки</h1>
        <p className="text-muted-foreground">
          Управление заявками артистов на публикацию текстов треков
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Всего заявок
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Отправлено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.sent}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Одобрено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Отказано
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Фильтр по статусу:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все заявки</SelectItem>
                  <SelectItem value="sent">Отправлено</SelectItem>
                  <SelectItem value="approved">Одобрено</SelectItem>
                  <SelectItem value="rejected">Отказано</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Заявки ({filteredSubmissions.length})</CardTitle>
            <CardDescription>
              Список всех заявок от артистов на публикацию текстов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Загрузка заявок...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {statusFilter === "all" 
                  ? "Заявок пока нет"
                  : `Нет заявок со статусом "${statusFilter}"`
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{submission.trackName}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {getPlatformName(submission.platform)}
                              </Badge>
                              {getStatusBadge(submission.status)}
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
                          </div>
                        </div>

                        {/* Artist Info */}
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>
                              {submission.artistName || "Неизвестный артист"}
                              {submission.artistEmail && (
                                <span className="ml-1">({submission.artistEmail})</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Отправлено: {new Date(submission.createdAt).toLocaleString("ru-RU")}
                            </span>
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {submission.rejectionReason && (
                          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Причина отказа:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {submission.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        onClick={() => openDialog(submission)}
                      >
                        Изменить статус
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить статус заявки</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Трек:</p>
                <p className="font-semibold">{selectedSubmission.trackName}</p>
              </div>

              <div>
                <Label htmlFor="status">Новый статус *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">Отправлено</SelectItem>
                    <SelectItem value="approved">Одобрено</SelectItem>
                    <SelectItem value="rejected">Отказано</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "rejected" && (
                <div>
                  <Label htmlFor="reason">Причина отказа *</Label>
                  <Textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите причину отказа..."
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updating}
            >
              Отмена
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}