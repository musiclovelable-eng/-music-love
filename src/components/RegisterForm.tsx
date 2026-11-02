"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Info, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    socialNetwork: "",
    artistName: "",
    password: "",
    howDidYouHear: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка при регистрации");
      setRegisteredEmail(form.email.toLowerCase());
      setStep("verify");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверный код");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success("Код отправлен повторно");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "h-[48px] text-base placeholder:text-gray-400 border-[#d4d4d4] focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:border-[#000000]";

  const header = (
    <header className="w-full border-b border-[#e5e5e5] bg-white flex-shrink-0">
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
        <img
          src="/logo.svg"
          alt="Music Love Logo"
          className="w-14 h-14 object-contain"
        />
        <div className="leading-tight">
          <div className="text-2xl font-bold text-gray-900">Music Love</div>
          <div className="text-sm text-gray-500">Label/Distributor</div>
        </div>
      </div>
    </header>
  );

  // ─── Экран: Регистрация завершена ──────────────────────────────────────
  if (step === "done") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#f5f5f5] text-gray-900 overflow-hidden">
        {header}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Добро пожаловать!
              </h1>
              <p className="text-gray-600 mb-8">
                Ваш аккаунт активирован. Теперь вы можете войти в личный кабинет.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full h-[48px] bg-[#000000] hover:bg-[#333333] text-white text-base font-medium rounded-lg transition-colors"
              >
                Войти в кабинет
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Экран: Ввод кода подтверждения ────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#f5f5f5] text-gray-900 overflow-hidden">
        {header}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-8 sm:p-10">
              <button
                onClick={() => setStep("form")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" /> Назад
              </button>

              <div className="w-16 h-16 bg-[#000000]/10 text-[#000000] rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Подтвердите почту
              </h1>
              <p className="text-gray-500 text-sm text-center mb-8">
                Мы отправили 6-значный код на<br />
                <span className="font-semibold text-gray-900">{registeredEmail}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Код подтверждения</Label>
                  <Input
                    id="code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    disabled={isLoading}
                    autoFocus
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-[48px] bg-[#000000] hover:bg-[#333333] text-white text-base font-medium rounded-lg transition-colors"
                  disabled={isLoading || verifyCode.length !== 6}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Проверка...</>
                  ) : (
                    "Подтвердить"
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Отправить код повторно через {resendCooldown} сек
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm text-[#000000] font-medium hover:underline"
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Экран: Форма регистрации ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f5] text-gray-900 overflow-hidden">
      {header}

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-8 sm:p-10">
            <h1 className="text-[26px] font-semibold text-gray-900 mb-6">
              Регистрация
            </h1>

            <div className="flex gap-3 bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6 text-sm text-neutral-700">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-500" />
              <p>
                После регистрации на вашу почту придёт код подтверждения.
                Введите его для активации аккаунта.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Имя *</Label>
                <Input id="firstName" value={form.firstName} onChange={set("firstName")} placeholder="Ваше имя" required disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" value={form.lastName} onChange={set("lastName")} placeholder="Ваша фамилия" disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Почта *</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="example@mail.ru" required disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="socialNetwork">Соцсеть для связи * (Telegram / VK / Discord)</Label>
                <Input id="socialNetwork" value={form.socialNetwork} onChange={set("socialNetwork")} placeholder="Например: @username в Telegram" required disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="artistName">Псевдоним *</Label>
                <Input id="artistName" value={form.artistName} onChange={set("artistName")} placeholder="Ваш творческий псевдоним" required disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Пароль *</Label>
                <Input id="password" type="password" value={form.password} onChange={set("password")} placeholder="Придумайте пароль" required disabled={isLoading} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="howDidYouHear">Как вы узнали о нас? (необязательно)</Label>
                <Input id="howDidYouHear" value={form.howDidYouHear} onChange={set("howDidYouHear")} placeholder="Например: от друга, ВКонтакте, реклама..." disabled={isLoading} className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-[48px] bg-[#000000] hover:bg-[#333333] text-white text-base font-medium rounded-lg transition-colors" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Отправка...</>
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Уже есть аккаунт? </span>
            <button type="button" onClick={() => router.push("/")} className="text-[#000000] font-medium hover:underline bg-transparent border-none p-0 cursor-pointer">
              Войти
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
