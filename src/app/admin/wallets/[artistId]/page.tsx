"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Wallet,
  Plus,
  Edit2,
  Trash2,
    Download,
    Upload,
    CheckCircle,
    Clock,
    X,
  Save,
  FileText,
  Music,
  DollarSign,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Artist {
  id: number;
  name: string;
  surname: string | null;
  artistName: string | null;
  email: string;
}

interface WalletData {
  id: number;
  artistId: number;
  balanceRub: string;
  balanceUsd: string;
}

interface Report {
  id: number;
  artistId: number;
  title: string;
  periodStart: string;
  periodEnd: string;
  quarter: number | null;
  year: number;
  amountRub: string;
  amountUsd: string;
  status: string;
  fileUrl: string | null;
  fileName: string | null;
  details: string | null;
  isRoyalty: boolean | null;
  agreedAt: string | null;
  createdAt: string;
}

interface PaymentDetails {
  id: number;
  artistId: number;
  fullName: string;
  cardNumber: string;
  bankName: string;
  kbe: string | null;
  updatedAt: string;
}

export default function AdminArtistWalletPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.artistId as string;
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddReport, setShowAddReport] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportForm, setReportForm] = useState({
    title: "",
    periodStart: "",
    periodEnd: "",
    quarter: "",
    year: new Date().getFullYear().toString(),
    amountRub: "",
    amountUsd: "",
    status: "pending",
    details: "",
    fileUrl: "",
    fileName: "",
    isRoyalty: true,
  });

  const [balanceForm, setBalanceForm] = useState({
    balanceRub: "",
    balanceUsd: "",
  });

  useEffect(() => {
    fetchData();
  }, [artistId]);

  useEffect(() => {
    if (wallet) {
      setBalanceForm({
        balanceRub: wallet.balanceRub,
        balanceUsd: wallet.balanceUsd,
      });
    }
  }, [wallet]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/wallets/${artistId}`);
      const data = await response.json();
      setArtist(data.artist);
      setWallet(data.wallet);
      setReports(data.reports || []);
      setPaymentDetails(data.paymentDetails || null);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/wallets/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balanceRub: balanceForm.balanceRub || "0",
          balanceUsd: balanceForm.balanceUsd || "0",
        }),
      });

      if (response.ok) {
        toast.success("Баланс обновлён");
        setShowEditBalance(false);
        fetchData();
      } else {
        toast.error("Ошибка при обновлении баланса");
      }
    } catch (error) {
      toast.error("Ошибка при обновлении баланса");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/wallets/${artistId}/reports/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка загрузки файла");

      setReportForm(prev => ({
        ...prev,
        fileUrl: data.url,
        fileName: file.name,
      }));
      toast.success("Файл загружен");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  };

  const handleAddReport = async () => {
    if (!reportForm.title || !reportForm.periodStart || !reportForm.periodEnd || !reportForm.year) {
      toast.error("Заполните обязательные поля");
      return;
    }

    if (!reportForm.fileUrl || !reportForm.fileName) {
      toast.error("Необходимо прикрепить документ");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/wallets/${artistId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportForm,
          quarter: (reportForm.quarter && reportForm.quarter !== "none") ? parseInt(reportForm.quarter) : null,
          year: parseInt(reportForm.year),
          isRoyalty: reportForm.isRoyalty,
        }),
      });

      if (response.ok) {
        toast.success("Отчёт добавлен");
        setShowAddReport(false);
        resetForm();
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при добавлении отчёта");
      }
    } catch (error) {
      toast.error("Ошибка при добавлении отчёта");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport) return;

    if (!reportForm.fileUrl || !reportForm.fileName) {
      toast.error("Необходимо прикрепить документ");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/wallets/${artistId}/reports/${editingReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportForm,
          quarter: (reportForm.quarter && reportForm.quarter !== "none") ? parseInt(reportForm.quarter) : null,
          year: parseInt(reportForm.year),
          isRoyalty: reportForm.isRoyalty,
        }),
      });

      if (response.ok) {
        toast.success("Отчёт обновлён");
        setEditingReport(null);
        resetForm();
        fetchData();
      } else {
        toast.error("Ошибка при обновлении отчёта");
      }
    } catch (error) {
      toast.error("Ошибка при обновлении отчёта");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm("Удалить этот отчёт? Баланс артиста будет пересчитан.")) return;

    try {
      const response = await fetch(`/api/admin/wallets/${artistId}/reports/${reportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Отчёт удалён");
        fetchData();
      } else {
        toast.error("Ошибка при удалении отчёта");
      }
    } catch (error) {
      toast.error("Ошибка при удалении отчёта");
    }
  };

  const resetForm = () => {
    setReportForm({
      title: "",
      periodStart: "",
      periodEnd: "",
      quarter: "none",
      year: new Date().getFullYear().toString(),
      amountRub: "",
      amountUsd: "",
      status: "pending",
      details: "",
      fileUrl: "",
      fileName: "",
      isRoyalty: true,
    });
  };

  const startEdit = (report: Report) => {
    setEditingReport(report);
    setReportForm({
      title: report.title,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      quarter: report.quarter?.toString() || "none",
      year: report.year.toString(),
      amountRub: report.amountRub,
      amountUsd: report.amountUsd,
      status: report.status,
      details: report.details || "",
      fileUrl: report.fileUrl || "",
      fileName: report.fileName || "",
      isRoyalty: report.isRoyalty !== false,
    });
  };

  const formatAmount = (amount: string, currency: "rub" | "usd") => {
    const num = parseFloat(amount || "0");
    if (currency === "rub") {
      return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
    }
    return "$ " + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Артист не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {artist.artistName || `${artist.name} ${artist.surname || ""}`}
          </h1>
          <p className="text-muted-foreground">{artist.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">Баланс кошелька</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditBalance(true)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Редактировать баланс"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              {formatAmount(wallet?.balanceRub || "0", "rub")}
            </p>
            <p className="text-lg text-muted-foreground">
              {formatAmount(wallet?.balanceUsd || "0", "usd")}
            </p>
          </div>
        </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">Отчёты</h2>
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-4">
              <p className="text-3xl font-bold">{reports.length}</p>
              <p className="text-muted-foreground">
                {reports.filter(r => r.status === "pending").length} ожидают согласования
              </p>
            </div>
          </div>
        </div>

        {paymentDetails && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">Реквизиты для выплаты</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ФИО</p>
                <p className="font-medium">{paymentDetails.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Номер карты</p>
                <p className="font-medium font-mono">{paymentDetails.cardNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Банк</p>
                <p className="font-medium">{paymentDetails.bankName}</p>
              </div>
              {paymentDetails.kbe && (
                <div>
                  <p className="text-xs text-muted-foreground">КБЕ</p>
                  <p className="font-medium">{paymentDetails.kbe}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Обновлено: {new Date(paymentDetails.updatedAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Финансовые отчёты</h2>
        <Button onClick={() => setShowAddReport(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить начисление
        </Button>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Отчётов пока нет</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{report.title}</h3>
                    {report.isRoyalty !== false ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Music className="w-3 h-3" />
                        Роялти
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <DollarSign className="w-3 h-3" />
                        Начисление
                      </span>
                    )}
                    {report.status === "agreed" ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Согласован
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        Ожидает
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Период: {report.periodStart} - {report.periodEnd}</span>
                    {report.quarter && <span>Q{report.quarter} {report.year}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatAmount(report.amountRub, "rub")}</p>
                    <p className="text-xs text-muted-foreground">{formatAmount(report.amountUsd, "usd")}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {report.fileUrl && (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => startEdit(report)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {report.details && (
                <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                  {report.details}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showEditBalance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditBalance(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Редактировать баланс</h3>
                <button
                  onClick={() => setShowEditBalance(false)}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Баланс в рублях (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={balanceForm.balanceRub}
                    onChange={(e) => setBalanceForm(prev => ({ ...prev, balanceRub: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Баланс в долларах ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={balanceForm.balanceUsd}
                    onChange={(e) => setBalanceForm(prev => ({ ...prev, balanceUsd: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Внимание: При прямом редактировании баланса он не будет автоматически пересчитываться при добавлении/удалении отчётов.
                </p>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEditBalance(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpdateBalance}
                    disabled={saving}
                  >
                    {saving ? "Сохранение..." : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showAddReport || editingReport) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddReport(false);
              setEditingReport(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingReport ? "Редактировать начисление" : "Добавить начисление"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddReport(false);
                    setEditingReport(null);
                    resetForm();
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Название *</Label>
                  <Input
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Отчёт_2024.01-2024.03"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Начало периода *</Label>
                    <Input
                      value={reportForm.periodStart}
                      onChange={(e) => setReportForm(prev => ({ ...prev, periodStart: e.target.value }))}
                      placeholder="2024.01"
                    />
                  </div>
                  <div>
                    <Label>Конец периода *</Label>
                    <Input
                      value={reportForm.periodEnd}
                      onChange={(e) => setReportForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                      placeholder="2024.03"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Квартал</Label>
                      <Select
                        value={reportForm.quarter}
                        onValueChange={(value) => setReportForm(prev => ({ ...prev, quarter: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Не указан" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не указан</SelectItem>
                          <SelectItem value="1">1 квартал</SelectItem>
                          <SelectItem value="2">2 квартал</SelectItem>
                          <SelectItem value="3">3 квартал</SelectItem>
                          <SelectItem value="4">4 квартал</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Год *</Label>
                      <Input
                        type="number"
                        value={reportForm.year}
                        onChange={(e) => setReportForm(prev => ({ ...prev, year: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Сумма (₽)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={reportForm.amountRub}
                        onChange={(e) => setReportForm(prev => ({ ...prev, amountRub: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Сумма ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={reportForm.amountUsd}
                        onChange={(e) => setReportForm(prev => ({ ...prev, amountUsd: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Статус</Label>
                    <Select
                      value={reportForm.status}
                      onValueChange={(value) => setReportForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Ожидает согласования</SelectItem>
                        <SelectItem value="agreed">Согласован</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isRoyalty"
                    checked={!reportForm.isRoyalty}
                    onChange={(e) => setReportForm(prev => ({ ...prev, isRoyalty: !e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isRoyalty" className="text-sm cursor-pointer">
                    <span className="font-medium">Не роялти</span>
                    <span className="text-muted-foreground ml-1">(обычное начисление, не от музыки)</span>
                  </label>
                </div>

                <div>
                  <Label>Детали</Label>
                  <Textarea
                    value={reportForm.details}
                    onChange={(e) => setReportForm(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Дополнительная информация..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Документ * <span className="text-red-500">(обязательно)</span></Label>
                  <div className="mt-2">
                    {reportForm.fileUrl ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm flex-1 truncate">{reportForm.fileName}</span>
                        <button
                          onClick={() => setReportForm(prev => ({ ...prev, fileUrl: "", fileName: "" }))}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full p-4 border-2 border-dashed border-red-300 dark:border-red-800 rounded-lg hover:border-primary/50 transition-colors text-center bg-red-50/50 dark:bg-red-900/10"
                      >
                        {uploading ? (
                          <span className="text-sm text-muted-foreground">Загрузка...</span>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mx-auto mb-2 text-red-400" />
                            <span className="text-sm text-red-500">Нажмите для загрузки документа</span>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddReport(false);
                      setEditingReport(null);
                      resetForm();
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={editingReport ? handleUpdateReport : handleAddReport}
                    disabled={saving || !reportForm.fileUrl}
                  >
                    {saving ? "Сохранение..." : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingReport ? "Сохранить" : "Добавить"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
