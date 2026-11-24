import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import ReCaptcha from "react-google-recaptcha";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCheck } from "lucide-react";

import { ForgotPasswordPanel } from "@/components/Auth/ForgotPasswordPanel";
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
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>("");
  const [otpValidationError, setOtpValidationError] = useState<string>("");
  const [resendOtpCountdown, setResendOtpCountdown] = useState(0);

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

  return (
    <div className="relative flex min-h-screen flex-col md:h-screen md:flex-row">
      <AuthHero />

      {/* Login Forms Section */}
      <div className="login-hero-form flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8 w-full md:w-1/2 min-h-screen md:min-h-0 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-4 my-auto">
          <Card className="w-full rounded-2xl border border-white/60 md:border-slate-200/90 shadow-[0_24px_60px_-12px_rgba(3,37,76,0.45)] md:shadow-[0_14px_45px_-8px_rgba(0,163,255,0.18),0_4px_16px_-2px_rgba(15,23,42,0.06)] bg-white/95 md:bg-white backdrop-blur-xl overflow-hidden transition-all duration-300">
            <CardHeader className="space-y-1.5 px-6 pt-6 pb-4 items-center text-center">
              <img
                src="/images/LogoRAG.png"
                alt="Logo SPNS Táchira"
                className="h-20 w-20 object-contain mb-1 select-none drop-shadow-xs"
              />
              <CardTitle className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
                {t("welcome_back")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {t("sign_in_to_your_account_to_continue")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {disablePatientLogin ? (
                <>
                  {/* Staff Login */}
                  {!forgotPassword ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">{t("username")}</Label>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          value={form.username}
                          onChange={handleChange}
                          className={cn(
                            errors.username &&
                              "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                        {errors.username && (
                          <p className="text-sm text-red-500">
                            {t(errors.username)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t("password")}</Label>
                        <PasswordInput
                          id="password"
                          name="password"
                          autoComplete="current-password"
                          value={form.password}
                          onChange={handleChange}
                          className={cn(
                            errors.password &&
                              "border-red-500 focus-visible:ring-red-500",
                          )}
                        />
                        {errors.password && (
                          <p className="text-sm text-red-500">
                            {t(errors.password)}
                          </p>
                        )}
                      </div>

                      {isCaptchaEnabled && reCaptchaSiteKey && (
                        <div className="py-4">
                          <ReCaptcha
                            sitekey={reCaptchaSiteKey}
                            onChange={onCaptchaChange}
                          />
                        </div>
                      )}

                      <Button
                        variant="link"
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="px-0"
                      >
                        {t("forget_password")}
                      </Button>

                      <Button
                        type="submit"
                        className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-bold shadow-md shadow-[#00a3ff]/25 hover:shadow-lg hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <CircularProgress className="text-white" />
                        ) : (
                          t("login")
                        )}
                      </Button>
                    </form>
                  ) : (
                    <ForgotPasswordPanel
                      username={form.username}
                      usernameError={errors.username}
                      onUsernameChange={handleChange}
                      onSubmitEmail={handleForgetSubmit}
                      onBackToLogin={() => setForgotPassword(false)}
                      isSubmitting={isLoading || forgotPasswordPending}
                    />
                  )}
                </>
              ) : (
                <Tabs
                  value={mode === "patient" ? "patient" : "staff"}
                  onValueChange={(value) => {
                    setQueryParams({ mode: value as LoginMode });
                    if (value === "staff") {
                      resetPatientLogin();
                    } else {
                      setForgotPassword(false);
                    }
                  }}
                >
                  <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200/80">
                    <TabsTrigger
                      className="w-full h-full text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0076be] data-[state=active]:shadow-xs transition-all select-none"
                      value="staff"
                    >
                      <UserCheck className="size-4 shrink-0 text-[#00a3ff]" />
                      <span className="truncate">Personal de Salud</span>
                    </TabsTrigger>
                    {!disablePatientLogin && (
                      <TabsTrigger
                        className="w-full h-full text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0076be] data-[state=active]:shadow-xs transition-all select-none"
                        value="patient"
                      >
                        <User className="size-4 shrink-0 text-[#00a3ff]" />
                        <span className="truncate">Paciente</span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Staff Login */}
                  <TabsContent value="staff">
                    {!forgotPassword ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">{t("username")}</Label>
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            value={form.username}
                            onChange={handleChange}
                            className={cn(
                              errors.username &&
                                "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                          {errors.username && (
                            <p className="text-sm text-red-500">
                              {t(errors.username)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t("password")}</Label>
                          <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            className={cn(
                              errors.password &&
                                "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                          {errors.password && (
                            <p className="text-sm text-red-500">
                              {t(errors.password)}
                            </p>
                          )}
                        </div>

                        {isCaptchaEnabled && reCaptchaSiteKey && (
                          <div className="py-4">
                            <ReCaptcha
                              sitekey={reCaptchaSiteKey}
                              onChange={onCaptchaChange}
                            />
                          </div>
                        )}

                        <Button
                          variant="link"
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="px-0"
                        >
                          {t("forget_password")}
                        </Button>

                        <Button
                          type="submit"
                          className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-bold shadow-md shadow-[#00a3ff]/25 hover:shadow-lg hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <CircularProgress className="text-white" />
                          ) : (
                            t("login")
                          )}
                        </Button>
                      </form>
                    ) : (
                      <ForgotPasswordPanel
                        username={form.username}
                        usernameError={errors.username}
                        onUsernameChange={handleChange}
                        onSubmitEmail={handleForgetSubmit}
                        onBackToLogin={() => setForgotPassword(false)}
                        isSubmitting={isLoading || forgotPasswordPending}
                      />
                    )}
                  </TabsContent>

                  {/* Patient Login */}
                  <TabsContent value="patient">
                    <form onSubmit={handlePatientLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("phone_number")}</Label>
                        <PhoneInput
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={(value) => {
                            setPhone(value ?? "");
                            setOtpError("");
                            setOtpValidationError("");
                          }}
                          disabled={isOtpSent}
                          placeholder="Ej. 412 123 4567"
                        />
                        <p className="text-[11px] text-slate-400">
                          Ingrese su número sin el 0 inicial (ej. 412, 414, 416,
                          424).
                        </p>
                        {otpError && (
                          <p className="text-sm text-red-500">{t(otpError)}</p>
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

                      <Button
                        type="submit"
                        className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-bold shadow-md shadow-[#00a3ff]/25 hover:shadow-lg hover:shadow-[#00a3ff]/35 transition-all bg-[#00a3ff] hover:bg-[#008fe6] text-white"
                        disabled={
                          isLoading ||
                          !isValidPhoneNumber(phone) ||
                          (isOtpSent && otp.length !== 5)
                        }
                      >
                        {isLoading ? (
                          <CircularProgress className="text-white" />
                        ) : isOtpSent ? (
                          t("verify_otp")
                        ) : (
                          t("send_otp")
                        )}
                      </Button>
                      {isOtpSent && (
                        <div className="flex flex-col items-center gap-2 text-center">
                          {resendOtpCountdown <= 0 ? (
                            <Button
                              variant="link"
                              type="button"
                              className="h-auto p-0"
                              onClick={() => {
                                sendOtp({ phone_number: phone });
                                setResendOtpCountdown(resendOtpTimeout);
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
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <LanguageSelectorLogin />
          <p className="text-center text-[11px] font-medium text-white/80 md:hidden pt-1 pb-2">
            MPPS · IVSS · Dirección de Salud Regional
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
