"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ChevronDown, Download, Loader2, FileText, Info, ListMusic, Edit, Link as LinkIcon, Power, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Release {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  status: string;
  upc: string | null;
  createdAt: string;
  releaseDate: string | null;
  mainArtist: string;
  label: string;
  genre: string;
}

export default function ArtistReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<Release | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch("/api/releases");
      const data = await response.json();
      // Filter: approved, published, re_moderation, deactivated — everything except drafts/draft statuses
      const visibleReleases = (data.releases || []).filter((r: Release) =>
        ["approved", "published", "re_moderation", "deactivated"].includes(r.status)
      );
      setReleases(visibleReleases);
    } catch (error) {
      console.error("Error fetching releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReleases = releases.filter(release => {
    const matchesSearch = searchQuery === "" || 
      release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.mainArtist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.upc?.includes(searchQuery) ||
      release.label.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleDownloadCatalog = () => {
    const headers = ["Название", "Артист", "UPC", "Лейбл", "Дата создания", "Дата релиза", "Жанр"];
    const rows = filteredReleases.map(r => [
      r.title,
      r.mainArtist,
      r.upc || "-",
      r.label,
      new Date(r.createdAt).toISOString().split("T")[0],
      r.releaseDate ? new Date(r.releaseDate).toISOString().split("T")[0] : "-",
      r.genre
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `catalog-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isEditable = (status: string) => status === "requires_changes" || status === "approved" || status === "published";

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    if (!deactivateReason.trim()) {
      toast.error("Укажите причину деактивации");
      return;
    }
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/releases/${deactivateTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", reason: deactivateReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка при деактивации");
        return;
      }
      toast.success("Релиз деактивирован");
      setDeactivateTarget(null);
      setDeactivateReason("");
      fetchReleases();
    } catch {
      toast.error("Ошибка подключения к серверу");
    } finally {
      setIsDeactivating(false);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      approved: "Одобрено",
      published: "Опубликован",
      re_moderation: "Повторная модерация",
      deactivated: "Деактивирован",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-green-500/15 text-green-600 dark:text-green-400",
      published: "bg-[var(--brand)]/15 text-[var(--brand-hover)]",
      re_moderation: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      deactivated: "bg-red-500/15 text-red-600 dark:text-red-400",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Мои релизы</h1>
        <p className="text-muted-foreground">
          Одобренные и опубликованные релизы
        </p>
      </motion.div>

      {/* Блок поиска и фильтров */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-border/50 shadow-sm bg-muted/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по UPC, ISRC, треку, исполнителю, лейблу"
                  className="pl-10 h-12 bg-background border-border"
                />
              </div>

              {/* Фильтры */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder="Площадки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все площадки</SelectItem>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="apple">Apple Music</SelectItem>
                    <SelectItem value="youtube">YouTube Music</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="text"
                    placeholder="Дата старта"
                    className="h-12 bg-background border-border pr-10"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="text"
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

      {/* Верхний блок управления */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold mb-1">Всего релизов: {filteredReleases.length}</h2>
          <button 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm">Сортировать по: Дата старта</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <Button 
          variant="outline" 
          onClick={handleDownloadCatalog}
          className="h-11 px-6 border-2"
        >
          <Download className="w-4 h-4 mr-2" />
          Скачать каталог
        </Button>
      </motion.div>

      {/* Карточки релизов */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {loading ? (
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
              <div className="text-center text-muted-foreground">
                <p className="mb-2">У вас пока нет одобренных релизов</p>
                <p className="text-sm">Релизы появятся здесь после одобрения администратором</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReleases.map((release) => (
            <Card key={release.id} className="overflow-hidden hover:shadow-md transition-shadow border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Обложка */}
                  <div className="relative w-32 h-32 rounded-md overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={release.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
                      alt={release.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    {/* Заголовок и артист */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-xl font-bold mb-1 text-foreground">{release.title}</h3>
                        {release.status !== "approved" && release.status !== "published" && (
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(release.status)}`}>
                            {statusLabel(release.status)}
                          </span>
                        )}
                      </div>
                      <p className="text-base text-muted-foreground">{release.mainArtist}</p>
                    </div>

                    {/* Метаданные - Строка 1 */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">UPC</span>
                        <p className="font-medium">{release.upc || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Название лейбла</span>
                        <p className="font-medium">{release.label}</p>
                      </div>
                    </div>

                    {/* Метаданные - Строка 2 */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Дата создания</span>
                        <p className="font-medium">{formatDate(release.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дата релиза</span>
                        <p className="font-medium">
                          {release.releaseDate ? formatDate(release.releaseDate) : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дата старта</span>
                        <p className="font-medium">
                          {release.releaseDate ? formatDate(release.releaseDate) : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Территории</span>
                        <p className="font-medium flex items-center gap-1">
                          WorldWide
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                            <path d="M2 6h8M6 2v8" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Площадки</span>
                        <p className="font-medium flex items-center gap-1">
                          120+
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                            <path d="M2 6h8M6 2v8" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Жанр</span>
                        <p className="font-medium">{release.genre}</p>
                      </div>
                    </div>
                  </div>

                  {/* Блок иконок действий */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => router.push(`/artist/releases/${release.id}`)}
                      title="Просмотреть информацию о релизе"
                    >
                      <Info className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => router.push(`/artist/releases/${release.id}?view=tracks`)}
                      title="Открыть трек-лист"
                    >
                      <ListMusic className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={!isEditable(release.status)}
                      onClick={() => router.push(`/artist/upload?edit=${release.id}`)}
                      title={isEditable(release.status) ? "Редактировать релиз" : "Редактирование недоступно"}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>

                    {release.status !== "deactivated" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => { setDeactivateTarget(release); setDeactivateReason(""); }}
                        title="Деактивировать релиз"
                      >
                        <Power className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* Диалог деактивации */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open && !isDeactivating) { setDeactivateTarget(null); setDeactivateReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Power className="h-5 w-5" />
              Деактивировать релиз
            </DialogTitle>
            <DialogDescription className="pt-2">
              Вы собираетесь деактивировать релиз{" "}
              <span className="font-semibold text-foreground">«{deactivateTarget?.title}»</span>.
              <br />Укажите причину деактивации (обязательно):
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            placeholder="Например: неверные метаданные, конфликт прав, по просьбе артиста..."
            rows={4}
            className="resize-none"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDeactivateTarget(null); setDeactivateReason(""); }} disabled={isDeactivating}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating || !deactivateReason.trim()} className="gap-2">
              {isDeactivating ? <><Loader2 className="h-4 w-4 animate-spin" />Деактивация…</> : <><Power className="h-4 w-4" />Деактивировать</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}