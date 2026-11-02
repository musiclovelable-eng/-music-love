"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, Plus, X, Upload, AlertCircle, Info, ExternalLink,
  Image as ImageIcon, Link as LinkIcon, Music, CheckCircle2, Trash2,
  GripVertical, ChevronDown, HelpCircle, Send, Check,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { hasAdvancedFeatures } from "@/lib/permissions";
import { DatePicker } from "@/components/ui/date-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  name: string;
  role: string;
}

interface Track {
  id: string;
  trackNumber: number;
  title: string;
  subtitle: string;
  url: string;
  fileName?: string;
  fileSize?: number;
  isUploaded: boolean;
  uploadProgress?: number;
  uploadMode: "file" | "url";
  trackUrlInput: string;
  persons: Person[];
  lyricsAuthor: string;
  producer: string;
  composer: string;
  language: string;
  explicit: boolean;
  isLive: boolean;
  isCover: boolean;
  isRemix: boolean;
  isInstrumental: boolean;
  lyrics: string;
  copyrightShare: string;
  relatedRightsShare: string;
  previewStart: string;
}

type TabId = "release" | "tracklist" | "platforms" | "check";

const TABS: { id: TabId; label: string }[] = [
  { id: "release", label: "Релиз" },
  { id: "tracklist", label: "Трек-лист" },
  { id: "platforms", label: "Площадки" },
  { id: "check", label: "Проверка" },
];

const RELEASE_SECTIONS = [
  "Основная информация",
  "Персоны и роли",
  "Жанр и поджанр",
  "Идентификация",
  "Название лейбла",
  "Даты",
  "Площадки и территории",
  "Загрузка видео",
  "Сопроводительные материалы",
];

const GENRES = [
  "Pop", "Rock", "Electronic", "Hip-Hop", "R&B", "Jazz", "Classical",
  "Folk", "Country", "Metal", "Alternative", "Indie", "Dance", "Reggae",
  "Soul", "Blues", "Funk", "Latin", "World", "Ambient",
];

const SUBGENRES: Record<string, string[]> = {
  Electronic: ["House", "Techno", "Trance", "Drum & Bass", "Ambient", "EDM", "Deep House", "Tech House"],
  "Hip-Hop": ["Trap", "Rap", "Lo-Fi", "Boom Bap", "Drill", "Cloud Rap"],
  Pop: ["Dance Pop", "Electropop", "Indie Pop", "K-Pop", "Synth Pop", "Art Pop"],
  Rock: ["Alternative Rock", "Indie Rock", "Classic Rock", "Punk", "Post-Rock", "Grunge"],
  "R&B": ["Neo Soul", "Contemporary R&B", "New Jack Swing"],
  Jazz: ["Smooth Jazz", "Bebop", "Fusion", "Free Jazz"],
  Classical: ["Baroque", "Romantic", "Contemporary Classical"],
  Folk: ["Acoustic", "Folk Rock", "Indie Folk"],
  Metal: ["Heavy Metal", "Death Metal", "Black Metal", "Metalcore", "Nu Metal"],
};

const LANGUAGES = [
  "Русский", "Английский", "Украинский", "Казахский", "Белорусский",
  "Узбекский", "Азербайджанский", "Армянский", "Грузинский",
  "Испанский", "Французский", "Немецкий", "Итальянский",
  "Японский", "Корейский", "Китайский", "Арабский",
  "Без слов (Инструментал)",
];

const PERSON_ROLES = ["Исполнитель", "feat.", "Автор музыки", "Автор слов", "Продюсер", "Ремиксёр", "Аранжировщик"];

const PLATFORMS = [
  "Apple Music", "Spotify", "YouTube Music", "VK Музыка", "Яндекс Музыка",
  "Deezer", "Tidal", "Amazon Music", "TikTok", "Instagram / Facebook",
  "SoundCloud", "Boom", "Звук", "Одноклассники", "Napster",
  "iHeartRadio", "Pandora", "Boomplay", "Anghami", "Gaana",
  "JioSaavn", "Kkbox", "NetEase Cloud Music", "QQ Music",
  "Melon", "Bugs", "Genie", "FLO", "Vibe", "LineMusic",
  "AWA", "Tencent Music", "Kuwo", "Kugou",
];

const CIS_COUNTRIES = ["RU", "UA", "BY", "KZ", "UZ", "AZ", "AM", "GE", "MD", "TM", "TJ", "KG"];

const COUNTRIES: { code: string; name: string }[] = [
  { code: "RU", name: "Россия" }, { code: "UA", name: "Украина" }, { code: "BY", name: "Беларусь" },
  { code: "KZ", name: "Казахстан" }, { code: "UZ", name: "Узбекистан" }, { code: "AZ", name: "Азербайджан" },
  { code: "AM", name: "Армения" }, { code: "GE", name: "Грузия" }, { code: "MD", name: "Молдова" },
  { code: "TM", name: "Туркменистан" }, { code: "TJ", name: "Таджикистан" }, { code: "KG", name: "Кыргызстан" },
  { code: "US", name: "США" }, { code: "GB", name: "Великобритания" }, { code: "DE", name: "Германия" },
  { code: "FR", name: "Франция" }, { code: "IT", name: "Италия" }, { code: "ES", name: "Испания" },
  { code: "PL", name: "Польша" }, { code: "NL", name: "Нидерланды" }, { code: "SE", name: "Швеция" },
  { code: "NO", name: "Норвегия" }, { code: "DK", name: "Дания" }, { code: "FI", name: "Финляндия" },
  { code: "CH", name: "Швейцария" }, { code: "AT", name: "Австрия" }, { code: "BE", name: "Бельгия" },
  { code: "PT", name: "Португалия" }, { code: "CZ", name: "Чехия" }, { code: "RO", name: "Румыния" },
  { code: "HU", name: "Венгрия" }, { code: "SK", name: "Словакия" }, { code: "BG", name: "Болгария" },
  { code: "HR", name: "Хорватия" }, { code: "GR", name: "Греция" }, { code: "TR", name: "Турция" },
  { code: "IL", name: "Израиль" }, { code: "AE", name: "ОАЭ" }, { code: "SA", name: "Саудовская Аравия" },
  { code: "EG", name: "Египет" }, { code: "NG", name: "Нигерия" }, { code: "ZA", name: "ЮАР" },
  { code: "IN", name: "Индия" }, { code: "CN", name: "Китай" }, { code: "JP", name: "Япония" },
  { code: "KR", name: "Южная Корея" }, { code: "TH", name: "Таиланд" }, { code: "ID", name: "Индонезия" },
  { code: "PH", name: "Филиппины" }, { code: "MY", name: "Малайзия" }, { code: "SG", name: "Сингапур" },
  { code: "AU", name: "Австралия" }, { code: "NZ", name: "Новая Зеландия" },
  { code: "CA", name: "Канада" }, { code: "MX", name: "Мексика" }, { code: "BR", name: "Бразилия" },
  { code: "AR", name: "Аргентина" }, { code: "CL", name: "Чили" }, { code: "CO", name: "Колумбия" },
  { code: "PE", name: "Перу" }, { code: "VE", name: "Венесуэла" },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="text-muted-foreground hover:text-muted-foreground transition-colors">
        <HelpCircle className="w-4 h-4" />
      </button>
      {show && (
        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-foreground text-background text-xs rounded-lg px-3 py-2 w-60 shadow-xl leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <Tooltip text={hint} />}
      </div>
      {children}
    </div>
  );
}

// ─── StyledInput ──────────────────────────────────────────────────────────────
function SI(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] transition-colors bg-background disabled:bg-muted disabled:text-muted-foreground ${props.className || ""}`}
    />
  );
}

// ─── StyledSelect ─────────────────────────────────────────────────────────────
function SS({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="border-border rounded-lg text-sm focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] h-10 bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ─── CheckBox ────────────────────────────────────────────────────────────────
function CB({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: () => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div onClick={() => !disabled && onChange()} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${checked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border hover:border-[var(--brand)]/50"}`}>
        {checked && <Check className="w-2.5 h-2.5 text-background" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
      {hint && <Tooltip text={hint} />}
    </label>
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────
function RB({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: () => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => !disabled && onChange()}>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border group-hover:border-[var(--brand)]/50"}`}>
        {checked && <div className="w-2 h-2 rounded-full bg-background" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
      {hint && <Tooltip text={hint} />}
    </label>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ArtistUpload() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");

  const [activeTab, setActiveTab] = useState<TabId>("release");
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false); // prevents double-submit
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  // Cover
  const [coverPreview, setCoverPreview] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploadMode, setCoverUploadMode] = useState<"file" | "url">("file");
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [coverProgress, setCoverProgress] = useState(0);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Release fields
  const [metadataLang, setMetadataLang] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [releaseType, setReleaseType] = useState("");
  const [label, setLabel] = useState("Music Love");
  const [persons, setPersons] = useState<Person[]>([{ id: "1", name: "", role: "Исполнитель" }]);
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [upc, setUpc] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [preorderDate, setPreorderDate] = useState("");
  const [rightsYear, setRightsYear] = useState(new Date().getFullYear().toString());
  const [earlyRussia, setEarlyRussia] = useState(false);
  const [realtimeDelivery, setRealtimeDelivery] = useState(false);
  const [artistComment, setArtistComment] = useState("");

  // Platforms
  const [platformMode, setPlatformMode] = useState<"all" | "selected">("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([...PLATFORMS]);
  const [countryMode, setCountryMode] = useState<"all" | "selected" | "except">("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Tracks
  const [tracks, setTracks] = useState<Track[]>([{
    id: "1", trackNumber: 1, title: "", subtitle: "", url: "", isUploaded: false,
    uploadMode: "file", trackUrlInput: "",
    persons: [{ id: "1", name: "", role: "Исполнитель" }],
    lyricsAuthor: "", producer: "", composer: "",
    language: "Русский", explicit: false, isLive: false, isCover: false,
    isRemix: false, isInstrumental: false, lyrics: "",
    copyrightShare: "0.00", relatedRightsShare: "100.00", previewStart: "",
  }]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [draftId, setDraftId] = useState<number | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => { if (user) setLabel(user.label || "Music Love"); }, [user]);

  useEffect(() => { if (editId) fetchRelease(editId); }, [editId]);

  // ─── Автосохранение черновика ────────────────────────────────────────────
  // Сохраняет черновик каждые 30 секунд, если что-то заполнено
  const hasAnyData = useCallback(() => {
    return !!(title || coverUrl || releaseType || genre || metadataLang ||
      persons.some(p => p.name.trim()) ||
      tracks.some(t => t.title || t.url));
  }, [title, coverUrl, releaseType, genre, metadataLang, persons, tracks]);

  const autoSaveDraft = useCallback(async () => {
    if (!user || isSubmittingRef.current || isLoading) return;
    if (!hasAnyData()) return;
    // Если редактируем не-draft релиз — автосохранение не нужно
    if (editId && !canEdit) return;

    setIsAutoSaving(true);
    try {
      const payload: any = {
        draftId: draftId || (editId ? parseInt(editId) : undefined),
        title, type: releaseType, coverUrl, genre, subgenre,
        subtitle, metadataLang, label, artistComment,
        startDate: startDate || null, preorderDate: preorderDate || null,
        rightsYear, partnerCode, earlyRussia, realtimeDelivery,
        releaseDate: releaseDate || null,
        mainArtist: persons.filter(p => p.role === "Исполнитель" && p.name.trim()).map(p => p.name.trim()).join(", "),
        additionalArtists: persons.filter(p => p.role === "feat." && p.name.trim()).map(p => p.name.trim()).join(", "),
        platforms: platformMode === "all" ? [] : selectedPlatforms,
        territories: countryMode === "all" ? [] : selectedCountries,
        persons,
        tracks: tracks.map((t, i) => ({
          trackNumber: i + 1, title: t.title, url: t.url, subtitle: t.subtitle,
          artists: t.persons.filter(p => ["Исполнитель", "feat."].includes(p.role) && p.name.trim()).map(p => p.name.trim()).join(", "),
          musicAuthor: t.persons.filter(p => p.role === "Автор музыки" && p.name.trim()).map(p => p.name.trim()).join(", "),
          lyricsAuthor: t.persons.filter(p => p.role === "Автор слов" && p.name.trim()).map(p => p.name.trim()).join(", "),
          producer: t.persons.filter(p => p.role === "Продюсер" && p.name.trim()).map(p => p.name.trim()).join(", "),
          composer: t.composer, language: t.language, explicit: t.explicit, lyrics: t.lyrics,
          isLive: t.isLive, isCover: t.isCover, isRemix: t.isRemix, isInstrumental: t.isInstrumental,
          previewStart: t.previewStart,
          copyrightShare: t.copyrightShare, relatedRightsShare: t.relatedRightsShare,
          personsJson: JSON.stringify(t.persons),
        })),
      };

      const res = await fetch("/api/releases/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.draftId && !draftId) {
        setDraftId(data.draftId);
      }
      setLastSavedAt(new Date().toLocaleTimeString("ru-RU"));
    } catch (e) {
      // Silent fail on autosave
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, draftId, editId, canEdit, title, coverUrl, releaseType, genre, subgenre, subtitle,
      releaseDate, startDate, preorderDate, rightsYear, partnerCode, earlyRussia, realtimeDelivery,
      metadataLang, label, artistComment, platformMode, selectedPlatforms,
      countryMode, selectedCountries, persons, tracks, isLoading, hasAnyData]);

  // ─── DEBOUNCED автосохранение: 3.5 сек после последнего изменения ─────────
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || isSubmittingRef.current || isLoading) return;
    if (!hasAnyData()) return;
    if (editId && !canEdit) return;

    // Сбрасываем предыдущий таймер
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Ставим новый — через 3.5 секунды после последнего изменения
    saveTimeoutRef.current = setTimeout(() => {
      autoSaveDraft();
    }, 3500);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [autoSaveDraft, user, hasAnyData, editId, canEdit, isLoading, title, coverUrl, releaseType, genre,
      subgenre, subtitle, metadataLang, label, artistComment, releaseDate, startDate, preorderDate,
      rightsYear, partnerCode, earlyRussia, realtimeDelivery, platformMode, selectedPlatforms,
      countryMode, selectedCountries, persons, tracks]);

  // Сохранение при закрытии/уходе со страницы
  useEffect(() => {
    const handler = () => { autoSaveDraft(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [autoSaveDraft]);

  const fetchRelease = async (id: string) => {
    try {
      const res = await fetch(`/api/releases/${id}`);
      const data = await res.json();
      if (data.release) {
        const r = data.release;
        setReleaseType(r.type || "");
        setSubtitle(r.subtitle || "");
        setMetadataLang(r.metadataLang || r.metadata_language || "");
        setCoverUrl(r.coverUrl || ""); setCoverPreview(r.coverUrl || "");
        setTitle(r.title || ""); setReleaseDate(r.releaseDate || "");
        setStartDate(r.startDate || r.start_date || "");
        setPreorderDate(r.preorderDate || r.pre_order_date || "");
        setRightsYear(r.rightsYear || r.copyright_year || new Date().getFullYear().toString());
        setPartnerCode(r.partnerCode || r.partner_code || "");
        setUpc(r.upc || "");
        setEarlyRussia(!!(r.earlyRussia ?? r.early_russia));
        setRealtimeDelivery(!!(r.realtimeDelivery ?? r.realtime_delivery));
        setLabel(r.label || user?.label || "Music Love");
        setGenre(r.genre || ""); setSubgenre(r.subgenre || "");
        setArtistComment(r.artistComment || "");
        setCanEdit(r.status === "draft" || r.status === "requires_changes" || r.status === "approved" || r.status === "published");

        // ─── Загружаем персоны релиза из JSON ────────────────────────────
        let loadedPersons: Person[] = [];
        const rawPersons = r.persons || r.personsList;
        if (rawPersons) {
          try {
            const parsed = typeof rawPersons === "string" ? JSON.parse(rawPersons) : rawPersons;
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedPersons = parsed.map((p: any, i: number) => ({
                id: String(p.id || i + 1),
                name: p.name || "",
                role: p.role || "Исполнитель",
              }));
            }
          } catch {}
        }
        if (loadedPersons.length > 0) {
          setPersons(loadedPersons);
        }

        if (data.tracks?.length) {
          setTracks(data.tracks.map((t: any, i: number) => {
            // Загружаем персоны трека из persons_json
            let trackPersons: Person[] = [{ id: "1", name: "", role: "Исполнитель" }];
            const rawTP = t.personsJson || t.persons_json;
            if (rawTP) {
              try {
                const parsed = typeof rawTP === "string" ? JSON.parse(rawTP) : rawTP;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  trackPersons = parsed.map((p: any, j: number) => ({
                    id: String(p.id || j + 1),
                    name: p.name || "",
                    role: p.role || "Исполнитель",
                  }));
                }
              } catch {}
            } else if (t.artists) {
              // Fallback: если persons_json нет, но есть artists
              trackPersons = [{ id: "1", name: t.artists || "", role: "Исполнитель" }];
            }

            return {
              id: String(t.id), trackNumber: i + 1, title: t.title || "",
              subtitle: t.subtitle || "",
              url: t.url || "", isUploaded: true,
              uploadMode: t.url?.includes("release-tracks") ? "file" : "url" as "file" | "url",
              trackUrlInput: t.url || "",
              persons: trackPersons,
              lyricsAuthor: t.lyricsAuthor || t.lyrics_author || "",
              producer: t.producer || "",
              composer: t.composer || "",
              language: t.language || "Русский",
              explicit: !!(t.explicit ?? false),
              isLive: !!(t.isLive ?? t.is_live ?? false),
              isCover: !!(t.isCover ?? t.is_cover ?? false),
              isRemix: !!(t.isRemix ?? t.is_remix ?? false),
              isInstrumental: !!(t.isInstrumental ?? t.is_instrumental ?? false),
              lyrics: t.lyrics || "",
              copyrightShare: t.copyrightShare || t.copyright_share || "0.00",
              relatedRightsShare: t.relatedRightsShare || t.related_rights_share || "100.00",
              previewStart: t.previewStart || t.preview_start || "",
            };
          }));
        }
      }
    } catch (e) { console.error(e); }
  };

  // ─── Cover ────────────────────────────────────────────────────────────────
  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setError("Допустимые форматы: JPG, PNG"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Максимальный размер: 5 МБ"); return; }
    setError("");
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview); setCoverUrl("");
    uploadCover(file, preview);
  };

  const uploadCover = async (file: File, localPreview: string) => {
    setCoverUploading(true); setCoverProgress(0);
    try {
      const fd = new FormData(); fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", ev => { if (ev.lengthComputable) setCoverProgress(Math.round(ev.loaded / ev.total * 100)); });
      const res = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Invalid response")); } };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.timeout = 120000; xhr.open("POST", "/api/releases/upload-cover"); xhr.send(fd);
      });
      if (res.success && res.url) { setCoverUrl(res.url); URL.revokeObjectURL(localPreview); setCoverPreview(res.url); }
      else { setError(res.error || "Ошибка загрузки обложки"); setCoverPreview(""); }
    } catch (e: any) { setError(e?.message || "Ошибка загрузки обложки"); setCoverPreview(""); }
    finally { setCoverUploading(false); setCoverProgress(0); }
  };

  const applyCoverUrl = () => {
    const v = coverUrlInput.trim();
    if (!v) return;
    setCoverUrl(v); setCoverPreview(v);
  };

  // ─── Track upload ─────────────────────────────────────────────────────────
  const handleTrackFile = async (trackId: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["wav", "flac", "mp3", "aac"].includes(ext)) { setError("Форматы: WAV, FLAC, MP3, AAC"); return; }
    if (file.size > 1024 * 1024 * 1024) { setError("Максимальный размер: 1 ГБ"); return; }
    setError("");
    setTracks(p => p.map(t => t.id === trackId ? { ...t, fileName: file.name, fileSize: file.size, uploadProgress: 0, isUploaded: false, url: "" } : t));
    try {
      const fd = new FormData(); fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", ev => { if (ev.lengthComputable) setTracks(p => p.map(t => t.id === trackId ? { ...t, uploadProgress: Math.round(ev.loaded / ev.total * 100) } : t)); });
      const res = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Invalid response")); } };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.timeout = 300000; xhr.open("POST", "/api/releases/upload-track"); xhr.send(fd);
      });
      if (res.success && res.url) {
        setTracks(p => p.map(t => t.id === trackId ? { ...t, url: res.url, isUploaded: true, uploadProgress: undefined, title: t.title || file.name.replace(/\.[^/.]+$/, "") } : t));
      } else {
        setError(res.error || "Ошибка загрузки трека");
        setTracks(p => p.map(t => t.id === trackId ? { ...t, uploadProgress: undefined, fileName: undefined, fileSize: undefined } : t));
      }
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки трека");
      setTracks(p => p.map(t => t.id === trackId ? { ...t, uploadProgress: undefined, fileName: undefined, fileSize: undefined } : t));
    }
  };

  const applyTrackUrl = (trackId: string) => {
    setTracks(p => p.map(t => {
      if (t.id !== trackId) return t;
      const v = t.trackUrlInput.trim();
      if (!v) return t;
      return { ...t, url: v, isUploaded: true };
    }));
  };

  // ─── Persons ─────────────────────────────────────────────────────────────
  const addPerson = () => setPersons(p => [...p, { id: Date.now().toString(), name: "", role: "Исполнитель" }]);
  const removePerson = (id: string) => setPersons(p => p.filter(x => x.id !== id));
  const updatePerson = (id: string, field: "name" | "role", val: string) => setPersons(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));

  const addTrackPerson = (tid: string) => setTracks(p => p.map(t => t.id === tid ? { ...t, persons: [...t.persons, { id: Date.now().toString(), name: "", role: "Исполнитель" }] } : t));
  const removeTrackPerson = (tid: string, pid: string) => setTracks(p => p.map(t => t.id === tid ? { ...t, persons: t.persons.filter(x => x.id !== pid) } : t));
  const updateTrackPerson = (tid: string, pid: string, field: "name" | "role", val: string) => setTracks(p => p.map(t => t.id === tid ? { ...t, persons: t.persons.map(x => x.id === pid ? { ...x, [field]: val } : x) } : t));

  // ─── Tracks ───────────────────────────────────────────────────────────────
  const addTrack = () => setTracks(p => [...p, {
    id: Date.now().toString(), trackNumber: p.length + 1,
    title: "", subtitle: "", url: "", isUploaded: false, uploadMode: "file", trackUrlInput: "",
    persons: [{ id: "1", name: "", role: "Исполнитель" }],
    lyricsAuthor: "", producer: "", composer: "",
    language: "Русский", explicit: false, isLive: false, isCover: false,
    isRemix: false, isInstrumental: false, lyrics: "",
    copyrightShare: "0.00", relatedRightsShare: "100.00", previewStart: "",
  }]);
  const removeTrack = (id: string) => { if (tracks.length > 1) setTracks(p => p.filter(t => t.id !== id).map((t, i) => ({ ...t, trackNumber: i + 1 }))); };
  const updateTrack = (id: string, field: keyof Track, val: any) => setTracks(p => p.map(t => t.id === id ? { ...t, [field]: val } : t));

  const fmt = (b: number) => b < 1024 ? b + " B" : b < 1024 * 1024 ? (b / 1024).toFixed(1) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB";

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs: string[] = [];
    if (!metadataLang) errs.push("Не выбран язык метаданных");
    if (!coverUrl) errs.push("Не загружена обложка релиза");
    if (!title.trim()) errs.push("Не указано название релиза");
    if (!releaseType) errs.push("Не выбран тип релиза");
    if (!genre) errs.push("Не выбран жанр");
    if (!label.trim()) errs.push("Не указано название лейбла");
    if (!releaseDate && !startDate) errs.push("Не указана дата релиза");
    const mainArtist = persons.filter(p => p.role === "Исполнитель" && p.name.trim()).map(p => p.name.trim()).join(", ");
    if (!mainArtist) errs.push("Укажите хотя бы одного исполнителя в разделе «Персоны и роли»");
    if (!tracks.some(t => t.isUploaded)) errs.push("Не загружен ни один трек");
    tracks.forEach((t, i) => { if (t.isUploaded && !t.title.trim()) errs.push(`Трек ${i + 1}: не указано название`); });
    setValidationErrors(errs);
    return errs;
  }, [metadataLang, coverUrl, title, releaseType, genre, label, releaseDate, startDate, persons, tracks]);

  useEffect(() => { if (activeTab === "check") validate(); }, [activeTab, validate]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmittingRef.current || isLoading) return;
    const errs = validate();
    if (errs.length > 0) return;
    isSubmittingRef.current = true;
    setIsLoading(true); setError("");
    try {
      const mainArtist = persons.filter(p => p.role === "Исполнитель" && p.name.trim()).map(p => p.name.trim()).join(", ");
      const additionalArtists = persons.filter(p => p.role === "feat." && p.name.trim()).map(p => p.name.trim()).join(", ");
      const payload = {
        type: releaseType, subtitle, coverUrl, title, metadataLang,
        releaseDate: releaseDate || null, startDate: startDate || null,
        preorderDate: preorderDate || null, rightsYear, partnerCode,
        upc: upc || undefined,
        earlyRussia, realtimeDelivery,
        isAsap: false,
        mainArtist, additionalArtists, genre, subgenre, label, artistComment,
        platforms: platformMode === "all" ? PLATFORMS : selectedPlatforms,
        territories: countryMode === "all" ? [] : selectedCountries,
        persons: persons,
        tracks: tracks.map((t, i) => ({
          trackNumber: i + 1, title: t.title, subtitle: t.subtitle, url: t.url,
          artists: t.persons.filter(p => ["Исполнитель", "feat."].includes(p.role) && p.name.trim()).map(p => p.name.trim()).join(", ") || mainArtist,
          musicAuthor: t.persons.filter(p => p.role === "Автор музыки" && p.name.trim()).map(p => p.name.trim()).join(", "),
          lyricsAuthor: t.persons.filter(p => p.role === "Автор слов" && p.name.trim()).map(p => p.name.trim()).join(", ") || t.lyricsAuthor,
          producer: t.persons.filter(p => p.role === "Продюсер" && p.name.trim()).map(p => p.name.trim()).join(", ") || t.producer,
          composer: t.composer, language: t.language,
          explicit: t.explicit, isLive: t.isLive, isCover: t.isCover,
          isRemix: t.isRemix, isInstrumental: t.isInstrumental,
          previewStart: t.previewStart, lyrics: t.lyrics,
          copyrightShare: t.copyrightShare, relatedRightsShare: t.relatedRightsShare,
          personsJson: JSON.stringify(t.persons),
        })),
        status: "on_moderation",
      };
      const url = editId ? `/api/releases/${editId}` : "/api/releases/create";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка при сохранении"); return; }
      router.push("/artist/moderation");
    } catch { setError("Ошибка подключения к серверу"); }
    finally { setIsLoading(false); isSubmittingRef.current = false; }
  };

  if (!user) return null;
  const isLabelRole = (user as any).role === "label";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="font-[Inter,sans-serif]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{editId ? "Редактировать релиз" : "Новый релиз"}</h1>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAutoSaving ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : lastSavedAt ? "bg-green-500/10 text-green-600 dark:text-green-400" : ""}`}>
          {isAutoSaving ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Сохранение черновика…</>
          ) : lastSavedAt ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Черновик сохранён · {lastSavedAt}</>
          ) : null}
        </div>
      </div>

      {!canEdit && (
        <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Релиз не может быть отредактирован в текущем статусе.
        </div>
      )}

      {/* Tabs */}
      <div className="border border-border rounded-xl overflow-hidden mb-8">
        <div className="grid grid-cols-4">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 text-sm font-medium transition-colors border-r last:border-r-0 border-border ${activeTab === tab.id ? "bg-background text-foreground font-semibold border-b-2 border-b-[var(--brand)]" : "bg-muted/50 text-muted-foreground hover:bg-background hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════ TAB: РЕЛИЗ ══════════════════════ */}
      {activeTab === "release" && (
        <div className="flex gap-8">
          <div className="flex-1 space-y-10">

            {/* Основная информация */}
            <Section title="Основная информация" description="Заполните общую информацию по вашему релизу">
              <Field label="Язык метаданных" hint="Язык, на котором представлена основная информация о релизе. Если релиз на нескольких языках — выберите основной.">
                <SS value={metadataLang} onChange={setMetadataLang} placeholder="Выберите язык" disabled={!canEdit} options={LANGUAGES.map(l => ({ value: l, label: l }))} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Название релиза">
                  <SI value={title} onChange={e => setTitle(e.target.value)} placeholder="Введите название" disabled={!canEdit} />
                </Field>
                <Field label="Подзаголовок" hint="Дополнительное название, например: Deluxe Edition, Acoustic Version. Если отсутствует — оставьте пустым.">
                  <SI value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Введите подзаголовок" disabled={!canEdit} />
                </Field>
              </div>
              <Field label="Тип релиза">
                <div className="space-y-2">
                  {[{ v: "single", l: "Single", h: "1–3 трека, до 10 минут каждый" }, { v: "ep", l: "EP", h: "До 6 треков, общая длительность до 30 минут" }, { v: "album", l: "Album", h: "7 и более треков, более 30 минут" }, { v: "single_maxi", l: "Single Maxi", h: "2–3 трека" }, { v: "mixtape", l: "Mixtape", h: "Сборник без общей концепции" }].map(o => (
                    <RB key={o.v} checked={releaseType === o.v} onChange={() => setReleaseType(o.v)} label={o.l} hint={o.h} disabled={!canEdit} />
                  ))}
                </div>
              </Field>

              {/* Cover upload */}
              <Field label="Обложка релиза" hint="JPG или PNG, до 5 МБ, минимум 1400×1400, максимум 6000×6000 пикселей.">
                {/* Mode toggle */}
                <div className="flex gap-1 mb-3">
                  {(["file", "url"] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setCoverUploadMode(m); if (m === "file") { setCoverUrlInput(""); } }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${coverUploadMode === m ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] dark:text-[var(--brand)] dark:text-[var(--brand-hover)]" : "border-border text-muted-foreground hover:border-border"}`}>
                      {m === "file" ? <><Upload className="w-3.5 h-3.5" /> Загрузить файл</> : <><LinkIcon className="w-3.5 h-3.5" /> Указать ссылку</>}
                    </button>
                  ))}
                </div>
                <input ref={coverRef} type="file" accept="image/jpeg,image/png" onChange={handleCoverFile} className="hidden" disabled={!canEdit} />
                {coverUploadMode === "url" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <SI value={coverUrlInput} onChange={e => setCoverUrlInput(e.target.value)} placeholder="https://example.com/cover.jpg" disabled={!canEdit} onKeyDown={e => e.key === "Enter" && applyCoverUrl()} />
                      <button type="button" onClick={applyCoverUrl} disabled={!canEdit || !coverUrlInput.trim()} className="px-3 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-40 transition-colors whitespace-nowrap">
                        Применить
                      </button>
                    </div>
                    {coverPreview && coverUploadMode === "url" && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0">
                          <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--brand)] text-sm"><CheckCircle2 className="w-4 h-4" /> Обложка добавлена</div>
                      </div>
                    )}
                  </div>
                ) : (
                  coverPreview ? (
                    <div className="flex items-start gap-4">
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border shrink-0">
                        <Image src={coverPreview} alt="Обложка" fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 space-y-2 pt-2">
                        {coverUploading ? (
                          <><p className="text-sm text-muted-foreground">Загрузка обложки...</p>
                            <Progress value={coverProgress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">{coverProgress}%</p></>
                        ) : coverUrl ? (
                          <div className="flex items-center gap-2 text-[var(--brand)] text-sm"><CheckCircle2 className="w-4 h-4" /> Обложка загружена</div>
                        ) : null}
                        {canEdit && <button type="button" onClick={() => { setCoverPreview(""); setCoverUrl(""); }} className="text-sm text-muted-foreground hover:text-muted-foreground underline">Удалить</button>}
                        {canEdit && <button type="button" onClick={() => coverRef.current?.click()} className="ml-3 text-sm text-muted-foreground hover:text-muted-foreground underline">Заменить</button>}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => canEdit && !coverUploading && coverRef.current?.click()}
                      className={`border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors ${canEdit && !coverUploading ? "cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand)]/10/30" : "opacity-50"}`}>
                      <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">Нажмите для загрузки обложки</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG • До 5 МБ • 1400×1400 – 6000×6000 px</p>
                    </div>
                  )
                )}
              </Field>
            </Section>

            <div className="border-t border-border" />

            {/* Персоны и роли */}
            <Section title="Персоны и роли"
              description="Для Исполнителей и Соисполнителей (feat.) необходимо указать наименование артиста, группы, проекта — как хотите доставить на площадки. Для Авторов музыки и Авторов слов необходимо указать фактические имена и фамилии, не указывайте псевдонимы.">
              <div className="space-y-2">
                {persons.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/60 cursor-grab shrink-0" />
                    <div className="flex-1">
                      <SI value={p.name} onChange={e => updatePerson(p.id, "name", e.target.value)} placeholder="Имя персоны" disabled={!canEdit} />
                    </div>
                    <div className="w-48 shrink-0">
                      <SS value={p.role} onChange={v => updatePerson(p.id, "role", v)} placeholder="Роль" disabled={!canEdit} options={PERSON_ROLES.map(r => ({ value: r, label: r }))} />
                    </div>
                    <button type="button" onClick={() => removePerson(p.id)} className="text-muted-foreground/60 hover:text-destructive/70 transition-colors p-1 shrink-0" disabled={!canEdit}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addPerson} disabled={!canEdit} className="text-sm text-muted-foreground hover:text-[var(--brand)] transition-colors mt-1">
                  Добавить
                </button>
              </div>
            </Section>

            <div className="border-t border-border" />

            {/* Жанр и поджанр */}
            <Section title="Жанр и поджанр" description="Укажите основной жанр и поджанр для релиза">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Жанр" hint="Основной жанр релиза">
                  <SS value={genre} onChange={v => { setGenre(v); setSubgenre(""); }} placeholder="Выберите жанр" disabled={!canEdit} options={GENRES.map(g => ({ value: g, label: g }))} />
                </Field>
                <Field label="Поджанр" hint="Дополнительный жанр, элементы которого встречаются в вашем релизе. Указывается после основного жанра">
                  <SS value={subgenre} onChange={setSubgenre} placeholder="Выберите поджанр" disabled={!canEdit || !genre} options={(SUBGENRES[genre] || []).map(s => ({ value: s, label: s }))} />
                </Field>
              </div>
            </Section>

            <div className="border-t border-border" />

            {/* Идентификация */}
            <Section title="Идентификация">
              <div className="grid grid-cols-2 gap-4">
                <Field label="UPC" hint="Заполняется только администратором. После присвоения отображается без возможности редактирования.">
                  <SI value={upc} placeholder="Заполняется администратором" disabled />
                </Field>
                <Field label="Код партнёра">
                  <SI value={partnerCode} onChange={e => setPartnerCode(e.target.value)} placeholder="Необязательное поле" disabled={!canEdit} />
                </Field>
              </div>
            </Section>

            <div className="border-t border-border" />

            {/* Название лейбла */}
            <Section title="Название лейбла" description="Укажите наименование лейбла, данная информация будет отображена на площадках">
              {isLabelRole ? (
                <Field label="Лейбл">
                  <div className="relative">
                    <SI value={label} onChange={e => setLabel(e.target.value)} disabled={!canEdit} />
                    {label && <button type="button" onClick={() => setLabel("")} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"><X className="w-4 h-4" /></button>}
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </Field>
              ) : (
                <div className="border border-border rounded-lg px-4 py-3 bg-muted/40 flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">{label || "Music Love"}</span>
                  <div className="flex gap-2"><X className="w-4 h-4 text-muted-foreground/60" /><ChevronDown className="w-4 h-4 text-muted-foreground" /></div>
                </div>
              )}
            </Section>

            <div className="border-t border-border" />

            {/* Даты */}
            <Section title="Даты" description="Укажите основные даты для релиза">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Дата релиза" hint="Официальная дата выхода релиза">
                  <DatePicker value={releaseDate} onChange={setReleaseDate} disabled={!canEdit} placeholder="Выберите дату" minDate={new Date()} />
                </Field>
                <Field label="Дата старта" hint="Дата, когда ваш релиз должен стать доступным на площадках">
                  <DatePicker value={startDate} onChange={setStartDate} disabled={!canEdit} placeholder="Выберите дату" minDate={new Date()} />
                </Field>
                <Field label="Дата предзаказа" hint="Дата начала предзаказа (если используется)">
                  <DatePicker value={preorderDate} onChange={setPreorderDate} disabled={!canEdit} placeholder="Выберите дату" />
                </Field>
                <Field label="Год получения прав" hint="Год выпуска, например: ® 2026 Music Love">
                  <SI value={rightsYear} onChange={e => setRightsYear(e.target.value)} placeholder="2026" disabled={!canEdit} maxLength={4} />
                </Field>
              </div>
            </Section>

            <div className="border-t border-border" />

            {/* Дополнительные настройки */}
            <Section title="Дополнительные настройки">
              <div className="space-y-3">
                <CB checked={earlyRussia} onChange={() => setEarlyRussia(v => !v)} label="Ранний старт в России" hint="Релиз выходит на 1 день раньше в России" disabled={!canEdit} />
                <CB checked={realtimeDelivery} onChange={() => setRealtimeDelivery(v => !v)} label="Доставка в реальном времени" hint="Релиз выходит сразу после прохождения модерации" disabled={!canEdit} />
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0">
            <div className="sticky top-6">
              <ul className="space-y-1">
                {RELEASE_SECTIONS.map((sec, idx) => (
                  <li key={sec} onClick={() => setActiveSection(idx)} className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${activeSection === idx ? "text-[var(--brand)]" : "text-muted-foreground hover:text-foreground"}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${activeSection === idx ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border"}`}>
                      {activeSection === idx && <Check className="w-2.5 h-2.5 text-background" />}
                    </div>
                    {sec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: ТРЕК-ЛИСТ ══════════════════════ */}
      {activeTab === "tracklist" && (
        <div className="space-y-8">
          {/* Bulk upload zone */}
          <Section title="Загрузка треков">
            <div onClick={() => canEdit && document.getElementById("bulk-track")?.click()}
              className={`border-2 border-dashed border-border rounded-xl p-10 text-center transition-colors ${canEdit ? "cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand)]/10/30" : "opacity-50"}`}>
              <input id="bulk-track" type="file" accept=".wav,.flac,.mp3,.aac" multiple className="hidden" disabled={!canEdit}
                onChange={e => {
                  Array.from(e.target.files || []).forEach((file, i) => {
                    if (i === 0 && tracks.length === 1 && !tracks[0].isUploaded && tracks[0].uploadProgress === undefined) {
                      handleTrackFile(tracks[0].id, file);
                    } else {
                      const newId = Date.now().toString() + i;
                      setTracks(prev => {
                        const newTrack: Track = {
                          id: newId, trackNumber: prev.length + 1,
                          title: "", subtitle: "", url: "", isUploaded: false, uploadMode: "file", trackUrlInput: "",
                          persons: [{ id: "p1", name: "", role: "Исполнитель" }],
                          lyricsAuthor: "", producer: "", composer: "",
                          language: "Русский", explicit: false, isLive: false, isCover: false,
                          isRemix: false, isInstrumental: false, lyrics: "",
                          copyrightShare: "0.00", relatedRightsShare: "100.00", previewStart: "",
                        };
                        const updated = [...prev, newTrack];
                        setTimeout(() => handleTrackFile(newId, file), 50);
                        return updated;
                      });
                    }
                  });
                }} />
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Перенесите файлы сюда или нажмите, чтобы загрузить</p>
              <p className="text-xs text-muted-foreground mt-1">Формат: .wav, .flac &nbsp;•&nbsp; Максимальный размер: 1 ГБ</p>
            </div>
          </Section>

          {/* Track cards */}
          {tracks.map(track => (
            <div key={track.id} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
                <GripVertical className="w-4 h-4 text-muted-foreground/60 cursor-grab" />
                <span className="text-sm font-semibold text-foreground">Трек {track.trackNumber}</span>
                {track.isUploaded ? <span className="flex items-center gap-1 text-xs text-[var(--brand)]"><CheckCircle2 className="w-3.5 h-3.5" /> Загружен</span>
                  : track.uploadProgress !== undefined ? <span className="flex items-center gap-1 text-xs text-blue-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {track.uploadProgress}%</span>
                  : <span className="text-xs text-orange-500">Не загружен</span>}
                <div className="flex-1" />
                {tracks.length > 1 && <button type="button" onClick={() => removeTrack(track.id)} className="text-muted-foreground/60 hover:text-destructive/70 transition-colors"><Trash2 className="w-4 h-4" /></button>}
              </div>

              <div className="p-5 space-y-5">
                {/* Upload / URL mode for track */}
                {!track.isUploaded && track.uploadProgress === undefined && (
                  <>
                    <div className="flex gap-1 mb-2">
                      {(["file", "url"] as const).map(m => (
                        <button key={m} type="button" onClick={() => updateTrack(track.id, "uploadMode", m)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${track.uploadMode === m ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] dark:text-[var(--brand)] dark:text-[var(--brand-hover)]" : "border-border text-muted-foreground hover:border-border"}`}>
                          {m === "file" ? <><Upload className="w-3.5 h-3.5" /> Загрузить файл</> : <><LinkIcon className="w-3.5 h-3.5" /> Указать ссылку</>}
                        </button>
                      ))}
                    </div>
                    {track.uploadMode === "file" ? (
                      <div onClick={() => {
                        const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".wav,.flac,.mp3,.aac";
                        inp.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleTrackFile(track.id, f); }; inp.click();
                      }}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand)]/10/20 transition-colors">
                        <Music className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                        <p className="text-sm text-muted-foreground">Нажмите для загрузки аудио</p>
                        <p className="text-xs text-muted-foreground mt-1">WAV, FLAC, MP3, AAC</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <SI
                          value={track.trackUrlInput}
                          onChange={e => updateTrack(track.id, "trackUrlInput", e.target.value)}
                          placeholder="https://example.com/track.mp3 или ссылка на облако"
                          disabled={!canEdit}
                          onKeyDown={e => e.key === "Enter" && applyTrackUrl(track.id)}
                        />
                        <button type="button" onClick={() => applyTrackUrl(track.id)} disabled={!canEdit || !track.trackUrlInput.trim()}
                          className="px-3 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-40 transition-colors whitespace-nowrap">
                          Применить
                        </button>
                      </div>
                    )}
                  </>
                )}

                {track.uploadProgress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{track.fileName}</span><span>{track.fileSize && fmt(track.fileSize)}</span></div>
                    <Progress value={track.uploadProgress} className="h-1.5" />
                  </div>
                )}

                {track.isUploaded && (
                  <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2.5">
                    {track.uploadMode === "url" ? <LinkIcon className="w-4 h-4 text-[var(--brand)] shrink-0" /> : <Music className="w-4 h-4 text-[var(--brand)] shrink-0" />}
                    <span className="text-sm text-muted-foreground flex-1 truncate">{track.fileName || track.url || "Трек загружен"}</span>
                    <button type="button" disabled={!canEdit} className="text-xs text-muted-foreground hover:text-muted-foreground underline"
                      onClick={() => updateTrack(track.id, "isUploaded", false)}>Заменить</button>
                  </div>
                )}

                {/* Track name + subtitle */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Название трека" hint="Название трека на языке метаданных">
                    <SI value={track.title} onChange={e => updateTrack(track.id, "title", e.target.value)} placeholder="Название вашего трека" disabled={!canEdit} />
                  </Field>
                  <Field label="Подзаголовок" hint="Например: Remix, Live, Acoustic Version">
                    <SI value={track.subtitle} onChange={e => updateTrack(track.id, "subtitle", e.target.value)} placeholder="Remix" disabled={!canEdit} />
                  </Field>
                </div>

                {/* Персоны трека */}
                <Section title="Персоны и роли"
                  description="Для Исполнителей и Соисполнителей (feat.) необходимо указать наименование артиста, группы, проекта. Для Авторов музыки и Авторов слов необходимо указать фактические имена и фамилии.">
                  <div className="space-y-2">
                    {track.persons.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/60 cursor-grab shrink-0" />
                        <div className="flex-1">
                          <SI value={p.name} onChange={e => updateTrackPerson(track.id, p.id, "name", e.target.value)} placeholder="Имя персоны" disabled={!canEdit} />
                        </div>
                        <div className="w-48 shrink-0">
                          <SS value={p.role} onChange={v => updateTrackPerson(track.id, p.id, "role", v)} placeholder="Роль" disabled={!canEdit} options={PERSON_ROLES.map(r => ({ value: r, label: r }))} />
                        </div>
                        <button type="button" onClick={() => removeTrackPerson(track.id, p.id)} className="text-muted-foreground/60 hover:text-destructive/70 transition-colors p-1 shrink-0" disabled={!canEdit}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addTrackPerson(track.id)} disabled={!canEdit} className="text-sm text-muted-foreground hover:text-[var(--brand)] transition-colors">
                      Добавить
                    </button>
                  </div>
                </Section>

                {/* Права */}
                <Section title="Права" description="Укажите доли авторского и смежного права">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Авторские права" hint="Доля авторских прав. Сумма всех долей должна составлять 100%">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-[var(--brand)]/40 focus-within:border-[var(--brand)]">
                        <span className="px-3 py-2.5 bg-muted/40 border-r border-border text-muted-foreground text-sm">©</span>
                        <input type="number" step="0.01" min="0" max="100" value={track.copyrightShare} onChange={e => updateTrack(track.id, "copyrightShare", e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-foreground focus:outline-none" disabled={!canEdit} />
                      </div>
                    </Field>
                    <Field label="Смежные права" hint="Доля смежных прав. Релиз может быть доставлен на площадки только при наличии 100%">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-[var(--brand)]/40 focus-within:border-[var(--brand)]">
                        <span className="px-3 py-2.5 bg-muted/40 border-r border-border text-muted-foreground text-sm">℗</span>
                        <input type="number" step="0.01" min="0" max="100" value={track.relatedRightsShare} onChange={e => updateTrack(track.id, "relatedRightsShare", e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-foreground focus:outline-none" disabled={!canEdit} />
                      </div>
                    </Field>
                  </div>
                </Section>

                {/* Версия трека */}
                <Section title="Версия трека" description="Укажите версию трека, данный параметр поможет площадкам верно определить категорию пользователей">
                  <div className="space-y-2">
                    {[
                      { f: "explicit" as const, l: "Explicit Content", h: "Содержит ненормативную лексику" },
                      { f: "isLive" as const, l: "Live", h: "Запись живого выступления" },
                      { f: "isCover" as const, l: "Cover", h: "Кавер на чужую песню" },
                      { f: "isRemix" as const, l: "Remix", h: "Ремикс оригинального трека" },
                      { f: "isInstrumental" as const, l: "Instrumental", h: "Трек без вокала" },
                    ].map(o => (
                      <CB key={o.f} checked={!!track[o.f]} onChange={() => updateTrack(track.id, o.f, !track[o.f])} label={o.l} hint={o.h} disabled={!canEdit} />
                    ))}
                  </div>
                </Section>

                {/* Language + preview + lyrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Язык трека">
                    <SS value={track.language} onChange={v => updateTrack(track.id, "language", v)} placeholder="Выберите язык" disabled={!canEdit} options={LANGUAGES.map(l => ({ value: l, label: l }))} />
                  </Field>
                  <Field label="Начало предпрослушивания (сек)" hint="Время начала 30-секундного превью в секундах">
                    <SI type="number" min="0" value={track.previewStart} onChange={e => updateTrack(track.id, "previewStart", e.target.value)} placeholder="0" disabled={!canEdit} />
                  </Field>
                </div>

                <Field label="Текст трека">
                  <textarea value={track.lyrics} onChange={e => updateTrack(track.id, "lyrics", e.target.value)}
                    placeholder="Введите точный текст трека..." rows={5} maxLength={10000} disabled={!canEdit}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] resize-none transition-colors disabled:bg-muted/40 disabled:text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{track.lyrics.length} / 10 000</p>
                </Field>
              </div>
            </div>
          ))}

          <button type="button" onClick={addTrack} disabled={!canEdit}
            className="w-full border-2 border-dashed border-border rounded-xl py-3.5 text-sm text-muted-foreground hover:border-[var(--brand)] hover:text-[var(--brand)] flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Добавить трек
          </button>
        </div>
      )}

      {/* ══════════════════════ TAB: ПЛОЩАДКИ ══════════════════════ */}
      {activeTab === "platforms" && (
        <div className="space-y-10">
          <Section title="Площадки" description="Выберите площадки для дистрибуции">
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["all", "selected"] as const).map(m => (
                <button key={m} type="button" onClick={() => setPlatformMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${platformMode === m ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] dark:text-[var(--brand)] dark:text-[var(--brand-hover)]" : "border-border text-muted-foreground hover:border-border"}`}>
                  {m === "all" ? "Все площадки" : "Выбранные площадки"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const active = platformMode === "all" || selectedPlatforms.includes(p);
                return (
                  <label key={p} className="flex items-center gap-2.5 p-3 border border-border rounded-lg cursor-pointer hover:border-[var(--brand)]/50 transition-colors"
                    onClick={() => { if (platformMode === "selected") setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); }}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border"}`}>
                      {active && <Check className="w-2.5 h-2.5 text-background" />}
                    </div>
                    <span className="text-sm text-foreground">{p}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <div className="border-t border-border" />

          <Section title="Территории" description="Выберите страны для дистрибуции">
            <div className="flex gap-2 flex-wrap mb-4">
              {(["all", "selected", "except"] as const).map(m => (
                <button key={m} type="button" onClick={() => setCountryMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${countryMode === m ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] dark:text-[var(--brand)] dark:text-[var(--brand-hover)]" : "border-border text-muted-foreground hover:border-border"}`}>
                  {{ all: "Все страны", selected: "Выбранные страны", except: "Все кроме выбранных" }[m]}
                </button>
              ))}
              <button type="button"
                onClick={() => { setCountryMode("selected"); setSelectedCountries(CIS_COUNTRIES); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:border-[var(--brand)]/50 hover:text-[var(--brand)] transition-colors">
                Быстрый выбор: СНГ
              </button>
            </div>
            {countryMode !== "all" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {COUNTRIES.map(c => {
                  const active = selectedCountries.includes(c.code);
                  return (
                    <label key={c.code} className="flex items-center gap-2 p-2.5 border border-border rounded-lg cursor-pointer hover:border-[var(--brand)]/50 transition-colors"
                      onClick={() => setSelectedCountries(prev => prev.includes(c.code) ? prev.filter(x => x !== c.code) : [...prev, c.code])}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border"}`}>
                        {active && <Check className="w-2.5 h-2.5 text-background" />}
                      </div>
                      <span className="text-xs text-foreground">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ══════════════════════ TAB: ПРОВЕРКА ══════════════════════ */}
      {activeTab === "check" && (
        <div className="space-y-6">
          <Section title="Проверка перед отправкой" description="Система автоматически анализирует заполненные данные и показывает список ошибок">
            {validationErrors.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-[var(--brand)]/10 border border-[var(--border)] rounded-xl text-[var(--brand)] dark:text-[var(--brand)] dark:text-[var(--brand-hover)]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Всё в порядке!</p>
                  <p className="text-xs mt-0.5">Все обязательные поля заполнены. Релиз готов к отправке.</p>
                </div>
              </div>
            ) : (
              <div className="border border-destructive/30 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border-b border-destructive/30">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-destructive">Найдено ошибок: {validationErrors.length}</span>
                </div>
                <ul className="divide-y divide-red-100">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {/* Комментарий для модератора — здесь, на вкладке Проверка */}
          <div className="border-t border-border pt-6">
            <Section title="Комментарий для модератора">
              <textarea value={artistComment} onChange={e => setArtistComment(e.target.value)}
                placeholder="Например: срочная публикация, особые требования..." rows={3} disabled={!canEdit}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40 focus:border-[var(--brand)] resize-none transition-colors disabled:bg-muted/40 disabled:text-muted-foreground" />
            </Section>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={handleSubmit} disabled={isLoading || !canEdit}
              className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Отправить на модерацию
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors">
              Отмена
            </button>
          </div>

          {/* Legal */}
          <div className="space-y-2 pt-2">
            {[{ title: "Пользовательское Соглашение", url: "https://nightvolt.ru/terms", text: "Нажимая кнопку «Отправить», вы подтверждаете акцепт условий и соглашаетесь с Пользовательским соглашением." },
              { title: "Политика DMCA Music Love", url: "https://nightvolt.ru/copyright", text: "Нажимая кнопку «Отправить», Артист подтверждает, что загружает исключительно материалы, на которые обладает всеми необходимыми правами." }
            ].map(item => (
              <div key={item.url} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-border">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <button type="button" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")} className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-[var(--brand)] transition-colors">
                    {item.title} <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-border">
        <button type="button" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); if (idx > 0) setActiveTab(TABS[idx - 1].id); }}
          disabled={activeTab === "release"}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          ← Назад
        </button>
        {activeTab !== "check" ? (
          <button type="button" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-colors">
            Далее →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isLoading || !canEdit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-colors disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Отправить на модерацию
          </button>
        )}
      </div>
    </div>
  );
}
