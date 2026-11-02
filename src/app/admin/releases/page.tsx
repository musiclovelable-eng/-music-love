"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Calendar, ChevronDown, Download, Loader2, Info, ListMusic, Edit, Trash2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Image from "next/image";

interface Release {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  mainArtist: string;
  status: string;
  isAsap: boolean;
  artistName: string;
  artistComment: string | null;
  moderatorComment: string | null;
  deactivationReason: string | null;
  deactivatedAt: string | null;
  metadataLang?: string | null;
  earlyRussia?: boolean | null;
  realtimeDelivery?: boolean | null;
  createdAt: string;
  releaseDate: string | null;
  upc: string | null;
  label: string;
  genre: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft:            { label: "Черновик",            color: "bg-muted text-muted-foreground border-border" },
  on_moderation:    { label: "На модерации",         color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" },
  approved:         { label: "Одобрено",            color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  published:        { label: "Опубликован",          color: "bg-[var(--brand)]/15 text-[var(--brand-hover)] dark:text-[var(--brand-hover)] border-[var(--brand)]/30" },
  rejected:         { label: "Отклонено",           color: "bg-destructive/15 text-destructive border-destructive/30" },
  requires_changes: { label: "Требуются изменения", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30" },
  re_moderation:    { label: "Повторная модерация",  color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  deactivated:      { label: "Деактивирован",        color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
};

const STATUS_FILTERS = [
  { value: "all", label: "Все статусы" },
  { value: "on_moderation", label: "На модерации" },
  { value: "re_moderation", label: "Повторная модерация" },
  { value: "approved", label: "Одобренные" },
  { value: "published", label: "Опубликованные" },
  { value: "rejected", label: "Отклонённые" },
  { value: "requires_changes", label: "Требуются изменения" },
  { value: "deactivated", label: "Деактивированные" },
];

export default function AdminReleases() {
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Release | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const fetchReleases = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const params = new URLSearchParams({ page: String(currentPage) });
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/releases?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/");
          return;
        }
        const data = await response.json();
        setError(data.error || `Ошибка ${response.status}`);
        return;
      }

      const data = await response.json();
      setReleases(data.releases || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    fetchReleases(page, debouncedSearch);
  }, [fetchReleases, page, debouncedSearch]);

  const handleStatusFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/admin/releases/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || `Ошибка ${res.status}`);
        return;
      }
      setDeleteTarget(null);
      // Stay on current page; if it becomes empty go back one page
      const newTotal = (pagination?.total ?? 1) - 1;
      const newTotalPages = Math.ceil(newTotal / (pagination?.pageSize ?? 20));
      const nextPage = page > newTotalPages && newTotalPages > 0 ? newTotalPages : page;
      setPage(nextPage);
      fetchReleases(nextPage, debouncedSearch);
    } catch {
      setDeleteError("Ошибка подключения к серверу");
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side date filtering (applied on top of server pagination)
  const filteredReleases = releases.filter(release => {
    const matchesStartDate = startDateFilter === "" ||
      (release.releaseDate && new Date(release.releaseDate) >= new Date(startDateFilter));
    const matchesCreatedDate = createdDateFilter === "" ||
      (new Date(release.createdAt) >= new Date(createdDateFilter));
    return matchesStartDate && matchesCreatedDate;
  }).sort((a, b) => {
    if (sortBy === "releaseDate") {
      return (b.releaseDate ? new Date(b.releaseDate).getTime() : 0) -
             (a.releaseDate ? new Date(a.releaseDate).getTime() : 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleDownloadCatalog = () => {
    const headers = ["Название", "Артист", "UPC", "Лейбл", "Дата создания", "Дата релиза", "Статус", "Жанр"];
    const rows = filteredReleases.map(r => [
      r.title,
      r.mainArtist,
      r.upc || "-",
      r.label,
      formatDate(r.createdAt),
      r.releaseDate ? formatDate(r.releaseDate) : "-",
      (statusMap[r.status] || statusMap.draft).label,
      r.genre,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nightvolt-catalog-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Управление релизами</h1>
        <p className="text-muted-foreground">Модерация и управление релизами артистов</p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <Card className="border-border/50 shadow-sm bg-muted/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по UPC, треку, исполнителю, лейблу"
                  className="pl-10 h-12 bg-background border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="date"
                    placeholder="Дата старта"
                    className="h-12 bg-background border-border pr-10"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="date"
                    placeholder="Дата создания"
                    className="h-12 bg-background border-border pr-10"
                    value={createdDateFilter}
                    onChange={(e) => setCreatedDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {pagination ? `Всего релизов: ${pagination.total}` : "Релизы"}
          </h2>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-0 h-auto p-0 w-auto hover:bg-transparent">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">
                  Сортировать по: {sortBy === "releaseDate" ? "Дата старта" : "Дата создания"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="releaseDate">Дата старта</SelectItem>
              <SelectItem value="createdAt">Дата создания</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleDownloadCatalog} className="h-11 px-6 border-2">
          <Download className="w-4 h-4 mr-2" />
          Скачать каталог
        </Button>
      </motion.div>

      {/* Release Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
        {error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-destructive flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                <p>{error}</p>
                <Button variant="outline" onClick={() => fetchReleases(page, debouncedSearch)}>
                  Повторить
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Загрузка релизов...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredReleases.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Релизы не найдены</div>
            </CardContent>
          </Card>
        ) : (
          filteredReleases.map((release) => {
            const st = statusMap[release.status] || statusMap.draft;
            return (
              <Card key={release.id} className="overflow-hidden hover:shadow-md transition-shadow border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative w-32 h-32 rounded-md overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={release.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
                        alt={release.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-xl font-bold text-foreground">{release.title}</h3>
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-base text-muted-foreground">{release.mainArtist}</p>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">UPC</span>
                          <p className="font-medium">{release.upc || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Лейбл</span>
                          <p className="font-medium">{release.label}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Дата создания</span>
                          <p className="font-medium">{formatDate(release.createdAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Дата релиза</span>
                          <p className="font-medium">{release.releaseDate ? formatDate(release.releaseDate) : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Дата старта</span>
                          <p className="font-medium">{release.releaseDate ? formatDate(release.releaseDate) : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Жанр</span>
                          <p className="font-medium">{release.genre}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Артист (аккаунт)</span>
                          <p className="font-medium">{release.artistName || "—"}</p>
                        </div>
                      </div>

                      {release.status === "deactivated" && release.deactivationReason && (
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Деактивирован артистом</span>
                            {release.deactivatedAt && <span className="text-xs ml-1">({formatDate(release.deactivatedAt)})</span>}
                            <p className="mt-0.5">{release.deactivationReason}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => router.push(`/admin/releases/${release.id}`)}
                        title="Просмотр"
                      >
                        <Info className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => router.push(`/admin/releases/${release.id}`)}
                        title="Треки"
                      >
                        <ListMusic className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => router.push(`/admin/releases/${release.id}`)}
                        title="Редактировать"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Удалить релиз"
                        onClick={() => { setDeleteError(null); setDeleteTarget(release); }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) { setDeleteTarget(null); setDeleteError(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Удалить релиз
            </DialogTitle>
            <DialogDescription className="pt-2">
              Вы уверены, что хотите удалить релиз{" "}
              <span className="font-semibold text-foreground">«{deleteTarget?.title}»</span>{" "}
              ({deleteTarget?.mainArtist})?
              <br /><br />
              Это действие <span className="font-semibold text-destructive">необратимо</span> — релиз, все его треки, обложка и связанные данные будут удалены навсегда.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Удаление…</>
              ) : (
                <><Trash2 className="h-4 w-4" />Удалить навсегда</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pagination && pagination.totalPages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
            let p: number;
            if (pagination.totalPages <= 7) {
              p = i + 1;
            } else if (page <= 4) {
              p = i + 1;
            } else if (page >= pagination.totalPages - 3) {
              p = pagination.totalPages - 6 + i;
            } else {
              p = page - 3 + i;
            }
            return (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-9 w-9 text-sm"
                onClick={() => setPage(p)}
                disabled={loading}
              >
                {p}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground ml-2">
            Стр. {page} из {pagination.totalPages}
          </span>
        </motion.div>
      )}
    </div>
  );
}
