"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Clock, X, ChevronDown, AlertCircle, Loader2 } from "lucide-react";

interface Release {
  id: number;
  title: string;
  coverUrl: string;
  mainArtist: string;
  type: string;
  genre: string;
  status: string;
}

interface Pitching {
  id: number;
  releaseId: number;
  promoText: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  releaseTitle: string;
  releaseCover: string;
  releaseType: string;
  releaseMainArtist: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:  { label: "На рассмотрении", color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  reviewed: { label: "Рассмотрено",     color: "bg-green-500/15 text-green-600 dark:text-green-400" },
  rejected: { label: "Отклонено",       color: "bg-destructive/15 text-destructive" },
};

const TYPE_MAP: Record<string, string> = {
  single: "Single", ep: "EP", album: "Album",
  single_maxi: "Single Maxi", mixtape: "Mixtape",
};

export default function PitchingPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [pitchings, setPitchings] = useState<Pitching[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showReleaseDropdown, setShowReleaseDropdown] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [relRes, pitRes] = await Promise.all([
        fetch("/api/releases"),
        fetch("/api/pitchings"),
      ]);
      const relData = await relRes.json();
      const pitData = await pitRes.json();
      setReleases(relData.releases || []);
      setPitchings(pitData.pitchings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!selectedRelease || !promoText.trim()) {
      setError("Выберите релиз и заполните промо-информацию");
      return;
    }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/pitchings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId: selectedRelease.id, promoText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка отправки"); return; }
      setSuccess("Питчинг успешно отправлен на рассмотрение!");
      setPromoText(""); setSelectedRelease(null); setShowForm(false);
      fetchData();
    } catch { setError("Ошибка подключения к серверу"); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="font-[Inter,sans-serif] max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Маркетинг</h1>
          <p className="text-sm text-muted-foreground mt-1">Питчинг релизов для продвижения</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
          className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" /> Подать питчинг
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-xl text-[var(--brand)] text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {/* Pitch form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Новый питчинг</h2>
              <button onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Release selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Релиз</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowReleaseDropdown(v => !v)}
                  className="w-full flex items-center gap-3 border border-border rounded-xl px-3 py-2.5 text-sm text-left hover:border-[var(--brand)] transition-colors bg-background"
                >
                  {selectedRelease ? (
                    <>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <Image src={selectedRelease.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"} alt="" fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{selectedRelease.title}</p>
                        <p className="text-xs text-muted-foreground">{selectedRelease.mainArtist} • {TYPE_MAP[selectedRelease.type] || selectedRelease.type}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Выберите релиз</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${showReleaseDropdown ? "rotate-180" : ""}`} />
                </button>
                {showReleaseDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-10 max-h-56 overflow-y-auto">
                    {releases.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Нет доступных релизов</div>
                    ) : releases.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => { setSelectedRelease(r); setShowReleaseDropdown(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                          <Image src={r.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.mainArtist} • {TYPE_MAP[r.type] || r.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Promo text */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Промо-информация</label>
              <textarea
                value={promoText}
                onChange={e => setPromoText(e.target.value)}
                rows={6}
                placeholder="Расскажите о своём релизе: чем он уникален, какова его концепция, на какую аудиторию рассчитан..."
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] resize-none transition-colors"
              />
              <p className="text-xs text-muted-foreground">{promoText.length} символов</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={submitting || !selectedRelease || !promoText.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Отправить
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pitchings list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Мои питчинги</h2>

        {pitchings.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <Send className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Питчингов пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Подайте питчинг, чтобы продвинуть свой релиз</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2.5 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium rounded-xl transition-colors"
            >
              Подать питчинг
            </button>
          </div>
        ) : (
          pitchings.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
            return (
              <div key={p.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                <div className="flex items-center gap-4 p-5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                    <Image src={p.releaseCover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{p.releaseTitle}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.releaseMainArtist} • {TYPE_MAP[p.releaseType] || p.releaseType}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(p.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="shrink-0">
                    {p.status === "pending"  && <Clock        className="w-5 h-5 text-yellow-500" />}
                    {p.status === "reviewed" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {p.status === "rejected" && <X            className="w-5 h-5 text-destructive" />}
                  </div>
                </div>

                {/* Promo info */}
                <div className="border-t border-border px-5 py-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Промо-информация</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.promoText}</p>
                </div>

                {/* Admin note */}
                {p.adminNote && (
                  <div className="border-t border-border px-5 py-4 bg-blue-500/5">
                    <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1.5">Ответ команды</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">{p.adminNote}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
