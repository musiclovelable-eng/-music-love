"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  StickyNote,
  Plus,
  Settings,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Download,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

interface Note {
  id: number;
  ticketId: number;
  note: string;
  createdAt: string;
  createdBy: string;
  createdById: number;
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

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTicketDetails();
    fetchNotes();
    const interval = setInterval(() => {
      fetchMessages();
      fetchNotes();
    }, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
    }
  }, [ticket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
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
        router.push("/admin/tickets");
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
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTicket(data.ticket);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    fetchAttachments();
  };

  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}/attachments`, {
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

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
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
        const response = await fetch(`/api/admin/tickets/${ticketId}/attachments`, {
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
        const response = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
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

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Введите примечание");
      return;
    }

    setIsAddingNote(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        setNewNote("");
        setIsNoteDialogOpen(false);
        fetchNotes();
        toast.success("Примечание добавлено");
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при добавлении примечания");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Ошибка при добавлении примечания");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === ticket?.status) {
      toast.error("Статус не изменился");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (response.ok) {
        toast.success("Статус обновлен");
        fetchTicketDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Ошибка при обновлении статуса");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseTicket = async () => {
    setIsClosing(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ close: true }),
      });

      if (response.ok) {
        toast.success("Тикет закрыт");
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
        <Button onClick={() => router.push("/admin/tickets")}>
          Вернуться к списку
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
            onClick={() => router.push("/admin/tickets")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-sm text-muted-foreground">
              Тикет #{ticket.id} • {ticket.artistName} ({ticket.artistEmail})
            </p>
          </div>
        </div>
        {getStatusBadge(ticket.status)}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5" />
                  Переписка с артистом
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
                          msg.senderType === "admin" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            msg.senderType === "admin"
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
                                <div key={attachment.id} className={`rounded-lg overflow-hidden ${msg.senderType === "admin" ? "bg-primary-foreground/10" : "bg-background/50"}`}>
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
                                      className={`flex items-center gap-2 p-2 ${msg.senderType === "admin" ? "hover:bg-primary-foreground/20" : "hover:bg-background"} transition-colors`}
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
                              msg.senderType === "admin"
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
                      Тикет закрыт. Отправка сообщений недоступна.
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
                        placeholder="Напишите ответ артисту..."
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StickyNote className="w-5 h-5" />
                  Примечания (только для администрации)
                </CardTitle>
                <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить примечание</DialogTitle>
                      <DialogDescription>
                        Примечание будет видно только администраторам
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="note">Примечание</Label>
                        <Textarea
                          id="note"
                          placeholder="Введите примечание..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsNoteDialogOpen(false)}
                      >
                        Отмена
                      </Button>
                      <Button onClick={handleAddNote} disabled={isAddingNote}>
                        {isAddingNote ? "Добавление..." : "Добавить"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Примечаний пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3" />
                            <span className="font-semibold">{note.createdBy}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
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
                  <p className="text-sm text-muted-foreground mb-1">Артист</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{ticket.artistName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.artistEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Текущий статус</p>
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
                        : "Артист"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ticket.lastResponseAt)}
                    </p>
                    {ticket.lastResponseBy === "artist" && (
                      <Badge variant="destructive" className="mt-2">
                        Требует ответа
                      </Badge>
                    )}
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
                      {ticket.closedBy === "admin" ? "Администратором" : "Артистом"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Управление
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isClosed && (
                  <>
                    <div className="space-y-2">
                      <Label>Изменить статус</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="В работе">В работе</SelectItem>
                          <SelectItem value="Ожидает ответа">
                            Ожидает ответа
                          </SelectItem>
                          <SelectItem value="Решено">Решено</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="w-full"
                        onClick={handleUpdateStatus}
                        disabled={
                          isUpdatingStatus || selectedStatus === ticket.status
                        }
                      >
                        {isUpdatingStatus ? "Обновление..." : "Обновить статус"}
                      </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Закрыть тикет
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Закрыть тикет?</AlertDialogTitle>
                          <AlertDialogDescription>
                            После закрытия тикета ни артист, ни администратор не
                            смогут отправлять новые сообщения. Тикет будет помечен
                            как "Закрыто".
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
                  </>
                )}

                {isClosed && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Тикет закрыт</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-purple-500">
                  Работа с тикетами
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Отвечайте на тикеты в течение 1-2 часов</p>
                <p>• Используйте примечания для внутренних заметок</p>
                <p>• Меняйте статус на "Ожидает ответа" после ответа</p>
                <p>• Закрывайте решенные тикеты</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}