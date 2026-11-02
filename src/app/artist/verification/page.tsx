"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Check, ChevronLeft, ChevronRight, AlertTriangle,
  User, Building2, FileText, Send, ShieldCheck, RotateCcw, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ARTIST_VERIFICATION_REQUIRED } from "@/lib/verification";

type Country = "RU" | "KZ" | "BY" | "other";
type Role = "artist" | "label" | "";
type ContractType = "self_employed" | "individual" | "ip" | "";
type Step = 0 | 1 | 2 | 3 | 4;

interface DraftData {
  role: Role;
  contractType: ContractType;
  country: Country | "";
  passport: Record<string, string>;
  address: Record<string, string>;
  bank: Record<string, string>;
  npdConfirmed: boolean;
  finalConfirmed: boolean;
}

const emptyDraft: DraftData = {
  role: "", contractType: "", country: "",
  passport: {}, address: {}, bank: {},
  npdConfirmed: false, finalConfirmed: false,
};

const COUNTRIES = [
  { code: "RU" as Country, name: "Россия" },
  { code: "KZ" as Country, name: "Казахстан" },
  { code: "BY" as Country, name: "Беларусь" },
  { code: "other" as Country, name: "Другая страна" },
];

export default function VerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<DraftData>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(false);

  // Load draft
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/verification");
        const data = await res.json();
        if (data.verification) {
          const v = data.verification;
          if (v.status === "submitted") { setSubmittedStatus(true); setLoading(false); return; }
          const loaded: DraftData = {
            role: v.role || "", contractType: v.contract_type || "", country: v.country || "",
            passport: v.passportData || {}, address: v.addressData || {}, bank: v.bankData || {},
            npdConfirmed: !!v.npd_confirmed, finalConfirmed: !!v.final_confirmed,
          };
          setDraft(loaded);
          setStep(v.step || 0);
          if ((v.passportData || v.addressData || v.bankData) && v.step > 0) setShowRestoreBanner(true);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  // Debounced autosave
  const saveTimeout = setTimeoutRef();
  const doSave = useCallback(async (partial?: Partial<DraftData>) => {
    const data = partial ? { ...draft, ...partial } : draft;
    setSaving(true);
    try {
      await fetch("/api/user/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, step }),
      });
    } catch {} finally { setSaving(false); }
  }, [draft, step]);

  useEffect(() => {
    if (!loading && !submittedStatus && draft.role) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => doSave(), 2000);
    }
    return () => clearTimeout(saveTimeout.current);
  }, [draft, step, loading, submittedStatus, doSave]);

  const update = (section: "passport" | "address" | "bank", field: string, value: string) => {
    setDraft(d => ({ ...d, [section]: { ...d[section], [field]: value } }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const updateMeta = (field: keyof DraftData, value: any) => {
    setDraft(d => ({ ...d, [field]: value }));
  };

  const clearDraft = async () => {
    setDraft(emptyDraft); setStep(0); setShowRestoreBanner(false); setErrors({});
    await fetch("/api/user/verification", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emptyDraft, step: 0 }),
    });
    toast.success("Черновик очищен");
  };

  const changeCountry = (country: Country) => {
    if (draft.passport && Object.keys(draft.passport).length > 0 && draft.country !== country) {
      if (!confirm("При смене страны часть введённых данных может быть очищена, так как для другой страны используются другие поля.")) return;
      setDraft(d => ({ ...d, country, passport: {}, address: {}, bank: {} }));
    } else {
      updateMeta("country", country);
    }
  };

  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {};
    const req = (fields: string[], data: Record<string, string>) => {
      fields.forEach(f => { if (!data[f]?.trim()) errs[f] = "Обязательное поле"; });
    };

    if (s === 1) {
      const common = ["lastName", "firstName", "country"];
      const c = draft.country;
      if (c === "RU") req([...common, "passportSeries", "passportNumber", "issueDate", "issuedBy"], draft.passport);
      else if (c === "KZ") req([...common, "iin", "idNumber", "issueDate", "issuedBy"], draft.passport);
      else if (c === "BY") req([...common, "identNumber", "passportNumber", "issueDate", "issuedBy"], draft.passport);
      else req([...common, "docNumber", "docType", "issueDate", "issuedBy", "taxId"], draft.passport);
      if (!draft.passport.dataConfirmed) errs.dataConfirmed = "Обязательно";
    }
    if (s === 2) {
      const c = draft.country;
      if (c === "RU") req(["zip", "country", "city", "street", "house"], draft.address);
      else if (c === "KZ" || c === "BY") req(["zip", "country", "city", "street", "house"], draft.address);
      else req(["country", "city", "address1", "zip"], draft.address);
      if (!draft.address.dataConfirmed) errs.addrConfirmed = "Обязательно";
    }
    if (s === 3) {
      const c = draft.country;
      const r = draft.role; const ct = draft.contractType;
      if (c === "RU") {
        if (r === "label" && ct === "ip") req(["inn", "ogrnip", "account", "bankName", "bik"], draft.bank);
        else req(["inn", "account", "bankName", "bik"], draft.bank);
      } else if (c === "KZ" || c === "BY") {
        req(["taxId", "iban", "bankName", "swift"], draft.bank);
      } else {
        req(["taxId", "iban", "bankName", "swift"], draft.bank);
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep(s => Math.min(4, (s + 1) as Step) as Step); };
  const prevStep = () => setStep(s => Math.max(0, (s - 1) as Step) as Step);

  const handleSubmit = async () => {
    if (!draft.finalConfirmed || !draft.consentConfirmed) { toast.error("Подтвердите чекбоксы"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/user/verification/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: draft.role, contractType: draft.contractType, country: draft.country,
          passportData: draft.passport, addressData: draft.address, bankData: draft.bank,
          npdConfirmed: draft.npdConfirmed, finalConfirmed: draft.finalConfirmed,
        }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Ошибка"); return; }
      setSubmittedStatus(true);
      toast.success("Верификация отправлена!");
    } catch { toast.error("Ошибка подключения"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  );

  if (submittedStatus) return (
    <div className="max-w-xl mx-auto">
      <Card><CardContent className="pt-8 pb-8 text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Верификация отправлена на проверку</h2>
        <p className="text-muted-foreground mb-6">После проверки данных мы отправим лицензионный договор на вашу электронную почту.</p>
        <Button variant="outline" onClick={() => router.push("/artist/profile")}>Вернуться в профиль</Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Верификация</h1>
        <p className="text-muted-foreground">
          {ARTIST_VERIFICATION_REQUIRED
            ? "Для создания релизов необходимо пройти верификацию. После проверки данных лицензионный договор будет отправлен на указанную почту."
            : "Верификация необязательна. Вы можете создавать релизы без неё, а эту форму заполнить позже по желанию."}
        </p>
      </div>

      {/* Restore banner */}
      <AnimatePresence>
        {showRestoreBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <RotateCcw className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">Черновик восстановлен — продолжайте с того места, где остановились</p>
            <button onClick={clearDraft} className="text-sm font-medium text-blue-600 hover:underline shrink-0">Очистить</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 0: Role + Contract Type + Country */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Role */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Выберите роль</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RoleCard icon={User} title="Артист" desc="Я создаю музыку и хочу распространять свои релизы" active={draft.role === "artist"} onClick={() => { updateMeta("role", "artist"); updateMeta("contractType", ""); }} />
              <RoleCard icon={Building2} title="Лейбл" desc="Я представляю лейбл и работаю с несколькими артистами" active={draft.role === "label"} onClick={() => { updateMeta("role", "label"); updateMeta("contractType", ""); }} />
            </div>
          </div>

          {/* Contract type */}
          {draft.role && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Label className="text-base font-semibold mb-3 block">Тип договора</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {draft.role === "artist" ? (
                  <>
                    <ContractCard title="Самозанятый" active={draft.contractType === "self_employed"} onClick={() => updateMeta("contractType", "self_employed")} />
                    <ContractCard title="Физическое лицо" active={draft.contractType === "individual"} onClick={() => updateMeta("contractType", "individual")} />
                  </>
                ) : (
                  <>
                    <ContractCard title="ИП" desc="Для индивидуальных предпринимателей" active={draft.contractType === "ip"} onClick={() => updateMeta("contractType", "ip")} />
                    <ContractCard title="Самозанятый" desc="Для самозанятых" active={draft.contractType === "self_employed"} onClick={() => updateMeta("contractType", "self_employed")} />
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* NPD checkbox */}
          {draft.contractType === "self_employed" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Checkbox checked={draft.npdConfirmed} onCheckedChange={(v) => updateMeta("npdConfirmed", v === true)} id="npd" />
              <label htmlFor="npd" className="text-sm cursor-pointer select-none ml-2">Я подтверждаю, что являюсь плательщиком НПД (налога на профессиональный доход) и буду загружать только собственный контент, созданный лично мной</label>
              <p className="text-xs text-muted-foreground ml-6">Это согласие обязательно для выбора статуса 'Самозанятый' в соответствии с ФЗ-422 от 27.11.2018</p>
            </motion.div>
          )}

          {/* Country */}
          {draft.contractType && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Label className="text-base font-semibold mb-3 block">Страна резидентства</Label>
              <select className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm" value={draft.country} onChange={(e) => changeCountry(e.target.value as Country)}>
                <option value="">Выберите страну</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Страна гражданства</p>
            </motion.div>
          )}

          {/* Next button */}
          {draft.country && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <Button onClick={() => setStep(1)} className="gap-2">Перейти к заполнению <ChevronRight className="w-4 h-4" /></Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Steps 1-4 with Stepper */}
      {step > 0 && step < 4 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Stepper step={step} />

          {step === 1 && <PassportStep draft={draft} update={update} updateMeta={updateMeta} errors={errors} />}
          {step === 2 && <AddressStep draft={draft} update={update} updateMeta={updateMeta} errors={errors} />}
          {step === 3 && <BankStep draft={draft} update={update} errors={errors} />}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4" /> Назад</Button>
            <Button onClick={nextStep} className="gap-2">Далее <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Stepper step={step} />
          <p className="text-sm text-muted-foreground">Проверьте данные перед отправкой. После отправки данные будут переданы на проверку.</p>

          <ReviewSection title="Паспортные данные / данные документа" data={draft.passport} />
          <ReviewSection title="Адрес регистрации" data={draft.address} />
          <ReviewSection title="Банковские реквизиты" data={draft.bank} />

          <ReviewRow label="Роль" value={draft.role === "artist" ? "Артист" : "Лейбл"} />
          <ReviewRow label="Тип договора" value={CT_LABELS[draft.contractType] || draft.contractType} />
          <ReviewRow label="Страна" value={COUNTRIES.find(c => c.code === draft.country)?.name || draft.country} />

          <div className="space-y-3 pt-4">
            <CheckboxRow checked={draft.finalConfirmed} onChange={(v) => updateMeta("finalConfirmed", v)} label="Я подтверждаю, что все указанные данные являются достоверными и актуальными." />
            <CheckboxRow checked={draft.consentConfirmed} onChange={(v) => updateMeta("consentConfirmed", v)} label="Я согласен на обработку персональных данных для прохождения верификации и подготовки лицензионного договора." />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4" /> Назад</Button>
            <Button onClick={handleSubmit} disabled={saving || !draft.finalConfirmed || !draft.consentConfirmed} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Отправить на проверку
            </Button>
          </div>
        </motion.div>
      )}

      {saving && <div className="fixed bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Сохранение...</div>}
    </div>
  );
}

const CT_LABELS: Record<string, string> = { self_employed: "Самозанятый", individual: "Физическое лицо", ip: "ИП" };

// ─── Helper: useRef wrapper for setTimeout ────────────────────────────────────
function setTimeoutRef() {
  const ref = (typeof window !== "undefined" ? (window as any).__saveTimeout : null) || { current: null as any };
  return ref;
}

// ─── Role / Contract Cards ────────────────────────────────────────────────────
function RoleCard({ icon: Icon, title, desc, active, onClick }: { icon: any; title: string; desc: string; active: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`text-left p-4 rounded-xl border-2 transition-all ${active ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-border hover:border-[var(--brand)]/40"}`}>
      <Icon className={`w-6 h-6 mb-2 ${active ? "text-[var(--brand)]" : "text-muted-foreground"}`} />
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function ContractCard({ title, desc, active, onClick }: { title: string; desc?: string; active: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`text-left p-4 rounded-xl border-2 transition-all ${active ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-border hover:border-[var(--brand)]/40"}`}>
      <p className="font-semibold">{title}</p>
      {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
    </button>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: Step }) {
  const steps = ["Паспорт", "Адрес", "Банк", "Подтверждение"];
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = step > num; const isCurrent = step === num;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${isDone ? "bg-green-500 text-white" : isCurrent ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {isDone ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-[10px] sm:text-xs ${isCurrent ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${isDone ? "bg-green-500" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Form Field components ────────────────────────────────────────────────────
function FieldRow({ label, field, draft, update, section, errors, hint, type = "text", placeholder }: {
  label: string; field: string; draft: DraftData; update: (s: "passport" | "address" | "bank", f: string, v: string) => void;
  section: "passport" | "address" | "bank"; errors: Record<string, string>; hint?: string; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{hint && <span className="text-muted-foreground ml-1 text-xs">({hint})</span>}</Label>
      <Input value={draft[section][field] || ""} onChange={(e) => update(section, field, e.target.value)} type={type} placeholder={placeholder} />
      {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
    </div>
  );
}

function PassportStep({ draft, update, updateMeta, errors }: { draft: DraftData; update: any; updateMeta: any; errors: Record<string, string>; }) {
  const c = draft.country;
  return (
    <Card><CardContent className="pt-6 space-y-4">
      <p className="text-sm text-muted-foreground">Введите данные именно как в документе.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow label="Фамилия" field="lastName" required draft={draft} update={update} section="passport" errors={errors} />
        <FieldRow label="Имя" field="firstName" required draft={draft} update={update} section="passport" errors={errors} />
        <FieldRow label="Отчество" field="middleName" draft={draft} update={update} section="passport" errors={errors} />
        <FieldRow label="Страна резидентства" field="country" required draft={draft} update={update} section="passport" errors={errors} hint="гражданства" />
        {c === "RU" && (<>
          <FieldRow label="Серия паспорта" field="passportSeries" required draft={draft} update={update} section="passport" errors={errors} hint="4 цифры" placeholder="0000" />
          <FieldRow label="Номер паспорта" field="passportNumber" required draft={draft} update={update} section="passport" errors={errors} hint="6 цифр" placeholder="000000" />
          <FieldRow label="Дата выдачи" field="issueDate" required type="date" draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Код подразделения" field="departmentCode" draft={draft} update={update} section="passport" errors={errors} placeholder="000-000" />
          <FieldRow label="Кем выдан" field="issuedBy" required draft={draft} update={update} section="passport" errors={errors} />
        </>)}
        {c === "KZ" && (<>
          <FieldRow label="ИИН" field="iin" required hint="12 цифр" draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Номер удостоверения / паспорта" field="idNumber" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Дата выдачи" field="issueDate" required type="date" draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Кем выдан" field="issuedBy" required draft={draft} update={update} section="passport" errors={errors} />
        </>)}
        {c === "BY" && (<>
          <FieldRow label="Идентификационный номер" field="identNumber" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Номер паспорта / ID-карты" field="passportNumber" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Дата выдачи" field="issueDate" required type="date" draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Орган, выдавший документ" field="issuedBy" required draft={draft} update={update} section="passport" errors={errors} />
        </>)}
        {c === "other" && (<>
          <FieldRow label="Номер документа" field="docNumber" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Тип документа" field="docType" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Дата выдачи" field="issueDate" required type="date" draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Кем выдан" field="issuedBy" required draft={draft} update={update} section="passport" errors={errors} />
          <FieldRow label="Налоговый номер / Tax ID" field="taxId" required draft={draft} update={update} section="passport" errors={errors} />
        </>)}
      </div>
      <CheckboxRow checked={draft.passport.dataConfirmed} onChange={(v) => update("passport", "dataConfirmed", v)} label="Я подтверждаю достоверность указанных данных и несу ответственность за предоставление недостоверной информации" />
    </CardContent></Card>
  );
}

function AddressStep({ draft, update, errors }: { draft: DraftData; update: any; errors: Record<string, string>; }) {
  const c = draft.country;
  return (
    <Card><CardContent className="pt-6 space-y-4">
      <p className="text-sm text-muted-foreground">Укажите адрес регистрации по документу.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(c === "RU" || c === "KZ" || c === "BY") && (<>
          <FieldRow label="Почтовый индекс" field="zip" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Страна" field="country" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Город" field="city" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Улица" field="street" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Дом" field="house" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Квартира / офис" field="apartment" draft={draft} update={update} section="address" errors={errors} />
        </>)}
        {c === "other" && (<>
          <FieldRow label="Страна" field="country" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Город" field="city" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Адресная строка 1" field="address1" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Адресная строка 2" field="address2" draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Почтовый индекс / ZIP" field="zip" required draft={draft} update={update} section="address" errors={errors} />
          <FieldRow label="Регион / штат" field="region" draft={draft} update={update} section="address" errors={errors} />
        </>)}
      </div>
      <CheckboxRow checked={draft.address.dataConfirmed} onChange={(v) => update("address", "dataConfirmed", v)} label="Я подтверждаю достоверность указанных данных и несу ответственность за предоставление недостоверной информации" />
    </CardContent></Card>
  );
}

function BankStep({ draft, update, errors }: { draft: DraftData; update: any; errors: Record<string, string>; }) {
  const c = draft.country; const r = draft.role; const ct = draft.contractType;
  const showOgrnip = c === "RU" && r === "label" && ct === "ip";
  const showIpReg = (c === "KZ" || c === "BY") && r === "label" && ct === "ip";
  return (
    <Card><CardContent className="pt-6 space-y-4">
      <p className="text-sm text-muted-foreground">Реквизиты нужны для выплат. Проверьте данные в выписке из банка.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {c === "RU" ? (<>
          <FieldRow label="ИНН" field="inn" required hint="12 цифр" draft={draft} update={update} section="bank" errors={errors} />
          {showOgrnip && <FieldRow label="ОГРНИП" field="ogrnip" required hint="15 цифр" draft={draft} update={update} section="bank" errors={errors} />}
          <FieldRow label="Расчётный счёт" field="account" required hint="20 цифр" draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Название банка" field="bankName" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="БИК" field="bik" required hint="9 цифр" draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Корр. счёт" field="corrAccount" hint="20 цифр" draft={draft} update={update} section="bank" errors={errors} />
        </>) : c === "KZ" ? (<>
          <FieldRow label={r === "label" ? "ИИН / БИН" : "ИИН"} field="taxId" required draft={draft} update={update} section="bank" errors={errors} />
          {showIpReg && <FieldRow label="Регистрация ИП" field="ipReg" draft={draft} update={update} section="bank" errors={errors} />}
          <FieldRow label="IBAN / Расчётный счёт" field="iban" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Название банка" field="bankName" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="БИК / SWIFT" field="swift" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Корр. счёт" field="corrAccount" draft={draft} update={update} section="bank" errors={errors} />
        </>) : c === "BY" ? (<>
          <FieldRow label="УНП" field="taxId" required hint="9 символов" draft={draft} update={update} section="bank" errors={errors} />
          {showIpReg && <FieldRow label="Регистрация ИП" field="ipReg" draft={draft} update={update} section="bank" errors={errors} />}
          <FieldRow label="IBAN / Расчётный счёт" field="iban" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Название банка" field="bankName" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="БИК / SWIFT" field="swift" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Корр. счёт" field="corrAccount" draft={draft} update={update} section="bank" errors={errors} />
        </>) : (<>
          <FieldRow label="Tax ID" field="taxId" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="IBAN / Account" field="iban" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Bank Name" field="bankName" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="SWIFT / BIC" field="swift" required draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Bank Address" field="bankAddr" draft={draft} update={update} section="bank" errors={errors} />
          <FieldRow label="Correspondent Account" field="corrAccount" draft={draft} update={update} section="bank" errors={errors} />
        </>)}
      </div>
    </CardContent></Card>
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <button type="button" onClick={() => onChange(!checked)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border"}`}>
        {checked && <Check className="w-3 h-3 text-background" />}
      </button>
      <label className="text-sm cursor-pointer select-none" onClick={() => onChange(!checked)}>{label}</label>
    </div>
  );
}

function ReviewSection({ title, data }: { title: string; data: Record<string, string> }) {
  const entries = Object.entries(data).filter(([, v]) => v);
  if (entries.length === 0) return null;
  const labels: Record<string, string> = {
    lastName: "Фамилия", firstName: "Имя", middleName: "Отчество", country: "Страна",
    passportSeries: "Серия паспорта", passportNumber: "Номер паспорта", issueDate: "Дата выдачи",
    departmentCode: "Код подразделения", issuedBy: "Кем выдан", iin: "ИИН", idNumber: "Номер удостоверения",
    identNumber: "Идент. номер", docNumber: "Номер документа", docType: "Тип документа", taxId: "Tax ID / ИНН",
    zip: "Индекс", city: "Город", street: "Улица", house: "Дом", apartment: "Квартира",
    address1: "Адрес 1", address2: "Адрес 2", region: "Регион",
    account: "Расчётный счёт", bankName: "Банк", bik: "БИК", corrAccount: "Корр. счёт",
    iban: "IBAN", swift: "SWIFT", bankAddr: "Адрес банка", ogrnip: "ОГРНИП", ipReg: "Регистрация ИП",
  };
  return (
    <Card><CardContent className="pt-5 pb-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm gap-4">
            <span className="text-muted-foreground">{labels[k] || k}</span>
            <span className="font-medium text-right">{v}</span>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
