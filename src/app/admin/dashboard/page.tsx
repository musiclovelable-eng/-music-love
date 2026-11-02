"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Music2, Clock, CheckCircle, XCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle";

interface Stats {
  totalArtists: number;
  totalReleases: number;
  pendingReleases: number;
  approvedReleases: number;
  rejectedReleases: number;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats>({
    totalArtists: 0,
    totalReleases: 0,
    pendingReleases: 0,
    approvedReleases: 0,
    rejectedReleases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Всего артистов",
      value: stats.totalArtists,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Всего релизов",
      value: stats.totalReleases,
      icon: Music2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "На модерации",
      value: stats.pendingReleases,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Одобрено",
      value: stats.approvedReleases,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Отклонено",
      value: stats.rejectedReleases,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
        <p className="text-muted-foreground">
          Обзор системы управления Music Love
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Добро пожаловать в админ-панель Music Love</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Здесь вы можете управлять всеми аспектами платформы:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Управление артистами: создание, редактирование, блокировка</li>
              <li>Модерация релизов: проверка, одобрение, отклонение</li>
              <li>Публикация новостей для артистов</li>
              <li>Управление разделом FAQ</li>
              <li>Обработка заявок на загрузку текстов</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Maintenance toggle — super admin only */}
      {user?.isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <MaintenanceToggle />
        </motion.div>
      )}
    </div>
  );
}
