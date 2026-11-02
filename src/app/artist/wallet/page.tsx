"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Calendar,
  Info,
  CheckCircle2,
  Clock,
  FileText,
  X,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
}

interface GroupedReports {
  [key: string]: {
    quarter: number;
    year: number;
    reports: Report[];
    totalRub: number;
    totalUsd: number;
  };
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [showHowToGet, setShowHowToGet] = useState(false);
  const [showOperationsInfo, setShowOperationsInfo] = useState(false);
  const [agreeingId, setAgreeingId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    fullName: "",
    cardNumber: "",
    bankName: "",
    kbe: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchPaymentDetails();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet");
      const data = await response.json();
      setWallet(data.wallet);
      setReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error("Ошибка загрузки данных кошелька");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch("/api/wallet/payment-details");
      const data = await response.json();
      if (data.paymentDetails) {
        setPaymentDetails(data.paymentDetails);
        setPaymentForm({
          fullName: data.paymentDetails.fullName || "",
          cardNumber: data.paymentDetails.cardNumber || "",
          bankName: data.paymentDetails.bankName || "",
          kbe: data.paymentDetails.kbe || "",
        });
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }
  };

  const openPaymentModal = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowPaymentModal(true);
  };

  const handleAgreeWithPayment = async () => {
    if (!selectedReportId) return;
    
    if (!paymentForm.fullName || !paymentForm.cardNumber || !paymentForm.bankName) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`/api/wallet/reports/${selectedReportId}/agree`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });

      if (response.ok) {
        toast.success("Отчёт согласован");
        setShowPaymentModal(false);
        setSelectedReportId(null);
        fetchWalletData();
        fetchPaymentDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ошибка при согласовании отчёта");
      }
    } catch (error) {
      toast.error("Ошибка при согласовании отчёта");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAgree = async (reportId: number) => {
    openPaymentModal(reportId);
  };

  const toggleReport = (reportId: number) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const formatAmount = (amount: string, currency: "rub" | "usd") => {
    const num = parseFloat(amount);
    if (currency === "rub") {
      return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
    }
    return "$ " + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getQuarterLabel = (quarter: number, year: number) => {
    return `${quarter}-й квартал ${year}`;
  };

  const groupReportsByQuarter = (): GroupedReports => {
    const grouped: GroupedReports = {};
    
    reports.forEach(report => {
      const key = `${report.year}-Q${report.quarter || 0}`;
      if (!grouped[key]) {
        grouped[key] = {
          quarter: report.quarter || 0,
          year: report.year,
          reports: [],
          totalRub: 0,
          totalUsd: 0,
        };
      }
      grouped[key].reports.push(report);
      grouped[key].totalRub += parseFloat(report.amountRub);
      grouped[key].totalUsd += parseFloat(report.amountUsd);
    });

    return grouped;
  };

  const getAvailablePeriods = () => {
    const periods = new Set<string>();
    reports.forEach(report => {
      const year = report.year;
      periods.add(`${year}`);
    });
    return Array.from(periods).sort().reverse();
  };

  const filteredGroupedReports = () => {
    const grouped = groupReportsByQuarter();
    if (selectedPeriod === "all") return grouped;
    
    const filtered: GroupedReports = {};
    Object.entries(grouped).forEach(([key, value]) => {
      if (value.year.toString() === selectedPeriod) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedReports = filteredGroupedReports();
  const availablePeriods = getAvailablePeriods();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Финансы и отчёты</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Доступная сумма</h2>
          <div className="space-y-1">
            <p className="text-4xl font-bold tracking-tight">
              {wallet ? formatAmount(wallet.balanceRub, "rub") : "0.00 ₽"}
            </p>
            <p className="text-lg text-muted-foreground">
              {wallet ? formatAmount(wallet.balanceUsd, "usd") : "$ 0.00"}
            </p>
          </div>
          <button
            onClick={() => setShowHowToGet(true)}
            className="mt-4 text-sm text-[var(--brand)] hover:underline cursor-pointer"
          >
            Как получить
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">История операций</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            В этом разделе вы можете увидеть все операции по перечислению средств, а также их статусы.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowOperationsInfo(true)}
          >
            Подробнее
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4" />
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все периоды</SelectItem>
            {availablePeriods.map(period => (
              <SelectItem key={period} value={period}>{period}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedReports).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Отчётов пока нет</p>
          </div>
        ) : (
          Object.entries(groupedReports)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, group]) => (
              <div key={key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {group.quarter ? getQuarterLabel(group.quarter, group.year) : group.year}
                  </h3>
                  <div className="text-right">
                    <p className="font-semibold">Итого: {formatAmount(group.totalRub.toFixed(2), "rub")}</p>
                    <p className="text-sm text-muted-foreground">{formatAmount(group.totalUsd.toFixed(2), "usd")}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.reports.map(report => (
                    <div key={report.id} className="border border-border rounded-lg bg-card overflow-hidden">
                      <button
                        onClick={() => toggleReport(report.id)}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: expandedReports.has(report.id) ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                          <span className="font-medium">{report.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{formatAmount(report.amountRub, "rub")}</span>
                          {report.status === "agreed" ? (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Согласован
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAgree(report.id);
                              }}
                              disabled={agreeingId === report.id}
                            >
                              {agreeingId === report.id ? "..." : "Согласовать"}
                            </Button>
                          )}
                          {report.fileUrl && (
                            <a
                              href={report.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-muted transition-colors text-[var(--brand)]"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedReports.has(report.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Период</p>
                                  <p className="font-medium">{report.periodStart} - {report.periodEnd}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Сумма</p>
                                  <p className="font-medium">{formatAmount(report.amountRub, "rub")} / {formatAmount(report.amountUsd, "usd")}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Статус</p>
                                  <div className="flex items-center gap-2">
                                    {report.status === "agreed" ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-green-600 dark:text-green-400 font-medium">Согласован</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">Ожидает согласования</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {report.agreedAt && (
                                  <div>
                                    <p className="text-muted-foreground">Дата согласования</p>
                                    <p className="font-medium">{new Date(report.agreedAt).toLocaleDateString("ru-RU")}</p>
                                  </div>
                                )}
                              </div>
                              {report.details && (
                                <div>
                                  <p className="text-muted-foreground text-sm">Детали</p>
                                  <p className="text-sm mt-1">{report.details}</p>
                                </div>
                              )}
                              {report.fileUrl && (
                                <div className="pt-2">
                                  <a
                                    href={report.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-[var(--brand)] hover:underline"
                                  >
                                    <Download className="w-4 h-4" />
                                    Скачать {report.fileName || "файл"}
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      <AnimatePresence>
        {showHowToGet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHowToGet(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Как получить выплату</h3>
                <button onClick={() => setShowHowToGet(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Для получения выплаты необходимо:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Согласовать все отчёты за период</li>
                  <li>Убедиться, что сумма к выплате составляет не менее 1000 ₽</li>
                  <li>Связаться с менеджером для оформления выплаты</li>
                  <li>Предоставить реквизиты для перевода</li>
                </ol>
                <p>Выплаты производятся в течение 5-7 рабочих дней после согласования.</p>
              </div>
            </motion.div>
          </motion.div>
        )}

          {showOperationsInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowOperationsInfo(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">История операций</h3>
                  <button onClick={() => setShowOperationsInfo(false)} className="p-1 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>В этом разделе отображаются все финансовые операции:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Начисления</strong> — роялти за прослушивания вашей музыки</li>
                    <li><strong>Выплаты</strong> — переводы на ваши реквизиты</li>
                    <li><strong>Статусы</strong> — текущее состояние каждой операции</li>
                  </ul>
                  <p>Отчёты формируются ежеквартально и требуют вашего согласования перед выплатой.</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedReportId(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Реквизиты для выплаты</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedReportId(null);
                    }}
                    className="p-1 hover:bg-muted rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Для согласования отчёта необходимо указать реквизиты для выплаты. Эти данные будут сохранены для последующих выплат.
                  </p>

                  <div>
                    <Label>ФИО получателя *</Label>
                    <Input
                      value={paymentForm.fullName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>

                  <div>
                    <Label>Номер карты *</Label>
                    <Input
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>

                  <div>
                    <Label>Название банка *</Label>
                    <Input
                      value={paymentForm.bankName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Kaspi Bank"
                    />
                  </div>

                  <div>
                    <Label>КБЕ <span className="text-muted-foreground text-xs">(необязательно)</span></Label>
                    <Input
                      value={paymentForm.kbe}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, kbe: e.target.value }))}
                      placeholder="19"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedReportId(null);
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleAgreeWithPayment}
                      disabled={savingPayment || !paymentForm.fullName || !paymentForm.cardNumber || !paymentForm.bankName}
                    >
                      {savingPayment ? "Сохранение..." : "Согласовать"}
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
