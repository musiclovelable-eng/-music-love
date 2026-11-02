"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Send } from "lucide-react";

export function PendingAccessBanner() {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10 mb-6">
      <Clock className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
        Аккаунт ожидает подтверждения
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-muted-foreground">
          Ваш аккаунт находится на модерации. Вы можете просматривать интерфейс, 
          но все функции будут доступны после одобрения администрацией.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-sky-500 hover:bg-sky-600 text-white border-none"
          ignoreReadOnly
          asChild
        >
          <a href="https://t.me/normansa12" target="_blank" rel="noopener noreferrer">
            <Send className="mr-2 h-4 w-4" />
            Ускорить проверку в Telegram
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
