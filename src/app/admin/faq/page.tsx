"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, CheckCircle, AlertCircle, GripVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  orderIndex: number;
}

export default function AdminFAQ() {
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const response = await fetch("/api/admin/faq");
      const data = await response.json();
      setFaq(data.faq || []);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!question || !answer) {
      setMessage({ type: "error", text: "Заполните все обязательные поля" });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          orderIndex: faq.length + 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Ошибка при создании вопроса" });
        return;
      }

      setMessage({ type: "success", text: "Вопрос успешно добавлен!" });
      fetchFAQ();
      setQuestion("");
      setAnswer("");
      setTimeout(() => setIsCreateOpen(false), 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка подключения к серверу" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот вопрос?")) return;

    try {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchFAQ();
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
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
            <h1 className="text-3xl font-bold mb-2">Управление FAQ</h1>
            <p className="text-muted-foreground">
              Редактирование часто задаваемых вопросов
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Добавить вопрос
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Добавить новый вопрос</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="question">Вопрос *</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Как загрузить релиз?"
                  />
                </div>
                <div>
                  <Label htmlFor="answer">Ответ *</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Подробный ответ на вопрос..."
                    rows={6}
                  />
                </div>

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
                      Добавление...
                    </>
                  ) : (
                    "Добавить вопрос"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </CardContent>
          </Card>
        ) : faq.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Нет вопросов в FAQ
            </CardContent>
          </Card>
        ) : (
          faq.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.question}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
