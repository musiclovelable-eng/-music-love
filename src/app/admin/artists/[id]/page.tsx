"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save, History, Music2, AlertCircle, CheckCircle, Ban, Unlock, FileSignature } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { ArtistAnalyticsManager } from "@/components/admin/ArtistAnalyticsManager";
import { ARTIST_VERIFICATION_REQUIRED } from "@/lib/verification";

interface Artist {
  id: number;
  uid: string;
  email: string;
  name: string;
  surname: string | null;
  artistName: string | null;
  bio: string | null;
  socialNetwork: string | null;
  avatarUrl: string | null;
  telegramChatId: string | null;
  contractSigned: boolean;
  plan: string;
  role: string | null;
  isBlocked: boolean;
  isDeactivated: boolean;
  deactivationReason: string | null;
  label: string;
  createdAt: string;
}

interface PasswordHistory {
  id: number;
  password: string;
  createdAt: string;
}

interface Release {
  id: number;
  title: string;
  type: string;
  status: string;
  coverUrl: string;
  createdAt: string;
}

export default function ArtistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const artistId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistory[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("basic");
  const [role, setRole] = useState<string | null>(null);
  const [label, setLabel] = useState("Music Love");
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [contractSigned, setContractSigned] = useState(false);

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  const fetchArtistData = async () => {
    try {
      const response = await fetch(`/api/admin/artists/${artistId}`);
      const data = await response.json();

      if (data.artist) {
        setArtist(data.artist);
        setName(data.artist.name);
        setEmail(data.artist.email);
        setPlan(data.artist.plan);
        setRole(data.artist.role);
        setLabel(data.artist.label);
        setIsDeactivated(data.artist.isDeactivated || false);
        setDeactivationReason(data.artist.deactivationReason || "");
        setContractSigned(data.artist.contractSigned || false);
      }

      setPasswordHistory(data.passwordHistory || []);
      setReleases(data.releases || []);
    } catch (error) {
      console.error("Error fetching artist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          plan,
          role,
          label,
          isDeactivated,
          deactivationReason: isDeactivated ? deactivationReason : null,
          contractSigned,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Ошибка при сохранении" });
        return;
      }

      setMessage({ type: "success", text: "Изменения успешно сохранены!" });
      fetchArtistData();
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка подключения к серверу" });
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `nightvolt-${randomNum}`;
  };

  const handleResetPassword = async () => {
    const password = generatePassword();

    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        alert(`Новый пароль для артиста: ${password}\n\nСкопируйте и отправьте артисту.`);
        fetchArtistData();
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Артист не найден</p>
        <Button onClick={() => router.back()} className="mt-4">
          Назад
        </Button>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Черновик", variant: "secondary" },
    on_moderation: { label: "На модерации", variant: "default" },
    approved: { label: "Одобрено", variant: "outline" },
    rejected: { label: "Отклонено", variant: "destructive" },
    requires_changes: { label: "Требуются изменения", variant: "destructive" },
  };

  const getRoleBadge = () => {
    if (role === "label") return <Badge variant="default">Лейбл</Badge>;
    if (role === "advanced") return <Badge variant="default">Продвинутый план (роль)</Badge>;
    if (role === "basic") return <Badge variant="secondary">Базовый план (роль)</Badge>;
    return <Badge variant={artist.plan === "advanced" ? "default" : "secondary"}>
      {artist.plan === "advanced" ? "Продвинутый" : "Базовый"}
    </Badge>;
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку артистов
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted ring-2 ring-border shrink-0">
              {artist.avatarUrl ? (
                <Image src={artist.avatarUrl} alt={artist.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] text-background text-3xl font-bold">
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {artist.artistName || artist.name}
                {artist.artistName && artist.artistName !== artist.name && (
                  <span className="text-base font-normal text-muted-foreground ml-2">({artist.name} {artist.surname})</span>
                )}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-muted-foreground">{artist.email}</p>
                {getRoleBadge()}
                {artist.isDeactivated ? (
                  <Badge variant="destructive">Деактивирован</Badge>
                ) : artist.isBlocked ? (
                  <Badge variant="destructive">Заблокирован</Badge>
                ) : (
                  <Badge variant="outline">Активен</Badge>
                )}
                {artist.telegramChatId && (
                  <Badge variant="outline" className="text-green-600 border-green-600/30">Telegram подключён</Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Основная информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>
                  Редактирование данных артиста
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Имя артиста *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="plan">План</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Базовый план</SelectItem>
                      <SelectItem value="advanced">Продвинутый план</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    План используется когда роль не установлена
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Роль (переопределяет план)</Label>
                  <Select value={role || "none"} onValueChange={(v) => setRole(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не установлена (использовать план)</SelectItem>
                      <SelectItem value="basic">Базовый план</SelectItem>
                      <SelectItem value="advanced">Продвинутый план</SelectItem>
                      <SelectItem value="label">Лейбл</SelectItem>
                    </SelectContent>
                  </Select>
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      <strong>Роль «Лейбл»:</strong> Даёт полный доступ ко всем функциям Продвинутого плана + возможность редактировать название своего лейбла при загрузке релизов. Введённое название автоматически сохраняется и используется для всех будущих релизов артиста.
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <Label htmlFor="label">Лейбл</Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Изменение автоматически обновится во всех релизах артиста
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Ban className="w-5 h-5 text-destructive" />
                      <div>
                        <Label htmlFor="deactivate">Деактивировать учётную запись</Label>
                        <p className="text-xs text-muted-foreground">
                          Артист не сможет войти в систему
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="deactivate"
                      checked={isDeactivated}
                      onCheckedChange={setIsDeactivated}
                    />
                  </div>

                  {isDeactivated && (
                    <div>
                      <Label htmlFor="reason">Причина деактивации *</Label>
                      <Textarea
                        id="reason"
                        value={deactivationReason}
                        onChange={(e) => setDeactivationReason(e.target.value)}
                        placeholder="Укажите причину деактивации..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                {/* Договор */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${contractSigned ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600"}`}>
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <div>
                        <Label htmlFor="contract" className="cursor-pointer">Статус договора</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {contractSigned
                            ? "Договор подписан — релизы разрешены"
                            : ARTIST_VERIFICATION_REQUIRED
                              ? "Договор не подписан — релизы заблокированы"
                              : "Договор не подписан — верификация необязательна, релизы разрешены"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${contractSigned ? "text-green-600" : "text-orange-600"}`}>
                        {contractSigned ? "Подписан" : "Не подписан"}
                      </span>
                      <Switch
                        id="contract"
                        checked={contractSigned}
                        onCheckedChange={setContractSigned}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>

            {/* Управление аналитикой */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <ArtistAnalyticsManager artistId={artistId} />
            </motion.div>

            {/* История паролей */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      История паролей
                    </CardTitle>
                    <CardDescription>
                      Все пароли, когда-либо использованные для этого аккаунта
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleResetPassword}>
                    Сбросить пароль
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passwordHistory.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    История пуста
                  </p>
                ) : (
                  <div className="space-y-3">
                    {passwordHistory.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg bg-muted flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {index === passwordHistory.length - 1 ? "Текущий пароль" : `Пароль #${passwordHistory.length - index}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Создан: {new Date(entry.createdAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        {index === passwordHistory.length - 1 && (
                          <Badge variant="outline">Активен</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Релизы артиста */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music2 className="w-5 h-5" />
                  Релизы артиста
                </CardTitle>
                <CardDescription>
                  Всего релизов: {releases.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {releases.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Нет релизов
                  </p>
                ) : (
                  <div className="space-y-4">
                    {releases.map((release) => (
                      <div
                        key={release.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={release.coverUrl}
                            alt={release.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{release.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {release.type}
                            </Badge>
                            <Badge {...(statusMap[release.status] || statusMap.draft)} className="text-xs">
                              {(statusMap[release.status] || statusMap.draft).label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(release.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/releases?id=${release.id}`)}
                        >
                          Открыть
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">UID</p>
                  <p className="font-mono font-medium">{artist.uid}</p>
                </div>
                {artist.artistName && (
                  <div>
                    <p className="text-muted-foreground">Псевдоним</p>
                    <p className="font-medium">{artist.artistName}</p>
                  </div>
                )}
                {artist.surname && (
                  <div>
                    <p className="text-muted-foreground">Фамилия</p>
                    <p className="font-medium">{artist.surname}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">
                    {new Date(artist.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Релизов</p>
                  <p className="font-medium">{releases.length}</p>
                </div>
                {artist.telegramChatId && (
                  <div>
                    <p className="text-muted-foreground">Telegram</p>
                    <p className="font-medium text-green-600">✓ Подключён (ID: {artist.telegramChatId})</p>
                  </div>
                )}
                {artist.socialNetwork && (
                  <div>
                    <p className="text-muted-foreground">Социальные сети</p>
                    {artist.socialNetwork.startsWith("http") ? (
                      <a href={artist.socialNetwork} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--brand)] hover:underline break-all text-xs">
                        {artist.socialNetwork}
                      </a>
                    ) : (
                      <p className="font-medium break-all">{artist.socialNetwork}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Биография */}
            {artist.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Биография</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{artist.bio}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {artist.isDeactivated && artist.deactivationReason && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">
                    Причина деактивации
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {artist.deactivationReason}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg">Доступные функции</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {role === "label" ? (
                  <>
                    <p className="text-muted-foreground">✓ Приоритетная модерация</p>
                    <p className="text-muted-foreground">✓ Загрузка текстов на площадки</p>
                    <p className="text-muted-foreground">✓ Промо от Music Love</p>
                    <p className="text-muted-foreground">✓ Премиум поддержка</p>
                    <p className="text-muted-foreground">✓ Редактирование названия лейбла</p>
                  </>
                ) : (role === "advanced" || (!role && plan === "advanced")) ? (
                  <>
                    <p className="text-muted-foreground">✓ Приоритетная модерация</p>
                    <p className="text-muted-foreground">✓ Загрузка текстов на площадки</p>
                    <p className="text-muted-foreground">✓ Промо от Music Love</p>
                    <p className="text-muted-foreground">✓ Премиум поддержка</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">✓ Стандартная модерация</p>
                    <p className="text-muted-foreground">✓ Опция "Как можно скорее"</p>
                    <p className="text-muted-foreground">✓ Базовая поддержка</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
