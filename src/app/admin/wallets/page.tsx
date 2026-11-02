"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Search, 
  ChevronRight,
  Users,
  FileText,
  CircleAlert
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ArtistWithWallet {
  id: number;
  name: string;
  surname: string | null;
  artistName: string | null;
  email: string;
  wallet: {
    balanceRub: string;
    balanceUsd: string;
  } | null;
  reportsCount: number;
  pendingReports: number;
}

export default function AdminWalletsPage() {
  const [artists, setArtists] = useState<ArtistWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch("/api/admin/wallets");
      const data = await response.json();
      setArtists(data.artists || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string, currency: "rub" | "usd") => {
    const num = parseFloat(amount || "0");
    if (currency === "rub") {
      return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
    }
    return "$ " + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredArtists = artists.filter(artist => {
    const query = searchQuery.toLowerCase();
    return (
      artist.name.toLowerCase().includes(query) ||
      (artist.surname?.toLowerCase().includes(query)) ||
      (artist.artistName?.toLowerCase().includes(query)) ||
      artist.email.toLowerCase().includes(query)
    );
  });

  const totalBalance = artists.reduce((sum, artist) => {
    return sum + parseFloat(artist.wallet?.balanceRub || "0");
  }, 0);

  const totalPendingReports = artists.reduce((sum, artist) => sum + artist.pendingReports, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Кошельки артистов</h1>
        <p className="text-muted-foreground mt-1">Управление финансовыми данными артистов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Всего артистов</span>
          </div>
          <p className="text-3xl font-bold">{artists.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Общий баланс</span>
          </div>
          <p className="text-3xl font-bold">{formatAmount(totalBalance.toFixed(2), "rub")}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <CircleAlert className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-muted-foreground">Ожидают согласования</span>
          </div>
          <p className="text-3xl font-bold">{totalPendingReports}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, псевдониму или email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filteredArtists.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Артисты не найдены</p>
          </div>
        ) : (
          filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                href={`/admin/wallets/${artist.id}`}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {artist.artistName?.[0] || artist.name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {artist.artistName || `${artist.name} ${artist.surname || ""}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{artist.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatAmount(artist.wallet?.balanceRub || "0", "rub")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(artist.wallet?.balanceUsd || "0", "usd")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{artist.reportsCount}</span>
                    </div>
                    {artist.pendingReports > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {artist.pendingReports} ожидают
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
