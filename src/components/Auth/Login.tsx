import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import ReCaptcha from "react-google-recaptcha";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, User, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ForgotPasswordPanel } from "@/components/Auth/ForgotPasswordPanel";
import {
  authSlideTransition,
  authSlideVariants,
} from "@/components/Auth/authMotion";
import CircularProgress from "@/components/Common/CircularProgress";
import LanguageSelectorLogin from "@/components/Common/LanguageSelectorLogin";

import { useAuthContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import FiltersCache from "@/Utils/FiltersCache";
import ViewCache from "@/Utils/ViewCache";
import mutate from "@/Utils/request/mutate";
import { HTTPError } from "@/Utils/request/types";
import authApi from "@/types/auth/authApi";
import { TokenData } from "@/types/otp/otp";
import otpApi from "@/types/otp/otpApi";

import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";
import { invalidateAllPaymentReconcilationLocationCaches } from "@/atoms/paymentReconcilationLocationAtom";
import { clearQueuePractitionerCache } from "@/atoms/queuePractitionerAtom";
import { AuthHero } from "./AuthHero";

interface OtpLoginData {
  phone_number: string;
  otp: string;
}

interface OtpError {
  type: string;
  loc: string[];
  msg: string;
  input: string;
  ctx: {
    error: string;
  };
  url: string;
}

interface OtpValidationError {
  otp?: string;
  [key: string]: string | undefined;
}

type LoginMode = "staff" | "patient";

interface LoginProps {
  forgot?: boolean;
}

const Login = (props: LoginProps) => {
  const { signIn, patientLogin, isAuthenticating } = useAuthContext();
  const { reCaptchaSiteKey, resendOtpTimeout, disablePatientLogin } =
    careConfig;
  const initForm: any = {
    username: "",
    password: "",
  };
  const { forgot } = props;
  const [params, setQueryParams] = useQueryParams();
  const { mode } = params;
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const { t } = useTranslation();
  const [forgotPassword, setForgotPassword] = useState(forgot);
  const [tabDirection, setTabDirection] = useState(1);
  const [authDirection, setAuthDirection] = useState(1);
  const activeTab: LoginMode = mode === "patient" ? "patient" : "staff";

  const openForgotPassword = () => {
    setAuthDirection(1);
    setForgotPassword(true);
  };

  const closeForgotPassword = () => {
    setAuthDirection(-1);
    setForgotPassword(false);
  };
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>("");
  const [otpValidationError, setOtpValidationError] = useState<string>("");
  const [resendOtpCountdown, setResendOtpCountdown] = useState(0);
  const [focusedField, setFocusedField] = useState<
    "username" | "password" | "phone" | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActivo, setCapsLockActivo] = useState(false);

  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActivo(e.getModifierState("CapsLock"));
    }
  };

  // Timer Function for resend OTP
  useEffect(() => {
    if (resendOtpCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendOtpCountdown((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendOtpCountdown]);

  // Remember the last login mode
  useEffect(() => {
    localStorage.setItem(LocalStorageKeys.loginPreference, mode);
  }, [mode]);

  // Send OTP Mutation
  const { mutate: sendOtp, isPending: sendOtpPending } = useMutation({
    mutationFn: mutate(otpApi.send),
    onSuccess: () => {
      setIsOtpSent(true);
      setOtpError("");
      toast.success(t("send_otp_success"));
    },
    onError: (error: any) => {
      const errors = error?.data || [];
      if (Array.isArray(errors) && errors.length > 0) {
        const firstError = errors[0] as OtpError;
        setOtpError(firstError.msg);
      } else {
        setOtpError("send_otp_error");
      }
    },
  });

  // Verify OTP Mutation
  const { mutate: verifyOtp, isPending: verifyOtpPending } = useMutation({
    mutationFn: async (data: OtpLoginData) => {
      const response = await mutate(otpApi.login, { silent: true })(data);
      if ("errors" in response) {
        throw response;
      }
      return response;
    },
    onSuccess: async (response: { access: string }) => {
      const { access } = response;
      if (access) {
        setOtpValidationError("");
        const tokenData: TokenData = {
          token: access,
          phoneNumber: phone,
          createdAt: new Date().toISOString(),
        };
        patientLogin(tokenData, `/patient/home`);
      }
    },
    onError: (error: any) => {
      let errorMessage = "invalid_otp";
      if (
        error.cause &&
        Array.isArray(error.cause.errors) &&
        error.cause.errors.length > 0
      ) {
        const otpError = error.cause.errors.find(
          (e: OtpValidationError) => e.otp,
        );
        if (otpError && otpError.otp) {
          errorMessage = otpError.otp;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setOtpValidationError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Forgot Password Mutation
  const { mutate: submitForgetPassword, isPending: forgotPasswordPending } =
    useMutation({
      mutationFn: mutate(authApi.forgotPassword),
      onSuccess: () => {
        toast.success(t("password_sent"));
      },
    });

  // Login form validation
  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);
    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    fieldValue[name] = value;
    if (name === "username") {
      fieldValue[name] = value.toLowerCase();
    }
    setForm(fieldValue);
  };

  const validateData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);
    Object.keys(form).forEach((key) => {
      if (
        typeof form[key] === "string" &&
        key !== "password" &&
        key !== "confirm"
      ) {
        if (!form[key].match(/\w/)) {
          hasError = true;
          err[key] = "field_required";
        }
      }
      if (!form[key]) {
        hasError = true;
        err[key] = "field_required";
      }
    });
    if (hasError) {
      setErrors(err);
      return false;
    }
    return form;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    ViewCache.invalidateAll();
    const validated = validateData();
    if (!validated) return;

    FiltersCache.invalidateAll();
    invalidateAllPaymentReconcilationLocationCaches();
    clearQueuePractitionerCache();
    clearQueryPersistenceCache();
    try {
      await signIn(validated);
    } catch (error) {
      if (error instanceof HTTPError) {
        setCaptcha(error.status == 429);
      }
    }
  };

  const validateForgetData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);

    if (typeof form.username === "string") {
      if (!form.username.match(/\w/)) {
        hasError = true;
        err.username = "field_required";
      }
    }
    if (!form.username) {
      hasError = true;
      err.username = "field_required";
    }

    if (hasError) {
      setErrors(err);
      return false;
    }
    return form;
  };
  const handleForgetSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const valid = validateForgetData();
    if (!valid) return;

    submitForgetPassword(valid);
  };

  const onCaptchaChange = (value: any) => {
    if (value && isCaptchaEnabled) {
      const formCaptcha = { ...form };
      formCaptcha["g-recaptcha-response"] = value;
      setForm(formCaptcha);
    }
  };

  // Handle OTP flow
  const handlePatientLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!isOtpSent) {
      sendOtp({ phone_number: phone });
      setResendOtpCountdown(resendOtpTimeout);
    } else {
      verifyOtp({ phone_number: phone, otp });
    }
  };

  const resetPatientLogin = () => {
    setIsOtpSent(false);
    setPhone("");
    setOtp("");
    setOtpError("");
    setOtpValidationError("");
  };

  // Loading state derived from mutations
  const isLoading = isAuthenticating || sendOtpPending || verifyOtpPending;

  const renderStaffForm = () => (
    <motion.form
      key="staff-form"
      custom={tabDirection}
      variants={authSlideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={authSlideTransition}
      onSubmit={handleSubmit}
      className="space-y-3.5"
    >
      {/* Campo Usuario */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="username"
            className={cn(
              "text-xs font-semibold transition-colors duration-200",
              focusedField === "username" ? "text-[#0076be]" : "text-slate-700",
            )}
          >
            {t("username")}
          </Label>
          {focusedField === "username" && (
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
            scale: focusedField === "username" ? 1.008 : 1,
            boxShadow:
              focusedField === "username"
                ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
                : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            borderColor: errors.username
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
          <motion.div
            animate={{
              scale: focusedField === "username" ? 1.12 : 1,
              color: focusedField === "username" ? "#00a3ff" : "#94a3b8",
            }}
            transition={{ duration: 0.2 }}
            className="pl-3 pr-2 flex items-center pointer-events-none shrink-0"
          >
            <User className="size-4" />
          </motion.div>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            onChange={handleChange}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            placeholder="Ej. care-doctor"
            className="w-full h-full pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 border-0 ring-0 focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none shadow-none"
          />
        </motion.div>
        {errors.username && (
          <p className="text-xs text-red-500">{t(errors.username)}</p>
        )}
      </div>

      {/* Campo Contraseña */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className={cn(
              "text-xs font-semibold transition-colors duration-200",
              focusedField === "password" ? "text-[#0076be]" : "text-slate-700",
            )}
          >
            {t("password")}
          </Label>
          {focusedField === "password" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00a3ff]"
            >
              <span className="size-1.5 rounded-full bg-[#00a3ff] animate-pulse" />
              Seguro
            </motion.span>
          )}
        </div>

        <motion.div
          animate={{
            scale: focusedField === "password" ? 1.008 : 1,
            boxShadow:
              focusedField === "password"
                ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
                : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            borderColor: errors.password
              ? "#ef4444"
              : focusedField === "password"
                ? "#00a3ff"
                : "#e2e8f0",
            backgroundColor:
              focusedField === "password" ? "#ffffff" : "#f8fafc",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative flex items-center rounded-xl border overflow-hidden h-10"
        >
          <motion.div
            animate={{
              scale: focusedField === "password" ? 1.12 : 1,
              color: focusedField === "password" ? "#00a3ff" : "#94a3b8",
            }}
            transition={{ duration: 0.2 }}
            className="pl-3 pr-2 flex items-center pointer-events-none shrink-0"
          >
            <Lock className="size-4" />
          </motion.div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            onChange={handleChange}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            placeholder="••••••••"
            className="w-full h-full pr-10 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 border-0 ring-0 focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none shadow-none"
          />
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-[#00a3ff] hover:bg-[#00a3ff]/10 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </motion.button>
        </motion.div>

        {capsLockActivo && (
          <motion.div
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium"
          >
            <span>⚠️ Bloqueo de Mayúsculas activo</span>
          </motion.div>
        )}
        {errors.password && (
          <p className="text-xs text-red-500">{t(errors.password)}</p>
        )}
      </div>

      {isCaptchaEnabled && reCaptchaSiteKey && (
        <div className="py-2">
          <ReCaptcha sitekey={reCaptchaSiteKey} onChange={onCaptchaChange} />
        </div>
      )}

      <div className="flex justify-end pt-0.5">
        <Button
          variant="link"
          type="button"
          onClick={openForgotPassword}
          className="h-auto p-0 text-xs font-medium text-[#0076be] hover:text-[#00a3ff]"
        >
          {t("forget_password")}
        </Button>
      </div>

      <motion.div
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          type="submit"
          className="group/btn w-full h-10 rounded-xl text-sm font-semibold shadow-sm shadow-[#00a3ff]/25 hover:shadow-md hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress className="text-white" />
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span>{t("login")}</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </span>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );

  return (
    <div className="relative flex min-h-screen flex-col md:h-screen md:flex-row">
      <AuthHero />

      {/* Login Forms Section */}
      <div className="login-hero-form flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8 w-full md:w-1/2 min-h-screen md:min-h-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] space-y-3 my-auto"
        >
          <Card className="group/card w-full rounded-2xl border border-white/60 md:border-slate-200/90 shadow-[0_24px_60px_-12px_rgba(3,37,76,0.45)] md:shadow-[0_14px_45px_-8px_rgba(0,163,255,0.16),0_4px_16px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_24px_60px_-10px_rgba(0,163,255,0.26)] hover:border-[#00a3ff]/40 bg-white/95 md:bg-white backdrop-blur-xl overflow-hidden transition-all duration-300">
            <CardHeader className="space-y-1 px-6 pt-5 pb-3 items-center text-center">
              <motion.img
                src="/images/LogoRAG.png"
                alt="Logo SPNS Táchira"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.07, rotate: 1.5 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="h-24 w-24 sm:h-28 sm:w-28 mb-1.5 object-contain select-none drop-shadow-xs cursor-pointer"
              />
              <AnimatePresence initial={false}>
                {!forgotPassword && (
                  <motion.div
                    key="login-welcome-header"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-1 overflow-hidden w-full"
                  >
                    <CardTitle className="font-display text-xl sm:text-[22px] font-bold tracking-tight text-slate-900">
                      {t("welcome_back")}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {t("sign_in_to_your_account_to_continue")}
                    </CardDescription>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent className="px-6 pb-5 pt-0">
              <div className="overflow-hidden px-1.5 -mx-1.5 py-1.5 -my-1.5">
                <AnimatePresence
                  mode="wait"
                  custom={authDirection}
                  initial={false}
                >
                  {forgotPassword ? (
                    <motion.div
                      key="forgot-password-view"
                      custom={authDirection}
                      variants={authSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={authSlideTransition}
                    >
                      <ForgotPasswordPanel
                        username={form.username}
                        usernameError={errors.username}
                        onUsernameChange={handleChange}
                        onSubmitEmail={handleForgetSubmit}
                        onBackToLogin={closeForgotPassword}
                        isSubmitting={isLoading || forgotPasswordPending}
                      />
                    </motion.div>
                  ) : disablePatientLogin ? (
                    <motion.div
                      key="staff-only-view"
                      custom={authDirection}
                      variants={authSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={authSlideTransition}
                    >
                      {renderStaffForm()}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login-tabs-view"
                      custom={authDirection}
                      variants={authSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={authSlideTransition}
                    >
                      <Tabs
                        value={activeTab}
                        onValueChange={(value) => {
                          const nextMode = value as LoginMode;
                          setTabDirection(nextMode === "patient" ? 1 : -1);
                          setQueryParams({ mode: nextMode });
                          if (nextMode === "staff") {
                            resetPatientLogin();
                          } else {
                            setForgotPassword(false);
                          }
                        }}
                      >
                        <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200/80">
                          <TabsTrigger
                            className="relative w-full h-full text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-slate-600 data-[state=active]:bg-transparent data-[state=active]:text-[#0076be] data-[state=active]:shadow-none transition-colors select-none"
                            value="staff"
                          >
                            {activeTab === "staff" && (
                              <motion.span
                                layoutId="login-mode-pill"
                                transition={{
                                  type: "spring",
                                  stiffness: 380,
                                  damping: 32,
                                }}
                                className="absolute inset-0 rounded-lg bg-white shadow-xs"
                              />
                            )}
                            <span className="relative z-10 inline-flex items-center justify-center gap-1.5 min-w-0">
                              <UserCheck className="size-3.5 shrink-0 text-[#00a3ff]" />
                              <span className="truncate">
                                Personal de Salud
                              </span>
                            </span>
                          </TabsTrigger>
                          {!disablePatientLogin && (
                            <TabsTrigger
                              className="relative w-full h-full text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-slate-600 data-[state=active]:bg-transparent data-[state=active]:text-[#0076be] data-[state=active]:shadow-none transition-colors select-none"
                              value="patient"
                            >
                              {activeTab === "patient" && (
                                <motion.span
                                  layoutId="login-mode-pill"
                                  transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 32,
                                  }}
                                  className="absolute inset-0 rounded-lg bg-white shadow-xs"
                                />
                              )}
                              <span className="relative z-10 inline-flex items-center justify-center gap-1.5 min-w-0">
                                <User className="size-3.5 shrink-0 text-[#00a3ff]" />
                                <span className="truncate">Paciente</span>
                              </span>
                            </TabsTrigger>
                          )}
                        </TabsList>

                        <div
                          role="tabpanel"
                          className="overflow-hidden px-1.5 -mx-1.5 py-1.5 -my-1.5"
                        >
                          <AnimatePresence
                            mode="wait"
                            custom={tabDirection}
                            initial={false}
                          >
                            {activeTab === "staff" ? (
                              renderStaffForm()
                            ) : (
                              <motion.form
                                key="patient-form"
                                custom={tabDirection}
                                variants={authSlideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={authSlideTransition}
                                onSubmit={handlePatientLogin}
                                className="space-y-3.5"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <Label
                                      htmlFor="phone"
                                      className={cn(
                                        "text-xs font-semibold transition-colors duration-200",
                                        focusedField === "phone"
                                          ? "text-[#0076be]"
                                          : "text-slate-700",
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
                                      scale:
                                        focusedField === "phone" ? 1.008 : 1,
                                      boxShadow:
                                        focusedField === "phone"
                                          ? "0 0 0 3px rgba(0, 163, 255, 0.14), 0 4px 12px -2px rgba(0, 163, 255, 0.15)"
                                          : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                                      borderColor: otpError
                                        ? "#ef4444"
                                        : focusedField === "phone"
                                          ? "#00a3ff"
                                          : "#e2e8f0",
                                      backgroundColor:
                                        focusedField === "phone"
                                          ? "#ffffff"
                                          : "#f8fafc",
                                    }}
                                    transition={{
                                      duration: 0.2,
                                      ease: "easeOut",
                                    }}
                                    onFocus={() => setFocusedField("phone")}
                                    onBlur={() => setFocusedField(null)}
                                    className="relative flex items-center rounded-xl border overflow-hidden h-10"
                                  >
                                    <PhoneInput
                                      id="phone"
                                      name="phone"
                                      embedded
                                      value={phone}
                                      onChange={(value) => {
                                        setPhone(value ?? "");
                                        setOtpError("");
                                        setOtpValidationError("");
                                      }}
                                      disabled={isOtpSent}
                                      placeholder="Ej. 412 123 4567"
                                    />
                                  </motion.div>
                                  <p className="text-[11px] text-slate-400">
                                    Ingrese su número sin el 0 inicial (ej. 412,
                                    414, 416, 424).
                                  </p>
                                  {otpError && (
                                    <p className="text-xs text-red-500">
                                      {t(otpError)}
                                    </p>
                                  )}
                                </div>

                                {isOtpSent && (
                                  <div className="space-y-2">
                                    <Label htmlFor="otp" className="mb-4">
                                      {t("enter_otp")}
                                    </Label>
                                    <div className="flex justify-center">
                                      <InputOTP
                                        id="otp"
                                        value={otp}
                                        maxLength={5}
                                        pattern={REGEXP_ONLY_DIGITS}
                                        autoComplete="one-time-code"
                                        autoFocus
                                        onChange={(value) => {
                                          setOtp(value);
                                          setOtpValidationError("");
                                        }}
                                      >
                                        <InputOTPGroup>
                                          {[...Array(5)].map((_, index) => (
                                            <InputOTPSlot
                                              key={index}
                                              index={index}
                                              className={cn(
                                                "size-10",
                                                otpValidationError &&
                                                  "border-red-500 focus-visible:ring-red-500",
                                              )}
                                            />
                                          ))}
                                        </InputOTPGroup>
                                      </InputOTP>
                                    </div>
                                    {otpValidationError && (
                                      <p className="text-sm text-red-500 text-center">
                                        {t(otpValidationError)}
                                      </p>
                                    )}
                                  </div>
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
                                      isLoading ||
                                      !isValidPhoneNumber(phone) ||
                                      (isOtpSent && otp.length !== 5)
                                    }
                                  >
                                    {isLoading ? (
                                      <CircularProgress className="text-white" />
                                    ) : (
                                      <span className="inline-flex items-center justify-center gap-2">
                                        <span>
                                          {isOtpSent
                                            ? t("verify_otp")
                                            : t("send_otp")}
                                        </span>
                                        <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                                      </span>
                                    )}
                                  </Button>
                                </motion.div>
                                {isOtpSent && (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    {resendOtpCountdown <= 0 ? (
                                      <Button
                                        variant="link"
                                        type="button"
                                        className="h-auto p-0"
                                        onClick={() => {
                                          sendOtp({ phone_number: phone });
                                          setResendOtpCountdown(
                                            resendOtpTimeout,
                                          );
                                        }}
                                      >
                                        {t("resend_otp")}
                                      </Button>
                                    ) : (
                                      <p className="text-sm text-gray-500">
                                        {t("resend_otp_timer", {
                                          time: resendOtpCountdown,
                                        })}
                                      </p>
                                    )}
                                    <div className="flex items-center text-sm">
                                      <Button
                                        variant="link"
                                        type="button"
                                        className="h-auto p-0 text-primary-600"
                                        onClick={() => {
                                          setIsOtpSent(false);
                                          setOtp("");
                                          setOtpError("");
                                          setOtpValidationError("");
                                        }}
                                      >
                                        {t("change_phone_number")}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </motion.form>
                            )}
                          </AnimatePresence>
                        </div>
                      </Tabs>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <LanguageSelectorLogin />
          <p className="text-center text-[11px] font-medium text-white/80 md:hidden pt-1 pb-2">
            MPPS · IVSS · Dirección de Salud Regional
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
