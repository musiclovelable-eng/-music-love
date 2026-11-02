"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, ShieldCheck, CheckCircle, XCircle, FileSignature } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

interface VerificationDetail {
  id: number;
  artist_id: number;
  role: string;
  contract_type: string;
  country: string;
  status: string;
  submitted_at: string;
  passportData: Record<string, string> | null;
  addressData: Record<string, string> | null;
  bankData: Record<string, string> | null;
  npd_confirmed: boolean;
  final_confirmed: boolean;
  admin_comment: string | null;
  artist_name: string;
  artist_email: string;
  artist_pseudonym: string;
}

const labels: Record<string, string> = {
  lastName: "Фамилия", firstName: "Имя", middleName: "Отчество", country: "Страна",
  passportSeries: "Серия паспорта", passportNumber: "Номер паспорта", issueDate: "Дата выдачи",
  departmentCode: "Код подразделения", issuedBy: "Кем выдан", iin: "ИИН", idNumber: "Номер удостоверения",
  identNumber: "Идент. номер", docNumber: "Номер документа", docType: "Тип документа", taxId: "Tax ID / ИНН",
  zip: "Индекс", city: "Город", street: "Улица", house: "Дом", apartment: "Квартира",
  address1: "Адрес 1", address2: "Адрес 2", region: "Регион",
  inn: "ИНН", account: "Расчётный счёт", bankName: "Банк", bik: "БИК", corrAccount: "Корр. счёт",
  iban: "IBAN", swift: "SWIFT", bankAddr: "Адрес банка", ogrnip: "ОГРНИП", ipReg: "Регистрация ИП",
};

export default function VerificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/verifications/${params.id}`);
        const d = await res.json();
        setData(d.verification);
        setComment(d.verification?.admin_comment || "");
      } catch {} finally { setLoading(false); }
    })();
  }, [params.id]);

  const handleAction = async (status: "approved" | "rejected") => {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/verifications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminComment: comment }),
      });
      if (!res.ok) { toast.error("Ошибка"); return; }
      toast.success(status === "approved" ? "Верификация одобрена! Договор активирован." : "Верификация отклонена");
      router.push("/admin/verifications");
    } catch { toast.error("Ошибка подключения"); }
    finally { setActing(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!data) return <div className="text-center py-12"><p>Не найдено</p><Button onClick={() => router.back()} className="mt-4">Назад</Button></div>;

  const roleLabel = data.role === "artist" ? "Артист" : "Лейбл";
  const ctLabel = ({ self_employed: "Самозанятый", individual: "Физ. лицо", ip: "ИП" } as any)[data.contract_type] || data.contract_type;
  const countryLabel = ({ RU: "Россия", KZ: "Казахстан", BY: "Беларусь" } as any)[data.country] || data.country;

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2"><ArrowLeft className="w-4 h-4" /> Назад</Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-3xl font-bold">{data.artist_pseudonym || data.artist_name}</h1>
          <Badge variant={data.status === "approved" ? "default" : data.status === "rejected" ? "destructive" : "secondary"}>
            {data.status === "approved" ? "Одобрено" : data.status === "rejected" ? "Отклонено" : "На проверке"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{data.artist_email}</p>
      </motion.div>

      {/* Role / Contract / Country */}
      <Card className="mb-4">
        <CardContent className="pt-5 pb-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FileSignature className="w-4 h-4" /> Роль и тип договора</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoBox label="Роль" value={roleLabel} />
            <InfoBox label="Тип договора" value={ctLabel} />
            <InfoBox label="Страна" value={countryLabel} />
          </div>
        </CardContent>
      </Card>

      {/* Data sections */}
      {data.passportData && <DataSection title="Паспортные данные / данные документа" data={data.passportData} />}
      {data.addressData && <DataSection title="Адрес регистрации" data={data.addressData} />}
      {data.bankData && <DataSection title="Банковские реквизиты" data={data.bankData} />}

      {/* NPD checkbox status */}
      {data.contract_type === "self_employed" && (
        <Card className="mb-4"><CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 text-sm">
            {data.npd_confirmed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
            <span>Подтверждение НПД (ФЗ-422): {data.npd_confirmed ? "Подтверждено" : "Не подтверждено"}</span>
          </div>
        </CardContent></Card>
      )}

      {/* Admin comment + actions */}
      {data.status === "submitted" && (
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <h3 className="font-semibold">Решение по верификации</h3>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий для артиста (необязательно)..." rows={3} />
            <div className="flex gap-3">
              <Button onClick={() => handleAction("approved")} disabled={acting} className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" /> Одобрить и активировать договор
              </Button>
              <Button variant="destructive" onClick={() => handleAction("rejected")} disabled={acting} className="gap-2">
                <XCircle className="w-4 h-4" /> Отклонить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {data.status === "approved" && (
        <Card className="border-green-500/30 bg-green-500/5"><CardContent className="pt-5 pb-5 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-green-600" />
          <div><p className="font-semibold text-green-700 dark:text-green-400">Верификация одобрена</p>
          <p className="text-sm text-muted-foreground">Договор активирован, артист может создавать релизы.</p></div>
        </CardContent></Card>
      )}
    </div>
  );
}

function DataSection({ title, data }: { title: string; data: Record<string, string> }) {
  const entries = Object.entries(data).filter(([, v]) => v);
  return (
    <Card className="mb-4"><CardContent className="pt-5 pb-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <span className="text-xs text-muted-foreground">{labels[k] || k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-semibold">{value}</p></div>;
}
