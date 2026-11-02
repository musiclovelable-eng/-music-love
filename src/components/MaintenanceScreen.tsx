"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, Loader2 } from "lucide-react";

interface MaintenanceScreenProps {
  initialReason?: string;
}

export function MaintenanceScreen({ initialReason = "" }: MaintenanceScreenProps) {
  const [reason, setReason] = useState(initialReason);

  // Poll for real-time updates (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/maintenance");
        const data = await res.json();
        setReason(data.reason || "");
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950 dark:bg-black overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ffffff]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffffff]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full mx-auto px-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto w-24 h-24 rounded-3xl bg-[#ffffff]/15 flex items-center justify-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Wrench className="w-12 h-12 text-[#ffffff]" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-center text-white mb-4"
        >
          Технический перерыв
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-neutral-400 text-lg mb-6"
        >
          Сайт временно недоступен
        </motion.p>

        {/* Reason */}
        {reason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">
              Причина
            </p>
            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
              {reason}
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2 mt-8 text-neutral-500 text-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Music Love · проводим технические работы</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
