"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Shield,
  UserCog,
  Snowflake,
  Sun,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser, hasPermission } from "@/hooks/useUser";

interface AdminPermissions {
  canAccessDashboard: boolean;
  canAccessArtists: boolean;
  canAccessReleases: boolean;
  canAccessWallets: boolean;
  canAccessNews: boolean;
  canAccessFaq: boolean;
  canAccessTickets: boolean;
  canAccessPendingUsers: boolean;
  canAccessLyrics: boolean;
  canAccessStaff: boolean;
  canEditReleases: boolean;
  canDeleteReleases: boolean;
  canDownloadFiles: boolean;
  canApproveReleases: boolean;
  canEditArtists: boolean;
  canDeleteArtists: boolean;
  canManagePayouts: boolean;
  canManageUsers: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canAccessDashboard: true,
  canAccessArtists: true,
  canAccessReleases: true,
  canAccessWallets: false,
  canAccessNews: true,
  canAccessFaq: true,
  canAccessTickets: true,
  canAccessPendingUsers: true,
  canAccessLyrics: true,
  canAccessStaff: false,
  canEditReleases: true,
  canDeleteReleases: false,
  canDownloadFiles: true,
  canApproveReleases: true,
  canEditArtists: true,
  canDeleteArtists: false,
  canManagePayouts: false,
  canManageUsers: true,
};

interface AdminMember {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isManager: boolean;
  isFrozen: boolean;
  createdAt: string;
  permissions: AdminPermissions | null;
  isSuperAdmin: boolean;
}

const SECTION_PERMISSIONS: Array<{
  key: keyof AdminPermissions;
  label: string;
  description: string;
  group: "sections" | "actions";
}> = [
  // Sections
  { key: "canAccessDashboard", label: "Дашборд", description: "Доступ к главной панели", group: "sections" },
  { key: "canAccessArtists", label: "Артисты", description: "Раздел управления артистами", group: "sections" },
  { key: "canAccessReleases", label: "Релизы", description: "Раздел управления релизами", group: "sections" },
  { key: "canAccessWallets", label: "Кошельки", description: "Финансовый раздел", group: "sections" },
  { key: "canAccessNews", label: "Новости", description: "Раздел новостей", group: "sections" },
  { key: "canAccessFaq", label: "FAQ", description: "Раздел часто задаваемых вопросов", group: "sections" },
  { key: "canAccessTickets", label: "Тикеты", description: "Раздел поддержки", group: "sections" },
  { key: "canAccessPendingUsers", label: "Заявки на регистрацию", description: "Просмотр и одобрение заявок", group: "sections" },
  { key: "canAccessLyrics", label: "Заявки на тексты", description: "Управление заявками на загрузку текстов", group: "sections" },
  { key: "canAccessStaff", label: "Администрация", description: "Управление другими администраторами", group: "sections" },
  // Actions
  { key: "canEditReleases", label: "Редактирование релизов", description: "Изменение метаданных и статусов релизов", group: "actions" },
  { key: "canDeleteReleases", label: "Удаление релизов", description: "Полное удаление релизов из системы", group: "actions" },
  { key: "canDownloadFiles", label: "Скачивание файлов", description: "Скачивание треков, обложек и материалов", group: "actions" },
  { key: "canApproveReleases", label: "Одобрение релизов", description: "Изменение статуса релизов (одобрение/отклонение)", group: "actions" },
  { key: "canEditArtists", label: "Редактирование артистов", description: "Изменение данных профилей артистов", group: "actions" },
  { key: "canDeleteArtists", label: "Удаление артистов", description: "Удаление аккаунтов артистов", group: "actions" },
  { key: "canManagePayouts", label: "Управление выплатами", description: "Подтверждение и обработка выплат", group: "actions" },
  { key: "canManageUsers", label: "Управление пользователями", description: "Блокировка, разблокировка и заморозка", group: "actions" },
];

export default function AdminStaffPage() {
  const { user } = useUser();
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedPerms, setExpandedPerms] = useState<"sections" | "actions" | null>("sections");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: { ...DEFAULT_PERMISSIONS },
  });

  const [editPerms, setEditPerms] = useState<AdminPermissions>({ ...DEFAULT_PERMISSIONS });

  const isSuperAdmin = user?.isSuperAdmin === true;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/admins");
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      } else {
        toast.error(data.error || "Ошибка загрузки администраторов");
      }
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Заполните все обязательные поля");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Администратор успешно создан");
        setIsCreateDialogOpen(false);
        setFormData({ name: "", email: "", password: "", permissions: { ...DEFAULT_PERMISSIONS } });
        fetchAdmins();
      } else {
        toast.error(data.error || "Ошибка создания");
      }
    } catch {
      toast.error("Ошибка создания администратора");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFreeze = async (admin: AdminMember) => {
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFrozen: !admin.isFrozen }),
      });
      if (response.ok) {
        toast.success(admin.isFrozen ? "Администратор разморожен" : "Администратор заморожен");
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка обновления");
      }
    } catch {
      toast.error("Ошибка обновления статуса");
    }
  };

  const openEditDialog = (admin: AdminMember) => {
    setSelectedAdmin(admin);
    setEditPerms(admin.permissions ? { ...admin.permissions } : { ...DEFAULT_PERMISSIONS });
    setIsEditDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPerms }),
      });
      if (response.ok) {
        toast.success("Права доступа обновлены");
        setIsEditDialogOpen(false);
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка обновления прав");
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, { method: "DELETE" });
      const data = await response.json();
      if (response.ok) {
        toast.success("Администратор удалён");
        setIsDeleteDialogOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const generatePassword = () => {
    const part = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, password: `nightvolt-${part}` });
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sectionPerms = SECTION_PERMISSIONS.filter((p) => p.group === "sections");
  const actionPerms = SECTION_PERMISSIONS.filter((p) => p.group === "actions");

  const PermissionsList = ({
    permissions,
    onChange,
  }: {
    permissions: AdminPermissions;
    onChange: (key: keyof AdminPermissions, value: boolean) => void;
  }) => (
    <div className="space-y-4">
      {/* Sections group */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left font-semibold text-sm mb-2"
          onClick={() => setExpandedPerms(expandedPerms === "sections" ? null : "sections")}
        >
          {expandedPerms === "sections" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Доступ к разделам
        </button>
        <AnimatePresence>
          {expandedPerms === "sections" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pl-2">
                {sectionPerms.map((perm) => (
                  <div key={perm.key} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                    <Switch
                      checked={!!permissions[perm.key]}
                      onCheckedChange={(v) => onChange(perm.key, v)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator />

      {/* Actions group */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left font-semibold text-sm mb-2"
          onClick={() => setExpandedPerms(expandedPerms === "actions" ? null : "actions")}
        >
          {expandedPerms === "actions" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Права на действия
        </button>
        <AnimatePresence>
          {expandedPerms === "actions" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pl-2">
                {actionPerms.map((perm) => (
                  <div key={perm.key} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                    <Switch
                      checked={!!permissions[perm.key]}
                      onCheckedChange={(v) => onChange(perm.key, v)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Администрация</h1>
          <p className="text-muted-foreground mt-1">
            Управление администраторами системы и их правами доступа
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Создать администратора
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего администраторов</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Супер-администраторов</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.isSuperAdmin).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Замороженных</CardTitle>
            <Snowflake className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.isFrozen).length}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени или email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Администраторы ({filteredAdmins.length})</CardTitle>
          <CardDescription>Список всех администраторов системы</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "Администраторы не найдены" : "Нет администраторов"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    {isSuperAdmin && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} className={admin.isFrozen ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        {admin.isSuperAdmin ? (
                          <Badge className="bg-purple-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Супер-Администратор
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-600">
                            <UserCog className="w-3 h-3 mr-1" />
                            Администратор
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.isFrozen ? (
                          <Badge variant="destructive">
                            <Snowflake className="w-3 h-3 mr-1" />
                            Заморожен
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600">
                            <Sun className="w-3 h-3 mr-1" />
                            Активен
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(admin.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!admin.isSuperAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(admin)}
                                  title="Настроить права доступа"
                                >
                                  <Settings className="w-3 h-3 mr-1" />
                                  Права
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleFreeze(admin)}
                                  title={admin.isFrozen ? "Разморозить" : "Заморозить"}
                                >
                                  {admin.isFrozen ? (
                                    <><Sun className="w-3 h-3 mr-1" />Разморозить</>
                                  ) : (
                                    <><Snowflake className="w-3 h-3 mr-1" />Заморозить</>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => { setSelectedAdmin(admin); setIsDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать нового администратора</DialogTitle>
            <DialogDescription>
              Заполните данные и настройте права доступа для нового администратора
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Основные данные</h3>
              <div className="space-y-2">
                <Label>Имя *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Введите имя"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@nightvolt.ru"
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
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
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Права доступа</h3>
              <PermissionsList
                permissions={formData.permissions}
                onChange={(key, value) =>
                  setFormData({ ...formData, permissions: { ...formData.permissions, [key]: value } })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Права доступа: {selectedAdmin?.name}</DialogTitle>
            <DialogDescription>
              Настройте права доступа для администратора. Изменения применяются немедленно.
            </DialogDescription>
          </DialogHeader>
          <PermissionsList
            permissions={editPerms}
            onChange={(key, value) => setEditPerms({ ...editPerms, [key]: value })}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить права
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить администратора</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Аккаунт будет удалён навсегда.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Администратор <strong>{selectedAdmin?.name}</strong> будет удалён из системы.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Все права доступа будут аннулированы, сессия завершена.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
