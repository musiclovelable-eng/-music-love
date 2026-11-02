"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface EmailVerificationProps {
  email: string;
  onSuccess: () => void;
}

export function EmailVerification({
  email,
  onSuccess,
}: EmailVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Неверный код");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при отправке");
      }

      setResendMessage("Код успешно отправлен повторно");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при отправке");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-8 sm:p-10">
      <h1 className="text-[28px] font-semibold text-gray-900 mb-2">
        Подтверждение почты
      </h1>
      <p className="text-gray-600 mb-6">
        Мы отправили код подтверждения на <strong>{email}</strong>
      </p>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {resendMessage && (
          <div className="bg-neutral-50 text-neutral-700 p-3 rounded-lg text-sm border border-neutral-200 mb-4">
            {resendMessage}
          </div>
        )}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Код подтверждения</Label>
            <Input
              id="code"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              disabled={isLoading}
              className="h-[48px] text-base placeholder:text-gray-400 border-[#d4d4d4] focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:border-[#000000]"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-[48px] bg-[#000000] hover:bg-[#333333] text-white text-base font-medium rounded-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Подтверждение...
              </>
            ) : (
              "Подтвердить"
            )}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={handleResendCode}
            disabled={resendLoading || isLoading}
            className="text-sm text-[#000000] font-medium hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Отправка..." : "Отправить код еще раз"}
          </button>
        </div>
      </div>
    </div>
  );
}
