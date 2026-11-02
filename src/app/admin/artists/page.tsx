"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Lock, Unlock, Trash2, Key, Loader2, CheckCircle, AlertCircle, Eye, Ban } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface Artist {
  id: number;
  uid: string;
  email: string;
  name: string;
  plan: string;
  isBlocked: boolean;
  isDeactivated: boolean;
  deactivationReason: string | null;
  label: string;
  createdAt: string;
  isOnline: boolean;
  lastActiveAt: string | null;
}

export default function AdminArtists() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("basic");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchArtists();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchArtists, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch("/api/admin/artists");
      const data = await response.json();
      setArtists(data.artists || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `nightvolt-${randomNum}`;
  };

  const handleCreate = async () => {
    if (!email || !name) {
      setMessage({ type: "error", text: "Заполните все поля" });
      return;
    }

    setIsCreating(true);
    const password = generatePassword();

    try {
      const response = await fetch("/api/admin/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, plan, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Ошибка при создании артиста" });
        return;
      }

      setGeneratedPassword(password);
      setMessage({ type: "success", text: "Артист успешно создан!" });
      fetchArtists();
      setEmail("");
      setName("");
      setPlan("basic");
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка подключения к серверу" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleBlock = async (id: number, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });

      if (response.ok) {
        fetchArtists();
      }
    } catch (error) {
      console.error("Error toggling block:", error);
    }
  };

  const handleResetPassword = async (id: number) => {
    const password = generatePassword();
    
    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        alert(`Новый пароль для артиста: ${password}\n\nСкопируйте и отправьте артисту.`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleChangePlan = async (id: number, newPlan: string) => {
    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        fetchArtists();
      }
    } catch (error) {
      console.error("Error changing plan:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить артиста "${name}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchArtists();
      }
    } catch (error) {
      console.error("Error deleting artist:", error);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Управление артистами</h1>
            <p className="text-muted-foreground">
              Создание, редактирование и управление артистами
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать артиста
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать нового артиста</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@nightvolt.app"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Имя артиста *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="DJ Voltage"
                  />
                </div>
                <div>
                  <Label htmlFor="plan">План</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Базовый</SelectItem>
                      <SelectItem value="advanced">Продвинутый</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generatedPassword && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-1">Пароль для входа:</p>
                      <p className="font-mono text-lg">{generatedPassword}</p>
                      <p className="text-xs mt-2">Скопируйте и отправьте артисту</p>
                    </AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    {message.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать артиста"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Все артисты ({artists.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </div>
            ) : artists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет артистов
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Лейбл</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Статус активности</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artists.map((artist) => (
                      <TableRow key={artist.id}>
                        <TableCell className="font-mono text-xs">
                          {artist.uid}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                artist.isOnline ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              title={artist.isOnline ? 'Online' : 'Offline'}
                            />
                            <span className="font-medium">{artist.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {artist.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {artist.label}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={artist.plan}
                            onValueChange={(value) => handleChangePlan(artist.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Базовый</SelectItem>
                              <SelectItem value="advanced">Продвинутый</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={artist.isOnline ? "default" : "secondary"}
                            className={artist.isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                          >
                            {artist.isOnline ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {artist.isDeactivated ? (
                            <Badge variant="destructive">Деактивирован</Badge>
                          ) : artist.isBlocked ? (
                            <Badge variant="destructive">Заблокирован</Badge>
                          ) : (
                            <Badge variant="outline">Активен</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(artist.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/artists/${artist.id}`)}
                              title="Просмотр полной информации"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetPassword(artist.id)}
                              title="Сбросить пароль"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleBlock(artist.id, artist.isBlocked)}
                              title={artist.isBlocked ? "Разблокировать" : "Заблокировать"}
                            >
                              {artist.isBlocked ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(artist.id, artist.name)}
                              title="Удалить артиста"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}