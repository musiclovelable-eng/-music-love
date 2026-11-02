"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Artist {
  id: number;
  name: string;
  email: string;
  plan: string;
  uid: string;
  isBlocked: boolean;
  isDeactivated: boolean;
  createdAt: string;
}

export default function ManagerArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    plan: "basic",
  });

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/manager/artists");
      const data = await response.json();

      if (response.ok) {
        setArtists(data.artists);
      } else {
        toast.error(data.error || "Ошибка загрузки артистов");
      }
    } catch (error) {
      toast.error("Ошибка загрузки артистов");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtist = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      const response = await fetch("/api/manager/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Артист успешно создан");
        setIsCreateDialogOpen(false);
        setFormData({ name: "", email: "", password: "", plan: "basic" });
        fetchArtists();
      } else {
        toast.error(data.error || "Ошибка создания артиста");
      }
    } catch (error) {
      toast.error("Ошибка создания артиста");
    }
  };

  const handleEditArtist = async () => {
    if (!selectedArtist) return;

    try {
      const updates: any = {};
      if (formData.name !== selectedArtist.name) updates.name = formData.name;
      if (formData.email !== selectedArtist.email) updates.email = formData.email;
      if (formData.password) updates.password = formData.password;
      if (formData.plan !== selectedArtist.plan) updates.plan = formData.plan;

      const response = await fetch(`/api/manager/artists/${selectedArtist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success("Артист успешно обновлён");
        setIsEditDialogOpen(false);
        setSelectedArtist(null);
        setFormData({ name: "", email: "", password: "", plan: "basic" });
        fetchArtists();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка обновления артиста");
      }
    } catch (error) {
      toast.error("Ошибка обновления артиста");
    }
  };

  const handleDeleteArtist = async () => {
    if (!selectedArtist) return;

    try {
      const response = await fetch(`/api/manager/artists/${selectedArtist.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Артист успешно удалён");
        setIsDeleteDialogOpen(false);
        setSelectedArtist(null);
        fetchArtists();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка удаления артиста");
      }
    } catch (error) {
      toast.error("Ошибка удаления артиста");
    }
  };

  const openEditDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    setFormData({
      name: artist.name,
      email: artist.email,
      password: "",
      plan: artist.plan,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsDeleteDialogOpen(true);
  };

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePassword = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const password = `nightvolt-${randomPart}`;
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Управление артистами</h1>
          <p className="text-muted-foreground mt-1">
            Создавайте и управляйте вашими артистами
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать артиста
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Artists List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredArtists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Артисты не найдены" : "У вас пока нет артистов"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{artist.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Mail className="w-3 h-3 inline mr-1" />
                        {artist.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">План:</span>
                      <Badge variant={artist.plan === "advanced" ? "default" : "secondary"}>
                        {artist.plan === "advanced" ? "Продвинутый" : "Базовый"}
                      </Badge>
                    </div>
                    
                    {artist.isBlocked && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Заблокирован</span>
                      </div>
                    )}
                    
                    {artist.isDeactivated && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <Shield className="w-4 h-4" />
                        <span>Деактивирован</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(artist)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(artist)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать нового артиста</DialogTitle>
            <DialogDescription>
              Заполните информацию для создания нового артиста
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите имя артиста"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="artist@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="nightvolt-XXXXX"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Генерировать
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">План</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Базовый</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateArtist}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать артиста</DialogTitle>
            <DialogDescription>
              Изменить информацию артиста
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Новый пароль (оставьте пустым, если не хотите менять)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="nightvolt-XXXXX"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Генерировать
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan">План</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Базовый</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditArtist}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить артиста</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить артиста {selectedArtist?.name}? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteArtist}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
