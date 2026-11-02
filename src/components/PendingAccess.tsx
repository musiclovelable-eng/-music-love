'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send } from 'lucide-react';

interface PendingAccessProps {
  user: any;
  onRefresh: () => void;
}

export function PendingAccess({ user, onRefresh }: PendingAccessProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке запроса');
      }

      setSuccess(true);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (user.accessRequestMessage || success) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <Card className="w-full max-w-2xl text-center border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Заявка отправлена</CardTitle>
            <CardDescription className="text-lg mt-2">
              Ваша заявка на получение доступа уже находится на рассмотрении.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-background/50 rounded-xl border border-border/50 shadow-inner">
              <p className="text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wider">Ваше сообщение:</p>
              <div className="text-lg italic">
                "{user.accessRequestMessage || message}"
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border/50">
              <p className="text-muted-foreground">
                Мы проверим ваши данные и активируем аккаунт в ближайшее время. 
                Обычно это занимает от пары часов до суток.
              </p>
              
              <div className="flex flex-col gap-3 items-center">
                <p className="font-semibold text-primary">Хотите ускорить процесс?</p>
                <Button 
                  variant="outline" 
                  className="bg-sky-500 hover:bg-sky-600 text-white border-none transition-all hover:scale-105"
                  asChild
                >
                  <a href="https://t.me/normansa12" target="_blank" rel="noopener noreferrer">
                    <Send className="mr-2 h-4 w-4" />
                    Написать менеджеру в Telegram
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Доступ ограничен</CardTitle>
          <CardDescription>
            Ваш аккаунт подтвержден, но у вас пока нет доступа к функциям портала. 
            Напишите менеджеру, чтобы получить доступ к загрузке релизов и другим инструментам.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder="Расскажите немного о себе или вашем лейбле..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Отправить запрос менеджеру
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
