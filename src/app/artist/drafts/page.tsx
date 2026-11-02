"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  Edit,
  Trash2,
  FileEdit,
  Send,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface DraftRelease {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  mainArtist: string;
  genre: string;
  label: string;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ArtistDraftsPage() {
  const [drafts, setDrafts] = useState<DraftRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/releases?status=draft");
      const data = await res.json();
      setDrafts(data.releases || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/artist/upload?edit=${id}`);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/releases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  const getDraftCompleteness = (draft: DraftRelease): { filled: number; total: number } => {
    const fields = [draft.title, draft.coverUrl, draft.type, draft.genre, draft.mainArtist, draft.releaseDate];
    const filled = fields.filter(Boolean).length;
    return { filled, total: fields.length };
  };

  const filteredDrafts = drafts.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.mainArtist.toLowerCase().includes(q) ||
      d.genre.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Черновики</h1>
        <p className="text-muted-foreground">
          Незавершённые релизы. Откройте черновик, завершите заполнение и отправьте на модерацию.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, артисту, жанру"
            className="pl-10 h-12"
          />
        </div>
      </motion.div>

      {/* Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <h2 className="text-xl font-semibold">Черновиков: {filteredDrafts.length}</h2>
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Загрузка черновиков...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredDrafts.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <FileEdit className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium mb-1">Нет черновиков</p>
                <p className="text-sm">
                  Когда вы начнёте создавать релиз, он автоматически сохранится здесь
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/artist/upload")}
                >
                  Создать новый релиз
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDrafts.map((draft) => {
            const { filled, total } = getDraftCompleteness(draft);
            const pct = Math.round((filled / total) * 100);
            const isComplete = filled === total;

            return (
              <Card
                key={draft.id}
                className="overflow-hidden hover:shadow-md transition-shadow border-border"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Cover */}
                    <div className="relative w-24 h-24 rounded-md overflow-hidden shrink-0 bg-muted">
                      {draft.coverUrl ? (
                        <Image
                          src={draft.coverUrl}
                          alt={draft.title || "Черновик"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileEdit className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground truncate">
                          {draft.title || <span className="text-muted-foreground italic">Без названия</span>}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Черновик
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {draft.mainArtist || <span className="italic">Исполнитель не указан</span>}
                        {draft.type && <span className="ml-2">· {draft.type}</span>}
                        {draft.genre && <span className="ml-2">· {draft.genre}</span>}
                      </p>

                      {/* Completeness bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Заполнено {filled} из {total} полей</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-[var(--brand)]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Создан: {formatDate(draft.createdAt)}</span>
                        <span>Изменён: {formatDate(draft.updatedAt)}</span>
                        {draft.releaseDate && <span>Дата релиза: {formatDate(draft.releaseDate)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        onClick={() => handleEdit(draft.id)}
                        size="sm"
                        className="gap-2 w-full"
                      >
                        <Edit className="w-4 h-4" />
                        Продолжить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setConfirmDeleteId(draft.id)}
                        disabled={deletingId === draft.id}
                      >
                        {deletingId === draft.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Удалить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить черновик?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Черновик и все загруженные файлы будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
