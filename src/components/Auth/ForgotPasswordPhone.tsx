import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

import {
  PasswordErrors,
  PasswordFields,
  validatePasswordFields,
} from "@/components/Auth/PasswordFields";
import CircularProgress from "@/components/Common/CircularProgress";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import { HTTPError } from "@/Utils/request/types";
import otpApi from "@/types/otp/otpApi";

const OTP_LENGTH = 5;

type PhoneResetStep = "phone" | "confirm";

interface ForgotPasswordPhoneProps {
  onBackToEmail: () => void;
  onSuccess: () => void;
}

interface ConfirmFieldErrors extends PasswordErrors {
  otp?: string | null;
  username?: string | null;
  error?: string | null;
}

function extractFieldErrors(cause: unknown): ConfirmFieldErrors {
  const result: ConfirmFieldErrors = {};
  if (!cause || typeof cause !== "object") return result;

  const data = cause as Record<string, unknown>;
  const errors = data.errors;

  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (!entry || typeof entry !== "object") continue;
      const msg = (entry as { msg?: unknown }).msg;
      if (typeof msg === "string") {
        result.error = msg;
      } else if (msg && typeof msg === "object") {
        for (const [key, value] of Object.entries(
          msg as Record<string, unknown>,
        )) {
          if (typeof value === "string") {
            result[key as keyof ConfirmFieldErrors] = value;
          } else if (Array.isArray(value) && typeof value[0] === "string") {
            result[key as keyof ConfirmFieldErrors] = value[0];
          }
        }
      }
    }
  }

  if (typeof data.error === "string") {
    result.error = data.error;
  }
  if (typeof data.otp === "string") {
    result.otp = data.otp;
  }
  if (typeof data.password === "string") {
    result.password = data.password;
  }

  return result;
}

export function ForgotPasswordPhone({
  onBackToEmail,
  onSuccess,
}: ForgotPasswordPhoneProps) {
  const { t } = useTranslation();
  const { resendOtpTimeout } = careConfig;

  const [step, setStep] = useState<PhoneResetStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [requiresUsername, setRequiresUsername] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<ConfirmFieldErrors>({});
  const [phoneError, setPhoneError] = useState("");
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<"phone" | "username" | null>(
    null,
  );
  const [resendOtpCountdown, setResendOtpCountdown] = useState(0);

  useEffect(() => {
    if (resendOtpCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendOtpCountdown]);

  const { mutate: sendOtp, isPending: sendOtpPending } = useMutation({
    mutationFn: mutate(otpApi.sendPasswordResetOtp),
    onSuccess: () => {
      setStep("confirm");
      setPhoneError("");
      setResendOtpCountdown(resendOtpTimeout);
      toast.success(t("otp_password_reset_sent"));
    },
    onError: (error) => {
      const fieldErrors = extractFieldErrors(error.cause);
      setPhoneError(
        fieldErrors.error || fieldErrors.otp || t("send_otp_error"),
      );
    },
  });

  const { mutate: confirmReset, isPending: confirmPending } = useMutation({
    mutationFn: mutate(otpApi.confirmPasswordResetOtp, { silent: true }),
    onSuccess: () => {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      localStorage.removeItem(LocalStorageKeys.refreshToken);
      toast.success(t("password_reset_success"));
      onSuccess();
      navigate("/login");
    },
    onError: (error) => {
      if (!(error instanceof HTTPError)) {
        toast.error(t("something_went_wrong"));
        return;
      }

      if (error.status === 409) {
        setRequiresUsername(true);
        const message =
          typeof error.cause?.error === "string"
            ? error.cause.error
            : t("multiple_users_linked_to_phone");
        setErrors({ error: message });
        return;
      }

      const fieldErrors = extractFieldErrors(error.cause);
      setErrors(fieldErrors);
      if (fieldErrors.otp) {
        toast.error(fieldErrors.otp);
      } else if (fieldErrors.error) {
        toast.error(fieldErrors.error);
      } else if (fieldErrors.password) {
        toast.error(
          typeof fieldErrors.password === "string"
            ? fieldErrors.password
            : t("invalid_password"),
        );
      } else {
        toast.error(t("something_went_wrong"));
      }
    },
  });

  const handleSendOtp = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setPhoneError(t("phone_number_validation_error"));
      return;
    }
    setPhoneError("");
    sendOtp({ phone_number: phone });
  };

  const handleResendOtp = () => {
    if (resendOtpCountdown > 0 || !isValidPhoneNumber(phone)) return;
    sendOtp({ phone_number: phone });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ConfirmFieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleConfirm = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: ConfirmFieldErrors = {};
    if (otp.length !== OTP_LENGTH) {
      nextErrors.otp = t("invalid_otp");
    }

    const passwordErrors = validatePasswordFields(passwordForm, t);
    if (passwordErrors) {
      Object.assign(nextErrors, passwordErrors);
    }

    if (requiresUsername && !username.trim()) {
      nextErrors.username = t("field_required");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    confirmReset({
      phone_number: phone,
      otp,
      password: passwordForm.password,
      ...(requiresUsername ? { username: username.trim() } : {}),
    });
  };

  const handleChangePhone = () => {
    setStep("phone");
    setOtp("");
    setUsername("");
    setRequiresUsername(false);
    setPasswordForm({ password: "", confirm: "" });
    setErrors({});
    setIsPasswordFieldFocused(false);
  };

  if (step === "phone") {
    return (
      <motion.form
        key="forgot-phone-form"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onSubmit={handleSendOtp}
        className="space-y-3.5"
      >
        <button
          type="button"
          onClick={onBackToEmail}
          className="group/back inline-flex items-center gap-1.5 text-xs font-semibold text-[#0076be] hover:text-[#00a3ff] transition-colors"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
          <span>{t("back_to_email_reset")}</span>
        </button>

        <div className="space-y-1">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {t("reset_using_phone_number")}
          </h2>
          <p className="text-xs leading-relaxed text-slate-500">
            {t("forget_password_phone_instruction")}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="reset_phone"
              className={cn(
                "text-xs font-semibold transition-colors duration-200",
                focusedField === "phone" ? "text-[#0076be]" : "text-slate-700",
              )}
            >
              {t("phone_number")}
            </Label>
            {focusedField === "phone" && (
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
              scale: focusedField === "phone" ? 1.008 : 1,
              boxShadow:
                focusedField === "phone"
                  ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
                  : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
              borderColor: phoneError
                ? "#ef4444"
                : focusedField === "phone"
                  ? "#00a3ff"
                  : "#e2e8f0",
              backgroundColor: focusedField === "phone" ? "#ffffff" : "#f8fafc",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
            className="relative flex items-center rounded-xl border overflow-hidden h-10"
          >
            <PhoneInput
              id="reset_phone"
              name="phone"
              embedded
              value={phone}
              onChange={(value) => {
                setPhone(value ?? "");
                setPhoneError("");
              }}
              placeholder="Ej. 412 123 4567"
            />
          </motion.div>
          <p className="text-[11px] text-slate-400">
            Ingrese su número sin el 0 inicial (ej. 412, 414, 416, 424).
          </p>
          {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
        </div>

        <motion.div
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            type="submit"
            className="group/btn w-full h-10 rounded-xl text-sm font-semibold shadow-sm shadow-[#00a3ff]/25 hover:shadow-md hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
            disabled={sendOtpPending || !isValidPhoneNumber(phone)}
          >
            {sendOtpPending ? (
              <CircularProgress className="text-white" />
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <span>{t("send_otp")}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </span>
            )}
          </Button>
        </motion.div>
      </motion.form>
    );
  }

  return (
    <motion.form
      key="forgot-confirm-form"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onSubmit={handleConfirm}
      className="space-y-3.5"
    >
      <button
        type="button"
        onClick={handleChangePhone}
        className="group/back inline-flex items-center gap-1.5 text-xs font-semibold text-[#0076be] hover:text-[#00a3ff] transition-colors"
      >
        <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
        <span>{t("change_phone_number")}</span>
      </button>

      <div className="space-y-1">
        <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900">
          {t("reset_password")}
        </h2>
        <p className="text-xs leading-relaxed text-slate-500">
          {t("forget_password_phone_otp_instruction")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="reset_otp"
          className="text-xs font-semibold text-slate-700"
        >
          {t("enter_otp")}
        </Label>
        <div className="flex justify-center">
          <InputOTP
            id="reset_otp"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (errors.otp) {
                setErrors((prev) => ({ ...prev, otp: null }));
              }
            }}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={cn(errors.otp && "border-red-500")}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {errors.otp && (
          <p className="text-xs text-red-500 text-center">{errors.otp}</p>
        )}
      </div>

      <PasswordFields
        password={passwordForm.password}
        confirm={passwordForm.confirm}
        errors={errors}
        onChange={handlePasswordChange}
        isPasswordFieldFocused={isPasswordFieldFocused}
        onPasswordFocusChange={setIsPasswordFieldFocused}
      />

      {requiresUsername && (
        <div className="space-y-1.5">
          <Label
            htmlFor="reset_username"
            className="text-xs font-semibold text-slate-700"
          >
            {t("username")}
          </Label>
          <motion.div
            animate={{
              scale: focusedField === "username" ? 1.008 : 1,
              boxShadow:
                focusedField === "username"
                  ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
                  : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
              borderColor:
                errors.username || errors.error
                  ? "#ef4444"
                  : focusedField === "username"
                    ? "#00a3ff"
                    : "#e2e8f0",
              backgroundColor:
                focusedField === "username" ? "#ffffff" : "#f8fafc",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex items-center rounded-xl border overflow-hidden h-10"
          >
            <div className="pl-3 pr-2 flex items-center pointer-events-none shrink-0 text-slate-400">
              <User className="size-4" />
            </div>
            <input
              id="reset_username"
              name="username"
              type="text"
              value={username}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                if (errors.username || errors.error) {
                  setErrors((prev) => ({
                    ...prev,
                    username: null,
                    error: null,
                  }));
                }
              }}
              placeholder={t("enter_your_username")}
              className="w-full h-full pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 border-0 ring-0 focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none shadow-none"
            />
          </motion.div>
          {(errors.username || errors.error) && (
            <p className="text-xs text-red-500">
              {errors.username || errors.error}
            </p>
          )}
          <p className="text-[11px] text-slate-400">
            {t("multiple_users_linked_to_phone_hint")}
          </p>
        </div>
      )}

      {!requiresUsername && errors.error && (
        <p className="text-xs text-red-500">{errors.error}</p>
      )}

      <motion.div
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          type="submit"
          className="group/btn w-full h-10 rounded-xl text-sm font-semibold shadow-sm shadow-[#00a3ff]/25 hover:shadow-md hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
          disabled={
            confirmPending ||
            otp.length !== OTP_LENGTH ||
            !passwordForm.password ||
            !passwordForm.confirm
          }
        >
          {confirmPending ? (
            <CircularProgress className="text-white" />
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span>{t("reset_password")}</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </span>
          )}
        </Button>
      </motion.div>

      <p className="text-xs text-red-500">{t("dont_share_code")}</p>

      <div className="text-center">
        {resendOtpCountdown <= 0 ? (
          <Button
            variant="link"
            type="button"
            onClick={handleResendOtp}
            disabled={sendOtpPending}
            className="h-auto p-0 text-xs font-semibold text-[#0076be] hover:text-[#00a3ff]"
          >
            {t("resend_otp")}
          </Button>
        ) : (
          <p className="text-xs text-slate-500">
            {t("resend_otp_timer", { time: resendOtpCountdown })}
          </p>
        )}
      </div>
    </motion.form>
  );
}
