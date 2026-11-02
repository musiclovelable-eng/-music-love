"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Music2,
  Calendar,
  User,
  Tag,
  FileText,
  AlertCircle,
  Trash2,
  Plus,
  History,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";

interface Track {
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  performers: string;
  musicAuthor: string;
  lyricsAuthor: string;
  producer: string;
  lyrics: string;
  isrc?: string;
  language?: string;
  explicit?: boolean;
  composer?: string;
  isLive?: boolean;
  isCover?: boolean;
  isRemix?: boolean;
  isInstrumental?: boolean;
  previewStart?: string;
}

interface Release {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  releaseDate: string;
  isAsap: boolean;
  mainArtist: string;
  featuredArtists: string;
  genre: string;
  subgenre: string;
  label: string;
  promoInfo: string;
  promoByNightvolt: boolean;
  tracks: Track[];
  status: string;
  upc?: string;
  isrc?: string;
  artistComment: string;
  moderatorComment: string;
  createdAt: string;
  artistId: number;
  artistName: string;
  artistEmail?: string;
  artistLabel?: string;
  artistPlan?: string;
  editableFields: string[];
  platformsList?: string[] | null;
  territoriesList?: string[] | null;
  personsList?: Array<{ id: string; name: string; role: string }> | null;
  subtitle?: string;
  metadataLang?: string;
  partnerCode?: string;
  rightsYear?: string;
  earlyRussia?: boolean;
  realtimeDelivery?: boolean;
  startDate?: string | null;
  preorderDate?: string | null;
}

interface HistoryEntry {
  id: number;
  releaseId: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  performedAt: string;
  description: string | null;
  releaseTitle: string;
  artistName: string;
}

interface LyricsSubmission {
  id: number;
  artistId: number;
  releaseId: number;
  trackName: string;
  lyricLink: string;
  platform: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  artistName: string;
  artistEmail: string;
}

export default function AdminReleasePage() {
  const router = useRouter();
  const params = useParams();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRelease, setEditedRelease] = useState<Release | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lyricsSubmissions, setLyricsSubmissions] = useState<LyricsSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchRelease();
    fetchHistory();
    fetchLyricsSubmissions();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [params.id]);

  const fetchRelease = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/releases/${params.id}/full`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        toast.error(errorData.error || "Ошибка при загрузке релиза");
        
        if (response.status === 401) {
          router.push("/");
          return;
        }
        
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.release) {
        setRelease(data.release);
        setEditedRelease(data.release);
      } else {
        toast.error("Релиз не найден");
      }
    } catch (error) {
      console.error("Error fetching release:", error);
      toast.error("Ошибка при загрузке релиза");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/releases/${params.id}/history`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.history) {
          setHistory(data.history);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchLyricsSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/releases/${params.id}/lyrics-submissions`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.submissions) {
          setLyricsSubmissions(data.submissions);
        }
      }
    } catch (error) {
      console.error("Error fetching lyrics submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSave = async () => {
    if (!editedRelease) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/releases/${params.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedRelease),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Релиз успешно обновлён");
        setRelease(editedRelease);
        fetchHistory();
      } else {
        toast.error(data.error || "Ошибка при сохранении");
      }
    } catch (error) {
      console.error("Error saving release:", error);
      toast.error("Ошибка при сохранении релиза");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Загрузка обложки...");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (editedRelease && event.target?.result) {
        setEditedRelease({
          ...editedRelease,
          coverUrl: event.target.result as string,
        });
        toast.success("Обложка загружена");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadCover = async () => {
    if (!release?.coverUrl) return;
    try {
      const response = await fetch(release.coverUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${release.title}-cover.${blob.type.split('/')[1] || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Обложка скачана");
    } catch (error) {
      console.error("Error downloading cover:", error);
      toast.error("Ошибка при скачивании обложки");
    }
  };

  const handleDownloadTrack = async (track: Track) => {
    if (!track.url) {
      toast.error("URL трека не найден");
      return;
    }
    
    try {
      toast.info(`Скачивание трека "${track.title}"...`);
      
      // Определяем расширение файла из URL
      let ext = 'mp3';
      const urlParts = track.url.split('?')[0]; // Убираем query параметры
      const urlExt = urlParts.split('.').pop()?.toLowerCase();
      
      if (urlExt && ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(urlExt)) {
        ext = urlExt;
      }
      
      // Очищаем имя файла от специальных символов
      const sanitizedTitle = track.title.replace(/[^a-zA-Z0-9а-яА-Я\s-]/g, '_').trim();
      const filename = `${sanitizedTitle}.${ext}`;
      
      const response = await fetch(track.url, {
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Небольшая задержка перед очисткой
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Трек "${track.title}" успешно скачан`);
    } catch (error: any) {
      console.error("Error downloading track:", error);
      toast.error(`Ошибка при скачивании: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const handlePlayPauseTrack = (track: Track) => {
    if (!track.url) return;
    
    if (playingTrackId === track.id) {
      audioElement?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(track.url);
      audio.play();
      audio.onended = () => setPlayingTrackId(null);
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  const handleDownloadMaterials = async () => {
    toast.info("Скачивание всех материалов...");
    if (release?.coverUrl) {
      await handleDownloadCover();
    }
    for (const track of editedRelease?.tracks || []) {
      if (track.url) {
        await handleDownloadTrack(track);
      }
    }
    toast.success("Все материалы скачаны");
  };

  const addTrack = () => {
    if (!editedRelease) return;
    
    const newTrack: Track = {
      id: Date.now().toString(),
      title: "",
      url: "",
      performers: "",
      musicAuthor: "",
      lyricsAuthor: "",
      producer: "",
      lyrics: "",
    };

    setEditedRelease({
      ...editedRelease,
      tracks: [...editedRelease.tracks, newTrack],
    });
  };

  const removeTrack = (trackId: string) => {
    if (!editedRelease) return;
    
    setEditedRelease({
      ...editedRelease,
      tracks: editedRelease.tracks.filter(t => t.id !== trackId),
    });
  };

  const updateTrack = (trackId: string, field: keyof Track, value: string | boolean) => {
    if (!editedRelease) return;
    
    setEditedRelease({
      ...editedRelease,
      tracks: editedRelease.tracks.map(t =>
        t.id === trackId ? { ...t, [field]: value } : t
      ),
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "status_changed":
        return <CheckCircle className="w-4 h-4" />;
      case "metadata_updated":
        return <FileText className="w-4 h-4" />;
      case "cover_updated":
        return <Upload className="w-4 h-4" />;
      case "upc_added":
        return <Tag className="w-4 h-4" />;
      case "comment_added":
        return <AlertCircle className="w-4 h-4" />;
      case "tracks_updated":
        return <Music2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getLyricsStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      sent: { label: "Отправлено", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
      approved: { label: "Одобрено", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
      rejected: { label: "Отказано", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
    };

    const { label, className } = statusMap[status] || statusMap.sent;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const isAudioFile = (url: string | undefined) => {
    if (!url) return false;
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext)) || url.includes('release-tracks');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!release || !editedRelease) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Релиз не найден или недоступен</p>
        <Button onClick={() => router.push("/admin/releases")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к списку релизов
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{release.title}</h1>
            <p className="text-muted-foreground">
              Артист: {release.artistName} • Создано: {new Date(release.createdAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadMaterials}
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать все материалы
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Левая колонка - Обложка и основная информация */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Обложка релиза
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                <Image
                  src={editedRelease.coverUrl || "/placeholder-cover.jpg"}
                  alt={editedRelease.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDownloadCover}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать
                </Button>
                <Label htmlFor="cover-upload" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Заменить
                    </span>
                  </Button>
                  <Input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG/PNG/WebP • До 50 МБ • 1500×1500 - 3000×3000 px
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статус и модерация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Статус релиза</Label>
                <Select
                  value={editedRelease.status}
                  onValueChange={(value) =>
                    setEditedRelease({ ...editedRelease, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Черновик</SelectItem>
                    <SelectItem value="on_moderation">На модерации</SelectItem>
                    <SelectItem value="pending">В ожидании</SelectItem>
                    <SelectItem value="requires_changes">
                      Требуются изменения
                    </SelectItem>
                    <SelectItem value="approved">Одобрено</SelectItem>
                    <SelectItem value="published">Опубликован</SelectItem>
                    <SelectItem value="rejected">Отклонён</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="moderator-comment">
                  Комментарий модератора
                </Label>
                <Textarea
                  id="moderator-comment"
                  value={editedRelease.moderatorComment || ""}
                  onChange={(e) =>
                    setEditedRelease({
                      ...editedRelease,
                      moderatorComment: e.target.value,
                    })
                  }
                  placeholder="Оставьте комментарий для артиста..."
                  rows={4}
                />
              </div>

              {release.artistComment && (
                <div>
                  <Label>Комментарий артиста</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {release.artistComment}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artist Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Информация об артисте
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Имя</span>
                <span className="font-medium">{release.artistName}</span>
              </div>
              {release.artistEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{release.artistEmail}</span>
                </div>
              )}
              {release.artistLabel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Лейбл</span>
                  <span className="font-medium">{release.artistLabel}</span>
                </div>
              )}
              {release.artistPlan && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">План</span>
                  <span className="font-medium capitalize">{release.artistPlan}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Средняя и правая колонки - Детальная информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Название релиза</Label>
                  <Input
                    id="title"
                    value={editedRelease.title}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="type">Тип релиза</Label>
                  <Select
                    value={editedRelease.type}
                    onValueChange={(value) =>
                      setEditedRelease({ ...editedRelease, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                      <SelectItem value="single_maxi">Single Maxi</SelectItem>
                      <SelectItem value="mixtape">Mixtape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="release-date">Дата релиза</Label>
                  <DatePicker
                    value={editedRelease.releaseDate}
                    onChange={(date) =>
                      setEditedRelease({
                        ...editedRelease,
                        releaseDate: date,
                      })
                    }
                    placeholder="Выберите дату релиза"
                  />
                  {editedRelease.isAsap && (
                    <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      СРОЧНО - Как можно скорее
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="start-date">Дата старта</Label>
                  <DatePicker
                    value={editedRelease.startDate || ""}
                    onChange={(date) =>
                      setEditedRelease({
                        ...editedRelease,
                        startDate: date,
                      })
                    }
                    placeholder="Дата появления на площадках"
                  />
                </div>

                <div>
                  <Label htmlFor="label">Лейбл</Label>
                  <Input
                    id="label"
                    value={editedRelease.label}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        label: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="main-artist">Основной исполнитель</Label>
                  <Input
                    id="main-artist"
                    value={editedRelease.mainArtist}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        mainArtist: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="featured-artists">
                    Дополнительные артисты
                  </Label>
                  <Input
                    id="featured-artists"
                    value={editedRelease.featuredArtists || ""}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        featuredArtists: e.target.value,
                      })
                    }
                    placeholder="feat. ..."
                  />
                </div>

                <div>
                  <Label htmlFor="genre">Жанр</Label>
                  <Input
                    id="genre"
                    value={editedRelease.genre}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        genre: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="subgenre">Поджанр</Label>
                  <Input
                    id="subgenre"
                    value={editedRelease.subgenre || ""}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        subgenre: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="upc">UPC</Label>
                  <Input
                    id="upc"
                    value={editedRelease.upc || ""}
                    onChange={(e) =>
                      setEditedRelease({
                        ...editedRelease,
                        upc: e.target.value,
                      })
                    }
                    placeholder="Введите UPC..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="promo-info">Промо-информация</Label>
                <Textarea
                  id="promo-info"
                  value={editedRelease.promoInfo || ""}
                  onChange={(e) =>
                    setEditedRelease({
                      ...editedRelease,
                      promoInfo: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Промо-текст..."
                />
                {editedRelease.promoByNightvolt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ✨ Промо-текст написан редакцией Music Love
                  </p>
                )}
              </div>

              {/* Дополнительные настройки */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-base font-semibold">Дополнительные настройки</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editedRelease.earlyRussia}
                      onChange={(e) =>
                        setEditedRelease({ ...editedRelease, earlyRussia: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Ранний старт в России</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editedRelease.realtimeDelivery}
                      onChange={(e) =>
                        setEditedRelease({ ...editedRelease, realtimeDelivery: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Доставка в реальном времени</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Persons & Roles */}
          {release.personsList && release.personsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Персоны и роли
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {release.personsList.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">{p.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platforms & Territories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Площадки и территории
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Площадки</p>
                {release.platformsList && release.platformsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {release.platformsList.map((pl) => (
                      <span key={pl} className="text-xs bg-muted border border-border px-2 py-1 rounded-md font-medium">
                        {pl}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold">Все площадки (120+) — WorldWide</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Территории</p>
                {release.territoriesList && release.territoriesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {release.territoriesList.map((t) => (
                      <span key={t} className="text-xs bg-muted border border-border px-2 py-1 rounded-md font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold">Весь мир (WorldWide)</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                Трек-лист ({editedRelease.tracks.length} {editedRelease.tracks.length === 1 ? 'трек' : 'треков'})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addTrack}
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить трек
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {editedRelease.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">Трек {index + 1}</h4>
                      {track.explicit && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          18+ Explicit
                        </Badge>
                      )}
                      {track.language && (
                        <Badge variant="secondary">{track.language}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAudioFile(track.url) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePlayPauseTrack(track)}
                          >
                            {playingTrackId === track.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadTrack(track)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTrack(track.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {isAudioFile(track.url) && (
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">Аудиофайл загружен</p>
                        <p className="text-xs text-muted-foreground truncate">{track.url}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(track.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Открыть
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Название трека</Label>
                      <Input
                        value={track.title}
                        onChange={(e) =>
                          updateTrack(track.id, "title", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Ссылка на трек</Label>
                      <div className="flex gap-2">
                        <Input
                          value={track.url || ""}
                          onChange={(e) =>
                            updateTrack(track.id, "url", e.target.value)
                          }
                          placeholder="https://..."
                        />
                        {track.url && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(track.url, "_blank")}
                            type="button"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Исполнители</Label>
                      <Input
                        value={track.performers}
                        onChange={(e) =>
                          updateTrack(track.id, "performers", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Автор музыки</Label>
                      <Input
                        value={track.musicAuthor}
                        onChange={(e) =>
                          updateTrack(track.id, "musicAuthor", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Автор текста</Label>
                      <Input
                        value={track.lyricsAuthor}
                        onChange={(e) =>
                          updateTrack(track.id, "lyricsAuthor", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Продюсер (Prod. by)</Label>
                      <Input
                        value={track.producer}
                        onChange={(e) =>
                          updateTrack(track.id, "producer", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>ISRC</Label>
                      <Input
                        value={track.isrc || ""}
                        onChange={(e) =>
                          updateTrack(track.id, "isrc", e.target.value)
                        }
                        placeholder="Введите ISRC..."
                      />
                    </div>

                    <div>
                      <Label>Язык</Label>
                      <Input
                        value={track.language || ""}
                        onChange={(e) =>
                          updateTrack(track.id, "language", e.target.value)
                        }
                        placeholder="Русский, English..."
                      />
                    </div>

                    <div>
                      <Label>Композитор</Label>
                      <Input
                        value={track.composer || ""}
                        onChange={(e) =>
                          updateTrack(track.id, "composer", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Начало предпрослушивания (сек)</Label>
                      <Input
                        type="number"
                        value={track.previewStart || ""}
                        onChange={(e) =>
                          updateTrack(track.id, "previewStart", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>

                    {/* Версия трека — полные чекбоксы */}
                    <div className="md:col-span-2 space-y-2 pt-2 border-t">
                      <Label className="text-sm font-semibold">Версия трека</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!track.explicit}
                            onChange={(e) => updateTrack(track.id, "explicit", e.target.checked)}
                            className="w-4 h-4" />
                          <span className="text-sm">Explicit Content</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!track.isLive}
                            onChange={(e) => updateTrack(track.id, "isLive", e.target.checked)}
                            className="w-4 h-4" />
                          <span className="text-sm">Live</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!track.isCover}
                            onChange={(e) => updateTrack(track.id, "isCover", e.target.checked)}
                            className="w-4 h-4" />
                          <span className="text-sm">Cover</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!track.isRemix}
                            onChange={(e) => updateTrack(track.id, "isRemix", e.target.checked)}
                            className="w-4 h-4" />
                          <span className="text-sm">Remix</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!track.isInstrumental}
                            onChange={(e) => updateTrack(track.id, "isInstrumental", e.target.checked)}
                            className="w-4 h-4" />
                          <span className="text-sm">Instrumental</span>
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Текст трека (до 10 000 символов)</Label>
                      <Textarea
                        value={track.lyrics}
                        onChange={(e) =>
                          updateTrack(track.id, "lyrics", e.target.value)
                        }
                        rows={6}
                        maxLength={10000}
                        placeholder="Текст трека..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {track.lyrics.length} / 10 000 символов
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {editedRelease.tracks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Треки не добавлены</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* История изменений */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                История изменений
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>История изменений пуста</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="shrink-0 mt-0.5">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {entry.description || `${entry.field} изменено`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{entry.performedBy}</span>
                          <span>•</span>
                          <span>
                            {new Date(entry.performedAt).toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Связанные заявки на загрузку текстов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Заявки на загрузку текстов
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : lyricsSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Заявки на загрузку текстов отсутствуют</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lyricsSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{submission.trackName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Платформа: {submission.platform}
                          </p>
                        </div>
                        {getLyricsStatusBadge(submission.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={submission.lyricLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Открыть ссылку
                        </a>
                      </div>
                      {submission.rejectionReason && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                          <strong>Причина отказа:</strong> {submission.rejectionReason}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Отправлено: {new Date(submission.createdAt).toLocaleString("ru-RU")}
                      </p>
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