import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  if (forgotMethod === "phone") {
    return (
      <ForgotPasswordPhone
        onBackToEmail={() => setForgotMethod("email")}
        onSuccess={onBackToLogin}
      />
    );
  }

  return (
    <form onSubmit={onSubmitEmail} className="space-y-5">
      <Button
        variant="link"
        type="button"
        onClick={onBackToLogin}
        className="-ml-1 flex h-auto items-center gap-1.5 p-0 text-sm font-medium text-sus-700 hover:text-sus-900 hover:no-underline"
      >
        <CareIcon
          icon="l-arrow-left"
          className="text-base"
          aria-hidden="true"
        />
        <span>{t("back_to_login")}</span>
      </Button>

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {t("forget_password")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("forget_password_instruction")}
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="forgot_username"
            className="text-sm font-medium text-gray-700"
          >
            {t("username")}
          </Label>
          <Input
            id="forgot_username"
            name="username"
            type="text"
            value={username}
            onChange={onUsernameChange}
            placeholder={t("enter_your_username")}
            className={cn(
              "h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base shadow-none transition-colors focus:border-sus-600 focus:bg-white focus:ring-sus-600",
              usernameError && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          <p className="min-h-5 text-sm leading-5 text-red-600">
            {usernameError ? t(usernameError) : null}
          </p>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-sus-700 font-semibold text-white shadow-sm transition-colors hover:bg-sus-800 active:bg-sus-900"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress className="text-white" />
          ) : (
            t("send_reset_link")
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-500">{t("cant_access_email")}</p>
          <Button
            variant="link"
            type="button"
            onClick={() => setForgotMethod("phone")}
            className="h-auto p-0 text-sm font-medium text-sus-700 hover:text-sus-900 hover:underline"
          >
            {t("reset_using_phone_number")}
          </Button>
        </div>
      </div>
    </form>
  );
}
