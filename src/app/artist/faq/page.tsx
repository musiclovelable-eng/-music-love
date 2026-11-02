"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, FileText } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function ArtistFAQ() {
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch("/api/faq");
        const data = await response.json();
        setFaq(data.faq || []);
      } catch (error) {
        console.error("Error fetching FAQ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQ();
  }, []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">FAQ</h1>
        <p className="text-muted-foreground">
          Ответы на часто задаваемые вопросы и решение типичных ситуаций
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Часто задаваемые вопросы
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : faq.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  FAQ пока не добавлены
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faq.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AccordionItem value={`item-${item.id}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Решение типичных ситуаций
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    Релиз отклонён или требует изменений
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>1. Откройте вкладку «Исправить» в боковом меню</p>
                    <p>2. Найдите релиз и прочитайте комментарий модератора</p>
                    <p>3. Внесите необходимые изменения согласно комментарию</p>
                    <p>4. Нажмите «Отправить на модерацию» повторно</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Совет: внимательно читайте комментарии модератора, чтобы избежать повторных правок
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Не могу загрузить обложку релиза
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Убедитесь, что изображение соответствует требованиям:</p>
                    <p>• Формат: JPG, PNG или WebP</p>
                    <p>• Размер файла: до 50 МБ</p>
                    <p>• Разрешение: от 1500×1500 до 3000×3000 пикселей</p>
                    <p>• Изображение должно быть квадратным (соотношение 1:1)</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Совет: используйте качественные изображения без водяных знаков
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Как узнать статус релиза
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Статус вашего релиза отображается в нескольких местах:</p>
                    <p>• Вкладка «Мои релизы» - все одобренные и опубликованные релизы</p>
                    <p>• Вкладка «На модерации» - релизы, ожидающие проверки</p>
                    <p>• Вкладка «Исправить» - релизы, требующие изменений</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Возможные статусы: Черновик, На модерации, Требуются изменения, Одобрено, Опубликован, Отклонён
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Функция недоступна (требуется Продвинутый план)
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Некоторые функции доступны только для артистов с Продвинутым планом:</p>
                    <p>• Загрузка текстов на площадки (Musixmatch, Genius)</p>
                    <p>• Промо от редакции Music Love</p>
                    <p>• Расширенная аналитика</p>
                    <p className="mt-2">Для изменения плана обратитесь к администратору через Email или Telegram.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Как добавить текст трека
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>1. При загрузке релиза найдите поле «Текст трека» под метаданными каждого трека</p>
                    <p>2. Введите текст трека (до 10 000 символов)</p>
                    <p>3. Текст сохранится автоматически при отправке релиза</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Для Продвинутого плана: используйте вкладку «Загрузка текста на площадки» для публикации на Musixmatch и Genius
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    Сколько времени занимает модерация
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <p>Средние сроки модерации:</p>
                    <p>• Обычные релизы: 1-3 рабочих дня</p>
                    <p>• Релизы с отметкой «Как можно скорее» (Базовый план): обрабатываются приоритетно в течение 24 часов</p>
                    <p>• Релизы Продвинутого плана: 1-2 рабочих дня</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Срочные вопросы можно уточнить через Telegram
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
