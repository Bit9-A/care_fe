import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Phone, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ForgotPasswordPhone } from "@/components/Auth/ForgotPasswordPhone";
import CircularProgress from "@/components/Common/CircularProgress";

type ForgotMethod = "email" | "phone";

interface ForgotPasswordPanelProps {
  username: string;
  usernameError?: string | null;
  onUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitEmail: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
  isSubmitting: boolean;
}

export function ForgotPasswordPanel({
  username,
  usernameError,
  onUsernameChange,
  onSubmitEmail,
  onBackToLogin,
  isSubmitting,
}: ForgotPasswordPanelProps) {
  const { t } = useTranslation();
  const [forgotMethod, setForgotMethod] = useState<ForgotMethod>("email");
  const [isFocused, setIsFocused] = useState(false);

  if (forgotMethod === "phone") {
    return (
      <ForgotPasswordPhone
        onBackToEmail={() => setForgotMethod("email")}
        onSuccess={onBackToLogin}
      />
    );
  }

  return (
    <motion.form
      key="forgot-email-form"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onSubmit={onSubmitEmail}
      className="space-y-3.5"
    >
      <button
        type="button"
        onClick={onBackToLogin}
        className="group/back inline-flex items-center gap-1.5 text-xs font-semibold text-[#0076be] hover:text-[#00a3ff] transition-colors"
      >
        <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
        <span>{t("back_to_login")}</span>
      </button>

      <div className="space-y-1">
        <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900">
          {t("forget_password")}
        </h2>
        <p className="text-xs leading-relaxed text-slate-500">
          {t("forget_password_instruction")}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="forgot_username"
            className={cn(
              "text-xs font-semibold transition-colors duration-200",
              isFocused ? "text-[#0076be]" : "text-slate-700",
            )}
          >
            {t("username")}
          </Label>
          {isFocused && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00a3ff]"
            >
              <span className="size-1.5 rounded-full bg-[#00a3ff] animate-pulse" />
              Activo
            </motion.span>
          )}
        </div>

        <motion.div
          animate={{
            scale: isFocused ? 1.008 : 1,
            boxShadow: isFocused
              ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
              : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            borderColor: usernameError
              ? "#ef4444"
              : isFocused
                ? "#00a3ff"
                : "#e2e8f0",
            backgroundColor: isFocused ? "#ffffff" : "#f8fafc",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative flex items-center rounded-xl border overflow-hidden h-10"
        >
          <motion.div
            animate={{
              scale: isFocused ? 1.12 : 1,
              color: isFocused ? "#00a3ff" : "#94a3b8",
            }}
            transition={{ duration: 0.2 }}
            className="pl-3 pr-2 flex items-center pointer-events-none shrink-0"
          >
            <User className="size-4" />
          </motion.div>
          <input
            id="forgot_username"
            name="username"
            type="text"
            value={username}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={onUsernameChange}
            placeholder={t("enter_your_username")}
            className="w-full h-full pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 border-0 ring-0 focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none shadow-none"
          />
        </motion.div>
        {usernameError && (
          <p className="text-xs text-red-500">{t(usernameError)}</p>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          type="submit"
          className="group/btn w-full h-10 rounded-xl text-sm font-semibold shadow-sm shadow-[#00a3ff]/25 hover:shadow-md hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress className="text-white" />
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span>{t("send_reset_link")}</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </span>
          )}
        </Button>
      </motion.div>

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-[11px] text-slate-400 mb-1">
          {t("cant_access_email")}
        </p>
        <button
          type="button"
          onClick={() => setForgotMethod("phone")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0076be] hover:text-[#00a3ff] transition-colors"
        >
          <Phone className="size-3.5" />
          <span>{t("reset_using_phone_number")}</span>
        </button>
      </div>
    </motion.form>
  );
}
