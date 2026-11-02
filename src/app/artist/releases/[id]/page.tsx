"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, ExternalLink, AlertCircle, Link as LinkIcon, Music, CheckCircle2, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Release {
  id: number;
  type: string;
  title: string;
  coverUrl: string;
  releaseDate: string | null;
  isAsap: boolean;
  mainArtist: string;
  additionalArtists: string | null;
  genre: string;
  subgenre: string | null;
  promoText: string | null;
  useEditorialPromo: boolean;
  label: string;
  artistComment: string | null;
  moderatorComment: string | null;
  status: string;
  upc: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Track {
  id: number;
  trackNumber: number;
  title: string;
  url: string;
  artists: string;
  musicAuthor: string | null;
  lyricsAuthor: string | null;
  producer: string | null;
  lyrics: string | null;
  language?: string | null;
  explicit?: boolean;
  composer?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:            { label: "Черновик",              color: "bg-muted text-muted-foreground" },
  on_moderation:    { label: "На модерации",           color: "bg-blue-500/15 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400" },
  pending:          { label: "На модерации",           color: "bg-blue-500/15 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400" },
  approved:         { label: "Одобрено",              color: "bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400" },
  published:        { label: "Опубликован",            color: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
  rejected:         { label: "Отклонён",              color: "bg-destructive/15 text-destructive" },
  requires_changes: { label: "Требуются изменения",   color: "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" },
  changes_required: { label: "Требуются изменения",   color: "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" },
};

const TYPE_MAP: Record<string, string> = {
  single: "Single", ep: "EP", album: "Album",
  single_maxi: "Single Maxi", mixtape: "Mixtape",
};

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function ReleaseView() {
  const params = useParams();
  const router = useRouter();
  const [release, setRelease] = useState<Release | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLyrics, setExpandedLyrics] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (params?.id) fetchRelease(params.id as string);
  }, [params?.id]);

  const fetchRelease = async (id: string) => {
    try {
      const res = await fetch(`/api/releases/${id}`);
      const data = await res.json();
      if (data.release) { setRelease(data.release); setTracks(data.tracks || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleLyrics = (id: number) => setExpandedLyrics(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!release) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">Релиз не найден</p>
      <Button onClick={() => router.back()} variant="outline">Вернуться назад</Button>
    </div>
  );

  const canEdit = release.status === "draft" || release.status === "requires_changes" || release.status === "changes_required";
  const st = STATUS_MAP[release.status] || { label: release.status, color: "bg-muted text-muted-foreground" };

  return (
    <div className="font-[Inter,sans-serif] max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{release.title}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{release.mainArtist}</p>
        </div>
        {canEdit && (
          <Link href={`/artist/upload?edit=${release.id}`}>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-colors">
              <Edit className="w-4 h-4" /> Редактировать
            </button>
          </Link>
        )}
      </div>

      {/* Moderator comment */}
      {release.moderatorComment && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-500 mb-1">Комментарий модератора</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">{release.moderatorComment}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: cover */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border bg-muted">
            <Image
              src={release.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
              alt={release.title} fill className="object-cover" unoptimized
            />
          </div>
          {/* Quick info */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <InfoRow label="Тип" value={TYPE_MAP[release.type] || release.type} />
            <InfoRow label="Жанр" value={release.genre + (release.subgenre ? ` / ${release.subgenre}` : "")} />
            <InfoRow label="Лейбл" value={release.label} />
            {release.upc && <InfoRow label="UPC" value={<span className="font-mono">{release.upc}</span>} />}
            <InfoRow label="Дата релиза" value={release.isAsap ? "Как можно скорее" : release.releaseDate ? new Date(release.releaseDate).toLocaleDateString("ru-RU") : "Не указана"} />
            <InfoRow label="Создан" value={new Date(release.createdAt).toLocaleDateString("ru-RU")} />
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info card */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="px-5 py-3.5 border-b border-border bg-muted/50">
              <h2 className="text-sm font-semibold text-foreground">Основная информация</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <InfoRow label="Название" value={release.title} />
              <InfoRow label="Тип релиза" value={TYPE_MAP[release.type] || release.type} />
              <InfoRow label="Основной исполнитель" value={release.mainArtist} />
              {release.additionalArtists && <InfoRow label="Дополнительные артисты" value={release.additionalArtists} />}
              <InfoRow label="Жанр" value={release.genre} />
              {release.subgenre && <InfoRow label="Поджанр" value={release.subgenre} />}
              <InfoRow label="Лейбл" value={release.label} />
              {release.upc && <InfoRow label="UPC" value={<span className="font-mono text-sm">{release.upc}</span>} />}
              <InfoRow label="Дата релиза" value={release.isAsap ? "Как можно скорее" : release.releaseDate ? new Date(release.releaseDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Не указана"} />
              <InfoRow label="Статус" value={<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>} />
            </div>
          </div>

          {/* Promo */}
          {(release.promoText || release.useEditorialPromo) && (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-5 py-3.5 border-b border-border bg-muted/50">
                <h2 className="text-sm font-semibold text-foreground">Промо-информация</h2>
              </div>
              <div className="p-5">
                {release.useEditorialPromo ? (
                  <p className="text-sm text-muted-foreground italic">✨ Промо-текст будет написан редакцией Music Love</p>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{release.promoText}</p>
                )}
              </div>
            </div>
          )}

          {/* Tracks */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="px-5 py-3.5 border-b border-border bg-muted/50">
              <h2 className="text-sm font-semibold text-foreground">Трек-лист ({tracks.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {tracks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Треки не добавлены</p>
                </div>
              )}
              {tracks.map(track => (
                <div key={track.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                      {track.trackNumber}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{track.title}</h3>
                        {track.explicit && (
                          <span className="text-xs bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-medium">Explicit</span>
                        )}
                        {track.language && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{track.language}</span>
                        )}
                      </div>
                      {track.artists && <p className="text-sm text-muted-foreground mt-0.5">{track.artists}</p>}
                    </div>
                    {track.url && (
                      <a href={track.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="ml-10 grid grid-cols-2 gap-x-8 gap-y-2 mb-3">
                    {track.musicAuthor && <InfoRow label="Автор музыки" value={track.musicAuthor} />}
                    {track.lyricsAuthor && <InfoRow label="Автор текста" value={track.lyricsAuthor} />}
                    {track.producer && <InfoRow label="Продюсер" value={track.producer} />}
                    {track.composer && <InfoRow label="Композитор" value={track.composer} />}
                  </div>

                  {track.url && (
                    <div className="ml-10 flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <a href={track.url} target="_blank" rel="noopener noreferrer"
                        className="hover:text-[var(--brand)] truncate max-w-sm transition-colors">
                        {track.url}
                      </a>
                    </div>
                  )}

                  {track.lyrics && (
                    <div className="ml-10">
                      <button onClick={() => toggleLyrics(track.id)}
                        className="text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium transition-colors mb-2">
                        {expandedLyrics.has(track.id) ? "Скрыть текст ↑" : "Показать текст ↓"}
                      </button>
                      {expandedLyrics.has(track.id) && (
                        <div className="bg-muted rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{track.lyrics}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Artist comment */}
          {release.artistComment && (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-5 py-3.5 border-b border-border bg-muted/50">
                <h2 className="text-sm font-semibold text-foreground">Комментарий для модератора</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-foreground whitespace-pre-wrap">{release.artistComment}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
