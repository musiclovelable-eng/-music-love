'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, XCircle, Mail, User as UserIcon, Eye } from "lucide-react";

interface PendingUser {
  id: number;
  email: string;
  name: string;
  surname: string | null;
  artistName: string | null;
  emailVerified: boolean;
  isApproved: boolean;
  accessRequestMessage: string | null;
  socialNetwork: string | null;
  howDidYouHear: string | null;
  password: string;
  createdAt: string;
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<PendingUser | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/pending-users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/users/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number, name: string) => {
    if (!confirm(`Вы уверены, что хотите отклонить заявку от "${name}"? Аккаунт будет удалён.`)) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/users/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Заявки на регистрацию</h1>
        <p className="text-muted-foreground">
          Управление новыми пользователями и запросами на доступ
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Ожидают подтверждения ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет новых заявок
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Псевдоним</TableHead>
                    <TableHead>Почта</TableHead>
                    <TableHead>Соцсеть</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name}{user.surname ? ` ${user.surname}` : ""}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium text-primary">
                          <UserIcon className="w-3 h-3" />
                          {user.artistName || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.socialNetwork || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(user)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Подробнее
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(user.id)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Одобрить
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(user.id, user.name)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Отклонить
                              </>
                            )}
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

      {/* Details modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Заявка: {selected?.name}{selected?.surname ? ` ${selected.surname}` : ""}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <div className="text-muted-foreground mb-0.5">Имя</div>
                  <div className="font-medium">{selected.name}</div>
                </div>
                {selected.surname && (
                  <div>
                    <div className="text-muted-foreground mb-0.5">Фамилия</div>
                    <div className="font-medium">{selected.surname}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground mb-0.5">Почта</div>
                  <div className="font-medium break-all">{selected.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Соцсеть для связи</div>
                  <div className="font-medium">{selected.socialNetwork || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Псевдоним</div>
                  <div className="font-medium">{selected.artistName || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Дата заявки</div>
                  <div className="font-medium">
                    {new Date(selected.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-0.5">Пароль (хэшированный)</div>
                <div className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">{selected.password}</div>
              </div>

              {selected.howDidYouHear && (
                <div>
                  <div className="text-muted-foreground mb-0.5">Как узнал о нас</div>
                  <div className="font-medium">{selected.howDidYouHear}</div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(selected.id)}
                  disabled={processingId === selected.id}
                >
                  {processingId === selected.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Одобрить заявку
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selected.id, selected.name)}
                  disabled={processingId === selected.id}
                >
                  {processingId === selected.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Отклонить
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
