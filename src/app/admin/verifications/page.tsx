"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Verification {
  id: number;
  artist_id: number;
  role: string;
  contract_type: string;
  country: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  artist_name: string;
  artist_email: string;
  artist_pseudonym: string;
  avatar_url: string | null;
}

export default function AdminVerifications() {
  const router = useRouter();
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");

  useEffect(() => { fetchList(); }, [statusFilter]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`);
      const data = await res.json();
      setItems(data.verifications || []);
    } catch {} finally { setLoading(false); }
  };

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Черновик", color: "bg-muted text-muted-foreground", icon: Clock },
    submitted: { label: "На проверке", color: "bg-blue-500/15 text-blue-600", icon: ShieldCheck },
    approved: { label: "Одобрено", color: "bg-green-500/15 text-green-600", icon: CheckCircle },
    rejected: { label: "Отклонено", color: "bg-red-500/15 text-red-600", icon: XCircle },
  };

  const roleLabel = (r: string) => r === "artist" ? "Артист" : r === "label" ? "Лейбл" : r;
  const ctLabel = (ct: string) => ({ self_employed: "Самозанятый", individual: "Физ. лицо", ip: "ИП" }[ct] || ct);
  const countryLabel = (c: string) => ({ RU: "Россия", KZ: "Казахстан", BY: "Беларусь" }[c] || c);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Верификации артистов</h1>
        <p className="text-muted-foreground">Проверка данных и управление договорами</p>
      </motion.div>

      <div className="mb-6 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="submitted">На проверке</SelectItem>
            <SelectItem value="approved">Одобренные</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></CardContent></Card>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Нет верификаций с этим статусом</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((v, i) => {
            const st = statusMap[v.status] || statusMap.draft;
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/admin/verifications/${v.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {v.avatar_url ? <img src={v.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{v.artist_name?.[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{v.artist_pseudonym || v.artist_name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            <st.icon className="w-3 h-3" /> {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{v.artist_email}</span>
                          <span>·</span>
                          <span>{roleLabel(v.role)}</span>
                          <span>·</span>
                          <span>{ctLabel(v.contract_type)}</span>
                          <span>·</span>
                          <span>{countryLabel(v.country)}</span>
                        </div>
                      </div>
                      {v.submitted_at && <span className="text-xs text-muted-foreground shrink-0">{new Date(v.submitted_at).toLocaleDateString("ru-RU")}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
