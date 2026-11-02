"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Loader2, BarChart3, TrendingUp, Users, PlayCircle, UserPlus, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart").then(mod => mod.AnalyticsChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
});

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isTotalMode, setIsTotalMode] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/artist/analytics");
      if (response.ok) {
        const stats = await response.json();
        setData(stats);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = useMemo(() => {
    if (data.length === 0) return { totalStreams: 0, streamsOver30s: 0, uniqueListeners: 0, subscribers: 0 };
    return data.reduce((acc: any, curr: any) => ({
      totalStreams: acc.totalStreams + Number(curr.totalStreams),
      streamsOver30s: acc.streamsOver30s + Number(curr.streamsOver30s),
      uniqueListeners: acc.uniqueListeners + Number(curr.uniqueListeners),
      subscribers: acc.subscribers + Number(curr.subscribers),
    }), { totalStreams: 0, streamsOver30s: 0, uniqueListeners: 0, subscribers: 0 });
  }, [data]);

  const latestStats = useMemo(() => {
    if (data.length === 0) return { totalStreams: 0, streamsOver30s: 0, uniqueListeners: 0, subscribers: 0 };
    return data[data.length - 1];
  }, [data]);

  const displayStats = isTotalMode ? totalStats : latestStats;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Аналитика прослушиваний
          </h1>
          <p className="text-muted-foreground">
            {isTotalMode ? "Общая статистика за всё время" : "Динамика показателей по дням"}
          </p>
        </motion.div>

        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg self-start">
          <Button
            variant={!isTotalMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsTotalMode(false)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            По дням
          </Button>
          <Button
            variant={isTotalMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsTotalMode(true)}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Общая
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isTotalMode ? "Всего стримов" : "Стримы сегодня"}
                </p>
                <h3 className="text-2xl font-bold">{(displayStats?.totalStreams || 0).toLocaleString()}</h3>
              </div>
              <PlayCircle className="w-8 h-8 text-[var(--chart-1)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isTotalMode ? "Стримы > 30с" : "Стримы > 30с (24ч)"}
                </p>
                <h3 className="text-2xl font-bold">{(displayStats?.streamsOver30s || 0).toLocaleString()}</h3>
              </div>
              <PlayCircle className="w-8 h-8 text-[var(--chart-2)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isTotalMode ? "Все слушатели" : "Слушатели сегодня"}
                </p>
                <h3 className="text-2xl font-bold">{(displayStats?.uniqueListeners || 0).toLocaleString()}</h3>
              </div>
              <Users className="w-8 h-8 text-[var(--chart-3)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isTotalMode ? "Всего подписчиков" : "Новые подписчики"}
                </p>
                <h3 className="text-2xl font-bold">{(displayStats?.subscribers || 0).toLocaleString()}</h3>
              </div>
              <UserPlus className="w-8 h-8 text-[var(--chart-4)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Линейная аналитика
                </CardTitle>
                <CardDescription>
                  Детальный график показателей по дням
                </CardDescription>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg border border-border/50 max-w-md">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-[var(--chart-1)] uppercase mr-1">Примечание:</span>
                  Линия «Все прослушивания» показывает общее количество запусков трека. 
                  Она не суммируется с остальными показателями и приведена для общей справки за весь период.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BarChart3 className="w-12 h-12 text-muted mb-4" />
                <p className="text-muted-foreground max-w-xs">
                  Статистика по вашим релизам еще не сформирована. Данные появятся здесь сразу после обработки первых прослушиваний.
                </p>
              </div>
            ) : (
              <AnalyticsChart data={data} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
