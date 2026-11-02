"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ChevronDown, Download, Loader2, FileText, Info, ListMusic, Edit, Link as LinkIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Release {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  status: string;
  moderatorComment: string | null;
  mainArtist: string;
  upc: string | null;
  label: string;
  createdAt: string;
  releaseDate: string | null;
  genre: string;
}

export default function ArtistCorrections() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/releases?status=requires_changes", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        setReleases(data.releases || []);
      } catch (error) {
        console.error("Error fetching releases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

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
    link.download = `corrections-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isEditable = (status: string) => status === "requires_changes";

  const handleEditRelease = (releaseId: number) => {
    router.push(`/artist/upload?edit=${releaseId}`);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Требуются изменения</h1>
        <p className="text-muted-foreground">
          Релизы, требующие исправлений. Внесите необходимые правки и повторно отправьте на модерацию.
        </p>
      </motion.div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Нажмите на кнопку «Редактировать» чтобы внести изменения в релиз. После внесения всех правок нажмите «Отправить на модерацию» для повторной проверки.
        </AlertDescription>
      </Alert>

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
                Нет релизов, требующих исправлений
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
                      <h3 className="text-xl font-bold mb-1 text-foreground">{release.title}</h3>
                      <p className="text-base text-muted-foreground">{release.mainArtist}</p>
                    </div>

                    {/* Комментарий модератора */}
                    {release.moderatorComment && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          Комментарий модератора:
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {release.moderatorComment}
                        </p>
                      </div>
                    )}

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
                        <span className="text-muted-foreground">Жанр</span>
                        <p className="font-medium">{release.genre}</p>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка редактирования */}
                  <div className="shrink-0">
                    <Button
                      onClick={() => handleEditRelease(release.id)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Редактировать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>
    </div>
  );
}