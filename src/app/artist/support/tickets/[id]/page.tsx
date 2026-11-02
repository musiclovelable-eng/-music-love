"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Download,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Attachment {
  id: number;
  ticketId: number;
  messageId: number | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploadedByType: string;
  createdAt: string;
}

interface Message {
  id: number;
  ticketId: number;
  senderId: number;
  senderType: string;
  senderName: string;
  message: string;
  createdAt: string;
  attachments?: Attachment[];
}

interface Ticket {
  id: number;
  artistId: number;
  subject: string;
  initialMessage: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  closedBy: string | null;
  lastResponseAt: string | null;
  lastResponseBy: string | null;
  artistName: string;
  artistEmail: string;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
        setMessages(data.messages || []);
      } else {
        toast.error("Ошибка при загрузке тикета");
        router.push("/artist/support");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Ошибка при загрузке тикета");
    } finally {
      setLoading(false);
    }
    fetchAttachments();
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    fetchAttachments();
  };

  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const getMessageAttachments = (messageId: number | null): Attachment[] => {
    return attachments.filter(a => a.messageId === messageId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} превышает 10MB`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesWithMessage = async (messageId: number | null) => {
    if (selectedFiles.length === 0) return;
    
    const token = localStorage.getItem("bearer_token");
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      if (messageId) {
        formData.append("messageId", messageId.toString());
      }
      
      try {
        const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || `Ошибка загрузки ${file.name}`);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Ошибка загрузки ${file.name}`);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) {
      toast.error("Введите сообщение или прикрепите файл");
      return;
    }

    if (ticket?.status === "Решено" || ticket?.status === "Закрыто") {
      toast.error("Нельзя отправлять сообщения в закрытый тикет");
      return;
    }

    setIsSending(true);
    setIsUploading(selectedFiles.length > 0);
    
    try {
      const token = localStorage.getItem("bearer_token");
      let messageId: number | null = null;
      
      if (newMessage.trim()) {
        const response = await fetch(`/api/tickets/${ticketId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          messageId = data.message?.id || null;
        } else {
          const data = await response.json();
          toast.error(data.error || "Ошибка при отправке сообщения");
          setIsSending(false);
          setIsUploading(false);
          return;
        }
      }

      if (selectedFiles.length > 0) {
        await uploadFilesWithMessage(messageId);
      }

      setNewMessage("");
      setSelectedFiles([]);
      fetchMessages();
      toast.success("Сообщение отправлено");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Ошибка при отправке сообщения");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleCloseTicket = async () => {
    setIsClosing(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Обращение закрыто");
        fetchTicketDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при закрытии тикета");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error("Ошибка при закрытии тикета");
    } finally {
      setIsClosing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      "В работе": { variant: "default", label: "В работе" },
      "Ожидает ответа": { variant: "secondary", label: "Ожидает ответа" },
      Решено: { variant: "outline", label: "Решено" },
      Закрыто: { variant: "outline", label: "Закрыто" },
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImageFile = (fileType: string) => fileType.startsWith("image/");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Тикет не найден</h2>
        <Button onClick={() => router.push("/artist/support")}>
          Вернуться к поддержке
        </Button>
      </div>
    );
  }

  const isClosed = ticket.status === "Решено" || ticket.status === "Закрыто";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/artist/support")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-sm text-muted-foreground">
              Тикет #{ticket.id} • Создан {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        {getStatusBadge(ticket.status)}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5" />
                  Переписка
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Нет сообщений</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const msgAttachments = getMessageAttachments(msg.id);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${
                          msg.senderType === "artist" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            msg.senderType === "artist"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                              {msg.senderName}
                            </span>
                            {msg.senderType === "admin" && (
                              <Badge variant="secondary" className="text-xs">
                                Администратор
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          {msgAttachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msgAttachments.map((attachment) => (
                                <div key={attachment.id} className={`rounded-lg overflow-hidden ${msg.senderType === "artist" ? "bg-primary-foreground/10" : "bg-background/50"}`}>
                                  {isImageFile(attachment.fileType) ? (
                                    <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                      <img
                                        src={attachment.fileUrl}
                                        alt={attachment.fileName}
                                        className="max-w-full max-h-[200px] rounded object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 ${msg.senderType === "artist" ? "hover:bg-primary-foreground/20" : "hover:bg-background"} transition-colors`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="text-sm truncate">{attachment.fileName}</span>
                                      <span className="text-xs opacity-70">({formatFileSize(attachment.fileSize)})</span>
                                      <Download className="w-4 h-4 ml-auto shrink-0" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p
                            className={`text-xs mt-2 ${
                              msg.senderType === "artist"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="border-t p-4">
                {isClosed ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Обращение закрыто. Отправка сообщений недоступна.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                          >
                            {isImageFile(file.type) ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <span className="text-muted-foreground">
                              ({formatFileSize(file.size)})
                            </span>
                            <button
                              onClick={() => removeSelectedFile(index)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Textarea
                        placeholder="Напишите ваше сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || isUploading || (!newMessage.trim() && selectedFiles.length === 0)}
                        className="shrink-0"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация о тикете</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Статус</p>
                  {getStatusBadge(ticket.status)}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Дата создания
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                  </div>
                </div>

                {ticket.lastResponseAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Последний ответ
                    </p>
                    <p className="text-sm">
                      {ticket.lastResponseBy === "admin"
                        ? "Администратор"
                        : "Вы"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ticket.lastResponseAt)}
                    </p>
                  </div>
                )}

                {ticket.closedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Дата закрытия
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">{formatDate(ticket.closedAt)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Закрыто:{" "}
                      {ticket.closedBy === "admin" ? "Администратором" : "Вами"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {!isClosed && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Действия</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Закрыть обращение
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Закрыть обращение?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          После закрытия обращения вы не сможете отправлять новые
                          сообщения. Обращение будет помечено как "Решено".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCloseTicket}
                          disabled={isClosing}
                        >
                          {isClosing ? "Закрытие..." : "Закрыть"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-blue-500">
                  Полезные советы
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Средний ответ администратора: 1-2 часа</p>
                <p>• Опишите проблему максимально подробно</p>
                <p>• Прикрепляйте скриншоты и документы для наглядности</p>
                <p>• Максимальный размер файла: 10MB</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}