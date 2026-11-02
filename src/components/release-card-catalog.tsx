"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Info, 
  ListMusic, 
  Edit, 
  Link as LinkIcon,
  Trash2 
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ReleaseCardCatalogProps {
  id: number;
  coverUrl: string;
  title: string;
  mainArtist: string;
  upc: string | null;
  label: string;
  createdAt: string;
  releaseDate: string;
  startDate: string;
  territory: string;
  genre: string;
  status: string;
  onDelete?: (id: number) => void;
}

export function ReleaseCardCatalog({
  id,
  coverUrl,
  title,
  mainArtist,
  upc,
  label,
  createdAt,
  releaseDate,
  startDate,
  territory,
  genre,
  status,
  onDelete,
}: ReleaseCardCatalogProps) {
  const router = useRouter();
  const isEditable = status === "requires_changes";

  const formatDate = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Cover */}
        <div className="shrink-0">
          <div className="relative w-32 h-32 rounded overflow-hidden bg-muted">
            <Image
              src={coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Artist */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-foreground mb-0.5">
              {title}
            </h3>
            <p className="text-base text-muted-foreground">
              {mainArtist}
            </p>
          </div>

          {/* Metadata - 2 rows */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {/* Row 1 */}
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="font-medium text-foreground">UPC</span>
                <span className="ml-2">{upc || "—"}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Название лейбла</span>
                <span className="ml-2">{label}</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="font-medium text-foreground">Дата создания</span>
                <span className="ml-2">{formatDate(createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Дата релиза</span>
                <span className="ml-2">{formatDate(releaseDate)}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Дата старта</span>
                <span className="ml-2">{formatDate(startDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Территории</span>
                <span className="ml-1">{territory}</span>
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M2 10L10 2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">Площадки</span>
                <span className="ml-1">120+</span>
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M2 10L10 2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-foreground">Жанр</span>
                <span className="ml-2">{genre}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="shrink-0 flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={!isEditable}
            onClick={() => router.push(`/artist/releases/${id}?edit=tracklist`)}
            title="Редактировать треклист"
          >
            <FileText className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push(`/artist/releases/${id}`)}
            title="Просмотреть информацию о релизе"
          >
            <Info className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push(`/artist/releases/${id}?view=tracks`)}
            title="Открыть трек-лист и информацию о треках"
          >
            <ListMusic className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={!isEditable}
            onClick={() => router.push(`/artist/releases/${id}?edit=cover`)}
            title="Редактировать обложку и файлы"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push(`/artist/releases/${id}?manage=links`)}
            title="Управление ссылками на площадки"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => onDelete(id)}
              title="Удалить релиз"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
