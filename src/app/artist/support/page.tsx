"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MessageCircle, Clock, AlertCircle, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface SupportTicket {
  id: number;
  subject: string;
  initialMessage: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  lastResponseAt: string | null;
  lastResponseBy: string | null;
}

export default function ArtistSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message }),
      });

      if (response.ok) {
        toast.success("Тикет успешно создан");
        setIsCreateDialogOpen(false);
        setSubject("");
        setMessage("");
        fetchTickets();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при создании тикета");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Ошибка при создании тикета");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      "В работе": { variant: "default", label: "В работе" },
      "Ожидает ответа": { variant: "secondary", label: "Ожидает ответа" },
      "Решено": { variant: "outline", label: "Решено" },
      "Закрыто": { variant: "outline", label: "Закрыто" },
    };

    const config = statusConfig[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Поддержка</h1>
        <p className="text-muted-foreground">
          Свяжитесь с нами по любым вопросам
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Тикеты поддержки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Мои обращения
                </CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать тикет
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Создать обращение</DialogTitle>
                      <DialogDescription>
                        Опишите вашу проблему или вопрос. Мы ответим в ближайшее время.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Тема обращения</Label>
                        <Input
                          id="subject"
                          placeholder="Например: Проблема с загрузкой релиза"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Сообщение</Label>
                        <Textarea
                          id="message"
                          placeholder="Подробно опишите вашу проблему или вопрос..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={6}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Отмена
                      </Button>
                      <Button onClick={handleCreateTicket} disabled={isSubmitting}>
                        {isSubmitting ? "Отправка..." : "Создать тикет"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      У вас пока нет обращений
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать первое обращение
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/artist/support/tickets/${ticket.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold flex-1">{ticket.subject}</h3>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {ticket.initialMessage}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Создано: {formatDate(ticket.createdAt)}</span>
                          {ticket.lastResponseAt && (
                            <span>
                              Последний ответ: {ticket.lastResponseBy === "admin" ? "Администратор" : "Вы"}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Контактная информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Для общих вопросов и обращений
                        </p>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href="mailto:support@nightvolt.app">
                            nightvolt@internet.ru
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Telegram</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Для срочных вопросов
                        </p>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href="https://t.me/ilya_nightvolt1" target="_blank" rel="noopener noreferrer">
                            @nightvolt_support
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-2">Время работы поддержки</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Понедельник - Пятница:</span>
                          <span className="font-medium">10:00 - 18:00 МСК</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Суббота - Воскресенье:</span>
                          <span className="font-medium">Выходной</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1 text-blue-500">Сроки ответа</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Тикеты: в течение 24 часов</li>
                        <li>• Email: в течение 24 часов</li>
                        <li>• Telegram: в течение 1-2х часов (в рабочее время)</li>
                        <li>• Срочные вопросы обрабатываются приоритетно</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg">Быстрая помощь</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="default" onClick={() => setIsCreateDialogOpen(true)}>
                  <Ticket className="w-4 h-4 mr-2" />
                  Создать тикет
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href="mailto:support@nightvolt.app">
                    <Mail className="w-4 h-4 mr-2" />
                    Написать на Email
                  </a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a href="https://t.me/ilya_nightvolt1" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Написать в Telegram
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Полезная информация</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-semibold mb-1">Проверьте перед обращением:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Статус релиза в личном кабинете</li>
                    <li>• Комментарии модератора</li>
                    <li>• Раздел FAQ</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-semibold mb-1">При обращении укажите:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Ваше имя артиста</li>
                    <li>• Название релиза (если касается релиза)</li>
                    <li>• Подробное описание проблемы</li>
                    <li>• Скриншоты (при необходимости)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}