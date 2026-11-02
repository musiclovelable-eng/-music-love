"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Clock, X, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";

interface Pitching {
  id: number;
  artistId: number;
  releaseId: number;
  promoText: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  releaseTitle: string;
  releaseCover: string;
  releaseType: string;
  releaseMainArtist: string;
  artistName: string | null;
  artistEmail: string;
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

export default function AdminPitchingsPage() {
  const [pitchings, setPitchings] = useState<Pitching[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Record<number, { status: string; note: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => { fetchPitchings(); }, []);

  const fetchPitchings = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/admin/pitchings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setPitchings(data.pitchings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleExpand = (id: number) => setExpanded(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const startEdit = (p: Pitching) => {
    setEditing(prev => ({ ...prev, [p.id]: { status: p.status, note: p.adminNote || "" } }));
    setExpanded(prev => new Set([...prev, p.id]));
  };

  const handleSave = async (id: number) => {
    const ed = editing[id]; if (!ed) return;
    setSaving(id);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/admin/pitchings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: ed.status, adminNote: ed.note }),
      });
      if (res.ok) {
        setPitchings(prev => prev.map(p => p.id === id ? { ...p, status: ed.status, adminNote: ed.note || null } : p));
        setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
        toast.success("Питчинг обновлён");
      } else { toast.error("Ошибка при сохранении"); }
    } catch { toast.error("Ошибка подключения"); }
    finally { setSaving(null); }
  };

  const stats = {
    total:    pitchings.length,
    pending:  pitchings.filter(p => p.status === "pending").length,
    reviewed: pitchings.filter(p => p.status === "reviewed").length,
    rejected: pitchings.filter(p => p.status === "rejected").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Питчинги</h1>
        <p className="text-sm text-muted-foreground mt-1">Заявки артистов на продвижение релизов</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Всего",            value: stats.total,    color: "bg-muted/50 border-border text-foreground" },
          { label: "На рассмотрении",  value: stats.pending,  color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400" },
          { label: "Рассмотрено",      value: stats.reviewed, color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" },
          { label: "Отклонено",        value: stats.rejected, color: "bg-destructive/10 border-destructive/30 text-destructive" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {pitchings.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <Send className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Питчингов пока нет</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pitchings.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
            const isExpanded = expanded.has(p.id);
            const ed = editing[p.id];

            return (
              <div key={p.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                {/* Header row */}
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Артист: {p.artistName || p.artistEmail}</span>
                      <span>•</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!ed && (
                      <button onClick={() => startEdit(p)}
                        className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent text-foreground transition-colors">
                        Ответить
                      </button>
                    )}
                    <button onClick={() => toggleExpand(p.id)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Promo text */}
                    <div className="px-5 py-4 bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Промо-информация артиста</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.promoText}</p>
                    </div>

                    {/* Admin response form or existing note */}
                    {ed ? (
                      <div className="px-5 py-4 space-y-3 border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ответ администратора</p>
                        <div className="flex gap-3">
                          {(["pending", "reviewed", "rejected"] as const).map(s => (
                            <button key={s} type="button"
                              onClick={() => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], status: s } }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                ed.status === s
                                  ? STATUS_MAP[s].color + " border-transparent"
                                  : "border-border text-muted-foreground hover:border-foreground/30"
                              }`}>
                              {STATUS_MAP[s].label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={ed.note}
                          onChange={e => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], note: e.target.value } }))}
                          rows={3}
                          placeholder="Напишите ответ для артиста (необязательно)..."
                          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] resize-none transition-colors"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(p.id)} disabled={saving === p.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                            {saving === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Сохранить
                          </button>
                          <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[p.id]; return n; })}
                            className="px-4 py-2 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-accent transition-colors">
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : p.adminNote ? (
                      <div className="px-5 py-4 border-t border-border bg-blue-500/5">
                        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1.5">Ответ команды</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{p.adminNote}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
