"use client";

import { Button } from "@/components/ui/button";
import { Send, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function PendingAccessOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border border-border rounded-xl shadow-2xl p-8 text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative bg-primary/10 p-4 rounded-full">
              <Clock className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Аккаунт на проверке</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ваша заявка на доступ в личный кабинет Music Love находится на рассмотрении. 
            До одобрения функции платформы ограничены.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Безопасность</p>
              <p className="text-sm">Мы проверяем каждый профиль артиста вручную для защиты сообщества.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-sm font-medium">Хотите ускорить процесс?</p>
          <Button 
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-6 text-lg"
            ignoreReadOnly
            asChild
          >
            <a href="https://t.me/normansa12" target="_blank" rel="noopener noreferrer">
              <Send className="mr-2 h-5 w-5" />
              Связаться с менеджером
            </a>
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest pt-2">
            Music Love Records &copy; 2025
          </p>
        </div>
      </motion.div>
    </div>
  );
}
